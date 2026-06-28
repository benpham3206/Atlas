# Atlas

Atlas is a minimal operational ontology platform. The Personal Atlas v0 slice adds governed actions, a next-action dashboard, and an in-memory personal workspace.

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
When review packets exist for the current workspace, the dashboard includes a Review inbox with the
PR artifact, verification commands, critic/safety findings, and the pending human-only action.

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

Policies are enforced before action execution. Once a workspace has at least one active policy, an
action run must present a `role` permitted by an allow rule (and not matched by a deny rule);
otherwise the API responds `403 policy_denied`, the target object is not mutated, and the denial is
recorded as both a `PermissionCheck` and an audit event. Workspaces with no active policy stay open
(legacy behavior). You can also pre-check a decision without acting:

```sh
curl -X POST http://localhost:4000/workspaces/workspace_game_studio/authorize \
  -H 'content-type: application/json' \
  -d '{
    "principal_type": "agent",
    "principal_id": "agent_coder",
    "role": "viewer",
    "action": "run_action",
    "resource_type": "object_type_bug"
  }'
```

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

## Agent Gateway (usable by any agent)

The agent gateway is the governed surface an autonomous agent uses to operate a workspace. Every
call is authorized against a scoped, expiring delegation and recorded in the hash-chained audit log,
following this verification order: resolve delegation -> check status/expiry -> check scope -> check
tool allowlist -> check GoalContract actions -> evaluate policy (for actions) -> execute -> append
audit event.

See the whole loop run end-to-end (discover -> delegate -> read -> govern -> audit -> persist):

```sh
npm run smoke:agent
```

Discover the tool contract (no auth required for discovery):

```sh
curl http://localhost:4000/agent/manifest
```

Create an agent identity and mint a scoped, expiring delegation (the delegation `id` is the bearer
token). Agents cannot mint or extend their own delegations:

```sh
curl -X POST http://localhost:4000/agents \
  -H 'content-type: application/json' \
  -d '{"display_name": "Coding Agent"}'

curl -X POST http://localhost:4000/workspaces/workspace_game_studio/agent-delegations \
  -H 'content-type: application/json' \
  -d '{
    "agent_id": "agent_001",
    "role": "editor",
    "scopes": ["atlas.read", "atlas.act", "github.pr:create"],
    "allowed_tools": ["*"],
    "goal_contract_id": "goal_contract_001",
    "ttl_seconds": 3600
  }'
```

Call a read tool with the delegation as a bearer token:

```sh
curl -X POST http://localhost:4000/agent/tools/get_workspace_overview \
  -H 'authorization: Bearer delegation_001' \
  -H 'content-type: application/json' \
  -d '{}'
```

Run a governed action through the gateway (subject to policy; denials are recorded, not silent):

```sh
curl -X POST http://localhost:4000/agent/tools/run_action \
  -H 'authorization: Bearer delegation_001' \
  -H 'content-type: application/json' \
  -d '{
    "action_type_id": "action_type_mark_bug_resolved",
    "target_object_id": "object_bug_camera_clip",
    "input_json": { "resolution_note": "Fixed collision mesh" }
  }'
```

Available tools: `get_workspace_overview`, `query_object`, `list_objects`, `search_records`,
`traverse_graph`, `get_available_actions`, `get_next_action`, `run_action`, `github.open_pr`,
`generate_review_packet`, `slack.get_channel_info`, `verify_audit_chain`. There is intentionally no
merge tool and no Slack write tool.

Open a PR through the GitHub tool only after setting `GITHUB_TOKEN`,
`GITHUB_ALLOWED_REPOSITORIES`, and `GITHUB_ALLOWED_BASE_BRANCHES` for the API process. The
`head_branch` must start with `codex/` or `agent/`; protected-branch merge remains a human-only
boundary. Set `GITHUB_DRY_RUN=1` to exercise the same gateway/audit path without calling GitHub.

## Audit Log

Every object create/update, action run, policy decision, delegation, and agent tool call appends a
hash-chained audit event. GitHub PR attempts also append `github.pull_request.open_attempted` for
success, dry-run, allowlist denial, and client failure. Slack read attempts append
`slack.conversation.info_attempted` for success, allowlist denial, and client failure. The chain is
tamper-evident and verifiable. The web dashboard renders the latest local workspace audit timeline
from the same API; it is process-local integrity evidence, not external compliance retention.

```sh
curl http://localhost:4000/audit/verify
curl http://localhost:4000/workspaces/workspace_game_studio/audit-events
```

## Environment Variables

- `PORT`: override the port for whichever app is being started.
- `HOST`: override the bind host. Defaults to `127.0.0.1`.
- `ATLAS_API_URL`: API URL displayed by the web placeholder. Defaults to `http://localhost:4000`.
- `ATLAS_DATA_FILE`: when set, the API persists its full state to this JSON file after each mutation and reloads it on boot. Unset means in-memory only (resets on restart).
- `GITHUB_TOKEN`: optional token used by the API GitHub client for `github.open_pr`. Use a narrowly scoped token that can create pull requests but cannot merge protected branches.
- `GITHUB_ALLOWED_REPOSITORIES`: comma-separated repository allowlist for `github.open_pr`, for example `benpham3206/Atlas`.
- `GITHUB_ALLOWED_BASE_BRANCHES`: comma-separated base-branch allowlist for `github.open_pr`, for example `main`.
- `GITHUB_DRY_RUN`: set to `1` or `true` to force `github.open_pr` to create a dry-run artifact and audit event without calling GitHub.
- `SLACK_TOKEN`: optional token used by the API Slack client for read-only Slack tools.
- `SLACK_ALLOWED_CHANNELS`: comma-separated channel-id allowlist for `slack.get_channel_info`, for example `C0123456789`.
