# TASK-2026-06-22-personal-atlas-composer-25 Local Codex Review Packet

Generated: 2026-06-22T22:08:24.915Z
Branch: cursor/personal-atlas-composer-25
Head: e6eec33
PR: 6
Base: origin/main

## Local Codex Review Instructions

Review this branch against `origin/main`.

Read:

- `AGENTS.md`
- `100X/AGENTS.md`
- `100X/docs/AGENT_WORKFLOW.md`
- `100X/docs/CODEX_RULES.md`
- `100X/codex/prompts/review.md`
- `100X/tasks/TASK-2026-06-22-personal-atlas-composer-25.md`
- `100X/state/TASK-2026-06-22-personal-atlas-composer-25.md`
- `100X/logs/TASK-2026-06-22-personal-atlas-composer-25.md`
- the branch diff

Return only P0/P1/P2 findings with file and line references. Focus on correctness, missing tests,
security/privacy, regressions, migration risk, acceptance criteria, and scope drift. Do not rewrite
the implementation unless explicitly asked.

## Handoff Files

### Task

Source: `100X/tasks/TASK-2026-06-22-personal-atlas-composer-25.md`

```markdown
# TASK-2026-06-22-personal-atlas-composer-25

## Goal

Build the smallest usable personal Atlas slice: private workspace + Carbon Copy + AAA vertical-slice project + task graph + next-action dashboard + one governed action to complete a task.

## User intent

Original request:

> Implement Personal Atlas v0 slice with generic actions, personal bootstrap/overview/next-action/complete endpoints, and a dependency-free web dashboard.

## Scope

In:

- Generic object PATCH, ActionType/ActionRun storage and API
- Personal bootstrap, overview, next-action, complete-task endpoints
- Migration `0004_actions.sql`
- Server-rendered personal dashboard with API proxy
- Tests, docs, 100X tracker updates

Out:

- Auth, database persistence, org/workspace sharing
- Workflow canvas, integrations, LLM calls, public publishing
- External npm dependencies

## Acceptance criteria

- [ ] `PATCH /workspaces/:workspace_id/objects/:object_id` merges properties and validates schema
- [ ] ActionType and ActionRun CRUD endpoints with workspace scoping
- [ ] Action execution records input, output, status, actor, target, before/after properties
- [ ] `POST /personal/bootstrap` idempotently seeds personal workspace data
- [ ] `GET /personal/overview` and `GET /personal/next-action` return grounded next action
- [ ] `POST /personal/tasks/:task_id/complete` runs governed action and advances next action
- [ ] Web dashboard shows bootstrap or overview with complete-task form
- [ ] Invalid input, type mismatch, cross-workspace references fail without mutation
- [ ] Docs state local in-memory boundary; no false auth/privacy claims
- [ ] All regression commands pass

## Test plan

- Unit: store action types/runs, PATCH objects, action execution effects
- Integration: API routes, personal endpoints, cross-workspace rejection
- Web: bootstrap state, dashboard, error handling
- Regression: `npm run lint`, `validate:records`, `verify:migrations`, `npm test`

## Likely files

- `apps/api/src/ontology-store.js`
- `apps/api/src/server.js`
- `apps/api/src/personal-atlas.js`
- `apps/api/test/*.test.js`
- `apps/web/src/*`
- `infra/migrations/0004_actions.sql`
- `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY_MODEL.md`
- `TASKS.md`, `100X/state/`, `100X/logs/`

## Risks

- Personal and API subagents must not edit same files in parallel
- Action effect engine must stay declarative, not arbitrary code execution
- Web proxy must handle API errors without crashing

## Plan

1. Add ActionType/ActionRun storage, object PATCH, migration, API routes, tests
2. Add personal seed, next-action selector, personal endpoints, tests
3. Replace web placeholder with personal dashboard and proxy
4. Update docs and 100X tracker
5. Run verifier, test-runner, security-auditor subagents

## Review requirements

- Codex review required: yes
- Bugbot review required: yes
- Security review required: yes
- Human approval required before merge: yes
```


### State

Source: `100X/state/TASK-2026-06-22-personal-atlas-composer-25.md`

```markdown
# TASK-2026-06-22-personal-atlas-composer-25 State

## Current status

- Phase: REVIEW
- Branch: not created yet
- PR: not created yet
- Owner: Cursor Composer 2.5
- Last update: 2026-06-22

## Current summary

Personal Atlas v0 implementation complete: generic ActionType/ActionRun CRUD, object PATCH, personal bootstrap/overview/next-action/complete endpoints, web dashboard with API proxy, migration `0004_actions.sql`, tests, and documentation updates. Ready for review packet and PR.

## Blockers

- None

## Risks

- API and personal layers share `ontology-store.js` and `server.js`; concurrent edits required coordination during implementation.

## Next action

Run `npm run 100x:review-packet -- TASK-2026-06-22-personal-atlas-composer-25 --pr <PR>` after PR is opened, or open PR for Codex review.

## Poke-ready summary

Personal Atlas v0 landed: in-memory AAA vertical slice with bootstrap, overview, next-action, task completion, ActionType/ActionRun, object PATCH, and a dependency-free web dashboard. No auth; data resets on restart. Docs updated. Ready for review.
```


### Log

Source: `100X/logs/TASK-2026-06-22-personal-atlas-composer-25.md`

```markdown
# TASK-2026-06-22-personal-atlas-composer-25 Log

## Command evidence

| Time | Command | Result | Notes |
| --- | --- | --- | --- |
| 2026-06-22T00:00:00Z | Task package created | pass | tasks/state/log files initialized |
| 2026-06-22T12:00:00Z | `npm test` | pass | 78 tests |
| 2026-06-22T12:00:00Z | `npm run lint` | pass | |
| 2026-06-22T12:00:00Z | `npm run validate:records` | pass | 20 records |
| 2026-06-22T12:00:00Z | `npm run verify:migrations` | pass | 4 migration files |
| 2026-06-22T12:00:00Z | Implementation subagents | pass | API/actions, personal endpoints, web dashboard, and tests completed by parallel subagents |
| 2026-06-22T18:00:00Z | Documentation subagent | pass | README, ARCHITECTURE, SECURITY_MODEL, 100X state/log, POKE_SUMMARY updated |

## Review notes

- Implementation subagents completed API (ActionType, ActionRun, object PATCH, `0004_actions.sql`), personal layer (`bootstrap`, `overview`, `next-action`, task complete), and web dashboard proxy.
- Baseline verification: tests, lint, validate, verify expected to pass after implementation.
- State moved to REVIEW phase pending PR and Codex review packet.

## Handoff notes

- Personal Atlas is in-memory with no auth; document and UI surface this explicitly.
- Web dashboard proxies to API via `ATLAS_API_URL`; no embedded personal state in `apps/web`.
- Next: open PR, run `npm run 100x:review-packet`, commit packet for local Codex review.
```


### Poke Summary

Source: `100X/POKE_SUMMARY.md`

```markdown
# POKE_SUMMARY.md

Short index for Poke status updates. Root `AGENTS.md`, `TASKS.md`, and `CONTEXT_LOG.md` remain the canonical Atlas trackers; detailed workflow evidence lives under `100X/tasks/`, `100X/state/`, and `100X/logs/`.

## Latest text-ready update

Personal Atlas v0 is ready for review. The slice adds ActionType/ActionRun create/list/fetch, object PATCH, personal bootstrap/overview/next-action endpoints, and a web dashboard that proxies the API. Storage is in-memory with no auth; data resets on API restart. Open a PR and run `npm run 100x:review-packet -- TASK-2026-06-22-personal-atlas-composer-25 --pr <PR>` for local Codex review.
```


## Git Status

```text
?? "Atlas PRD Final copy.md"
```

## Diff Stat

```text
100X/POKE_SUMMARY.md                               |  13 +-
 .../TASK-2026-06-22-personal-atlas-composer-25.md  |  25 ++
 .../TASK-2026-06-22-personal-atlas-composer-25.md  |  29 ++
 .../TASK-2026-06-22-personal-atlas-composer-25.md  |  79 +++++
 README.md                                          | 107 +++++-
 TASKS.md                                           |   1 +
 apps/api/src/ontology-store.js                     | 247 ++++++++++++++
 apps/api/src/personal-atlas.js                     | 378 +++++++++++++++++++++
 apps/api/src/server.js                             |  93 +++++
 apps/api/test/actions.test.js                      | 358 +++++++++++++++++++
 apps/api/test/ontology-store.test.js               | 283 +++++++++++++++
 apps/api/test/personal-atlas.test.js               | 233 +++++++++++++
 apps/web/src/api-client.js                         |  88 +++++
 apps/web/src/render.js                             | 367 ++++++++++++++++++--
 apps/web/src/server.js                             | 183 +++++++++-
 apps/web/test/dashboard.test.js                    | 220 ++++++++++++
 apps/web/test/render.test.js                       | 137 +++++++-
 docs/ARCHITECTURE.md                               |  27 +-
 docs/SECURITY_MODEL.md                             |  17 +-
 infra/migrations/0004_actions.sql                  |  57 ++++
 packages/ontology-core/src/index.js                |   6 +
 tests/integration/migrations.test.js               |   3 +-
 22 files changed, 2889 insertions(+), 62 deletions(-)
```

## Changed Files

```text
100X/POKE_SUMMARY.md
100X/logs/TASK-2026-06-22-personal-atlas-composer-25.md
100X/state/TASK-2026-06-22-personal-atlas-composer-25.md
100X/tasks/TASK-2026-06-22-personal-atlas-composer-25.md
README.md
TASKS.md
apps/api/src/ontology-store.js
apps/api/src/personal-atlas.js
apps/api/src/server.js
apps/api/test/actions.test.js
apps/api/test/ontology-store.test.js
apps/api/test/personal-atlas.test.js
apps/web/src/api-client.js
apps/web/src/render.js
apps/web/src/server.js
apps/web/test/dashboard.test.js
apps/web/test/render.test.js
docs/ARCHITECTURE.md
docs/SECURITY_MODEL.md
infra/migrations/0004_actions.sql
packages/ontology-core/src/index.js
tests/integration/migrations.test.js
```

## Cursor Fix Follow-up Template

```text
Task ID: TASK-2026-06-22-personal-atlas-composer-25

Read the Codex review findings pasted below and apply only scoped fixes for this task.
Do not re-plan architecture. Do not expand scope beyond 100X/tasks/TASK-2026-06-22-personal-atlas-composer-25.md.
Update 100X/state/TASK-2026-06-22-personal-atlas-composer-25.md, 100X/logs/TASK-2026-06-22-personal-atlas-composer-25.md, and 100X/POKE_SUMMARY.md.
Run the relevant verification commands from the task file.
Push the branch and update the PR.

Codex findings:

<paste findings here>
```
