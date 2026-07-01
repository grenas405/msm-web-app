#!/usr/bin/env bash
#
# diagnose-tls-reset.sh
# ---------------------------------------------------------------------------
# Diagnose why one HTTPS vhost (default: msmokc.org) gets a TCP RST / browser
# "connection reset" from the internet, while sibling vhosts on the SAME box
# and the SAME nginx work fine -- and while the failing host works from the
# box's own loopback.
#
# Observed symptom this script chases:
#   * External clients:  msmokc.org:443 -> RST during/after TLS ClientHello
#   * External clients:  praxedis/pedromdominguez/denogenesis:443 -> OK
#   * Box loopback:      msmokc.org:443 -> 200 (nginx serves it correctly)
#   * Unknown SNI:       also reset externally
# => Points at an SNI-aware reset on the EXTERNAL path (on-box IPS/nftables
#    hooked to the NIC, or a provider edge device) rather than nginx itself.
#
# This script is READ-ONLY except for a short tcpdump capture to a temp file.
# It changes NO config. Run it on the VPS:
#     bash scripts/diagnose-tls-reset.sh
# Optionally override the host under test and a known-good control host:
#     BAD_HOST=msmokc.org GOOD_HOST=praxedistechnologies.com \
#         bash scripts/diagnose-tls-reset.sh
# ---------------------------------------------------------------------------
set -u

BAD_HOST="${BAD_HOST:-msmokc.org}"
GOOD_HOST="${GOOD_HOST:-praxedistechnologies.com}"
UNKNOWN_SNI="${UNKNOWN_SNI:-zzz-nonexistent-$(date +%s).org}"
PORT=443

# --- pretty helpers --------------------------------------------------------
c_reset="$(printf '\033[0m')"; c_hd="$(printf '\033[1;36m')"
c_ok="$(printf '\033[1;32m')"; c_bad="$(printf '\033[1;31m')"; c_warn="$(printf '\033[1;33m')"
hd()  { printf '\n%s========== %s ==========%s\n' "$c_hd" "$1" "$c_reset"; }
ok()  { printf '%s[ OK ]%s %s\n'   "$c_ok"  "$c_reset" "$1"; }
bad() { printf '%s[FAIL]%s %s\n'   "$c_bad" "$c_reset" "$1"; }
warn(){ printf '%s[WARN]%s %s\n'   "$c_warn" "$c_reset" "$1"; }
have(){ command -v "$1" >/dev/null 2>&1; }

# sudo wrapper: use -n so it never hangs; note when it can't elevate
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if sudo -n true 2>/dev/null; then SUDO="sudo -n"; else
    warn "Not root and passwordless sudo unavailable -- firewall/tcpdump/nginx -T sections may be limited. Re-run with: sudo bash $0"
  fi
fi

hd "ENVIRONMENT"
echo "date        : $(date -Is)"
echo "hostname    : $(hostname)"
echo "bad host    : $BAD_HOST  (the one that resets)"
echo "good host   : $GOOD_HOST (control)"
echo "unknown SNI : $UNKNOWN_SNI"

# primary interface + its IP (the address the internet reaches you on)
IFACE="$(ip route show default 2>/dev/null | awk '/default/{print $5; exit}')"
PUBIP="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
[ -z "${IFACE:-}" ] && IFACE="$(ip -o link 2>/dev/null | awk -F': ' '$2!="lo"{print $2; exit}')"
echo "primary if  : ${IFACE:-unknown}"
echo "primary IP  : ${PUBIP:-unknown}"
# What the world resolves BAD_HOST to (uses the box's resolver)
if have getent; then
  echo "$BAD_HOST -> $(getent ahostsv4 "$BAD_HOST" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
# Core test: probe a target IP with a given SNI, classify the outcome.
#   RESET   = handshake killed, no cert seen  (the bug)
#   OK:<cn> = full handshake, server cert CN
#   REFUSED/TIMEOUT/other
# ---------------------------------------------------------------------------
probe() {  # probe <ip> <sni>
  local ip="$1" sni="$2" out
  out="$(echo | timeout 8 openssl s_client -connect "${ip}:${PORT}" -servername "$sni" 2>&1)"
  if echo "$out" | grep -q "subject="; then
    echo "OK:$(echo "$out" | grep -m1 'subject=' | sed 's/.*CN *= *//; s/ .*//')"
  elif echo "$out" | grep -qiE "no peer certificate|reset by peer|sslv3 alert|handshake failure|tlsv1 alert"; then
    echo "RESET"
  elif echo "$out" | grep -qi "refused"; then echo "REFUSED"
  elif echo "$out" | grep -qi "timed out\|timeout"; then echo "TIMEOUT"
  else echo "OTHER"; fi
}

