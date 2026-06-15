# Codex Rules for Atlas

## Role

Codex is the architecture, planning, test-strategy, and independent-review lane for Atlas. Cursor is
the default implementation lane. When asked to implement non-trivial work, Codex should first create
or update a task spec with acceptance criteria and a test plan unless the human explicitly asks Codex
to edit code.

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
11. For non-trivial planning, write or update `tasks/<TASK_ID>.md` with acceptance criteria, test plan, risks, and likely files.
12. For review, compare the diff against `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, the relevant task spec, and `docs/ARCHITECTURE.md`.
13. Prioritize P0/P1 correctness, missing tests, security, privacy, data-loss, migration, and public API compatibility findings over style comments.
