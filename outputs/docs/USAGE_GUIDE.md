# Atlas Usage Guide (Hermes bar)

Fifteen-minute path to the first **governed** action. Apply **the Algorithm** first: question whether you need more setup than this doc — delete steps that do not prove value.

## Prerequisites

- Node.js 18.17+
- Repo checkout at `~/Documents/Atlas`

## 1. Start stack (~2 min)

```sh
cd ~/Documents/Atlas
npm run dev:personal
```

Note: `npm run dev: personal` (with a space) is invalid — the script name is `dev:personal`.

Verify:

```sh
curl -sf http://127.0.0.1:4000/health
curl -sf http://127.0.0.1:3000/health
```

See `outputs/app/RUN_PATH.md` for details.

## 2. Bootstrap personal workspace (~1 min)

Web: open http://127.0.0.1:3000 and click **Bootstrap Personal Atlas**.

Or API:

```sh
curl -X POST http://127.0.0.1:4000/personal/bootstrap
curl http://127.0.0.1:4000/personal/overview
curl http://127.0.0.1:4000/personal/tasks
curl http://127.0.0.1:4000/personal/next-action
```

## 3. Operational session + MCP (~3 min)

```sh
npm run operational:bootstrap
```

Writes `.atlas/local-session.json` (gitignored). Cursor MCP:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["scripts/atlas-mcp-stdio.js"],
      "env": { "ATLAS_SESSION_FILE": ".atlas/local-session.json" }
    }
  }
}
```

**Fail-closed:** missing, malformed, or expired session → MCP returns structured authorization errors. MCP never mints delegations (safety-by-absence).

### Hermes + Atlas split

| Layer | Owns | You use it for |
| --- | --- | --- |
| **Atlas** | Workspaces, GoalContracts, delegations, Tool Router, audit, review packets | Governed `get_next_action`, evidence, `verify_audit_chain`, Board pause (human API) |
| **Hermes** | Skills, memory, MCP client, cron delivery, host editing | Dogfood orchestration, heartbeat prompts, implementation in the clone via terminal/files |

Atlas answers “what is allowed and what happened?” Hermes answers “who runs the session and how is work delivered?” Delegations are minted only by Atlas bootstrap paths (`operational:bootstrap`, `dev:personal`), never by Hermes config alone.

Skill bundle for operators: `docs/HERMES_SKILL_BUNDLE.md` (`matrix-hermes-product-craft`, `atlas-personal-dogfood`, `plan`, `writing-plans`).

### MCP session hygiene

1. **Cursor** — project MCP config from repo root `~/Documents/Atlas`:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["scripts/atlas-mcp-stdio.js"],
      "env": { "ATLAS_SESSION_FILE": ".atlas/local-session.json" }
    }
  }
}
```

2. **Hermes desktop** — same stdio script and `ATLAS_SESSION_FILE`. After changing delegation or session file: **Settings → MCP → Reload**. The desktop GUI does not expose `/reload-mcp` in chat.

3. **`npm run smoke:polish`** — starts an **ephemeral** API on a random port and writes a temporary session (e.g. `.tmp-polish-quickstart-session.json`). It is a CI/quickstart gate, not your daily `:4000` session. **After polish smoke**, if the API on port 4000 is already up, refresh the personal session file:

```sh
node scripts/dev-personal.js
# or: npm run dev:personal --prefix ~/Documents/Atlas
```

Then Hermes **Settings → MCP → Reload** if in-chat `mcp_atlas_*` still shows `api_unreachable` or 401.

4. **Personal durable loop** — prefer `npm run dev:personal` or launchd (`daemon:install` / `daemon:handoff`) so `.atlas/local-session.json` tracks the live API and delegation expiry (~1h).

## 4. Governed tool call (~2 min)

Via Tool Router (Bearer delegation from bootstrap output):

```sh
curl -sS -X POST "$ATLAS_API_URL/agent/tools/get_next_action" \
  -H "authorization: Bearer $ATLAS_DELEGATION_ID" \
  -H "content-type: application/json" \
  -d '{}'
```

MCP equivalents: `get_next_action`, `list_goal_contracts`, `list_delegations`, `verify_audit_chain`.

Generic API transport (allowlisted routes only):

- `atlas.api.get` — `/personal/overview`, `/personal/tasks`, `/personal/next-action`
- `atlas.api.patch` — `/personal/objects/:object_id` (not `status: done`; use complete route)
- `atlas.api.post` — `/personal/bootstrap`, `/personal/tasks/:task_id/complete`

## 5. Complete one task with evidence (~5 min)

UI: `?view=next-action` → artifact URI + evidence note.

API:

```sh
curl -X POST http://127.0.0.1:4000/personal/tasks/<TASK_ID>/complete \
  -H "content-type: application/json" \
  -d '{"artifact_uri":"outputs/docs/USAGE_GUIDE.md","evidence_note":"Verified operator path"}'
```

## 6. Review inbox + Board (~2 min)

- Review: http://127.0.0.1:3000/?view=review-inbox
- Board (Paperclip): http://127.0.0.1:3000/?view=board — pause delegations, read GoalContracts
- Company hires: http://127.0.0.1:3000/?view=company

## 7. Audit verify

```sh
curl http://127.0.0.1:4000/audit/verify
```

## 8. Recovery

1. `outputs/internal/NEXT_ACTION.md`
2. `npm run operational:bootstrap` → refreshes `outputs/internal/STATE.md`
3. `npm run smoke:polish`

## Gate commands

```sh
npm test
npm run lint
npm run smoke:polish
npm run demo:flagship
```
