# Atlas Architecture

Status: Personal Atlas v0 slice
Last updated: 2026-06-28

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
- `GET /users` lists local user records.
- `POST /users` creates a local user record.
- `GET /users/:user_id` fetches a local user record.
- `GET /workspaces/:workspace_id/memberships` lists local workspace memberships.
- `POST /workspaces/:workspace_id/memberships` creates a local workspace membership.
- `GET /workspaces/:workspace_id/memberships/:membership_id` fetches a local membership scoped to one workspace.
- `GET /workspaces/:workspace_id/policies` lists local policies.
- `POST /workspaces/:workspace_id/policies` creates a local policy with validated rules.
- `GET /workspaces/:workspace_id/policies/:policy_id` fetches a local policy scoped to one workspace.
- `GET /workspaces/:workspace_id/permission-checks` lists recorded permission-check decisions.
- `POST /workspaces/:workspace_id/permission-checks` records a permission-check decision.
- `GET /workspaces/:workspace_id/permission-checks/:permission_check_id` fetches a permission-check decision.
- `POST /workspaces/:workspace_id/authorize` evaluates a policy decision for a principal/role/action/resource without mutating state, recording a `PermissionCheck` and an audit event.
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
- `POST /workspaces/:workspace_id/action-runs` creates an action run; enforces workspace policy before applying the action type effect to the target object, records before/after properties, and appends an audit event. Denied runs do not mutate the object.
- `GET /workspaces/:workspace_id/action-runs/:action_run_id` fetches an action run scoped to one workspace.
- `GET /audit/verify` verifies the integrity of the append-only, hash-chained audit log.
- `GET /workspaces/:workspace_id/audit-events` lists audit events for one workspace (filterable by `resource_id`, `event_type`).
- `GET /workspaces/:workspace_id/audit-events/:event_id` fetches a single audit event.
- `GET /agents` / `POST /agents` / `GET /agents/:agent_id` manage agent identities.
- `GET /workspaces/:workspace_id/goal-contracts` / `POST /workspaces/:workspace_id/goal-contracts` manage GoalContracts that constrain agent allowed/blocked actions and optional next-action configuration.
- `GET /workspaces/:workspace_id/goal-contracts/:goal_contract_id` fetches a GoalContract scoped to one workspace.
- `GET /workspaces/:workspace_id/agent-delegations` lists scoped delegations for one workspace.
- `POST /workspaces/:workspace_id/agent-delegations` mints a scoped, expiring delegation (role + scopes + allowed tools + optional GoalContract + expiry).
- `GET /workspaces/:workspace_id/agent-delegations/:delegation_id` fetches a delegation.
- `GET /workspaces/:workspace_id/pull-request-artifacts` / `GET /workspaces/:workspace_id/pull-request-artifacts/:artifact_id` expose PR artifacts created by the agent gateway.
- `GET /workspaces/:workspace_id/review-packets` / `POST /workspaces/:workspace_id/review-packets` manage bundled review packets.
- `GET /workspaces/:workspace_id/review-packets/:review_packet_id` fetches one review packet.
- `GET /agent/manifest` returns the discoverable agent tool contract (tools, scopes, verification order).
- `POST /agent/tools/:tool` dispatches a governed agent tool call; authorizes the delegation bearer (status, expiry, scope, tool allowlist, GoalContract allowed/blocked actions), evaluates policy for action runs, executes within the delegation's workspace, and appends an audit event for every call (allow or deny). `github.open_pr` can create or dry-run a PR from `codex/` or `agent/` branches only when repository and base branch are allowlisted; no merge tool exists. Every GitHub PR attempt appends `github.pull_request.open_attempted`. `slack.get_channel_info` reads Slack `conversations.info` only for allowlisted channels and appends `slack.conversation.info_attempted`; no Slack write tool exists.
- `POST /personal/bootstrap` seeds the personal workspace, object types, Atlas self-hosting roadmap, tasks, and complete-task action type. Idempotent.
- `GET /personal/overview` returns carbon copy, project, tasks, blockers map, next action, and security boundary notice.
- `GET /personal/next-action` returns the highest-priority unblocked open personal task with acceptance criteria and blocker context.
- `GET /personal/tasks` returns the personal task list, blocker map, and open/total counts (lighter than overview).
- `GET /personal/session-context` returns the dual-spine header: personal next-action summary, parallel polish pointers, `agent_contract` hints, and security boundary (for web UI and `personal.get_session_context` MCP).
- `PATCH /personal/objects/:object_id` patches personal object properties; marking tasks `done` is rejected (use complete route).
- `POST /personal/tasks/:task_id/complete` completes a personal task via the complete-task ActionType/ActionRun path; requires `artifact_uri` and `evidence_note`.

