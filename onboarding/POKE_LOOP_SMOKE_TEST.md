# Poke Loop Smoke Test

This is the end-to-end workflow test for the current Enterprise-compatible setup.

## Goal

Prove this loop works without requiring Codex cloud automation:

```text
local Codex plugin
  -> architecture plan and atomic task file
Poke
  -> Cursor Cloud Agent executes that atomic task
  -> branch + docs-only PR + POKE_SUMMARY.md
  -> local Cursor Codex plugin review
  -> Poke/Cursor Cloud fix follow-up
  -> updated POKE_SUMMARY.md
```

## Step 1: Plan the smoke task with local Codex

1. Open Atlas locally in Cursor.
2. Open the local Codex plugin.
3. Paste the contents of `prompts/local-codex-planning.md`.
4. Ask Codex to create or refine the atomic smoke-test spec:

```text
Task ID: TASK-2026-06-15-poke-smoke-test
Goal: docs-only smoke test for the Poke -> Cursor Cloud -> local Codex review loop.
Output: tasks/TASK-2026-06-15-poke-smoke-test.md and a Cursor Cloud launch prompt for Poke.
Do not implement runtime code.
```

Expected result:

- Codex produces a task spec with acceptance criteria and test plan.
- Codex keeps the task atomic and docs-only.
- Codex produces a Cursor Cloud launch prompt that Poke can send.

## Step 2: Launch the Codex-planned task from Poke

Send Poke the contents of `prompts/cursor-cloud-agent-smoke-test.md`.

Expected result:

- Cursor Cloud creates a branch.
- Cursor Cloud opens a draft PR.
- Cursor Cloud updates task/state/log files.
- Cursor Cloud updates `POKE_SUMMARY.md`.
- Cursor Cloud runs `npm run lint`.
- Cursor Cloud does not broaden the task beyond the Codex-planned docs-only scope.

## Step 3: Ask Poke for status

Send:

```text
Status for TASK-2026-06-15-poke-smoke-test?
Reply with the branch, PR, commands run, current phase, risks, and the latest POKE_SUMMARY.md text.
```

Expected result:

- Poke returns a concise summary.
- The summary includes PR status and verification evidence.

## Step 4: Review locally with Codex plugin in Cursor

1. Open Atlas locally in Cursor.
2. Fetch and check out the smoke-test branch.
3. Open the local Codex plugin.
4. Paste the contents of `prompts/local-codex-review.md`.

Expected result:

- Codex reviews the diff and task files.
- Codex returns P0/P1/P2 findings or says no blocking findings.
- Codex does not require cloud execution.

## Step 5: Feed Codex findings back through Poke

If Codex reports findings, send Poke the contents of `prompts/poke-fix-follow-up.md` plus the
findings.

Expected result:

- Cursor Cloud fixes scoped issues.
- Cursor Cloud reruns relevant verification.
- Cursor Cloud updates `POKE_SUMMARY.md`.

## Step 6: Final status

Send:

```text
Final status for TASK-2026-06-15-poke-smoke-test.
Use POKE_SUMMARY.md and logs/TASK-2026-06-15-poke-smoke-test.md.
```

Pass criteria:

- Poke returns a final concise status.
- The PR has the smoke-test change.
- `POKE_SUMMARY.md` reflects the final state.
- Codex planning and review were completed locally.
- No secret or environment output appears in task logs.

