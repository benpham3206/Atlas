# AGENTS.md

## Cursor Cloud specific instructions

Atlas is a zero-dependency Node.js monorepo (npm workspaces: `apps/api`, `apps/web`,
`packages/ontology-core`). It uses the built-in `node --test` runner. Node 22 is the CI/runtime
target. Standard commands (run/test/lint/verify) are documented in `README.md` and `package.json`
`scripts` — use those; they are not duplicated here.

## Design discipline (apply before building)

Before scoping a feature or adding any record type, table, endpoint, status, role, flag, or
subsystem, apply **the algorithm** (`.agent/skills/the-algorithm/SKILL.md`): question the
requirement, delete the part, simplify, accelerate, automate — in that order, with a bias toward
removal. Prefer **safety-by-absence over safety-by-machinery**: the strongest control is a missing
capability/scope/tool evaluated on the write path, not a checking subsystem an LLM must pass.

All security/authority design must conform to MoO's zero-trust architecture: the canonical spec is
`docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md`, and the operating rules + `ToolCall` verification order are
in `.agent/skills/zero-trust-orchestration/SKILL.md`. Authority comes only from short-lived scoped
delegation + the Tool Router; agents cannot self-extend scope; audit append is platform-side; do not
micromanage agents per step — they report asynchronously through the hash-chained audit log.

## Project-local agent skills

Reusable Atlas/MoO operating instructions live under `.agent/skills`.

For dogfooding Atlas + MoO on real tasks, start with
`.agent/skills/atlas-moo-dogfood-loop/SKILL.md`, then load the companion skill that matches the
active step: ontology delta capture, GoalContract routing, tool execution, verification, approval
filtering, run trace/audit closure, or workspace transparency blueprints.

Do not recreate legacy workflow directories for new agent instructions. Prefer `.agent/skills` for
project-local skills unless the user explicitly requests a different location.

Non-obvious notes for future agents:

- No external npm packages. `npm install` only links the local workspace packages; modules are
  imported via relative paths, so dependency installation is essentially a no-op. There is no
  `package-lock.json`.
- The API store is in-memory by default (`apps/api/src/ontology-store.js`); data resets on restart
  unless `ATLAS_DATA_FILE` is set, which snapshots the full store to JSON after each mutation and
  reloads it on boot (`apps/api/src/persistence.js`).
- Despite `infra/migrations`, there is no database runtime wiring yet. `npm run verify:migrations`
  only statically validates migration files; nothing connects to a DB.
- Object instance IDs are auto-generated sequentially (`object_001`, `object_002`, ...), so the
  README link examples that reference ids like `object_bug_camera_clip` will not match real ids —
  use the ids returned by the create calls.
- The web app (`apps/web`) is a static placeholder page; it renders a configured API URL but does
  not make live calls to the API. Health endpoints exist on both apps at `/health`.
- Servers bind to `127.0.0.1` by default (`HOST`/`PORT` env vars override). API: 4000, web: 3000.
