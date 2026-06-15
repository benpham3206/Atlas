# TASK-2026-06-15-agent-workflow

## Goal

Implement the repo control-plane workflow for Poke intake/status, Cursor execution, Codex
planning/review, focused Cursor subagents, and file-based handoff.

## User intent

Original request:

> implement with the fixes in order to have the specified and desired workflow outcome.

## Scope

In:

- Extend the existing `AGENTS.md` without replacing Atlas-specific rules.
- Add a repo-specific workflow guide for Poke, Cursor, Codex, and human review.
- Add Cursor rules and custom subagent definitions.
- Add portable shared skills under `.agents/skills`.
- Add per-task templates for `tasks/`, `state/`, and `logs/`.
- Add root summary files that remain short and refer to existing task/log sources.
- Add local verification coverage for the workflow files.

Out:

- No Codex GitHub Action automation until secrets and permissions are explicitly approved.
- No external dependencies.
- No replacement of `TASKS.md` or `CONTEXT_LOG.md`.
- No changes to API, web, ontology, migration, or runtime behavior.

## Acceptance criteria

- [ ] Existing Atlas-specific rules in `AGENTS.md` are preserved.
- [ ] `docs/AGENT_WORKFLOW.md` documents the Poke -> Cursor -> Codex workflow and security gates.
- [ ] `.cursor/rules` and `.cursor/agents` define focused Cursor behavior without symlinking `AGENTS.md`.
- [ ] `.agents/skills` defines reusable planning, implementation, review, and handoff skills.
- [ ] `tasks/`, `state/`, and `logs/` include templates for future per-task handoffs.
- [ ] Root `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md` are short summaries that do not replace `TASKS.md` or `CONTEXT_LOG.md`.
- [ ] Workflow files are covered by lint or tests.
- [ ] No external npm dependencies are added.

## Test plan

- Unit: not applicable; this is a workflow/documentation/configuration change.
- Integration: add a Node test that verifies required workflow files exist and key anti-regression
  constraints are present.
- Manual: inspect the diff to ensure existing task/log sources are referenced rather than replaced.
- Regression: run `npm run lint`, `npm run validate:records`, `npm run verify:migrations`, and
  `npm test`.

## Likely files

- `AGENTS.md`
- `README.md`
- `docs/AGENT_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- `docs/CODEX_RULES.md`
- `.agents/skills/**/SKILL.md`
- `.cursor/rules/*.mdc`
- `.cursor/agents/*.md`
- `tasks/`
- `state/`
- `logs/`
- `scripts/lint.js`
- `tests/integration/agent-workflow.test.js`

## Risks

- Creating duplicate sources of truth if root status files are too detailed.
- Weakening existing Atlas constraints by overwriting rather than extending `AGENTS.md`.
- Treating Codex review automation as safe before credentials and permissions are approved.
- Adding too many vague subagents instead of focused verification roles.

## Plan

1. Add workflow documentation and repo-rule extensions.
2. Add Cursor rules/subagents and shared skills.
3. Add task/state/log templates and short root summary files.
4. Add lint/test coverage for workflow files.
5. Commit and push the pre-verification revision.
6. Run verification commands.
7. Update task/state/log summaries and PR if verification changes are needed.

## Review requirements

- Codex review required: recommended before merge.
- Bugbot review required: recommended before merge.
- Security review required: recommended before enabling external Codex review automation.
- Human approval required before merge: yes.

