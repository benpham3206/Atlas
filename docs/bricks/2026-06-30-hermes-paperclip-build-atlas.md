# Hermes + Paperclip → build / fix Atlas

**Date:** 2026-06-30
**Use when:** Ben wants Hermes as operator, Paperclip as control plane, Atlas repo as implementation surface — not another merge debate.

## Stack (three layers)

| Layer | Port / surface | Hermes uses it for |
| --- | --- | --- |
| **Paperclip** | `:3100` API/UI, `pnpm run paperclipai` | Issues, agents, runs, approvals, checkout |
| **Atlas on Paperclip** | `/api/companies/:id/atlas/*` | Knowledge tools, `verify_audit_chain`, manifest tools via **atlas-paperclip** MCP |
| **Legacy personal** (optional) | `:4000` / `:3000`, `dev:personal` | Five-task spine, `personal.*` MCP on **atlas** server |

Hermes **implements** (terminal, patch, Codex/Cursor). Paperclip **tracks** work. Atlas MCP **proves** governed reads/writes on the company spine.

## 1. Start Paperclip (authority for public trunk)

```sh
cd ~/Documents/Atlas
pnpm --filter @paperclipai/plugin-sdk build   # first time / after pull
pnpm run dev:server                            # foreground dev
# or durable:
pnpm run paperclipai run
```

Verify: `curl -sf http://127.0.0.1:3100/api/health`

## 2. Bootstrap Atlas layer on the company

```sh
export PAPERCLIP_COMPANY_ID=<uuid>   # same as Hermes paperclip MCP env
npm run bootstrap:hermes-paperclip
```

Or: `npm run paperclip:operational:bootstrap`

## 3. Hermes MCP (two servers + optional legacy)

Edit `~/.hermes/config.yaml` under `mcp_servers`:

**`paperclip`** — `@paperclipai/mcp-server` (issues, agents, comments, checkout). Set `enabled: true`. Env: `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY` (board token), `PAPERCLIP_COMPANY_ID`.

**`atlas-paperclip`** — same stdio as legacy Atlas MCP, Paperclip backend:

```yaml
atlas-paperclip:
  command: node
  args:
    - /Users/benjaminpham/Documents/Atlas/scripts/atlas-mcp-stdio.js
  env:
    ATLAS_BACKEND: paperclip
    PAPERCLIP_API_URL: http://127.0.0.1:3100
    PAPERCLIP_COMPANY_ID: <uuid>
    PAPERCLIP_API_KEY: <board token — local_trusted dogfood only>
  enabled: true
```

**`atlas`** (unchanged) — `ATLAS_SESSION_FILE` → `.atlas/local-session.json` for `:4000` personal/operational dogfood.

Then **Settings → MCP → Reload** in Hermes desktop.

Auth note: production hires should use **`PAPERCLIP_AGENT_API_KEY`** on `atlas-paperclip`. For local board dogfood, `PAPERCLIP_API_KEY` is accepted as fallback (`atlas-mcp-lib.js`).

## 4. CLI (no MCP)

```sh
cd ~/Documents/Atlas
pnpm run paperclipai issue list
pnpm run paperclipai agent list
pnpm run paperclipai run          # onboard + server
```

Atlas repo tests after code changes:

```sh
npm test
npm run test:paperclip:import
```

## 5. Typical fix loop

1. Paperclip: create/checkout issue (MCP `paperclipCheckoutIssue` or UI).
2. Hermes: edit code under `server/`, `packages/atlas-ontology/`, `scripts/`.
3. Hermes: `npm test` / targeted gate.
4. Atlas MCP: `verify_audit_chain` on company; attach evidence if using knowledge pack flow.
5. PR via Cursor/Codex; Paperclip issue → done with proof link.

## Pitfalls

- **`:3100` down** — Paperclip MCP and atlas-paperclip fail; `dev:server` exited (SIGTERM) if nothing keeps the process alive. Prefer `paperclipai run` for long sessions.
- **Only enabling `paperclip` MCP** — you get issues but not Atlas knowledge/audit tools; add **atlas-paperclip**.
- **Putting `PAPERCLIP_*` on the legacy `atlas` MCP entry** — flips backend to Paperclip and breaks `:4000` personal routes. Use a **separate** `atlas-paperclip` server.
- **Grok + MCP** — if chat 400s on tool schemas, disable the noisiest server temporarily (`xai-mcp-safe-rollout` skill); keep `paperclip` + one Atlas server.

## References

- `docs/SPEC.md` — trunk layout
- `docs/atlas-moo-skills-on-paperclip.md` — skill → route map
- `docs/HERMES_SKILL_BUNDLE.md` — Hermes vs Atlas roles
- `outputs/docs/USAGE_GUIDE.md` — legacy `:4000` path