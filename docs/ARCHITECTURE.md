# Atlas Architecture

Status: Initial skeleton
Last updated: 2026-06-14

## Current Architecture

Atlas starts as a small Node.js monorepo with no external runtime dependencies.

```text
apps/
  api/                  minimal backend HTTP server
  web/                  minimal frontend HTTP server
packages/
  ontology-core/        shared runtime metadata and TypeScript declarations
infra/
  migrations/           future database migrations
docs/
  PRD.md
  ARCHITECTURE.md
  CODEX_RULES.md
TASKS.md
README.md
```

## Stack for This Skeleton

- Runtime: Node.js.
- API: Node built-in HTTP server.
- Web: Node built-in HTTP server returning placeholder HTML.
- Tests: Node built-in test runner.
- Shared package: `packages/ontology-core`.
- Database: none yet.

This keeps the first scaffold verifiable without package downloads. Future tasks may replace the placeholder web server with Next.js and the API server with FastAPI, NestJS, or another documented service framework. Any framework change must update this file.

## Service Boundaries

### `apps/api`

Owns HTTP API routes. Current routes:

- `GET /health` returns service health.
- `GET /` returns minimal service metadata.
- `GET /workspaces` lists workspaces.
- `POST /workspaces` creates a workspace.
- `GET /workspaces/:workspace_id` fetches a workspace.
- `GET /workspaces/:workspace_id/object-types` lists object types in one workspace.
- `POST /workspaces/:workspace_id/object-types` creates an object type in one workspace.
- `GET /workspaces/:workspace_id/object-types/:object_type_id` fetches an object type scoped to one workspace.
- `GET /workspaces/:workspace_id/objects` lists object instances in one workspace.
- `POST /workspaces/:workspace_id/objects` creates an object instance in one workspace.
- `GET /workspaces/:workspace_id/objects/:object_id` fetches an object instance scoped to one workspace.
- `GET /workspaces/:workspace_id/link-types` lists link types in one workspace.
- `POST /workspaces/:workspace_id/link-types` creates a link type in one workspace.
- `GET /workspaces/:workspace_id/link-types/:link_type_id` fetches a link type scoped to one workspace.
- `GET /workspaces/:workspace_id/links` lists link instances in one workspace.
- `POST /workspaces/:workspace_id/links` creates a link instance in one workspace.
- `GET /workspaces/:workspace_id/links/:link_id` fetches a link instance scoped to one workspace.
- `GET /workspaces/:workspace_id/objects/:object_id/links` returns one-hop inbound and outbound links for an object.
- `GET /workspaces/:workspace_id/object-sets` lists object sets in one workspace.
- `POST /workspaces/:workspace_id/object-sets` creates an object set in one workspace.
- `GET /workspaces/:workspace_id/object-sets/:object_set_id` fetches an object set scoped to one workspace.
- `GET /workspaces/:workspace_id/object-sets/:object_set_id/objects` evaluates an object set.

Storage is currently in-memory. `infra/migrations/0001_ontology_nouns.sql`, `infra/migrations/0002_links.sql`, and `infra/migrations/0003_object_sets.sql` define the intended Postgres schema for the same records.

### `apps/web`

Owns the human-facing UI. Current behavior:

- `GET /` returns a placeholder Atlas page.
- `GET /health` returns frontend health.

### `packages/ontology-core`

Owns shared cross-app types and tiny runtime helpers. Current exports cover:

- service health metadata
- object property validation against the first JSON Schema subset
- `BaseRecord` lifecycle/review/visibility validation for future Capability Graph records
- declarative Phase 2 record type specs and table-driven record set validation

### `infra/migrations`

Reserved for database migrations. The current migrations define `workspaces`, `object_types`, `object_instances`, `link_types`, `link_instances`, and `object_sets`.

Migration verification is currently static because no local Postgres runtime is configured. `npm run verify:migrations` checks ordering, file naming, semicolon termination, and duplicate table creation.

## Future Direction

The target architecture grows toward:

```text
Ontology nouns
-> capability graph records
-> governed actions
-> policy checks
-> hash-chained audit log
-> object UI
-> agent-readable tools
-> domain pack
-> next-action engine
```

Do not add those features during the skeleton task.
