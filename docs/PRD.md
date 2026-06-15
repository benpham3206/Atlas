# Atlas PRD

Status: Draft
Last updated: 2026-06-14

## Product Definition

Atlas is a minimal operational ontology platform. Its long-term goal is to model typed objects, relations, governed actions, permissions, audit history, agent-readable tools, and next valid actions.

The first useful version is intentionally smaller:

```text
One hard goal
-> one domain pack
-> one graph
-> one workspace
-> one agent loop
-> one next valid action
```

## Current Task

Create the initial monorepo skeleton.

## Requirements

1. Create `apps/api` with a minimal backend server.
2. Create `apps/web` with a minimal frontend.
3. Create `packages/ontology-core` for shared types.
4. Create `infra/migrations` for database migrations.
5. Add `docs/ARCHITECTURE.md` if missing.
6. Add a healthcheck endpoint.
7. Add test setup.
8. Add README instructions for running locally.

## Acceptance Criteria

- Backend starts locally.
- Frontend starts locally.
- Healthcheck returns `ok`.
- Tests run successfully.
- No ontology features yet.

## Non-Goals

- No auth.
- No database models.
- No ontology CRUD.
- No integrations.
- No production UI.
- No Lean, ZKP, blockchain, marketplace, ingestion, or enterprise SSO.

## Build Direction

Atlas should be built as small, verifiable tasks:

```text
PRD
-> architecture docs
-> schemas
-> migrations
-> APIs
-> tests
-> UI
-> agent tools
-> policies
-> audit
-> integrations
-> proof layer
```

The first credible Atlas loop will eventually be:

```text
Object
-> relation
-> action
-> permission check
-> state change
-> audit log
-> UI update
-> agent-readable API
```

That loop is not part of this skeleton task.