hd "SNI MATRIX  (loopback vs public IP, from THIS box)"
printf '%-34s | %-14s | %-14s\n' "SNI" "via 127.0.0.1" "via ${PUBIP:-pubip}"
printf -- '-----------------------------------+----------------+----------------\n'
matrix_row() {  # matrix_row <sni>
  local sni="$1" lo pub
  lo="$(probe 127.0.0.1 "$sni")"
  if [ -n "${PUBIP:-}" ]; then pub="$(probe "$PUBIP" "$sni")"; else pub="n/a"; fi
  printf '%-34s | %-14s | %-14s\n' "$sni" "$lo" "$pub"
}
for s in "$BAD_HOST" "www.$BAD_HOST" "$GOOD_HOST" "$UNKNOWN_SNI"; do matrix_row "$s"; done
cat <<'NOTE'

Read this matrix:
  * BAD_HOST OK on 127.0.0.1 but RESET on public IP  -> reset is on the EXTERNAL
    path (NIC-level IPS/nftables, or the provider edge). nginx is innocent.
  * BAD_HOST RESET on BOTH columns                   -> on-box (nginx
    ssl_reject_handshake, or a local reject rule). See NGINX/FIREWALL below.
  * UNKNOWN_SNI RESET but real hosts OK              -> a default_server is
    rejecting unknown SNI; the bug is that BAD_HOST is (externally) treated
    as unknown, i.e. not in the allow-set of whatever fronts the box.
NOTE

# ---------------------------------------------------------------------------
hd "PACKET-LEVEL SELF TEST  (who sends the RST?)"
if [ -n "${PUBIP:-}" ] && have tcpdump && [ -n "$SUDO" -o "$(id -u)" -eq 0 ]; then
  PCAP="$(mktemp /tmp/tlsreset.XXXXXX.pcap)"
  echo "capturing on ${IFACE} for host ${PUBIP} port ${PORT} ..."
  $SUDO tcpdump -nn -i "${IFACE:-any}" "host ${PUBIP} and tcp port ${PORT}" -w "$PCAP" >/dev/null 2>&1 &
  TPID=$!
  sleep 1
  echo | timeout 6 openssl s_client -connect "${PUBIP}:${PORT}" -servername "$BAD_HOST"  >/dev/null 2>&1
  echo | timeout 6 openssl s_client -connect "${PUBIP}:${PORT}" -servername "$GOOD_HOST" >/dev/null 2>&1
  sleep 1
  $SUDO kill "$TPID" 2>/dev/null; wait "$TPID" 2>/dev/null
  echo "--- flags (S=syn, P=data/ClientHello|ServerHello, R=reset) ---"
  $SUDO tcpdump -nn -r "$PCAP" 2>/dev/null \
    | grep -E 'Flags \[S|Flags \[P|Flags \[R' \
    | sed -E 's/ (win|options|length)/ \1/' | head -40
  rc=0
  $SUDO tcpdump -nn -r "$PCAP" 'tcp[tcpflags] & tcp-rst != 0' 2>/dev/null | grep -q . && rc=1
  echo "---"
  if [ "$rc" = 1 ]; then
    warn "RSTs present. If the ${BAD_HOST} flow shows SYN,SYN-ACK then RST with NO large"
    warn "inbound ServerHello (no 'Out ... length 2xxx' from ${PUBIP}:443), the ClientHello"
    warn "is being dropped and a RST forged -> inline SNI reset (IPS / provider edge)."
  fi
  echo "pcap kept at: $PCAP  (open with: sudo tcpdump -nnA -r $PCAP | less)"
else
  warn "tcpdump self-test skipped (need root + tcpdump + known public IP)."
fi

