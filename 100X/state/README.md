# Task State

Use this directory for per-task handoff state. Prefer `100X/state/<TASK_ID>.md` over editing a large root
state file so parallel agents do not create avoidable merge conflicts.

State files should summarize current phase, branch, PR, blockers, risks, and next action. Command
evidence belongs in `100X/logs/<TASK_ID>.md`.

