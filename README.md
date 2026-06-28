# Atlas

Atlas is a minimal operational ontology platform. The Personal Atlas v0 slice adds governed actions, a next-action dashboard, and an in-memory personal workspace.

## What Exists

- `apps/api`: backend HTTP server with ontology nouns, actions, local governance/policy records, and personal endpoints.
- `apps/web`: server-rendered personal dashboard with API proxy.
- `packages/ontology-core`: shared health/status types, object property validation, and BaseRecord validation.
- `infra/migrations`: database migration artifacts.
- `docs`: PRD, architecture, Codex rules, and task queue.

The ontology nouns and links are implemented with in-memory API storage: `Workspace`, `ObjectType`, `ObjectInstance`, `LinkType`, `LinkInstance`, and `ObjectSet`. Generic `ActionType` and `ActionRun` records support declarative property-update effects. Local `User`, `WorkspaceMembership`, and `Policy` records model governance scaffolding without authentication or authorization enforcement. Personal Atlas seeds a Carbon Copy, Atlas self-hosting roadmap, task graph, and next-action selector.

The Capability Graph record foundation is implemented in `ontology-core`: `BaseRecord` validation, a declarative record type registry, table-driven Phase 2 specs, AAA-wedge fixtures, and record validation command support. Candidate records remain visible but non-authoritative; only approved operational records can drive future recommendations or state-changing behavior.

Auth, policies, audit, database runtime wiring, and integrations are not implemented yet.

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

## Personal Atlas

Personal Atlas v0 is a local, in-memory self-hosting cockpit: bootstrap a personal workspace, view the Carbon Copy / Atlas roadmap / tasks, and complete roadmap tasks through a dependency-aware next-action flow.

**Run flow**

1. Start the API: `npm run dev:api`
2. Start the web app: `npm run dev:web`
3. Open `http://localhost:3000`
4. Click **Bootstrap Personal Atlas** (or call `POST /personal/bootstrap` below)
5. Complete tasks from the dashboard or via the API

**Note:** Personal Atlas uses in-memory storage with no authentication. All personal data resets when the API process restarts. Route scoping is not privacy protection.

Bootstrap the personal workspace (idempotent):

```sh
curl -X POST http://localhost:4000/personal/bootstrap
```

Load the personal overview (carbon copy, project, tasks, blockers, next action):

```sh
curl http://localhost:4000/personal/overview
```

Get the current next action:

```sh
curl http://localhost:4000/personal/next-action
```

Complete the first personal roadmap task (requires `artifact_uri` and `evidence_note`):

```sh
curl -X POST http://localhost:4000/personal/tasks/object_task_harden_personal_loop/complete \
  -H 'content-type: application/json' \
  -d '{
    "artifact_uri": "evidence/personal-atlas-composer-25-review.md",
    "evidence_note": "Personal Atlas review findings were fixed and verified"
  }'
```

Create an ActionType (generic workspace action definition):

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/action-types \
  -H 'content-type: application/json' \
  -d '{
    "id": "action_type_mark_bug_resolved",
    "name": "Mark Bug Resolved",
    "target_object_type_id": "object_type_bug",
    "input_schema_json": {
      "type": "object",
      "properties": {
        "resolution_note": { "type": "string" }
      }
    },
    "effect_json": {
      "type": "update_object_properties",
      "set_properties_json": { "status": "resolved" },
      "copy_input_fields": ["resolution_note"]
    }
  }'
```

Run an action (creates an ActionRun and mutates the target object):

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/action-runs \
  -H 'content-type: application/json' \
  -d '{
    "id": "action_run_mark_resolved",
    "action_type_id": "action_type_mark_bug_resolved",
    "target_object_id": "object_bug_camera_clip",
    "actor": "local_user",
    "input_json": {
      "resolution_note": "Fixed collision mesh"
    }
  }'
```

Create a local User record and add it to a workspace:

```sh
curl -X POST http://localhost:4000/users \
  -H 'content-type: application/json' \
  -d '{
    "id": "user_lead_engineer",
    "email": "lead@example.com",
    "display_name": "Lead Engineer",
    "identity_provider_subject": "idp|lead"
  }'

curl -X POST http://localhost:4000/workspaces/workspace_game_studio/memberships \
  -H 'content-type: application/json' \
  -d '{
    "id": "membership_game_studio_owner",
    "user_id": "user_lead_engineer",
    "role": "owner"
  }'
```

Local users and workspace memberships are governance scaffolding only. They do not authenticate
requests or provide privacy protection.

Create a local Policy record:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/policies \
  -H 'content-type: application/json' \
  -d '{
    "id": "policy_editors_run_actions",
    "name": "Editors can run actions",
    "rules_json": [
      {
        "effect": "allow",
        "action": "action_run:create",
        "resource_type": "ActionRun",
        "roles": ["owner", "editor"]
      }
    ]
  }'
```

Policies are stored and rule-validated, but they are not enforced until the PermissionCheck phase.

Patch an object instance directly:

```sh
curl -X PATCH http://localhost:4000/workspaces/workspace_game_studio/objects/object_bug_camera_clip \
  -H 'content-type: application/json' \
  -d '{
    "properties_json": {
      "title": "Camera clips through wall",
      "status": "open"
    }
  }'
```

## Environment Variables

- `PORT`: override the port for whichever app is being started.
- `HOST`: override the bind host. Defaults to `127.0.0.1`.
- `ATLAS_API_URL`: API URL displayed by the web placeholder. Defaults to `http://localhost:4000`.
