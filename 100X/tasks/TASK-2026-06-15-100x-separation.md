# TASK-2026-06-15-100x-separation

## Goal

Separate the Codex-Cursor Cloud Agents-Poke interaction workflow from the Atlas workspace root into
a dedicated `100X/` file structure.

## User intent

Original request:

> separate the Codex-Cursor Cloud Agents-Poke interaction workflow in the Atlas workspace into its
> own file structure called 100X

## Scope

In:

- Create `100X/` as the canonical home for workflow docs, templates, onboarding, skills, Cursor
  config, and Codex prompts.
- Keep root `AGENTS.md` focused on Atlas runtime constraints with a pointer to `100X/`.
- Keep root `.cursor/rules/` and `.cursor/agents/` as the Cursor discovery layer aligned with
  `100X/cursor/`.
- Update README, architecture docs, lint coverage, and integration tests for the new layout.

Out:

- No Atlas API, web, ontology, migration, or runtime behavior changes.
- No external dependencies.
- No replacement of root `TASKS.md` or `CONTEXT_LOG.md`.

## Acceptance criteria

- [x] `100X/` contains workflow docs, task/state/log templates, onboarding, skills, cursor config,
  and Codex prompts.
- [x] Root `AGENTS.md` points agents at `100X/` without duplicating workflow rules.
- [x] Root `.cursor/` remains the Cursor discovery layer and references `100X/` paths.
- [x] README and architecture docs describe the separation.
- [x] Lint and integration tests cover the `100X/` workflow contract.

## Test plan

- Integration: `tests/integration/agent-workflow.test.js` verifies required `100X/` and root
  integration files exist.
- Regression: `npm run lint`, `npm run validate:records`, `npm run verify:migrations`, `npm test`.

## Likely files

- `100X/**`
- `AGENTS.md`
- `.cursor/**`
- `README.md`
- `docs/ARCHITECTURE.md`
- `scripts/lint.js`
- `tests/integration/agent-workflow.test.js`

## Risks

- Duplicate sources of truth if both root and `100X/` keep full workflow copies without a documented
  owner.
- Broken Cursor discovery if root `.cursor/` drifts from `100X/cursor/`.
