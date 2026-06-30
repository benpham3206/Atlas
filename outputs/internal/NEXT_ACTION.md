# Atlas Internal Next Action

## Momentum program (giants shoulders)

**Cadence:** Hermes cron **Atlas Giants momentum** (9am/5pm Photon) + weekly **company turn** on live spine.

**Playbook:** `outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md` · pulse: `npm run momentum:pulse`

## Next Action (Public Atlas — Paperclip pivot)

**Do:** **PA-P2a** — Activity ↔ hash-chain integration ADR (`docs/bricks/2026-06-30-audit-activity-integration.md`).
**Because:** Import map (PA-P2M0) is merged; audit graft design must be locked before atlas-ontology mount (PA-P2b).
**Context:** `docs/bricks/2026-06-30-atlas-moo-import-map.md` §6 · `TASKS.md` § PA-P2
**Verification:** ADR merged; no implementation until reviewed

## Deferred: personal workspace spine

**Unblocked:** PS-P1 may start; sequenced after PA-P2a unless Ben reprioritizes.
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
