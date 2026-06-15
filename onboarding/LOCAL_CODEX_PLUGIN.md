# Local Codex Plugin Onboarding

Use this checklist to confirm the local Codex plugin works as the Atlas planning and review lane.

## Important constraint

For this workflow, Codex is local/manual. Do not assume the Codex plugin can run inside Cursor Cloud
or be invoked directly by Poke. Poke and Cursor Cloud can produce the branch, PR, task files, and
summary; you then open that work locally in Cursor and run Codex against it.

Codex is still the high-level owner: architecture, planning, task decomposition, test strategy, and
independent review happen in the local Codex plugin. Cursor Cloud Agents execute the atomic task
files Codex produces.

## Prerequisites

- Cursor is installed locally.
- The Codex plugin is installed in local Cursor.
- You are signed in with the account that has access to Codex in your ChatGPT Enterprise setup.
- The Atlas repository is open locally in Cursor.
- The target branch or PR is checked out locally before review.

## Files Codex should read

For planning:

- `AGENTS.md`
- `TASKS.md`
- `CONTEXT_LOG.md`
- `docs/ARCHITECTURE.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/CODEX_RULES.md`
- relevant source files

For review:

- `AGENTS.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/CODEX_RULES.md`
- `.github/codex/prompts/review.md`
- relevant `tasks/<TASK_ID>.md`
- the PR diff or branch diff

## Planning smoke test

Use `prompts/local-codex-planning.md`.

Pass criteria:

- Codex does not edit implementation code unless explicitly asked.
- Codex produces acceptance criteria, risks, and a test plan.
- Codex references the existing Atlas constraints, including zero dependencies and in-memory storage.
- Codex splits broad goals into atomic task files that can be assigned to separate Cursor Cloud
  coding agents.
- Codex produces copy/paste Cursor Cloud launch prompts for Poke when multiple agents are needed.

## Review smoke test

Use `prompts/local-codex-review.md` after Cursor Cloud opens a docs-only smoke PR.

Pass criteria:

- Codex reviews the branch or PR diff against `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, and the task
  spec.
- Codex returns only P0/P1/P2 findings.
- Codex does not ask for cloud-only automation.
- Any findings can be pasted into Poke or Cursor Cloud as follow-up instructions.

## Handoff back to Poke or Cursor Cloud

If Codex finds a P1 issue, paste the finding into Poke or Cursor Cloud with
`prompts/poke-fix-follow-up.md`.

If Codex finds no blocking issue, ask Cursor Cloud or Poke for final status:

```text
Summarize the current PR using POKE_SUMMARY.md, logs/<TASK_ID>.md, and the latest verification
commands. Include next action and known risks.
```

