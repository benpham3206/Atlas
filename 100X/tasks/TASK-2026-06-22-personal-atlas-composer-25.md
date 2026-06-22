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
