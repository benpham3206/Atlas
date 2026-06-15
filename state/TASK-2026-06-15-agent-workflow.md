# TASK-2026-06-15-agent-workflow State

## Current status

- Phase: DOING
- Branch: cursor/agent-workflow-control-plane-2044
- PR: TBD
- Owner: cursor-cloud
- Last update: 2026-06-15

## Current summary

Implementing the file-based agent workflow control plane with conservative fixes: preserve existing
Atlas rules, keep `TASKS.md` and `CONTEXT_LOG.md` canonical, add per-task templates, and add
Cursor/Codex workflow configuration.

## Blockers

- None.

## Risks

- Root summary files must not become detailed competing sources of truth.
- External Codex review automation remains deferred until secrets and permissions are approved.

## Next action

Complete file additions, commit and push the pre-verification revision, then run local verification.

## Poke-ready summary

Atlas agent workflow setup is being added. It preserves existing rules and adds Cursor/Codex/Poke
handoff files, templates, and verification coverage. External Codex automation is deferred for
security approval.

