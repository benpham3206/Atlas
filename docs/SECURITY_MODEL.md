# Atlas Security Model

Status: Personal Atlas v0 slice
Last updated: 2026-06-28

## Current Security Boundary

The current implementation has no authentication or authorization. Workspace isolation is enforced only by route-level scoping:

```text
/workspaces/:workspace_id/...
```

An object type, object instance, action run, workspace membership, or policy created in one workspace is not returned from another workspace route. Local `User`, `WorkspaceMembership`, and `Policy` records are governance scaffolding only; they do not authenticate requests, prove caller identity, or enforce authorization yet.

## Required Future Rules

1. Every request must resolve tenant and workspace before returning data.
2. No endpoint may return records outside the caller's workspace.
3. Every action must pass policy before mutation.
4. Every mutation must create an audit event.
5. Agent tools must be least-privilege by default.
6. Derived records, summaries, and embeddings must inherit source permissions.

## Personal Atlas v0 Boundary

Personal Atlas is **local in-memory personal state** for a single developer workflow demo. It is **not** real authentication or privacy protection.

- No auth; local users, memberships, roles, and policies are records only.
- Route scoping (`/workspaces/:workspace_id/...`, `/personal/...`) organizes data paths; it does **not** provide identity security or multi-tenant isolation.
- All personal workspace data lives in the API process memory and **resets on API restart**.
- Personal overview includes an explicit `security_boundary` notice in API responses and the web dashboard.
- Do **not** claim enterprise tenancy, audit guarantees, durable persistence, or production-grade access control for this slice.

Completing a personal task creates an ActionRun record in memory, but that is an operational trace—not an audit log with hash chaining, retention, or compliance guarantees.

## Non-Goals For Current Slice

- No auth.
- No identity-backed users or memberships.
- No enforced role permissions.
- No enforced policies.
- No audit log.
- No tenant isolation.
- No durable persistence (in-memory only; restart clears state).
