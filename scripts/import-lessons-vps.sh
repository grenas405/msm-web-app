#!/usr/bin/env bash
# import-lessons-vps.sh — one-shot Sunday School lesson migration on the VPS.
#
# Stops the service (the KV is single-writer), imports every lesson from the
# old Weebly site via curl, then restarts the service. Safe to re-run — already
# imported lessons are skipped.
#
# Run as root:   sudo bash scripts/import-lessons-vps.sh
#
# If your deployment differs from the defaults below, edit these four lines.

set -euo pipefail

SERVICE="msm-web-app"
APP_USER="sysadmin"
APP_DIR="/home/sysadmin/.local/src/development/msm-web-app"
DENO_BIN="/home/sysadmin/.deno/bin"

export MSM_KV_PATH="/var/lib/msm-web-app/msm.db"
export MSM_DATA_DIR="/var/lib/msm-web-app/data"
export DENO_DIR="/var/cache/msm-web-app/deno"

echo "==> Stopping ${SERVICE}…"
systemctl stop "${SERVICE}"

echo "==> Importing lessons (a few minutes — one file per second)…"
sudo -u "${APP_USER}" env \
  MSM_KV_PATH="${MSM_KV_PATH}" \
  MSM_DATA_DIR="${MSM_DATA_DIR}" \
  DENO_DIR="${DENO_DIR}" \
  PATH="${DENO_BIN}:/usr/local/bin:/usr/bin:/bin" \
  bash -c "cd '${APP_DIR}' && deno task import-lessons"

echo "==> Starting ${SERVICE}…"
systemctl start "${SERVICE}"

echo "==> Done. Check https://denogenesis.com/sunday-school"
