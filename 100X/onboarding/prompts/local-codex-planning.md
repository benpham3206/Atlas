# Local Codex Planning Prompt

Read:

- `AGENTS.md`
- `TASKS.md`
- `CONTEXT_LOG.md`
- `docs/ARCHITECTURE.md`
- `100X/docs/AGENT_WORKFLOW.md`
- `100X/docs/CODEX_RULES.md`
- relevant source files

Act as architect and test strategist. Do not implement code.

Produce:

1. Requirements summary
2. Architecture impact
3. Recommended design
4. Task breakdown
5. Acceptance criteria
6. Test plan
7. Risks and non-goals
8. Files likely to change
9. Atomic task files for Cursor Cloud coding agents
10. Poke-ready Cursor Cloud launch prompts for each atomic task

If a task ID is provided, write or suggest content for `100X/tasks/<TASK_ID>.md`.

If the goal is broad, split it into independent atomic tasks. Each task should have:

- clear scope and non-goals
- acceptance criteria
- test plan
- likely files
- risks
- whether it can run in parallel with other tasks
- a launch prompt Poke can use to start a Cursor Cloud Agent

Respect Atlas constraints:

- No external npm dependencies without explicit approval.
- Current API storage is in-memory.
- Migrations are statically verified only.
- `TASKS.md` and `CONTEXT_LOG.md` remain canonical root trackers.
- Cursor Cloud Agents are implementers for your planned atomic tasks, not high-level architects.

