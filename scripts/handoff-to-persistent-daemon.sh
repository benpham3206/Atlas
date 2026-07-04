#!/usr/bin/env bash
# Hand off :4000/:3000 to launchd Personal Atlas daemon (persistent store + auto bootstrap).
set -euo pipefail

ATLAS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ATLAS_ROOT
DATA_FILE="$ATLAS_ROOT/.atlas/personal-store.json"
LABEL="com.benpham.atlas.personal"
DOMAIN="gui/$(id -u)"

echo "==> POST personal/bootstrap (capture in-memory state before restart)"
curl -sf -X POST "http://127.0.0.1:4000/personal/bootstrap" >/dev/null || {
  echo "WARN: bootstrap failed (API down?); daemon will bootstrap on start." >&2
}

echo "==> Stop listeners on :4000 and :3000 (manual dev:personal / node servers)"
for port in 4000 3000; do
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [[ -n "${pids:-}" ]]; then
    echo "    killing port $port: $pids"
    kill $pids 2>/dev/null || true
    sleep 1
  fi
done

echo "==> Install / reload launchd (ATLAS_DATA_FILE=$DATA_FILE)"
cd "$ATLAS_ROOT"
npm run daemon:install

sleep 3
echo "==> Health + next action"
curl -sf "http://127.0.0.1:4000/health" | head -c 200
echo ""
curl -sf "http://127.0.0.1:4000/personal/next-action" | head -c 400
echo ""
test -f "$DATA_FILE" && echo "OK: persistence file $DATA_FILE" || echo "WARN: store file not created yet (first mutation will create)"
echo "Done. Hermes: /reload-mcp after delegation refresh. Logs: ~/.hermes/logs/atlas-personal.*.log"