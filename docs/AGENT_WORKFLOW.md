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
| `.agents/skills/` | Portable repeatable workflows for Codex and Cursor | Human-reviewed, all agents may use |
| `.cursor/rules/` | Cursor-specific project rules | Cursor-only |
| `.cursor/agents/` | Cursor custom subagent definitions | Cursor-only |
| `.github/codex/prompts/` | Codex PR review prompts for manual or approved automated use | Codex review lane |

Root summary files such as `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md` may be introduced later if
they are useful, but they should stay short and index-like. Detailed evidence belongs in per-task
files to avoid merge conflicts between parallel agents.

## Task lifecycle

1. **Intake**
   - Poke or the human supplies a goal, issue, or PR follow-up.
   - Assign one task ID, for example `TASK-2026-06-15-agent-workflow`.
   - Create one branch per implementation task.

2. **Plan**
   - Read `AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and relevant code.
   - Create or update `tasks/<TASK_ID>.md` for non-trivial work.
   - Include goal, user intent, scope, non-goals, acceptance criteria, test plan, likely files,
     risks, and review requirements.

3. **Implement**
   - Cursor Cloud Agent or Cursor Agent implements only the scoped task.
   - Do not let two live agents edit the same files on the same branch.
   - Keep changes minimal and reversible.
   - Do not add dependencies without explicit approval; Atlas is currently zero-dependency.

4. **Verify**
   - Run the narrowest relevant tests first.
   - Run broader commands when behavior crosses module boundaries. For Atlas, common commands are:
     - `npm run lint`
     - `npm run validate:records`
     - `npm run verify:migrations`
     - `npm test`
   - Store command evidence in `logs/<TASK_ID>.md` when a task file exists.

5. **Review**
   - Use independent review for non-trivial changes.
   - Codex review should compare the diff to `AGENTS.md`, `tasks/<TASK_ID>.md`, acceptance criteria,
     test plan, and architecture rules.
   - Cursor Bugbot may be used for PR diff review.
   - Treat P0/P1 correctness, security, data-loss, privacy, and missing-test findings as blocking.

6. **Handoff**
   - Update `TASKS.md` status or checklist when appropriate.
   - Update `CONTEXT_LOG.md` or the per-task log with commands run and results.
   - Update `state/<TASK_ID>.md` with current phase, branch, PR, risks, and next action.
   - Produce a Poke-ready summary under 100 words.

## Smoke test marker

`TASK-2026-06-15-poke-smoke-test` verified the docs-only handoff path by updating per-task records,
capturing lint evidence, and keeping runtime code unchanged.

## Poke command template

```text
Start Cursor Cloud Agent.

Repo: <org/repo>
Base branch: main
Task ID: TASK-YYYY-MM-DD-<slug>
Mode: plan first, then implement after the task spec is written
Goal: <goal>

Instructions:
- Read AGENTS.md, TASKS.md, CONTEXT_LOG.md, docs/ARCHITECTURE.md, and docs/AGENT_WORKFLOW.md.
- Create or update tasks/<TASK_ID>.md with acceptance criteria and a test plan.
- Implement only the scoped task.
- Use verifier and test-runner subagents before claiming completion.
- Use security-auditor if the change touches auth, permissions, secrets, user data, APIs, or database access.
- Run relevant tests.
- Open or update a PR when verification passes.
- Update task/state/log files.
- End with a Poke-ready summary under 100 words.
```

## Codex planning prompt

```text
Read AGENTS.md, TASKS.md, CONTEXT_LOG.md, docs/ARCHITECTURE.md, docs/AGENT_WORKFLOW.md, and the
relevant source files.

Act as architect and test strategist. Do not implement code.

Produce:
1. PRD or requirements summary
2. architecture options
3. recommended design
4. task breakdown
5. acceptance criteria
6. test plan
7. risks
8. files likely to change

Write or update tasks/<TASK_ID>.md and summarize what Cursor should implement.
```

## Codex review prompt

```text
Review this branch against main.

Use AGENTS.md, docs/AGENT_WORKFLOW.md, tasks/<TASK_ID>.md, docs/ARCHITECTURE.md, and the diff.

Return only P0/P1/P2 findings with evidence and file references. Focus on correctness, missing
tests, security/privacy, regressions, migration risk, and acceptance criteria. Do not rewrite the
implementation unless explicitly asked.
```

## Security and reliability rules

- Store secrets in the relevant platform secret manager, not in prompts, task files, logs, fixtures,
  or PR descriptions.
- Do not print environment variables, tokens, private keys, or credentials into logs.
- Add MCP servers selectively and prefer least-privilege credentials.
- Treat shared agent follow-ups as sensitive when the original agent has access to another user's
  credentials or secrets.
- Use Codex GitHub Action or automated Codex PR review only after repository permissions, fork
  behavior, and secret exposure are explicitly approved.
- Keep Poke summaries concise and avoid including sensitive details.

## PR gate

Do not merge unless:

- CI or local verification commands pass.
- Acceptance criteria are satisfied.
- Changed behavior has tests.
- Independent review has no unresolved P0/P1 findings.
- PR description includes commands run, files changed, risks, and follow-up work.
- Task/state/log files are current when the task uses them.
