#!/usr/bin/env bash
# Install Paperclip API + dashboard as a user LaunchAgent (login + crash restart + caffeinate).
set -euo pipefail

ATLAS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
WRAPPER="$HERMES_HOME/scripts/run-paperclip-caffeinated.sh"
PLIST_SRC="$ATLAS_ROOT/scripts/launchd/com.benpham.paperclip.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.benpham.paperclip.plist"
LABEL="com.benpham.paperclip"
USER_ID="$(id -u)"
DOMAIN="gui/$USER_ID"

mkdir -p "$HERMES_HOME/logs" "$HOME/Library/LaunchAgents"

if [[ ! -x "$WRAPPER" ]]; then
  echo "Missing executable wrapper: $WRAPPER" >&2
  exit 1
fi

sed \
  -e "s|__ATLAS_ROOT__|$ATLAS_ROOT|g" \
  -e "s|__HERMES_PAPERCLIP_WRAPPER__|$WRAPPER|g" \
  -e "s|__HERMES_LOGS__|$HERMES_HOME/logs|g" \
  "$PLIST_SRC" > "$PLIST_DST"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || launchctl unload "$PLIST_DST" 2>/dev/null || true

if launchctl bootstrap "$DOMAIN" "$PLIST_DST" 2>/dev/null; then
  :
else
  launchctl load "$PLIST_DST"
fi

sleep 4
if curl -sf "http://127.0.0.1:3100/api/health" >/dev/null; then
  echo "OK: Paperclip healthy at http://127.0.0.1:3100 (dashboard same origin)"
else
  echo "WARN: not healthy yet — check $HERMES_HOME/logs/paperclip.stderr.log"
fi

echo "Installed $PLIST_DST"
echo "Logs: $HERMES_HOME/logs/paperclip.{stdout,stderr}.log"
echo "Unload: launchctl bootout $DOMAIN/$LABEL"