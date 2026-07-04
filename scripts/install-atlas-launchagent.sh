#!/usr/bin/env bash
# Install Personal Atlas API daemon as a user LaunchAgent (login + crash restart + caffeinate).
set -euo pipefail

ATLAS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
WRAPPER="$HERMES_HOME/scripts/run-atlas-personal-caffeinated.sh"
PLIST_SRC="$ATLAS_ROOT/scripts/launchd/com.benpham.atlas.personal.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.benpham.atlas.personal.plist"
LABEL="com.benpham.atlas.personal"
USER_ID="$(id -u)"
DOMAIN="gui/$USER_ID"

mkdir -p "$HERMES_HOME/logs" "$HOME/Library/LaunchAgents"

if [[ ! -x "$WRAPPER" ]]; then
  echo "Missing executable wrapper: $WRAPPER" >&2
  echo "Create it from Atlas docs or re-run Hermes setup for Atlas daemon." >&2
  exit 1
fi

sed \
  -e "s|__ATLAS_ROOT__|$ATLAS_ROOT|g" \
  -e "s|__HERMES_ATLAS_WRAPPER__|$WRAPPER|g" \
  -e "s|__HERMES_LOGS__|$HERMES_HOME/logs|g" \
  "$PLIST_SRC" > "$PLIST_DST"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || launchctl unload "$PLIST_DST" 2>/dev/null || true

if launchctl bootstrap "$DOMAIN" "$PLIST_DST" 2>/dev/null; then
  :
else
  launchctl load "$PLIST_DST"
fi

sleep 2
if curl -sf "${ATLAS_API_URL:-http://127.0.0.1:4000}/health" >/dev/null; then
  echo "OK: Atlas API healthy at ${ATLAS_API_URL:-http://127.0.0.1:4000}"
else
  echo "WARN: API not healthy yet — check $HERMES_HOME/logs/atlas-personal.stderr.log"
fi

echo "Installed $PLIST_DST"
echo "Logs: $HERMES_HOME/logs/atlas-personal.{stdout,stderr}.log"
echo "Unload: launchctl bootout $DOMAIN/$LABEL"