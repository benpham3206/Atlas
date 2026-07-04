# Brick — 2026-06-29 (Capability compounder)

**Owner:** Codex or Cursor (implement). Hermes acceptance only.

## Context

Compound cron; Atlas/Collatz `git_failed` in prep — still verify live API.

## Task (≤20 min)

1. From clone: `cd ~/Documents/Atlas && npm run smoke:operational` (or `operational:bootstrap` if cold).
2. If smoke green: `GET /personal/next-action` — complete **one** blocked task with `artifact_uri` + `evidence_note` OR file a one-line issue if next-action is empty.

## Acceptance

- [ ] `npm run smoke:operational` exit 0 **or** documented blocker in this file.
- [ ] Next-action response pasted under ## Result (redact delegation ids if posting publicly).

## Result

_(implementer fills)_