# ---------------------------------------------------------------------------
hd "NGINX"
if have nginx; then
  NGT="$($SUDO nginx -T 2>/dev/null)"
  if [ -z "$NGT" ]; then warn "could not read 'nginx -T' (need root)"; else
    echo "-- server blocks that mention $BAD_HOST --"
    echo "$NGT" | grep -nE "server_name .*${BAD_HOST%%.*}|# configuration file .*${BAD_HOST%%.*}" | head
    echo "-- default_server / ssl_reject_handshake (reject-unknown-SNI knobs) --"
    if echo "$NGT" | grep -qiE 'ssl_reject_handshake .*on'; then
      warn "ssl_reject_handshake ON found -> unknown SNI is rejected by nginx itself:"
      echo "$NGT" | grep -niE 'ssl_reject_handshake' | head
    else
      ok "no 'ssl_reject_handshake on' in loaded config"
    fi
    echo "$NGT" | grep -niE 'listen .*443.*default_server|default_server.*443' | head
  fi
  echo "-- cert files for $BAD_HOST --"
  CDIR="/etc/letsencrypt/live/$BAD_HOST"
  if $SUDO test -e "$CDIR/fullchain.pem"; then
    ok "cert dir present: $CDIR"
    exp="$($SUDO openssl x509 -enddate -noout -in "$CDIR/fullchain.pem" 2>/dev/null | cut -d= -f2)"
    echo "   notAfter : ${exp:-?}"
    if [ -n "$exp" ]; then
      es=$(date -d "$exp" +%s 2>/dev/null || echo 0); now=$(date +%s)
      if [ "$es" -gt 0 ] && [ "$es" -lt "$now" ]; then bad "certificate is EXPIRED"; else ok "certificate not expired"; fi
    fi
    # cert/key modulus match
    cm="$($SUDO openssl x509 -noout -modulus -in "$CDIR/fullchain.pem" 2>/dev/null | md5sum | cut -d' ' -f1)"
    km="$($SUDO openssl rsa  -noout -modulus -in "$CDIR/privkey.pem"   2>/dev/null | md5sum | cut -d' ' -f1)"
    if [ -n "$cm" ] && [ "$cm" = "$km" ]; then ok "cert/key modulus match"; else warn "cert/key modulus MISMATCH or unreadable (cm=$cm km=$km)"; fi
  else
    bad "no cert dir at $CDIR"
  fi
else
  warn "nginx binary not found on PATH"
fi

# ---------------------------------------------------------------------------
hd "LISTENERS on :80 / :443"
if have ss; then $SUDO ss -ltnp 2>/dev/null | grep -E ':80 |:443 ' || ss -ltn | grep -E ':80 |:443 '; fi

# ---------------------------------------------------------------------------
hd "FIREWALL / NETFILTER"
have ufw && { echo "-- ufw --"; $SUDO ufw status verbose 2>/dev/null | head -20; }
echo "-- nft rules of interest (queue/reject/drop/counter) --"
$SUDO nft list ruleset 2>/dev/null | grep -niE 'queue|reject|drop|counter packets [1-9]' | head -30 \
  || warn "nft not readable"
echo "-- iptables NFQUEUE (used by inline IPS like suricata/snort) --"
if $SUDO iptables-save 2>/dev/null | grep -i NFQUEUE; then
  warn "NFQUEUE present -> traffic is handed to a userspace IPS. Inspect that IPS's rules."
else
  ok "no NFQUEUE rules (no inline IPS via iptables)"
fi

# ---------------------------------------------------------------------------
hd "IPS / DPI / WAF PROCESSES"
found_ips=0
for p in suricata snort zeek crowdsec crowdsec-firewall-bouncer nDPI; do
  if pgrep -x "$p" >/dev/null 2>&1 || pgrep -f "$p" >/dev/null 2>&1; then
    warn "running: $p"; found_ips=1
  fi
done
[ "$found_ips" = 0 ] && ok "no suricata/snort/zeek/crowdsec process detected"
# crowdsec decisions (bans) if present
if have cscli; then
  echo "-- crowdsec decisions --"; $SUDO cscli decisions list 2>/dev/null | head -20
fi
# any IPS config mentioning the bad host?
for d in /etc/suricata /etc/snort /etc/crowdsec; do
  if [ -d "$d" ]; then
    m="$($SUDO grep -rilE "${BAD_HOST%%.*}|sni" "$d" 2>/dev/null | head)"
    [ -n "$m" ] && { warn "references in $d:"; echo "$m"; }
  fi
