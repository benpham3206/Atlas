---
name: summarize-handoff
description: Use at the end of an agent run to update task state, command evidence, and produce a concise Poke-ready status.
---

# Summarize Handoff Skill

Update as applicable:

- `TASKS.md`
- `CONTEXT_LOG.md`
- `100X/tasks/<TASK_ID>.md`
- `100X/state/<TASK_ID>.md`
- `100X/logs/<TASK_ID>.md`

Include:

- What changed
- Files touched
- Tests and commands run
- Current status
- Risks
- Next action
- Poke-ready summary under 100 words

Root summary files such as `100X/STATE.md`, `100X/LOGS.md`, and `100X/POKE_SUMMARY.md` should stay short and
index-like if introduced. Detailed evidence belongs in per-task files.

