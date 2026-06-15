# Atlas

Atlas is a minimal operational ontology platform. This repository currently contains only the initial monorepo skeleton.

## What Exists

- `apps/api`: minimal backend server.
- `apps/web`: minimal frontend placeholder.
- `packages/ontology-core`: shared health/status types, object property validation, and BaseRecord validation.
- `infra/migrations`: database migration artifacts.
- `docs`: PRD, architecture, Codex rules, and task queue.
- `docs/AGENT_WORKFLOW.md`: Poke/Cursor/Codex operating model and handoff process.
- `.agents/skills`, `.cursor/rules`, `.cursor/agents`: portable skills and Cursor-specific agent workflow configuration.
- `.github/codex/prompts`: Codex review prompts; no automated Codex Action is enabled by default.
- `tasks`, `state`, `logs`: templates for per-task specs, handoff state, and command evidence.

The first ontology nouns and links are implemented with in-memory API storage: `Workspace`, `ObjectType`, `ObjectInstance`, `LinkType`, `LinkInstance`, and `ObjectSet`.

The first Capability Graph record foundation is implemented in `ontology-core`: `BaseRecord` validation, a declarative record type registry, table-driven Phase 2 specs, AAA-wedge fixtures, and record validation command support. Candidate records remain visible but non-authoritative; only approved operational records can drive future recommendations or state-changing behavior.

Auth, actions, policies, audit, database runtime wiring, and integrations are not implemented yet.

## Agent Workflow

For non-trivial agent work, read `AGENTS.md`, `TASKS.md`, `CONTEXT_LOG.md`, `docs/ARCHITECTURE.md`,
and `docs/AGENT_WORKFLOW.md` before planning or coding. `TASKS.md` remains the root implementation
queue, while per-task specs and handoff evidence belong under `tasks/`, `state/`, and `logs/` when
the task needs durable acceptance criteria or status.

## Requirements

- Node.js 18.17 or newer.
- npm.

There are currently no external npm dependencies.

## Run Locally

Start the backend:

```sh
npm run dev:api
```

The API listens on `http://localhost:4000` by default.

Check the health endpoint:

```sh
curl http://localhost:4000/health
```

Expected response:

```json
{"status":"ok","service":"atlas-api","timestamp":"2026-06-14T00:00:00.000Z"}
```

Start the frontend in another terminal:

```sh
npm run dev:web
```

The web app listens on `http://localhost:3000` by default.

## Tests

Run all tests:

```sh
npm test
```

Run lint:

```sh
npm run lint
```

Verify migration files:

```sh
npm run verify:migrations
```

Validate Capability Graph record fixtures:

```sh
npm run validate:records
```

Run a specific test group:

```sh
npm run test:api
npm run test:web
npm run test:core
```

## API Examples

Create a workspace:

```sh
curl -X POST http://localhost:4000/workspaces \
  -H 'content-type: application/json' \
  -d '{"id":"workspace_game_studio","name":"Game Studio"}'
```

Create an object type:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/object-types \
  -H 'content-type: application/json' \
  -d '{
    "id": "object_type_bug",
    "name": "Bug",
    "schema_json": {
      "type": "object",
      "required": ["title", "status"],
      "properties": {
        "title": {"type": "string"},
        "status": {"type": "string", "enum": ["open", "resolved"]}
      }
    }
  }'
```

Create an object instance:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/objects \
  -H 'content-type: application/json' \
  -d '{
    "object_type_id": "object_type_bug",
    "properties_json": {
      "title": "Camera clips through wall",
      "status": "open"
    }
  }'
```

Create a link type:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/link-types \
  -H 'content-type: application/json' \
  -d '{
    "id": "link_type_bug_affects_build",
    "name": "Bug affects Build",
    "from_object_type_id": "object_type_bug",
    "to_object_type_id": "object_type_build"
  }'
```

Create a link instance:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/links \
  -H 'content-type: application/json' \
  -d '{
    "link_type_id": "link_type_bug_affects_build",
    "from_object_id": "object_bug_camera_clip",
    "to_object_id": "object_build_v001"
  }'
```

Create an object set:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/object-sets \
  -H 'content-type: application/json' \
  -d '{
    "id": "object_set_open_bugs",
    "name": "Open bugs",
    "object_type_id": "object_type_bug",
    "filter_expression": {
      "property_equals": {
        "status": "open"
      }
    }
  }'
```

Evaluate an object set:

```sh
curl http://localhost:4000/workspaces/workspace_game_studio/object-sets/object_set_open_bugs/objects
```

## Environment Variables

- `PORT`: override the port for whichever app is being started.
- `HOST`: override the bind host. Defaults to `127.0.0.1`.
- `ATLAS_API_URL`: API URL displayed by the web placeholder. Defaults to `http://localhost:4000`.
