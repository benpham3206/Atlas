# Handoff: object_task_runtime_foundation (P1 spine)

**Owner:** Codex/Cursor · **Architect:** Hermes · **Date:** 2026-06-30

## Context

Polish program E1–E7 is **done** on branch `polish/e1-outputs-shelf` (ledger: `outputs/proofs/VERIFICATION_LEDGER.md`). Personal spine next action per `outputs/internal/NEXT_ACTION.md`.

## Objective

Wire durable object runtime: Postgres path, transaction boundary, migration runner, object history tests — unblocks policy/public/enterprise tasks that cannot stay on JSON snapshots alone.

## Read first

- `outputs/internal/PERSONAL_WORKSPACE_STATUS.md`
- `TASKS.md` (persistence section)
- `AGENTS.md` — no DB runtime yet; `npm run verify:migrations` is static only

## Acceptance (Ben / Hermes smoke later)

- [ ] Migration runner connects when configured (document env vars)
- [ ] Object history tests green under `node --test`
- [ ] `npm run gate:test` passes on implementation branch
- [ ] Evidence note + artifact URI on personal task complete (governed path)

## Result

_(Ben/Codex: fill after first PR slice)_