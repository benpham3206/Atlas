# TASK-2026-06-15-agent-workflow State

## Current status

- Phase: REVIEW
- Branch: cursor/agent-workflow-control-plane-2044
- PR: https://github.com/benpham3206/Atlas/pull/1
- Owner: cursor-cloud
- Last update: 2026-06-15

## Current summary

The file-based agent workflow control plane is implemented with onboarding docs for the corrected
ownership split: local Codex owns architecture, atomic planning, and review; Poke launches and
monitors Cursor Cloud; Cursor Cloud coding agents execute Codex-planned atomic tasks.

## Blockers

- None.

## Risks

- Root summary files must not become detailed competing sources of truth.
- External Codex review automation remains deferred until secrets and permissions are approved.

## Next action

Review the draft PR and address any Codex, Bugbot, CI, or human review findings.

## Poke-ready summary

Atlas agent workflow setup is in review. Local Codex plans/reviews, Poke launches and monitors
Cursor Cloud, and Cursor Cloud executes Codex-planned atomic tasks. Onboarding docs and smoke-test
prompts are included. External Codex automation remains deferred.

