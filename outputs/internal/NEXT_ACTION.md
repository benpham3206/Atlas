# Atlas Internal Next Action

> **This is the ONLY mutable direction file.** If any other doc disagrees, this file
> wins (per AGENTS.md). Full operating brief: `ATLAS_STATE_DIRECTION_2026-07-02.md`.

## Momentum program (giants shoulders)

**Cadence:** Hermes cron **Atlas Giants momentum** (9am/5pm Photon) + weekly **company turn** on live spine.

**Playbook:** `outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md` · pulse: `npm run momentum:pulse`

## Next Action (Public Atlas — Paperclip pivot)

**Do (ordered, per Ben's 2026-07-02 brief):**
1. **Proof green first — ATL-21:** Verifier runs audit verify + `validate:records` against the live seeded pack, posts evidence on the issue; re-verify ATL-18's event_hash fix against the actual canon pack (reopen ATL-18 if the chain doesn't verify).
2. **Ship ATL-8:** public read slice — first external artifact of Public Atlas.

**Then:** PS-P1 (personal workspace runtime foundation) / H1 (structured failure payloads).
**Because:** PA-P1–P4 gates all passed; nothing else counts until the proof layer is demonstrably honest.

## Epic gates (current)

| Epic | Status |
| --- | --- |
| PA-P1 (Paperclip trunk) | **done** |
| PA-P2 (knowledge + proof) | **done** |
| PA-P2M (Atlas + MoO import) | **done** |
| PA-P3 (staff + knowledge pack) | **done** — PA-P3a–g green; `test:paperclip:import` 52/52 |
| PA-P4 (re-hero + public slice) | **done** — site + smoke green |

## Deferred: personal workspace spine

**Unblocked:** PS-P1 may start; sequenced after PA-P3 unless Ben reprioritizes.
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
