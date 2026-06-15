# Agent Onboarding Workspace

This directory is the file-based onboarding workspace for the Atlas agent workflow.

It covers the practical setup where:

- The Codex plugin runs locally inside Cursor for high-level architecture, planning, atomic task
  decomposition, and independent review.
- Poke launches and monitors Cursor Cloud Agents.
- Cursor Cloud Agents implement, verify, commit, push, and open PRs for Codex-planned atomic tasks.
- Codex cloud automation is not required and is not assumed.

## Read in this order

1. `CURSOR_CLOUD_AGENT.md`
2. `LOCAL_CODEX_PLUGIN.md`
3. `POKE_LOOP_SMOKE_TEST.md`
4. `prompts/cursor-cloud-agent-smoke-test.md`
5. `prompts/local-codex-review.md`
6. `prompts/poke-fix-follow-up.md`

## What this onboarding proves

- Poke can start or track a Cursor Cloud Agent task.
- Local Codex can create or refine an atomic task spec.
- Cursor Cloud Agent can execute the Codex-planned task and update `POKE_SUMMARY.md`.
- You can open the resulting branch or PR locally in Cursor for Codex review.
- Findings can be fed back through Poke or Cursor Cloud for follow-up fixes.

## What this onboarding does not prove

- Codex runs in Cursor Cloud. In this setup, Codex remains local/manual.
- External Codex GitHub Action automation is enabled.
- Poke can invoke the local Codex plugin directly.

## Minimal success path

```text
Local Codex plugin
  -> architecture/task planning and atomic task file
Poke
  -> launch Cursor Cloud Agent for that atomic task
  -> draft PR and POKE_SUMMARY.md
Local Codex plugin
  -> review branch/PR locally
  -> Poke/Cursor Cloud fix follow-up if needed
  -> updated POKE_SUMMARY.md
```