done

# ---------------------------------------------------------------------------
hd "fail2ban"
if have fail2ban-client; then
  $SUDO fail2ban-client status 2>/dev/null
  for j in recidive nginx-http-auth nginx-botsearch; do
    b="$($SUDO fail2ban-client status "$j" 2>/dev/null | grep -i 'banned ip')"
    [ -n "$b" ] && echo "$j: $b"
  done
else
  ok "fail2ban not installed"
fi

# ---------------------------------------------------------------------------
hd "/etc/hosts override?"
if grep -qi "$BAD_HOST" /etc/hosts 2>/dev/null; then warn "$BAD_HOST is pinned in /etc/hosts:"; grep -i "$BAD_HOST" /etc/hosts; else ok "$BAD_HOST not overridden in /etc/hosts"; fi

# ---------------------------------------------------------------------------
hd "WHAT CHANGED RECENTLY  (it worked before -> look here)"
echo "-- files modified in the last 3 days under /etc that could matter --"
$SUDO find /etc/nginx /etc/letsencrypt /etc/nftables.conf /etc/ufw \
      /etc/crowdsec /etc/suricata /etc/fail2ban 2>/dev/null \
      -type f -mtime -3 -printf '%TY-%Tm-%Td %TH:%TM  %p\n' 2>/dev/null | sort | tail -40
echo "-- recent nginx errors (last 24h) --"
if have journalctl; then $SUDO journalctl -u nginx --since '24 hours ago' --no-pager 2>/dev/null | grep -iE 'error|emerg|reset|ssl' | tail -20; fi
echo "-- last nginx error.log lines --"
$SUDO tail -n 15 /var/log/nginx/error.log 2>/dev/null
echo "-- recently installed/updated packages (last 3 days) --"
if have dpkg-query; then
  $SUDO find /var/log -maxdepth 1 -name 'dpkg.log*' 2>/dev/null | while read -r f; do
    zgrep -h " install \| upgrade " "$f" 2>/dev/null || grep -h " install \| upgrade " "$f" 2>/dev/null
  done | awk -v d="$(date -d '3 days ago' +%Y-%m-%d)" '$1>=d' | tail -30
fi

# ---------------------------------------------------------------------------
hd "VERDICT (heuristic)"
lo_bad="$(probe 127.0.0.1 "$BAD_HOST")"
pub_bad="n/a"; [ -n "${PUBIP:-}" ] && pub_bad="$(probe "$PUBIP" "$BAD_HOST")"
pub_good="n/a"; [ -n "${PUBIP:-}" ] && pub_good="$(probe "$PUBIP" "$GOOD_HOST")"
echo "loopback $BAD_HOST = $lo_bad ; public $BAD_HOST = $pub_bad ; public $GOOD_HOST = $pub_good"
if [ "$lo_bad" != "RESET" ] && [ "$pub_bad" = "RESET" ] && [ "${pub_good#OK}" != "$pub_good" ]; then
  bad "nginx serves $BAD_HOST fine locally, but the PUBLIC path resets it while $GOOD_HOST"
  bad "works. The reset is NOT nginx. It is an SNI-aware device on the external path:"
  echo "     -> If NFQUEUE / suricata / crowdsec showed up above, that on-box IPS is it;"
  echo "        fix its rule/allowlist (or stop it) and retest."
  echo "     -> If nothing on-box showed up, the filter is at your PROVIDER's edge"
  echo "        (e.g. Contabo DDoS/again-domain protection that hasn't 'learned'"
  echo "        the newly-added $BAD_HOST). Open a ticket / register the domain there."
  echo "     -> Quick corroboration: the packet self-test above should show the"
  echo "        ${BAD_HOST} ClientHello leaving but NO ServerHello coming back, then a RST."
elif [ "$lo_bad" = "RESET" ]; then
  bad "$BAD_HOST resets even on loopback -> on-box cause. Check the NGINX section"
  echo "     (ssl_reject_handshake / missing-or-mismatched cert / default_server) and FIREWALL."
else
  warn "pattern not conclusive from this run; read the sections above."
fi
echo
echo "Done. Re-run after any change:  BAD_HOST=$BAD_HOST bash $0"
