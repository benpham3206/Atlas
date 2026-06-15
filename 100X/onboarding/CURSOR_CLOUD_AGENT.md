# Cursor Cloud Agent Onboarding

Use this checklist to confirm Cursor Cloud Agent is ready for the Atlas workflow.

Cursor Cloud is the execution lane. It should implement Codex-planned atomic task files, not own
high-level architecture or broad task decomposition.

## Prerequisites

- Cursor Cloud can access the Atlas GitHub repository.
- Cursor Cloud starts from the intended base branch, usually `main`.
- Cursor Cloud can create branches with the required `cursor/<slug>-2044` naming pattern.
- Cursor Cloud can push branches and open draft PRs.
- The Cloud Agent environment can run:
  - `npm run lint`
  - `npm run validate:records`
  - `npm run verify:migrations`
  - `npm test`
- Required secrets, if any are introduced later, are configured in Cursor Cloud secrets and are not
  pasted into prompts.

Atlas currently has no external npm dependencies and no required runtime secrets.

## Files Cursor Cloud should read

For non-trivial work, the Cursor Cloud prompt should point to the Codex-planned task and the repo
workflow files:

- `AGENTS.md`
- `TASKS.md`
- `CONTEXT_LOG.md`
- `docs/ARCHITECTURE.md`
- `100X/docs/AGENT_WORKFLOW.md`
- `100X/tasks/<TASK_ID>.md`

Cursor-specific behavior also lives in:

- `100X/cursor/rules/000-core.mdc`
- `100X/cursor/rules/010-cloud-agent.mdc`
- `100X/cursor/rules/020-tests.mdc`
- `100X/cursor/agents/verifier.md`
- `100X/cursor/agents/test-runner.md`
- `100X/cursor/agents/debugger.md`
- `100X/cursor/agents/security-auditor.md`

## Quick validation

First create or inspect the smoke-test task with local Codex using `prompts/local-codex-planning.md`.
Then use `prompts/cursor-cloud-agent-smoke-test.md` as the Poke or Cursor Cloud launch prompt.

Pass criteria:

- A branch is created from `main`.
- A draft PR is opened.
- A docs-only change is made.
- `100X/tasks/<TASK_ID>.md`, `100X/state/<TASK_ID>.md`, `100X/logs/<TASK_ID>.md`, and `100X/POKE_SUMMARY.md` are
  updated.
- At least `npm run lint` passes.
- The final agent message includes a Poke-ready summary under 100 words.
- Cursor Cloud does not expand scope beyond the Codex-planned task.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Agent does not open a PR | Repo or GitHub permission missing | Confirm Cursor Cloud GitHub access and retry a docs-only task |
| Agent does not run tests | Prompt omitted verification or environment failed | Ask it to run the commands from `package.json` and update `100X/logs/<TASK_ID>.md` |
| Agent edits runtime code during smoke test | Goal was too broad | Re-run with "docs-only; do not change runtime code" |
| Poke status is vague | Agent did not update `100X/POKE_SUMMARY.md` | Ask Cursor Cloud to update `100X/POKE_SUMMARY.md` from the task log |
| Secret appears in output | Secret was pasted or logged | Rotate the secret and move it to platform secret storage |

