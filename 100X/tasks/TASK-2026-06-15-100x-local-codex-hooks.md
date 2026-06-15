# TASK-2026-06-15-100x-local-codex-hooks

## Goal

Make the 100X loop more automatic while preserving the constraint that Codex runs locally.

## User intent

Original request:

> i feel the loop should be automatic. can we set up hooks in cursor and codex?
> only constraint is local codex, cursor can be set up with cursor cloud agents or cursor local agents.

The user wants Cursor Cloud or local Cursor agents to automate the handoff as much as possible,
without pretending local Codex can be invoked from Cursor Cloud.

## PRD summary

The workflow is:

```text
prompt -> local Codex writes infrastructure, tests, and atomic tasks
       -> Cursor Cloud or local Cursor agents code and verify those tasks
       -> local Codex reviews code and handoff evidence
       -> Cursor agents apply scoped fixes when needed
```

Because Codex is local, the automation boundary is a generated review packet. Cursor agents can
create it automatically after implementation, then the human runs local Codex against that packet.
Codex findings can be pasted back into Poke or Cursor for a scoped fix pass.

## Scope

In:

- Add a zero-dependency `100x-loop` script for workflow status checks and local Codex review packet
  generation.
- Add npm scripts so Cursor agents can invoke the hook with a stable command.
- Add docs for generated review packets.
- Update workflow docs and Cursor rules so Cloud/local agents generate review packets after
  implementation and know that Codex owns infrastructure, tests, and atomic task planning.
- Add test coverage for the hook script.
- Update 100X task/state/log/index files.

Out:

- No remote Codex automation.
- No background daemon.
- No secrets, credentials, or environment-variable capture.
- No changes to Atlas API, web, migrations, ontology-core, fixtures, auth, policy, or audit.
- No dependency additions.

## Acceptance criteria

- [x] `npm run 100x:status -- <TASK_ID>` reports required task/state/log/Poke files.
- [x] `npm run 100x:review-packet -- <TASK_ID> --dry-run` produces local Codex review instructions.
- [x] `npm run 100x:review-packet -- <TASK_ID> --pr <PR>` writes a packet under
  `100X/review-packets/`.
- [x] Cursor Cloud/local agent rules instruct agents to generate a review packet after
  implementation.
- [x] Review packet docs explain the automation boundary: Cursor automates handoff; Codex remains
  local/manual.
- [x] Workflow docs describe the intended loop as prompt -> Codex planning/tests/tasks -> Cursor
  implementation -> Codex review.
- [x] Tests cover the hook script without writing persistent review packets.
- [x] `npm run lint` and relevant tests pass.

## Test plan

- Unit/integration: add a Node test that runs `100x-loop status` and `100x-loop review-packet
  --dry-run` for an existing task.
- Regression: run `npm run lint`.
- Regression: run `npm test` or at minimum the new integration test.

## Likely files

- `scripts/100x-loop.js`
- `package.json`
- `tests/integration/100x-loop.test.js`
- `100X/review-packets/README.md`
- `100X/cursor/rules/010-cloud-agent.mdc`
- `.cursor/rules/010-cloud-agent.mdc`
- `100X/docs/AGENT_WORKFLOW.md`
- `100X/state/TASK-2026-06-15-100x-local-codex-hooks.md`
- `100X/logs/TASK-2026-06-15-100x-local-codex-hooks.md`
- `100X/STATE.md`
- `100X/LOGS.md`
- `100X/POKE_SUMMARY.md`
- `TASKS.md`

## Risks

- Over-automation could imply Codex is running remotely. Docs and prompts must say Codex remains a
  local/manual review checkpoint.
- Review packets could collect sensitive output if agents paste environment dumps. The hook should
  only include task/state/log/Poke files and git diff summaries.
- Cursor discovery rules can drift from canonical `100X/cursor/` rules. Update both together.

## Plan

1. Add hook script and npm commands.
2. Add review packet docs.
3. Update Cursor rules and workflow docs.
4. Add integration tests.
5. Run verification.

## Review requirements

- Codex review required: yes, because this changes workflow automation.
- Bugbot review required: optional.
- Security review required: no, unless follow-up changes capture secrets or automate external
  services.
- Human approval required before merge: yes.
