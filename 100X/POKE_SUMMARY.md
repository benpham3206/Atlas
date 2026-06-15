# POKE_SUMMARY.md

## Latest text-ready update

Local-Codex-safe automation is being added to 100X. Cursor Cloud or local Cursor agents can run
`npm run 100x:review-packet -- <TASK_ID> --pr <PR>` after implementation to generate a local Codex
review packet. The intended loop is prompt -> Codex plans infrastructure/tests/tasks -> Cursor codes
and verifies -> Codex reviews. Root `AGENTS.md`, `TASKS.md`, and `CONTEXT_LOG.md` stay
authoritative for Atlas product work.

## Suggested next Poke command

After Cursor opens a PR, ask it to run `npm run 100x:review-packet -- <TASK_ID> --pr <PR>` and
commit the generated packet for local Codex review.
