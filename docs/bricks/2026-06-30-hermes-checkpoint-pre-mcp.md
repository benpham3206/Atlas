# Hermes checkpoint — pre MCP atlas-paperclip integration

**Created:** 2026-06-30  
**Purpose:** Roll back Hermes if `paperclip` / `atlas-paperclip` MCP breaks chat, gateway, or tool loading.

## Active checkpoints (on this machine)

| Kind | ID / path | Restore |
| --- | --- | --- |
| **Quick state snapshot** | `20260701-051919-pre-mcp-atlas-paperclip` | In Hermes chat/TUI: `/snapshot restore 20260701-051919-pre-mcp-atlas-paperclip` |
| **Full zip** | `~/Documents/Atlas/evidence/hermes-checkpoint-pre-mcp-full.zip` (~616MB) | `hermes import ~/Documents/Atlas/evidence/hermes-checkpoint-pre-mcp-full.zip` (quit desktop/gateway first; see import help) |

Quick snapshot files live under `~/.hermes/state-snapshots/20260701-051919-pre-mcp-atlas-paperclip/`.

## Re-create before risky MCP edits

```sh
hermes backup --quick -l pre-mcp-atlas-paperclip
# optional full:
hermes backup -o ~/Documents/Atlas/evidence/hermes-checkpoint-pre-mcp-full.zip
```

## Restore if MCP integration fails

### Fast (config + critical state only)

1. Quit Hermes desktop / gateway.
2. In a **new** Hermes session (or TUI): `/snapshot list` → confirm id → `/snapshot restore 20260701-051919-pre-mcp-atlas-paperclip`
3. Reload MCP or disable servers (below).

### Full (sessions + skills tree)

1. Quit Hermes desktop / gateway.
2. `mv ~/.hermes ~/.hermes.broken-$(date +%s)` (optional safety move).
3. `hermes import ~/Documents/Atlas/evidence/hermes-checkpoint-pre-mcp-full.zip`
4. Restart Hermes.

### Surgical (keep snapshot, only kill bad MCP)

```sh
hermes config set mcp_servers.paperclip.enabled false
# if you added atlas-paperclip:
hermes config set mcp_servers.atlas-paperclip.enabled false
```

Or edit `~/.hermes/config.yaml`, then **Settings → MCP → Reload**.

If Grok 400s on tool schemas: leave only `atlas` + `jarvis` enabled (`xai-mcp-safe-rollout`).

## Config-only fallback

```sh
ls -t ~/.hermes/config.yaml.backup.* | head -3
cp "$(ls -t ~/.hermes/config.yaml.backup.* | head -1)" ~/.hermes/config.yaml
```

## Not covered

- **Project `/rollback`** — `checkpoints.enabled: false`; unrelated to MCP.
- **Paperclip :3100** — restart with `pnpm run dev:server` / `paperclipai run`.
- **Atlas repo** — git owns `scripts/atlas-mcp-lib.js` etc.

## Same failure as 2026-06-30 (Grok 400)

Enabling Paperclip MCP on **Grok** without preflight can look like “Hermes can’t reach providers” — actually **xAI rejects the whole tools payload** (`Schema validation failed`, `non_retryable_client_error`). Symptom: **no reply on any message**. Fix: disable `paperclip` / `atlas-paperclip`, Reload MCP, or `/snapshot restore 20260701-051919-pre-mcp-atlas-paperclip`. Before re-enable: `~/.hermes/hermes-agent/.venv/bin/python3 ~/.hermes/scripts/mcp-xai-schema-preflight.py paperclip` → exit 0. Postmortem: `~/.hermes/skills/mcp/xai-mcp-safe-rollout/references/paperclip-grok-schema-brick-2026-06-30.md`.

## Done when

One session after MCP enable: tools load, one Paperclip checkout, one `atlas-paperclip` read — then you can prune old snapshots if you want.