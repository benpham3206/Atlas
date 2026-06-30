# Atlas Internal Next Action

## Momentum program (giants shoulders)

**Cadence:** Hermes cron **Atlas Giants momentum** (9am/5pm Photon) + weekly **company turn** on live spine.

**Playbook:** `outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md` · pulse: `npm run momentum:pulse`

## Next Action (Public Atlas — Paperclip pivot)

**Do:** **PA-P2d** — ADR + implement Company ↔ `workspace_id` mapping for knowledge routes.
**Because:** atlas-ontology is mounted and tested; knowledge routes need company scope before CRUD (PA-P2e).

## Deferred: personal workspace spine

**Unblocked:** PS-P1 may start; sequenced after PA-P2c unless Ben reprioritizes.
**Pointer:** `outputs/internal/PERSONAL_WORKSPACE_STATUS.md`

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
