# Atlas Internal Next Action

## Momentum program (giants shoulders)

**Cadence:** Hermes cron **Atlas Giants momentum** (9am/5pm Photon) + weekly **company turn** on live spine.

**Playbook:** `outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md` · pulse: `npm run momentum:pulse`

## Next Action (Public Atlas — Paperclip pivot)

**Do:** **PA-P1b** — import Paperclip MIT repo to repo root (`server/`, `ui/`, `cli/`, `packages/adapters/`).
**Because:** Snapshot tag `atlas-pre-paperclip-v0` is in place; root-trunk import is next.
**Context:** `TASKS.md` § PA-P1 · `docs/bricks/2026-06-30-public-atlas-atomic-tasks.md`
**Verification:** Paperclip layout present; `upstream` remote → `https://github.com/paperclipai/paperclip`

## Deferred: personal workspace spine

**Blocked until:** PA-P1 epic gate (P1a–P1g complete).
**Then:** **PS-P1** / `object_task_runtime_foundation` — Postgres wiring, migration runner, object history tests.
**Pointer:** `outputs/internal/PERSONAL_WORKSPACE_STATUS.md` · `docs/bricks/2026-06-30-runtime-foundation-handoff.md`

## Parallel track (polish program)

**Status:** **done** — gates green, `outputs/proofs/VERIFICATION_LEDGER.md` filled; branch `polish/e1-outputs-shelf` ready for PR.
**Pointer:** `docs/bricks/2026-06-29-polish-program.md` · E1–E7 complete.

## Update Rule

- Public Atlas: update `TASKS.md` PA-* checkboxes when a task completes; update epic gates in this file.
- Personal spine: update `PERSONAL_WORKSPACE_STATUS.md` when a governed PS-* task completes.
- Run `npm run dev:personal` after bootstrap/smoke that touches session files.

## Role Reminder (Matrix)

| Role | You are here if… |
| --- | --- |
| Owner | Choosing direction, signing review inbox actions |
| Lead | Holding GoalContract + domain memory |
| Worker | Executing scoped tools with proof |
| System | Running bootstrap, cron, smoke gates |
