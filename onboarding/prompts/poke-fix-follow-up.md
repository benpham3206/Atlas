# Poke Fix Follow-up Prompt

Ask Cursor Cloud Agent to address the Codex review findings on the current smoke-test PR.

Task ID: TASK-2026-06-15-poke-smoke-test

Instructions:

- Read `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `tasks/TASK-2026-06-15-poke-smoke-test.md`,
  `state/TASK-2026-06-15-poke-smoke-test.md`, and `logs/TASK-2026-06-15-poke-smoke-test.md`.
- Apply only fixes related to the Codex findings pasted below.
- Do not re-plan or expand the task; Codex is the architecture/planning/review lane.
- Keep the task docs-only unless a finding explicitly requires a workflow test or lint update.
- Run the relevant verification commands.
- Update `logs/TASK-2026-06-15-poke-smoke-test.md`.
- Update `POKE_SUMMARY.md`.
- Push the branch and update the draft PR.
- Reply with the final Poke-ready summary under 100 words.

Codex findings:

```text
<paste findings here>
```

