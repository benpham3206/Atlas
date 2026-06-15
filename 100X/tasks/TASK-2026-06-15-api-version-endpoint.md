# TASK-2026-06-15-api-version-endpoint

## Goal

Prove the Codex -> Cursor Cloud Agent -> Codex review workflow with one small Atlas product change:
add a stable `GET /version` API endpoint.

## User intent

Original request:

> whats next we can do that can prove the 100X workflow from codex -> cursor agents works?
> alright go ahead and get that started for me

The intent is to validate that Codex can plan an atomic product task, Cursor Cloud can implement it,
and Codex can review the resulting PR without the workflow blocking normal product development.

## PRD summary

Atlas currently exposes `/health` and `/` on the API. A small `/version` endpoint gives clients,
operators, and future smoke tests a stable, dependency-free way to confirm which Atlas API package
version is running. This is intentionally low risk: it does not introduce persistence, auth,
external dependencies, migrations, or new product abstractions.

## Scope

In:

- Add `GET /version` to `apps/api`.
- Return a JSON payload with the API service name and current package version.
- Source the version from existing repo/package metadata, not a hardcoded duplicate string.
- Add API test coverage for the endpoint.
- Update docs only if needed to document the new endpoint.
- Update this task's `100X/state/`, `100X/logs/`, and `100X/POKE_SUMMARY.md` during implementation.
- Open a PR for Codex review.

Out:

- No web UI changes.
- No database, migration, fixture, ontology-core, or record lifecycle changes.
- No auth, policy, audit, or workspace-scoped behavior.
- No external npm dependencies.
- No broad refactors of API routing or server startup.
- No additional workflow restructuring beyond the required handoff updates.

## Acceptance criteria

- [ ] `GET /version` returns HTTP 200 with `content-type: application/json; charset=utf-8`.
- [ ] Response includes `service: "atlas-api"`.
- [ ] Response includes `version` matching the root package version in `package.json`.
- [ ] Response includes no timestamp, host, environment variables, secrets, git data, or machine-specific paths.
- [ ] Unknown routes still return the existing 404 JSON response.
- [ ] API tests cover the success response and version value.
- [ ] Relevant verification passes, at minimum `npm run test:api` and `npm run lint`.
- [ ] PR description includes what changed, how tested, risks, and follow-up work.
- [ ] `100X/state/TASK-2026-06-15-api-version-endpoint.md` and
  `100X/logs/TASK-2026-06-15-api-version-endpoint.md` are current before review.

## Test plan

- Unit/API: add or update an API test in `apps/api/test/health.test.js` or a narrow new API test file
  to assert `GET /version` returns the expected JSON and status.
- Regression: run `npm run test:api`.
- Lint: run `npm run lint`.
- Optional broad check before PR: run `npm test` if the implementation touches shared package exports,
  root package metadata, or routing helpers beyond the minimal endpoint.

## Likely files

- `apps/api/src/server.js`
- `apps/api/test/health.test.js`
- `README.md` if endpoint documentation is added
- `100X/state/TASK-2026-06-15-api-version-endpoint.md`
- `100X/logs/TASK-2026-06-15-api-version-endpoint.md`
- `100X/POKE_SUMMARY.md`

## Architecture notes

- Prefer the smallest local implementation consistent with existing dependency-free patterns.
- The current API server already imports from local files and uses built-in Node APIs only.
- If package metadata import requires JSON import assertions that would add runtime friction, use a
  small Node built-in file read from the root `package.json`; do not add dependencies.
- Keep the response stable and non-sensitive. This endpoint is for package version visibility, not
  build provenance.

## Cursor Cloud launch prompt

```text
Start Cursor Cloud Agent.

Repo: benpham3206/Atlas
Base branch: main
Task ID: TASK-2026-06-15-api-version-endpoint
Mode: implement the existing Codex-planned atomic task
Goal: Execute the task described in 100X/tasks/TASK-2026-06-15-api-version-endpoint.md

Instructions:
- Read AGENTS.md, 100X/AGENTS.md, TASKS.md, CONTEXT_LOG.md, docs/ARCHITECTURE.md, and
  100X/docs/AGENT_WORKFLOW.md.
- Read 100X/tasks/TASK-2026-06-15-api-version-endpoint.md.
- Implement only the scoped /version endpoint task. Do not make architecture decisions beyond the
  task spec.
- Do not add dependencies.
- Do not change web UI, migrations, fixtures, ontology-core behavior, auth, policy, or audit.
- Add API test coverage.
- Run npm run test:api and npm run lint. Run npm test too if you touch shared behavior.
- Update 100X/state/TASK-2026-06-15-api-version-endpoint.md.
- Update 100X/logs/TASK-2026-06-15-api-version-endpoint.md with command evidence.
- Update 100X/POKE_SUMMARY.md with a concise status.
- Open a PR for Codex review.
- End with summary, files changed, commands run, risks, next action, and a Poke-ready summary under
  100 words.
```

## Risks

- Reading version metadata could become overbuilt. Keep it simple and dependency-free.
- A version endpoint could accidentally expose build or environment information. Return only service
  and package version for this task.
- Workflow handoff files could expand beyond the product proof. Keep updates short and task-specific.

## Review requirements

- Codex review required: yes, to prove the independent review lane.
- Bugbot review required: optional.
- Security review required: no, unless implementation exposes environment/build/secrets or changes
  request handling beyond the endpoint.
- Human approval required before merge: yes.

