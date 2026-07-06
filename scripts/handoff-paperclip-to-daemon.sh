#!/usr/bin/env bash
# Stop foreground Paperclip dev runner on :3100 and hand off to launchd daemon.
set -euo pipefail

ATLAS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ATLAS_ROOT
LABEL="com.benpham.paperclip"
DOMAIN="gui/$(id -u)"

echo "==> Stop registered Paperclip dev services for this repo"
cd "$ATLAS_ROOT"
pnpm run dev:stop 2>/dev/null || true

echo "==> Stop listeners on :3100"
pids=$(lsof -tiTCP:3100 -sTCP:LISTEN 2>/dev/null || true)
if [[ -n "${pids:-}" ]]; then
  echo "    killing: $pids"
  kill $pids 2>/dev/null || true
  sleep 2
fi

echo "==> Install / reload launchd Paperclip daemon"
npm run paperclip:daemon:install

sleep 2
curl -sf "http://127.0.0.1:3100/api/health" | head -c 300
echo ""
echo "Done. Dashboard: http://127.0.0.1:3100 — Logs: ~/.hermes/logs/paperclip.*.log"