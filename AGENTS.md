# AGENTS.md

## Cursor Cloud specific instructions

Atlas is a zero-dependency Node.js monorepo (npm workspaces: `apps/api`, `apps/web`,
`packages/ontology-core`). It uses the built-in `node --test` runner. Node 22 is the CI/runtime
target. Standard commands (run/test/lint/verify) are documented in `README.md` and `package.json`
`scripts` — use those; they are not duplicated here.

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
