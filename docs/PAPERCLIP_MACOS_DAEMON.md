# Paperclip macOS daemon (API + dashboard)

Paperclip serves the **board UI and API on the same origin** (`http://127.0.0.1:3100`) in dev middleware mode. This daemon keeps that stack up under **launchd** + **caffeinate** (same pattern as Personal Atlas and Hermes gateway).

## Install

```bash
chmod +x ~/.hermes/scripts/run-paperclip-caffeinated.sh
cd ~/Documents/Atlas
npm run paperclip:daemon:handoff   # stop foreground pnpm dev, install launchd
```

Or install without killing an existing listener first:

```bash
npm run paperclip:daemon:install
```

Verify:

```bash
curl -sf http://127.0.0.1:3100/api/health
open http://127.0.0.1:3100
pgrep -fl 'caffeinate.*@paperclipai/server'
tail -20 ~/.hermes/logs/paperclip.stdout.log
```

## Unload

```bash
launchctl bootout "gui/$(id -u)/com.benpham.paperclip"
```

## Limits

| State | Paperclip |
|-------|-----------|
| Awake, daemon loaded, display off | OK (caffeinate blocks **idle** sleep) |
| Lid closed / deep sleep | Offline |
| Mac powered off | Offline |

Daemon runs `pnpm --filter @paperclipai/server dev` (dashboard middleware). Use foreground `pnpm dev` when actively hacking Paperclip with file-watch restarts, then `paperclip:daemon:handoff` when done.