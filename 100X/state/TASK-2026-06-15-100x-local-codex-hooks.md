# TASK-2026-06-15-100x-local-codex-hooks State

## Current status

- Phase: REVIEW
- Branch: local-main
- PR: not opened yet
- Owner: local-codex
- Last update: 2026-06-15

## Current summary

Local Codex is adding a zero-dependency workflow hook that lets Cursor Cloud or local Cursor agents
generate local Codex review packets automatically after implementation, while keeping Codex itself
local/manual. The workflow contract is prompt -> Codex plans infrastructure/tests/atomic tasks ->
Cursor implements -> Codex reviews.

## Blockers

- None.

## Risks

- The hook must not imply remote Codex invocation.
- Review packets must not capture secrets or environment dumps.
- Root `.cursor/` rules must stay aligned with `100X/cursor/` rules.

## Next action

Review the hook setup, then commit and push it so Cursor agents can use the review-packet command.

## Poke-ready summary

Setting up a local-Codex-safe automation hook: Cursor agents generate review packets automatically,
then the human runs local Codex for review and sends findings back to Cursor for scoped fixes.
