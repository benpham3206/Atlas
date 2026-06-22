# Atlas Architecture

Status: Personal Atlas v0 slice
Last updated: 2026-06-22

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
- `PATCH /workspaces/:workspace_id/objects/:object_id` updates an object instance; validates properties against the object type schema.
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
- `GET /workspaces/:workspace_id/action-types` lists action types in one workspace.
- `POST /workspaces/:workspace_id/action-types` creates an action type in one workspace.
- `GET /workspaces/:workspace_id/action-types/:action_type_id` fetches an action type scoped to one workspace.
- `GET /workspaces/:workspace_id/action-runs` lists action runs in one workspace.
- `POST /workspaces/:workspace_id/action-runs` creates an action run; applies the action type effect to the target object and records before/after properties.
- `GET /workspaces/:workspace_id/action-runs/:action_run_id` fetches an action run scoped to one workspace.
- `POST /personal/bootstrap` seeds the personal workspace, object types, AAA project graph, tasks, and complete-task action type. Idempotent.
- `GET /personal/overview` returns carbon copy, project, tasks, blockers map, next action, and security boundary notice.
- `GET /personal/next-action` returns the highest-priority unblocked open personal task with acceptance criteria and blocker context.
- `POST /personal/tasks/:task_id/complete` completes a personal task via the complete-task ActionType/ActionRun path; requires `artifact_uri` and `evidence_note`.

Storage is currently in-memory. `infra/migrations/0001_ontology_nouns.sql`, `infra/migrations/0002_links.sql`, `infra/migrations/0003_object_sets.sql`, and `infra/migrations/0004_actions.sql` define the intended Postgres schema for the same records. `0004_actions.sql` adds `action_types` and `action_runs` with workspace-scoped foreign keys to object types and object instances.

### `apps/web`

Owns the human-facing UI. Current behavior:

- `GET /` proxies to the API `GET /personal/overview`. If the personal workspace is not bootstrapped, renders a bootstrap page with a form that posts to `POST /bootstrap`.
- `POST /bootstrap` proxies to the API `POST /personal/bootstrap`, then redirects to `/`.
- `POST /tasks/:task_id/complete` proxies to the API `POST /personal/tasks/:task_id/complete` with form fields `artifact_uri` and `evidence_note`, then redirects to `/` (errors surface via `?error=` query param).
- `GET /health` returns frontend health.

The web server does not embed personal state. It calls the API at `ATLAS_API_URL` (default `http://127.0.0.1:4000`) through `apps/web/src/api-client.js`.

### `packages/ontology-core`

Owns shared cross-app types and tiny runtime helpers. Current exports cover:

- service health metadata
- object property validation against the first JSON Schema subset
- `BaseRecord` lifecycle/review/visibility validation for future Capability Graph records
- declarative Phase 2 record type specs and table-driven record set validation

### `infra/migrations`

Reserved for database migrations. The current migrations define `workspaces`, `object_types`, `object_instances`, `link_types`, `link_instances`, `object_sets`, `action_types`, and `action_runs`.

Migration verification is currently static because no local Postgres runtime is configured. `npm run verify:migrations` checks ordering, file naming, semicolon termination, and duplicate table creation.

## Agent Workflow Control Plane

Atlas product code and the agent workflow are separated:

- `100X/` is the canonical home for the Codex, Cursor Cloud Agents, and Poke interaction workflow.
- Root `AGENTS.md` keeps Atlas runtime constraints and points agents at `100X/`.
- Root `.cursor/rules/` and `.cursor/agents/` are the Cursor discovery layer and should stay aligned
  with `100X/cursor/`.
- `TASKS.md` and `CONTEXT_LOG.md` remain the root Atlas trackers.

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
