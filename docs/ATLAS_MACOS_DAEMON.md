# Personal Atlas macOS daemon (API + MCP session)

Hermes spawns `atlas-mcp-stdio.js` on demand. For MCP tools to work, the **Atlas API** and **`.atlas/local-session.json`** must stay valid. This daemon supervises both under **launchd** + **caffeinate** (same pattern as Hermes gateway).

## Install (login + restart + idle awake)

```bash
chmod +x ~/.hermes/scripts/run-atlas-personal-caffeinated.sh
cd ~/Documents/Atlas
npm run daemon:install
```

Verify:

```bash
curl -sf http://127.0.0.1:4000/health
pgrep -fl 'caffeinate.*atlas-personal-daemon'
tail -20 ~/.hermes/logs/atlas-personal.stdout.log
```

## Unload

```bash
launchctl bootout "gui/$(id -u)/com.benpham.atlas.personal"
```

## Env (LaunchAgent `EnvironmentVariables` or plist edit)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ATLAS_DAEMON_WEB` | off | Set `1` to also supervise web `:3000` |
| `ATLAS_SESSION_REFRESH_BUFFER_SEC` | `600` | Refresh delegation this many seconds before `expires_at` |
| `ATLAS_API_URL` | `http://127.0.0.1:4000` | API base |

After plist edits: `launchctl bootout …` then `npm run daemon:install`.

## Limits (be plain with Ben)

| State | Atlas API / Hermes MCP |
|-------|-------------------------|
| Awake, daemon loaded, display off | OK (caffeinate blocks **idle** sleep) |
| Lid closed / deep sleep | Offline |
| Mac powered off | Offline |

MCP stdio is **not** a always-on process — only the API + session file are.

## Foreground (no launchd)

```bash
caffeinate -im npm run daemon:personal --prefix ~/Documents/Atlas
```