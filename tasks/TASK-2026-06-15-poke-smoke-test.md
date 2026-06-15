# TASK-2026-06-15-poke-smoke-test

## Goal

Exercise the Poke → Cursor agent workflow with a docs-only smoke test. No runtime code changes.

## User intent

Original request:

> Test the agent workflow by adding a short docs note only. Do not change runtime code.

## Scope

In:

- Create this task spec with acceptance criteria and test plan.
- Add a "Smoke test marker" section to `docs/AGENT_WORKFLOW.md`.
- Update `state/`, `logs/`, `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md`.

Out:

- No API, web, ontology, migration, or runtime behavior changes.
- No external npm dependencies.
- No replacement of `TASKS.md` or `CONTEXT_LOG.md`.

## Acceptance criteria

- [x] `tasks/TASK-2026-06-15-poke-smoke-test.md` exists with acceptance criteria and test plan.
- [x] `docs/AGENT_WORKFLOW.md` includes a "Smoke test marker" section.
- [x] `state/TASK-2026-06-15-poke-smoke-test.md` reflects current phase and next action.
- [x] `logs/TASK-2026-06-15-poke-smoke-test.md` records `npm run lint` evidence.
- [x] `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md` are updated as short indexes.
- [x] `npm run lint` passes.
- [x] Draft PR is open.

## Test plan

- Unit: not applicable; docs-only change.
- Integration: not applicable; no runtime behavior changed.
- Manual: confirm no files under `apps/`, `packages/`, `scripts/`, or `infra/migrations/` changed.
- Regression: run `npm run lint`.

## Likely files

- `docs/AGENT_WORKFLOW.md`
- `tasks/TASK-2026-06-15-poke-smoke-test.md`
- `state/TASK-2026-06-15-poke-smoke-test.md`
- `logs/TASK-2026-06-15-poke-smoke-test.md`
- `STATE.md`
- `LOGS.md`
- `POKE_SUMMARY.md`

## Risks

- Creating duplicate sources of truth if root summary files become too detailed.
- Accidentally touching runtime code during a docs-only exercise.

## Review requirements

- Codex review required: no (docs-only smoke test).
- Bugbot review required: no.
- Security review required: no.
- Human approval required before merge: yes.
