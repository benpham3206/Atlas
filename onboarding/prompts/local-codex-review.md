# Local Codex Review Prompt

Review the current branch or PR against the base branch.

Read:

- `AGENTS.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/CODEX_RULES.md`
- `.github/codex/prompts/review.md`
- `tasks/<TASK_ID>.md` if present
- `state/<TASK_ID>.md` if present
- `logs/<TASK_ID>.md` if present
- the diff

For the smoke test, use:

- Task ID: `TASK-2026-06-15-poke-smoke-test`

Return only P0/P1/P2 findings with evidence and file references.

Focus on:

- Whether Cursor Cloud executed the Codex-planned atomic task without architecture drift.
- Whether the task stayed docs-only.
- Whether task/state/log files were updated.
- Whether `POKE_SUMMARY.md` reflects the latest state.
- Whether verification commands are recorded.
- Missing tests or lint checks for changed workflow files.
- Security issues, especially secrets in prompts, logs, or summaries.

Do not rewrite the implementation unless explicitly asked.

