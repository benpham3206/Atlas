# 100X Agent Rules

These rules govern the Codex, Cursor Cloud Agents, and Poke interaction workflow. Read root
`AGENTS.md` first for Atlas runtime constraints.

## Agent operating model

- Poke is the intake, interrupt, and concise status surface.
- Codex owns high-level architecture, PRD refinement, atomic task planning, test strategy, and
  independent review.
- Cursor Cloud Agent / Cursor Agent owns scoped implementation, verification commands, commits, and
  PR workflow for Codex-planned atomic tasks.
- Human owner is the final merge authority.
- Do not make one agent both author and final judge of non-trivial work; use independent review
  before merge.

## Control-plane files

- `TASKS.md` remains the root Atlas implementation queue.
- `CONTEXT_LOG.md` remains the historical evidence log until deliberately replaced by `100X/LOGS.md`.
- New workflow task work should use `100X/tasks/<TASK_ID>.md`, `100X/state/<TASK_ID>.md`, and
  `100X/logs/<TASK_ID>.md` when the work is non-trivial.
- `100X/STATE.md`, `100X/LOGS.md`, and `100X/POKE_SUMMARY.md` stay short and index-like; detailed
  evidence belongs in per-task files to reduce merge conflicts.
- `100X/agents/skills/` contains portable Codex and Cursor skills.
- `100X/cursor/` contains canonical Cursor rules and subagent definitions.
- Root `.cursor/rules/` and `.cursor/agents/` are the Cursor discovery layer and should stay aligned
  with `100X/cursor/`.

## Before coding

For non-trivial workflow work:

1. Read root `AGENTS.md`, this file, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and
   `100X/docs/AGENT_WORKFLOW.md`.
2. Create or update `100X/tasks/<TASK_ID>.md` when the task needs durable acceptance criteria, a test
   plan, or handoff state.
3. Identify acceptance criteria, tests to run, likely touched files, risks, and non-goals before
   implementation.
4. Keep implementation scoped to the task. If scope changes, update the relevant `100X/` task and
   state files before continuing.

## Definition of done

A non-trivial workflow task is not done until:

- Acceptance criteria are satisfied.
- Relevant tests pass.
- Lint, migration verification, fixture validation, or build commands pass when applicable.
- New or changed behavior has tests.
- `TASKS.md`, `CONTEXT_LOG.md`, and any `100X/` task-specific state and log files are updated when
  they are part of the task scope.
- The PR summary includes commands run, files changed, risks, and follow-up work.

## Review guidelines

Flag as blocking:

- Security regressions.
- Auth, permission, privacy, or data-loss risk.
- Missing tests for changed behavior.
- Broken public API compatibility.
- Unhandled migration or rollback risk.
- Unverified claims of completion.
- Workflow changes that create duplicate sources of truth or expose secrets.

## Handoff format

Every final agent message for workflow implementation should include:

- Summary.
- Files changed.
- Commands run and results.
- Tests added or updated.
- Known risks.
- Next recommended action.
- Poke-ready summary under 100 words in `100X/POKE_SUMMARY.md` or the final message.
