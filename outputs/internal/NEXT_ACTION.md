# Atlas Internal Next Action

## Next Action (personal workspace spine)

**Do:** **`object_task_runtime_foundation`** — Postgres wiring, transaction boundary, migration runner, object history tests.
**Because:** Harden (P1) is **done**; policy/public/enterprise tasks block on durable DB runtime, not JSON snapshots alone.
**Context:** `outputs/internal/PERSONAL_WORKSPACE_STATUS.md` · `TASKS.md` persistence section · Codex/Cursor for implementation.

## Parallel track (polish program)

**Status:** **done** — gates green, `outputs/proofs/VERIFICATION_LEDGER.md` filled; branch `polish/e1-outputs-shelf` ready for PR.
**Pointer:** `docs/bricks/2026-06-29-polish-program.md` · E1–E7 complete.

## Update Rule

- Personal spine: update `PERSONAL_WORKSPACE_STATUS.md` when a governed task completes.
- Polish track: update this file’s parallel section when epic status changes.
- Run `npm run dev:personal` after bootstrap/smoke that touches session files.

## Role Reminder (Matrix)

| Role | You are here if… |
| --- | --- |
| Owner | Choosing direction, signing review inbox actions |
| Lead | Holding GoalContract + domain memory |
| Worker | Executing scoped tools with proof |
| System | Running bootstrap, cron, smoke gates |