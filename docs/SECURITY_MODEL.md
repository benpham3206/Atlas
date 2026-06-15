# Atlas Security Model

Status: Initial placeholder
Last updated: 2026-06-14

## Current Security Boundary

The current implementation has no authentication or authorization. Workspace isolation is enforced only by route-level scoping:

```text
/workspaces/:workspace_id/...
```

An object type or object instance created in one workspace is not returned from another workspace route.

## Required Future Rules

1. Every request must resolve tenant and workspace before returning data.
2. No endpoint may return records outside the caller's workspace.
3. Every action must pass policy before mutation.
4. Every mutation must create an audit event.
5. Agent tools must be least-privilege by default.
6. Derived records, summaries, and embeddings must inherit source permissions.

## Non-Goals For Current Slice

- No auth.
- No users or memberships.
- No roles.
- No policies.
- No audit log.
- No tenant isolation.
