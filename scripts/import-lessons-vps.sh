#!/usr/bin/env bash
# import-lessons-vps.sh — one-shot Sunday School lesson migration on the VPS.
#
# Weebly's CDN blocks the server's datacenter IP, so we don't download from
# Weebly here. Instead this pulls a prepared bundle of lesson PDFs from the
# project's GitHub release (which the VPS can reach), then imports them locally.
#
# Run as root:   sudo bash scripts/import-lessons-vps.sh
#
# If your deployment differs from the defaults below, edit these lines.

set -euo pipefail

SERVICE="msm-web-app"
APP_USER="sysadmin"
APP_DIR="/home/sysadmin/.local/src/development/msm-web-app"
DENO_BIN="/home/sysadmin/.deno/bin"
BUNDLE_URL="https://github.com/grenas405/msm-web-app/releases/download/lessons-archive/lessons-archive.tar.gz"

export MSM_KV_PATH="/var/lib/msm-web-app/msm.db"
export MSM_DATA_DIR="/var/lib/msm-web-app/data"
export DENO_DIR="/var/cache/msm-web-app/deno"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> Downloading lesson bundle from GitHub…"
curl -sSL --fail "$BUNDLE_URL" -o "$WORK/lessons.tar.gz"

echo "==> Extracting…"
mkdir -p "$WORK/lessons"
tar -xzf "$WORK/lessons.tar.gz" -C "$WORK/lessons"
chmod -R a+rX "$WORK" # the import runs as ${APP_USER}, not root
echo "    $(ls "$WORK"/lessons/*.pdf | wc -l) lesson PDFs ready."

echo "==> Stopping ${SERVICE}…"
systemctl stop "${SERVICE}"

echo "==> Importing…"
sudo -u "${APP_USER}" env \
  MSM_KV_PATH="${MSM_KV_PATH}" \
  MSM_DATA_DIR="${MSM_DATA_DIR}" \
  DENO_DIR="${DENO_DIR}" \
  PATH="${DENO_BIN}:/usr/local/bin:/usr/bin:/bin" \
  bash -c "cd '${APP_DIR}' && deno task import-from-dir '$WORK/lessons'"

echo "==> Starting ${SERVICE}…"
systemctl start "${SERVICE}"

echo "==> Done. Check https://denogenesis.com/sunday-school"
