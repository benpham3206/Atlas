# AGENTS.md

## Cursor Cloud specific instructions

Atlas is a zero-dependency Node.js monorepo (npm workspaces: `apps/api`, `apps/web`,
`packages/ontology-core`). It uses the built-in `node --test` runner. Node 22 is the CI/runtime
target. Standard commands (run/test/lint/verify) are documented in `README.md` and `package.json`
`scripts` — use those; they are not duplicated here.

## Agent operating model

- Poke is the intake, interrupt, and concise status surface.
- Cursor Cloud Agent / Cursor Agent owns scoped implementation, verification commands, commits, and PR workflow.
- Codex owns architecture critique, PRD refinement, test strategy, and independent review.
- Human owner is the final merge authority.
- Do not make one agent both author and final judge of non-trivial work; use independent review before merge.

## Control-plane files

- `TASKS.md` remains the root task index and implementation queue.
- `CONTEXT_LOG.md` remains the historical evidence log until deliberately replaced by `LOGS.md`.
- New task-specific work should use `tasks/<TASK_ID>.md`, `state/<TASK_ID>.md`, and `logs/<TASK_ID>.md` when the work is non-trivial.
- Root summaries such as `STATE.md`, `LOGS.md`, and `POKE_SUMMARY.md` should stay short and index-like if introduced later; detailed evidence belongs in per-task files to reduce merge conflicts.
- `.agents/skills` contains portable Codex/Cursor skills.
- `.cursor/rules` and `.cursor/agents` contain Cursor-specific routing and subagent instructions.

## Before coding

For non-trivial work:

1. Read `AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`, and the relevant source files.
2. Create or update a task file under `tasks/` when the task needs durable acceptance criteria, a test plan, or handoff state.
3. Identify acceptance criteria, tests to run, likely touched files, risks, and non-goals before implementation.
4. Keep implementation scoped to the task. If scope changes, update the relevant task/state files before continuing.

## Definition of done

A non-trivial task is not done until:

- Acceptance criteria are satisfied.
- Relevant tests pass.
- Lint, migration verification, fixture validation, or build commands pass when applicable.
- New or changed behavior has tests.
- `TASKS.md`, `CONTEXT_LOG.md`, and any task-specific state/log files are updated when they are part of the task scope.
- The PR summary includes commands run, files changed, risks, and follow-up work.

## Review guidelines

Flag as blocking:

- Security regressions.
- Auth, permission, privacy, or data-loss risk.
- Missing tests for changed behavior.
- Broken public API compatibility.
- Unhandled migration or rollback risk.
- Unverified claims of completion.
- Agent workflow changes that create duplicate sources of truth or expose secrets.

## Handoff format

Every final agent message for implementation work should include:

- Summary.
- Files changed.
- Commands run and results.
- Tests added or updated.
- Known risks.
- Next recommended action.
- Poke-ready summary under 100 words.

Non-obvious notes for future agents:

- No external npm packages. `npm install` only links the local workspace packages; modules are
  imported via relative paths, so dependency installation is essentially a no-op. There is no
  `package-lock.json`.
- The API store is fully in-memory (`apps/api/src/ontology-store.js`). All workspaces/objects/links
  reset on every API restart — do not expect data to persist across `dev:api` restarts.
- Despite `infra/migrations`, there is no database runtime wiring yet. `npm run verify:migrations`
  only statically validates migration files; nothing connects to a DB.
- Object instance IDs are auto-generated sequentially (`object_001`, `object_002`, ...), so the
  README link examples that reference ids like `object_bug_camera_clip` will not match real ids —
  use the ids returned by the create calls.
- The web app (`apps/web`) is a static placeholder page; it renders a configured API URL but does
  not make live calls to the API. Health endpoints exist on both apps at `/health`.
- Servers bind to `127.0.0.1` by default (`HOST`/`PORT` env vars override). API: 4000, web: 3000.