Storage is in-memory by default and can be snapshotted to a JSON file when `ATLAS_DATA_FILE` is set (`apps/api/src/persistence.js`): the full store is written after each mutating request and reloaded on boot, so state survives restarts without a database. The migrations under `infra/migrations/` (`0001`–`0010`) define the intended Postgres schema for the same records. `0004_actions.sql` adds `action_types` and `action_runs`. `0005_governance.sql` adds local `users` and `workspace_memberships`. `0006_policies.sql` adds local `policies`. `0007_permission_checks.sql` adds `permission_checks`. `0008_agents.sql` adds `agents` and `agent_delegations`. `0009_audit_events.sql` adds the insert-only, hash-chained `audit_events` log. `0010_goal_contracts_review_packets.sql` adds GoalContracts, PullRequestArtifacts, and ReviewPackets.

### `apps/web`

Owns the human-facing UI. Current behavior:

- `GET /` proxies to the API `GET /personal/overview`. If the personal workspace is not bootstrapped, renders a bootstrap page with a form that posts to `POST /bootstrap`.
- `GET /?workspace_id=:workspace_id` selects the workspace context used for the read-only ontology manager, review packets, PR artifacts, and audit timeline panels. Personal task completion remains bound to the Personal Atlas overview.
- `GET /?workspace_id=:workspace_id&object_id=:object_id` additionally renders a read-only object detail panel with properties and one-hop inbound/outbound links.
- `POST /workspaces/:workspace_id/object-types` parses the dashboard object type form, validates `schema_json` as JSON, proxies to the API object-type create route, and redirects back to the selected workspace context.
- `POST /workspaces/:workspace_id/action-runs` parses the dashboard action runner form, validates `input_json` as JSON, proxies to the API ActionRun route, and redirects back to the target object detail context.
- `POST /bootstrap` proxies to the API `POST /personal/bootstrap`, then redirects to `/`.
- `POST /tasks/:task_id/complete` proxies to the API `POST /personal/tasks/:task_id/complete` with form fields `artifact_uri` and `evidence_note`, then redirects to `/` (errors surface via `?error=` query param).
- `GET /health` returns frontend health.

The web server does not embed personal state. It calls the API at `ATLAS_API_URL` (default `http://127.0.0.1:4000`) through `apps/web/src/api-client.js`.
The dashboard renders next actions, a read-only workspace selector, selected-workspace object type inventory, object instance summaries, object detail, a dependency-free node/edge graph explorer, governed action runner, review packets, PR artifacts, and the latest local hash-chained audit events.
A **session context bar** at the top of every console view shows dual-spine mode (personal `workspace_personal` vs operational MCP delegation), polish track URI, repo cwd, and last gate ledger mtime (from `outputs/proofs/VERIFICATION_LEDGER.md`).

### `packages/ontology-core`

Owns shared cross-app types and tiny runtime helpers. Current exports cover:

- service health metadata
- object property validation against the first JSON Schema subset
- `BaseRecord` lifecycle/review/visibility validation for future Capability Graph records
- declarative Phase 2 record type specs and table-driven record set validation
- audit hash-chain helpers (`canonicalJson`, `sha256Hex`, `auditEventHash`, `verifyAuditEventChain`) shared by the API audit log

### `infra/migrations`

Reserved for database migrations. The current migrations define `workspaces`, `object_types`, `object_instances`, `link_types`, `link_instances`, `object_sets`, `action_types`, `action_runs`, `users`, `workspace_memberships`, `policies`, `permission_checks`, `agents`, `agent_delegations`, `audit_events`, `goal_contracts`, `pull_request_artifacts`, and `review_packets`.

Migration verification is currently static because no local Postgres runtime is configured. `npm run verify:migrations` checks ordering, file naming, semicolon termination, and duplicate table creation.

## Implemented vs. Target

Implemented in this slice (in-memory / file-backed, single node):

```text
Ontology nouns
-> capability graph records
-> governed actions
-> policy checks (enforced on the action path)
-> hash-chained audit log
-> agent-readable tools (governed gateway + scoped delegations + GoalContracts)
-> open-PR-not-merge GitHub tool and review packet records
-> generalized next-action engine
-> durable file-backed persistence
```

Still on the target architecture (not yet implemented):

```text
Real authentication (OAuth 2.0 / signed JWT delegation)
-> Postgres + Row-Level Security (multi-tenant isolation)
-> sandboxed Tool Router execution profiles
-> classification propagation + redaction
-> rich object UI
-> domain packs and external integrations
```

Delegation tokens are currently local scoped bearers (not signed JWTs), and isolation is enforced in
application code rather than by the database. These are the first hardening steps toward the target.
