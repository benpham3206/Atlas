# Cursor Cloud API Version Endpoint Prompt

Start Cursor Cloud Agent.

Repo: benpham3206/Atlas
Base branch: main
Task ID: TASK-2026-06-15-api-version-endpoint
Mode: implement the existing Codex-planned atomic task

Goal:
Execute the task described in `100X/tasks/TASK-2026-06-15-api-version-endpoint.md`.

Instructions:

- Read `AGENTS.md`, `100X/AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and
  `100X/docs/AGENT_WORKFLOW.md`.
- Read `100X/tasks/TASK-2026-06-15-api-version-endpoint.md`.
- Implement only the scoped `/version` endpoint task.
- Do not make architecture decisions beyond the task spec.
- Do not add dependencies.
- Do not change web UI, migrations, fixtures, ontology-core behavior, auth, policy, or audit.
- Add API test coverage.
- Run `npm run test:api` and `npm run lint`. Run `npm test` too if shared behavior is touched.
- Update `100X/state/TASK-2026-06-15-api-version-endpoint.md`.
- Update `100X/logs/TASK-2026-06-15-api-version-endpoint.md` with command evidence.
- Update `100X/POKE_SUMMARY.md` with a concise status.
- Open a PR for Codex review.
- End with:
  - summary
  - files changed
  - commands run and results
  - known risks
  - next action
  - Poke-ready summary under 100 words

Constraints:

- Keep the endpoint response stable and non-sensitive.
- Return only service and package version unless the task spec is updated.
- Runtime implementation belongs to Cursor Cloud Agent; Codex will review the PR after it opens.

