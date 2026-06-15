# Task State

Use this directory for per-task handoff state. Prefer `state/<TASK_ID>.md` over editing a large root
state file so parallel agents do not create avoidable merge conflicts.

State files should summarize current phase, branch, PR, blockers, risks, and next action. Command
evidence belongs in `logs/<TASK_ID>.md`.

