# Codex Rules for Atlas

## Role

Codex is the architecture, planning, atomic task decomposition, test-strategy, and
independent-review lane for Atlas. Cursor Cloud Agents are the default implementation lane for the
atomic task files Codex plans. When asked to implement non-trivial work, Codex should first create
or update task specs with acceptance criteria, a test plan, and Cursor Cloud launch prompts unless
the human explicitly asks Codex to edit code.

## Rules

1. Do not introduce new frameworks without updating `docs/ARCHITECTURE.md`.
2. Every new data model must include:
   - schema
   - migration
   - tests
   - example fixture
3. Every mutation must create an `AuditEvent` once audit exists.
4. Every `ActionRun` must check policy before mutation once actions exist.
5. No endpoint may return records outside the caller's workspace once workspace data exists.
6. Do not implement ZK, blockchain, or Lean until the ontology/action kernel passes tests.
7. Prefer small, verifiable changes.
8. Every PR or task completion must include a short "what changed" and "how tested" section.
9. Keep non-goals explicit in `TASKS.md`.
10. Update `TASKS.md` as work progresses.
11. For non-trivial planning, write or update `100X/tasks/<TASK_ID>.md` with acceptance criteria, test plan, risks, and likely files.
12. For review, compare the diff against `AGENTS.md`, `100X/docs/AGENT_WORKFLOW.md`, the relevant task spec, and `docs/ARCHITECTURE.md`.
13. Prioritize P0/P1 correctness, missing tests, security, privacy, data-loss, migration, and public API compatibility findings over style comments.
14. Split broad goals into atomic tasks that can be assigned to one or more Cursor Cloud coding agents without overlapping file ownership.
