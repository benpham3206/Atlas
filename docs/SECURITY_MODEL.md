# Atlas Security Model

Status: Personal Atlas v0 slice
Last updated: 2026-06-28

## Current Security Boundary

The current implementation has **no end-user authentication** (no login, no signed identity). Multi-tenant isolation is enforced in application code via workspace-scoped routes and store checks, not yet by the database:

```text
/workspaces/:workspace_id/...
```

An object type, object instance, action run, membership, policy, delegation, or audit event created in one workspace is not returned from another workspace route.

What **is** now enforced:

- **Policy on the action path.** Once a workspace has an active policy, an action run (direct or via the agent gateway) must present a role permitted by an allow rule and not matched by a deny rule; otherwise it is rejected (`403 policy_denied`), the target is not mutated, and the denial is recorded as a `PermissionCheck` and an audit event. Workspaces with no active policy remain open (legacy behavior).
- **Least-privilege agent access.** Agents act through scoped, expiring `AgentDelegation` bearers bound to a workspace, role, scope set, tool allowlist, and optional `GoalContract`. The gateway verifies status, expiry, scope, tool allowlist, and GoalContract allowed/blocked actions on every call. Agents cannot mint or extend their own delegations.
- **Open-PR-not-merge GitHub boundary.** The gateway exposes `github.open_pr` behind the `github.pr:create` scope and an agent branch namespace (`codex/` or `agent/`). It records a `PullRequestArtifact` and audit event. There is no merge tool and no merge scope; protected-branch merge remains a human-only boundary.
- **Append-only audit.** Object writes, action runs, policy decisions, delegations, and agent tool calls append to a hash-chained audit log (`canonicalJson` + SHA-256 over each event plus the previous hash) that is verifiable and tamper-evident via `GET /audit/verify`.

What is **not** yet real: cryptographically signed identity/JWTs, OS-level tool sandboxing, classification propagation/redaction, and database Row-Level Security. Local `User`/`WorkspaceMembership` records are still identity scaffolding, not authenticated principals; delegation bearers are unsigned local tokens.

## Rule Status

1. Every request must resolve tenant and workspace before returning data. — **partial** (workspace scoping; no authenticated tenant/identity yet).
2. No endpoint may return records outside the caller's workspace. — **enforced at the application layer** (not yet DB Row-Level Security).
3. Every action must pass policy before mutation. — **enforced** (deny-by-default in governed workspaces).
4. Every mutation must create an audit event. — **implemented** for object writes, action runs, policy decisions, delegations, agent tool calls, PR artifacts, and review packets.
5. Agent tools must be least-privilege by default. — **enforced** via scoped delegations, per-delegation tool allowlists, GoalContract action constraints, and absent merge capability.
6. Derived records, summaries, and embeddings must inherit source permissions. — **not yet** (classification propagation is future work).

## Personal Atlas v0 Boundary

Personal Atlas is **local in-memory personal state** for a single developer workflow demo. It is **not** real authentication or privacy protection.

- No auth; local users, memberships, and roles are records only. There is no authenticated caller identity.
- Route scoping (`/workspaces/:workspace_id/...`, `/personal/...`) organizes data paths; it does **not** provide identity security or database-enforced multi-tenant isolation.
- Personal workspace data lives in the API process memory by default and **resets on API restart** unless `ATLAS_DATA_FILE` is set to enable file-backed persistence.
- Personal overview includes an explicit `security_boundary` notice in API responses and the web dashboard.
- Do **not** claim enterprise tenancy, signed-token identity, OS sandboxing, or production-grade access control for this slice.

Completing a personal task creates an ActionRun and a hash-chained audit event. The audit log is verifiable and tamper-evident within a process/snapshot, but it does **not** yet provide external retention, write-once storage, or compliance guarantees.

## Non-Goals For Current Slice

- No end-user auth or signed-token (JWT) identity.
- No identity-backed (authenticated) users or memberships.
- No database-enforced tenant isolation (Row-Level Security).
- No OS-level tool sandboxing.
- No classification propagation/redaction for derived records.

## In Place For Current Slice

- Enforced role-based policy on the action path (deny-by-default in governed workspaces).
- Least-privilege agent gateway with scoped, expiring delegations, tool allowlists, optional GoalContracts, and open-PR-not-merge GitHub capability.
- Append-only, hash-chained, verifiable audit log.
- Optional durable file-backed persistence (`ATLAS_DATA_FILE`).
