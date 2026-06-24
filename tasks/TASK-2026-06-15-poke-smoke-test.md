# TASK-2026-06-15-poke-smoke-test

## Goal

Run a docs-only smoke test of the Atlas Poke handoff workflow.

## User intent

Original request:

> Run a docs-only smoke test (Task ID: TASK-2026-06-15-poke-smoke-test).

## Scope

In:

- Locate or initialize `docs/AGENT_WORKFLOW.md`.
- Create this task spec with acceptance criteria and test plan.
- Create per-task state and log files.
- Create a root `POKE_SUMMARY.md` with a concise handoff summary.
- Make a minor documentation-only change.
- Run `npm run lint`.
- Open a draft pull request.

Out:

- No runtime behavior changes.
- No API, web, ontology-core, migration, script, or fixture changes.
- No external npm dependencies.

## Acceptance criteria

- [x] `docs/AGENT_WORKFLOW.md` exists and describes the workflow.
- [x] `tasks/TASK-2026-06-15-poke-smoke-test.md` exists with acceptance criteria and test plan.
- [x] `state/TASK-2026-06-15-poke-smoke-test.md` reflects current phase and next action.
- [x] `logs/TASK-2026-06-15-poke-smoke-test.md` records command evidence.
- [x] `POKE_SUMMARY.md` contains a Poke-ready summary under 100 words.
- [x] A minor documentation-only change is included.
- [x] `npm run lint` passes.
- [x] A draft pull request is open.

## Test plan

- Unit: not applicable; docs-only change.
- Integration: not applicable; no runtime behavior changed.
- Manual: inspect the diff and confirm no files under `apps/`, `packages/`, `scripts/`, `infra/`, or `tests/` changed.
- Regression: run `npm run lint`.

## Likely files

- `docs/AGENT_WORKFLOW.md`
- `tasks/TASK-2026-06-15-poke-smoke-test.md`
- `state/TASK-2026-06-15-poke-smoke-test.md`
- `logs/TASK-2026-06-15-poke-smoke-test.md`
- `POKE_SUMMARY.md`

## Risks

- Root summary files can become duplicate sources of truth if they grow beyond concise status.
- Smoke-test updates should not touch runtime files.

## Review requirements

- Codex review required: no; docs-only smoke test.
- Bugbot review required: no.
- Security review required: no.
- Human approval required before merge: yes.
