# Codex Rules for Atlas

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
