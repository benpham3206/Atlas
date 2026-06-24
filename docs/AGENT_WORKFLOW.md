# Agent Workflow

This document defines the Atlas control-plane workflow for Poke, Cursor, Codex, and human review.
It extends the existing `TASKS.md` and `CONTEXT_LOG.md` process instead of replacing it.

## Operating model

```text
Human
  -> Poke intake and status interface
  -> planning lane: Codex or Cursor plan mode writes/refines task spec
  -> implementation lane: Cursor Cloud Agent / Cursor Agent executes
  -> verification lane: Cursor verifier, test-runner, debugger, and security-auditor as needed
  -> independent review lane: Codex review and/or Cursor Bugbot
  -> fix lane: Cursor or Codex applies scoped follow-ups
  -> handoff lane: task/state/log updates plus concise Poke summary
  -> Poke status back to human
```

Cursor is the execution plane for repo edits, terminal commands, commits, and PRs. Codex is the
architecture and review plane. Poke is the control loop for launching, interrupting, and receiving
concise status. The repository files are the handoff surface between those tools.

## File ownership

| File or directory | Purpose | Owner |
| --- | --- | --- |
| `AGENTS.md` | Stable repo-wide agent rules and non-negotiables | Human-reviewed, all agents read |
| `TASKS.md` | Root implementation queue and task index | Cursor updates during implementation |
| `CONTEXT_LOG.md` | Historical evidence log for completed turns | Cursor updates when task scope requires it |
| `docs/AGENT_WORKFLOW.md` | This workflow guide | Human-reviewed, all agents read |
| `docs/CODEX_RULES.md` | Codex-specific review and planning rules | Codex-focused, Cursor respects |
| `tasks/` | Per-task specs, acceptance criteria, and test plans | Planning lane creates; implementation lane updates |
| `state/` | Per-task current state and handoff snapshots | Implementation lane updates |
| `logs/` | Per-task command evidence and review notes | Implementation and verification lanes update |

Root summary files such as `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md` should stay short and
index-like. Detailed evidence belongs in per-task files to avoid merge conflicts between parallel
agents.

## Task lifecycle

1. **Intake** — Poke or the human supplies a goal; assign one task ID and one branch.
2. **Plan** — Create or update `tasks/<TASK_ID>.md` with acceptance criteria and test plan.
3. **Implement** — Cursor implements only the scoped task; keep changes minimal.
4. **Verify** — Run relevant commands (`npm run lint`, `npm test`, etc.) and log evidence.
5. **Review** — Independent review for non-trivial changes; P0/P1 findings are blocking.
6. **Handoff** — Update task/state/log files and produce a Poke-ready summary under 100 words.

## Poke command template

```text
Start Cursor Cloud Agent.

Repo: <org/repo>
Base branch: main
Task ID: TASK-YYYY-MM-DD-<slug>
Goal: <goal>

Instructions:
- Read AGENTS.md, TASKS.md, CONTEXT_LOG.md, and docs/AGENT_WORKFLOW.md.
- Create or update tasks/<TASK_ID>.md with acceptance criteria and a test plan.
- Implement only the scoped task.
- Run relevant tests.
- Update task/state/log files.
- End with a Poke-ready summary under 100 words.
```

## Smoke test marker

Poke smoke test `TASK-2026-06-15-poke-smoke-test` verified the docs-only handoff path on
2026-06-15. Agents should update `tasks/`, `state/`, `logs/`, and root summary files without
changing runtime code when exercising this workflow.
