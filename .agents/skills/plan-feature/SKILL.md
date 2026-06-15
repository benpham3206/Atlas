---
name: plan-feature
description: Use when turning a fuzzy feature request into a PRD, architecture plan, task breakdown, and test plan before coding.
---

# Plan Feature Skill

Inputs:

- User request
- Existing docs
- Relevant source files
- Current `TASKS.md` and `CONTEXT_LOG.md`
- Existing task/state/log files when present

Steps:

1. Restate the user goal.
2. Identify product behavior.
3. Identify architecture impact.
4. Identify API, data model, migration, and fixture changes.
5. Identify risks, non-goals, and open questions.
6. Write acceptance criteria.
7. Write a test plan.
8. Create or update `tasks/<TASK_ID>.md`.
9. Do not implement production code unless explicitly asked.

Output:

- PRD summary
- Task breakdown
- Test plan
- Risk list
- Files likely to change
- Poke-ready summary under 100 words

