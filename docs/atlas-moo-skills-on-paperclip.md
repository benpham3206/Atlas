# Atlas + MoO skills on Paperclip (PA-P2M6)

**Date:** 2026-06-30
**Status:** reference mapping — `.agent/skills/` remain the source of truth; Paperclip **Hires** carry worker instructions.

## Principle

Paperclip owns **who runs** (agents, adapters, heartbeats). Atlas/MoO skills own **how they behave** (zero-trust, verification, ontology deltas). Do not duplicate skill bodies inside Paperclip plugin config; link them from hire instructions and repo paths.

## Skill → Paperclip surface

| Skill (`.agent/skills/`) | Paperclip mount |
| --- | --- |
| `atlas-moo-dogfood-loop` | Company hire onboarding doc + `POST /companies/:id/atlas/bootstrap` |
| `zero-trust-orchestration` | Agent API key scopes + `atlas/tools/*` write path |
| `ontology-delta-capture` | `POST /companies/:id/atlas/records` (candidate lifecycle) |
| `goal-contract-routing` | `GET /companies/:id/atlas/goal-contracts` (Goals bridge) |
| `tool-execution` | `POST /companies/:id/atlas/tools/:tool` + MCP (`ATLAS_BACKEND=paperclip`) |
| `verification-before-completion` | `GET /companies/:id/atlas/audit/verify` + `npm run validate:records` |
| `approval-filtering` | `GET /companies/:id/atlas/review-packets` (Approvals bridge) |
| `run-trace-audit-closure` | `atlas_audit_events` sidecar + Activity dual-append |
| `the-algorithm` | Design gate before new record types / tables |

## Hermes bundle

Hermes cron/heartbeat docs under `docs/examples/` and `outputs/docs/HEARTBEAT_CRON.md` should target:

- **Health:** `GET /api/health` (Paperclip)
- **Audit:** `GET /api/companies/:companyId/atlas/audit/verify`
- **Next action:** operational tools via MCP Paperclip backend or Issues/Goals UI

Set MCP env for dogfood:

```sh
export ATLAS_BACKEND=paperclip
export PAPERCLIP_API_URL=http://127.0.0.1:3100
export PAPERCLIP_COMPANY_ID=<company-uuid>
export PAPERCLIP_AGENT_API_KEY=<agent-key>
npm run mcp:atlas
```

## Non-goals

- Copying full SKILL.md bodies into `packages/db` or plugin entities.
- Per-step micromanagement — agents report via audit + activity, not inline prompts.
