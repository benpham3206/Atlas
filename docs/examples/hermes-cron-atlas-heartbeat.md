# Example: Hermes cron → Atlas heartbeat

Minimal sidecar pattern. Atlas stays authority; Hermes is the fast harness.

## Env (after operational bootstrap)

```sh
export ATLAS_API_URL=http://127.0.0.1:4000
export ATLAS_DELEGATION_ID=delegation_001
```

## MCP tools used in heartbeat

- `list_goal_contracts` — Paperclip goal alignment check
- `list_delegations` — Company hire status
- `get_next_action` — pick work
- `verify_audit_chain` — proof gate

Revoke/pause is **not** an MCP Tool Router tool. Board uses `PATCH /workspaces/:id/agent-delegations/:id` with `{ "status": "revoked" }` or the web Board form.

## Verification ledger

After a dry-run, add a row via:

```sh
node scripts/update-verification-ledger.js "polish quickstart" "npm run smoke:polish"
```
