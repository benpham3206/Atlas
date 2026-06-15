# Agent Workflow

This document defines the Atlas control-plane workflow for Poke, Cursor, Codex, and human review.
It extends the existing `TASKS.md` and `CONTEXT_LOG.md` process instead of replacing it.

## Operating model

```text
Human
  -> Poke intake and status interface
  -> architecture lane: local Codex plugin writes/refines PRD, architecture, and task specs
  -> implementation lane: Cursor Cloud coding agents execute Codex-planned atomic tasks
  -> verification lane: Cursor verifier, test-runner, debugger, and security-auditor as needed
  -> independent review lane: local Codex plugin review and/or Cursor Bugbot
  -> fix lane: Cursor Cloud agents apply scoped follow-ups from Codex/Bugbot/human review
  -> handoff lane: task/state/log updates plus concise Poke summary
  -> Poke status back to human
```

Codex is the high-level architecture, planning, task decomposition, and review plane. Cursor Cloud
is the execution plane for one or more coding agents that implement the atomic task files Codex
plans. Poke is the control loop for launching, interrupting, monitoring, and receiving concise
status from Cursor Cloud Agents. The repository files are the handoff surface between those tools.

## File ownership

| File or directory | Purpose | Owner |
| --- | --- | --- |
| `AGENTS.md` | Atlas runtime constraints for Cloud Agents | Human-reviewed, all agents read |
| `100X/AGENTS.md` | Workflow agent rules and handoff expectations | Human-reviewed, all agents read |
| `TASKS.md` | Root implementation queue and task index | Codex plans; Cursor updates status during execution |
| `CONTEXT_LOG.md` | Historical evidence log for completed turns | Cursor updates when task scope requires it |
| `100X/docs/AGENT_WORKFLOW.md` | This workflow guide | Human-reviewed, all agents read |
| `100X/docs/CODEX_RULES.md` | Codex-specific architecture, planning, and review rules | Codex-focused, Cursor respects |
| `100X/tasks/` | Per-task specs, acceptance criteria, and test plans | Codex creates; Cursor executes and updates status |
| `100X/state/` | Per-task current state and handoff snapshots | Implementation lane updates |
| `100X/logs/` | Per-task command evidence and review notes | Implementation and verification lanes update |
| `100X/agents/skills/` | Portable repeatable workflows for Codex and Cursor | Human-reviewed, all agents may use |
| `100X/cursor/rules/` | Cursor-specific project rules | Cursor-only |
| `100X/cursor/agents/` | Cursor custom subagent definitions | Cursor-only |
| `100X/codex/prompts/` | Codex PR review prompts for manual or approved automated use | Codex review lane |
| `100X/onboarding/` | Setup checklists and smoke-test prompts for Cursor Cloud, local Codex, and Poke | Human and agent onboarding |

Root summary files such as `100X/STATE.md`, `100X/LOGS.md`, and `100X/POKE_SUMMARY.md` may be introduced later if
they are useful, but they should stay short and index-like. Detailed evidence belongs in per-task
files to avoid merge conflicts between parallel agents.

For setup validation, use `100X/onboarding/README.md`. It documents the Enterprise-compatible path where
Codex runs locally in Cursor as architect/planner/reviewer and is not treated as a Cursor Cloud
subroutine.

## Task lifecycle

1. **Intake**
   - Poke or the human supplies a goal, issue, or PR follow-up.
   - Assign one task ID, for example `TASK-2026-06-15-agent-workflow`.
   - Create one branch per implementation task.

2. **Plan with local Codex**
   - Read `AGENTS.md` and `100X/AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and relevant code.
   - Create or update `100X/tasks/<TASK_ID>.md` for non-trivial work.
   - Include goal, user intent, scope, non-goals, acceptance criteria, test plan, likely files,
     risks, and review requirements.
   - Split large goals into independent atomic tasks that can be assigned to separate Cursor Cloud
     coding agents.

3. **Implement**
   - Cursor Cloud Agent implements only the scoped Codex-planned task.
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
   - Store command evidence in `100X/logs/<TASK_ID>.md` when a task file exists.

5. **Review**
   - Use independent review for non-trivial changes.
   - Codex review should compare the diff to `AGENTS.md`, `100X/tasks/<TASK_ID>.md`, acceptance criteria,
     test plan, and architecture rules.
   - Cursor Bugbot may be used for PR diff review.
   - Treat P0/P1 correctness, security, data-loss, privacy, and missing-test findings as blocking.

6. **Handoff**
   - Update `TASKS.md` status or checklist when appropriate.
   - Update `CONTEXT_LOG.md` or the per-task log with commands run and results.
   - Update `100X/state/<TASK_ID>.md` with current phase, branch, PR, risks, and next action.
   - Produce a Poke-ready summary under 100 words.

## Poke command template

```text
Start Cursor Cloud Agent.

Repo: <org/repo>
Base branch: main
Task ID: TASK-YYYY-MM-DD-<slug>
Mode: implement the existing Codex-planned atomic task
Goal: Execute the task described in 100X/tasks/<TASK_ID>.md

Instructions:
- Read AGENTS.md, TASKS.md, CONTEXT_LOG.md, docs/ARCHITECTURE.md, and 100X/docs/AGENT_WORKFLOW.md.
- Read 100X/tasks/<TASK_ID>.md.
- Implement only the scoped atomic task. Do not make architecture decisions beyond the task spec.
- Use verifier and test-runner subagents before claiming completion.
- Use security-auditor if the change touches auth, permissions, secrets, user data, APIs, or database access.
- Run relevant tests.
- Open or update a PR when verification passes.
- Update task/state/log files.
- End with a Poke-ready summary under 100 words.
```

## Codex planning prompt

```text
Read AGENTS.md, TASKS.md, CONTEXT_LOG.md, docs/ARCHITECTURE.md, 100X/docs/AGENT_WORKFLOW.md, and the
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

Write or update 100X/tasks/<TASK_ID>.md. If the goal is large, split it into multiple atomic task files
that can be safely assigned to separate Cursor Cloud coding agents. Summarize the exact Cursor Cloud
prompts Poke should launch for each atomic task.
```

## Codex review prompt

```text
Review this branch against main.

Use AGENTS.md, 100X/docs/AGENT_WORKFLOW.md, 100X/tasks/<TASK_ID>.md, docs/ARCHITECTURE.md, and the diff.

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

