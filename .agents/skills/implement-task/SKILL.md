---
name: implement-task
description: Use when implementing a scoped Atlas task from an existing task file.
---

# Implement Task Skill

Inputs:

- `AGENTS.md`
- `docs/AGENT_WORKFLOW.md`
- `TASKS.md`
- `CONTEXT_LOG.md`
- `tasks/<TASK_ID>.md`
- Relevant source files

Steps:

1. Confirm the task goal, acceptance criteria, test plan, risks, and non-goals.
2. Identify the smallest set of files to change.
3. Add or update tests for changed behavior first when practical.
4. Implement the scoped change using existing repo patterns.
5. Run the narrowest relevant verification command.
6. Run broader verification when the change crosses package, API, migration, fixture, or workflow
   boundaries.
7. Update task/state/log files with evidence.
8. Summarize commands run, risks, next action, and Poke-ready status.

Constraints:

- Do not add external dependencies without explicit approval.
- Do not expand scope without updating the task file.
- Do not mark completion without verification evidence.

