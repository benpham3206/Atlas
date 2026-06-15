# Codex PR Review Prompt

Review this branch against the base branch.

Read:

- `AGENTS.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/CODEX_RULES.md`
- `docs/ARCHITECTURE.md`
- the relevant `tasks/<TASK_ID>.md` file when present
- the diff

Focus on:

- P0/P1 correctness issues
- Missing tests for changed behavior
- Security, privacy, data-loss, auth, and permission risk
- Cross-workspace leakage
- Migration and rollback risk
- Public API compatibility
- Unverified claims of completion

Return only findings with severity, evidence, and file references. Avoid style-only comments.

