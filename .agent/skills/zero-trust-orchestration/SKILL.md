---
name: zero-trust-orchestration
description: Design, review, or harden MoO-style agent orchestration systems with OAuth2 scopes, short-lived JWT delegation, PostgreSQL RLS, sandboxed Tool Router execution, audit logs, classification propagation, human approval gates, low-risk fast paths, and future Lean/ZK hooks. Use for AI agent control planes, tool-call authorization, enterprise zero-trust runtime design, or Atlas/MoO security architecture.
---

# Zero-Trust Orchestration

Use this skill when designing or reviewing the runtime authority model for autonomous agents and tool execution.

## Launch Security Baseline

Default to the pragmatic production baseline unless the user explicitly asks otherwise:

- OAuth 2.0 scopes for coarse operation authority.
- Short-lived JWT delegation tokens for active agent sessions.
- PostgreSQL Row-Level Security for tenant and workspace isolation.
- Tool Router mediation for every tool call.
- Sandboxed execution profiles for filesystem, network, shell, browser, database, and repository tools.
- Hash-chained audit events for security-relevant decisions.
- Human approval gates for irreversible, external, financial, production, or broad data-exposure actions.

Treat Lean specs and ZK proofs as future-compatible hooks, not launch blockers, unless the user makes them part of the current requirement.

## Boundary Rules

Maintain these boundaries in every architecture:

- The orchestration runtime proposes actions; it does not mint its own authority.
- The Identity and Policy planes issue and validate delegation tokens; agents cannot self-extend scopes.
- The Tool Router is the only execution boundary for tools.
- The database is the final tenant/workspace isolation boundary through RLS.
- Audit append is a platform service operation, not an agent-side direct write.
- Sandbox profiles constrain physical access even when semantic policy allows an action.

## Tool Call Verification Order

When tracing a `ToolCall`, use this exact order:

1. API Gateway authenticates the caller and extracts the delegation JWT.
2. Identity Service verifies signature, issuer, audience, expiry, not-before, tenant, workspace, session, and token id.
3. Goal Contract Engine checks the requested operation against allowed actions, blocked actions, budget, risk class, and reversibility.
4. Policy Engine evaluates scope, RBAC, ABAC, relationship context, resource ownership, classification, and approval state.
5. Tool Router validates tool name, input schema, output schema, sandbox profile, and resource handles.
6. Database transaction sets tenant/workspace session variables before any query.
7. PostgreSQL RLS filters or rejects non-matching rows.
8. Sandbox executes the tool with least privilege.
9. Output classifier computes derived classification and redaction state.
10. Audit Service appends the decision, execution result, hashes, latency, token spend, and policy evidence.

## Required Output Structures

For architecture documents, define:

- JWT claims and scope arrays.
- Scope-to-tool mapping.
- Sandbox profile matrix.
- Approval gate matrix.
- RLS table policies.
- Classification propagation rules.
- Audit event schema.
- Fast-path criteria and denial criteria.

## Review Checks

Flag any design where:

- An agent can approve its own privilege expansion.
- A tool bypasses the Tool Router.
- A model receives data that was not authorized by scope and RLS.
- A sandbox profile permits broader network or filesystem access than the token scope requires.
- Generated artifacts lose the classification of their source records.
- Human approvals are required for routine reversible operations that can be safely handled by policy.
