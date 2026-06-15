# Cursor Cloud Agent Smoke Test Prompt

Start Cursor Cloud Agent.

Repo: benpham3206/Atlas
Base branch: main
Task ID: TASK-2026-06-15-poke-smoke-test
Mode: implement the existing Codex-planned atomic task

Goal:
Execute the docs-only smoke-test task described in `tasks/TASK-2026-06-15-poke-smoke-test.md`.

Instructions:

- Read `AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and
  `docs/AGENT_WORKFLOW.md`.
- Read `tasks/TASK-2026-06-15-poke-smoke-test.md`.
- Do not make architecture decisions beyond the task spec.
- If the task spec is missing, stop and ask for the local Codex planning step to be completed.
- Create or update `state/TASK-2026-06-15-poke-smoke-test.md`.
- Create or update `logs/TASK-2026-06-15-poke-smoke-test.md`.
- Add one tiny docs-only marker section to `docs/AGENT_WORKFLOW.md` titled
  `Smoke test marker`.
- Update `POKE_SUMMARY.md` with a concise status.
- Run `npm run lint`.
- Open a draft PR.
- End with:
  - summary
  - files changed
  - commands run and results
  - known risks
  - next action
  - Poke-ready summary under 100 words

Constraints:

- Do not add dependencies.
- Do not change API, web, ontology, migration, or runtime behavior.
- Do not run or invoke Codex cloud automation.

