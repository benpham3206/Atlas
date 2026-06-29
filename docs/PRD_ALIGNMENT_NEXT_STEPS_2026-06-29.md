# Atlas + MoO PRD Alignment Next Steps

Status: planning artifact only; no implementation code
Date: 2026-06-29
Sources:

- `/Users/benjaminpham/Downloads/UNIFIED_ATLAS_MOO_MASTER_PRD copy.md`
- `/Users/benjaminpham/Downloads/Mixture of Orchestrators v2.md`
- `/Users/benjaminpham/Downloads/Atlas PRD Final.md`
- Current repo on `feat/personal-atlas-moo-file-tree-ui`

## Executive Read

Atlas is no longer at the skeleton stage. The repo has a usable v0 control spine: ontology records,
actions, policy-on-action, hash-chained audit, scoped agent delegations, GoalContracts, review
packets, an open-PR-not-merge GitHub tool, a read-only Slack tool, operational bootstrap/smoke
scripts, and a zero-dependency MCP stdio adapter.

The gap to the three-PRD vision is not "build an MCP server from scratch." The gap is to make MCP
the default always-on local operating surface while preserving the zero-trust boundary: MCP must stay
a transport adapter over the Tool Router, and all authority must continue to come from platform-issued
delegation, policy, GoalContract constraints, and audit.

## The Algorithm Applied

Questioned requirement: "create the MCP server and have it on by default; never turn off."

- Requirement owner: Ben.
- Real need: make Atlas agent-usable by default from local agent hosts without hand-copying a
  connection snippet each run.
- What breaks if absent: the Tool Router is implemented but not naturally reachable as the default
  control surface; operators fall back to direct scripts, curl, or undocumented manual config.
- What should be deleted: do not create a second MCP authority service, a separate MCP data store,
  an MCP-specific permission model, an MCP flag that defaults off, or tool bypasses for convenience.
- What survives: a default-on MCP runtime lifecycle around the existing `scripts/atlas-mcp-stdio.js`
  adapter, plus tests proving it fails closed when delegation/API state is invalid.

## Current State vs PRD Vision

| Area | Current repo state | PRD vision | Gap |
| --- | --- | --- | --- |
| Atlas data plane | In-memory/file-backed workspace-scoped ontology records, links, object sets, actions, artifacts, review packets, audit events | Tenant/workspace-scoped semantic data substrate with durable DB, classifications, provenance, graph/search, public/private overlays | Persistence and isolation are not Postgres/RLS; classification propagation and search/graph upgrade are missing |
| MoO control plane | GoalContracts constrain gateway tools and next action; review packets summarize evidence | MetaOrchestrationRuns, OrchestratorRuns, AgentSessions, StrategySelection, VerificationRuns, approval gates, cost/latency budgets | Runtime records and strategy selection are mostly not implemented |
| Trust plane | Unsigned local delegation bearer, app-layer workspace scoping, scoped tools, absent merge capability, hash-chain audit | OAuth2, short-lived signed JWT, tenant/workspace RLS, sandboxed tools, append-only audit service | Signed identity/JWT, RLS, sandbox profiles, and external audit retention are missing |
| Tool plane | `GET /agent/manifest`, `POST /agent/tools/:tool`, GitHub open PR, Slack read, MCP stdio adapter | Tool Router validates token, scope, resource allowlist, schemas, sandbox, classification, output schema, audit | Tool definitions are code-defined; no persisted ToolDefinition/ToolCallResult model or output classification |
| MCP | `scripts/atlas-mcp-stdio.js` implements `initialize`, `tools/list`, `tools/call`; requires `ATLAS_API_URL` and `ATLAS_DELEGATION_ID` | Agent-callable tool surface through governed tool server | Exists, but not default-on, not session-persistent, and not smoke-tested as a first-class always-on runtime |
| UI | File-tree dashboard with overview, objects, graph, actions, review inbox, audit; GoalContracts/delegation panes are stubs | Project cockpit, graph explorer, Goal Contract editor, Strategy Inspector, Approval Inbox, Run Trace Viewer | Runtime/control-plane surfaces are incomplete |
| Domain packs | Personal Atlas and operational dogfood scaffold; AAA/public recovery seed direction exists in prior task memory | Mechanical, AAA development, aerospace, Public Atlas, organization/workspace packs | Need one small domain pack that drives real next actions; avoid broad taxonomy expansion |
| Future proof | Migrations and docs mention formal/proof hooks | Lean/ZK fields as dormant launch-compatible upgrade hooks | Correctly deferred; do not implement before launch trust spine |

## Default-On MCP Architecture

### Decision

MCP is the default local transport for agent hosts. It is not a new authority plane.

The adapter remains always available when the local Atlas runtime is running. It may return a
structured fail-closed error when the API, delegation, policy, or GoalContract is unavailable, but it
must not silently disable itself and must not bypass the Tool Router to stay "on."

### Lifecycle

```text
Atlas runtime starts
  -> API starts on configured host/port
  -> operational workspace exists or is bootstrapped by platform-side runtime code
  -> platform-side runtime mints scoped delegation
  -> MCP stdio adapter is registered for local agent hosts by default
  -> tools/list proxies GET /agent/manifest
  -> tools/call proxies POST /agent/tools/:tool with bearer delegation
  -> Tool Router enforces delegation, scope, tool allowlist, GoalContract, policy, and audit
```

### Authority Rules

- MCP must not mint, extend, or broaden its own delegation.
- MCP must not import store internals.
- MCP must not expose tools absent from `GET /agent/manifest`.
- MCP must not add merge, protected-branch write, deploy, secret, permission-change, destructive
  delete, or public-export capabilities.
- MCP startup is default-on; tool execution is still deny-by-default without valid scoped authority.
- Missing API, missing delegation, expired delegation, denied tool, policy denial, or GoalContract
  denial must return a structured error payload with:
  - `component`
  - `root_cause`
  - `failure_type`
  - `message`
  - optional `details`

### Default-On Definition

"Never turn off" means:

- No `ATLAS_MCP_ENABLED=false` path in the local operational runtime.
- The default dev/personal/operational runtime path includes MCP registration instructions or
  generated host config every time.
- `tools/list` remains available whenever the API is reachable.
- `tools/call` fails closed, not open, when authority is missing.
- Startup failures are visible and structured; they are not swallowed as optional integration failures.

## Next Task Packages

### M0. Default-On MCP Runtime Contract

Objective: convert the existing MCP adapter from manually configured helper to first-class default
local operating surface.

Scope:

- Update runtime architecture docs, task tracker, and tests first.
- Implementation pass will likely touch `README.md`, `package.json`, `scripts/operational-bootstrap.js`,
  `scripts/dev-personal.js`, `scripts/atlas-mcp-stdio.js`, and MCP smoke test coverage.

Non-goals:

- No new MCP authority store.
- No MCP-side delegation minting.
- No external npm packages.
- No merge/deploy/secret/permission tools.
- No production daemon or launch agent until the local runtime contract is proven.

Acceptance criteria:

- A fresh local operator can start the default Atlas operational runtime and receive a working MCP
  host configuration without hand-assembling environment variables.
- MCP initialize and tools/list work by default against the local API.
- MCP tools/call succeeds only with a platform-issued scoped delegation.
- MCP remains visible but fails closed when the API or delegation is invalid.
- Every MCP tool call still produces Tool Router audit evidence.

### M1. Structured Error Payload Standard

Objective: make all agent/MCP/API failure paths return machine-readable failure payloads containing
component, root cause, and failure type.

Scope:

- Specify a shared error shape for API and MCP tool errors.
- Add tests before implementation for API route errors, Tool Router denials, MCP missing delegation,
  MCP API unreachable, and client/tool failures.

Acceptance criteria:

- Existing errors remain human-readable.
- New structured fields exist on every failure path reachable from MCP.
- Tests assert component/root_cause/failure_type for authorization, validation, dependency, and
  upstream-client failures.

### M2. Signed Delegation Hardening

Objective: replace local unsigned delegation bearers with short-lived signed JWT-style delegation
without changing the MCP contract.

Scope:

- Identity/delegation issuance, verification, expiry, audience, issuer, token id, workspace, scopes,
  tool allowlist, and replay/invalid-token tests.

Non-goals:

- Do not add full user login in this slice.
- Do not add orchestrator self-extension of scopes.

Acceptance criteria:

- Tool Router rejects invalid signature, wrong audience, expired token, wrong workspace, missing
  scope, and replay when replay cache exists.
- MCP continues to send only the platform-issued bearer.

### M3. Postgres + RLS Runtime Spike

Objective: prove database-enforced tenant/workspace isolation for the records already modeled.

Scope:

- One minimal runtime path for workspace, object instance, link instance, GoalContract, delegation,
  and audit events.

Non-goals:

- No broad migration of every future PRD record.
- No search/embedding/graph database upgrade.

Acceptance criteria:

- Cross-workspace reads/writes fail at the DB policy layer even if application code asks for the
  wrong rows.
- File-backed persistence remains available only as local/demo fallback.

### M4. MoO Runtime Records Before More Tools

Objective: add the minimum control-plane records required to prove the PRD trace:
GoalContract -> MetaOrchestrationRun -> OrchestratorRun -> AgentSession -> ToolCall -> AuditEvent.

Scope:

- Data model/test specs for MetaOrchestrationRun, OrchestratorRun, AgentSession, ToolCall, and
  ToolCallResult.
- Strategy selection can start rule-based; no model routing required.

Non-goals:

- No autonomous multi-agent execution until the trace records exist.
- No self-improvement loop.

Acceptance criteria:

- Every tool-executed action can be traced through the PRD chain.
- Review packet links to run trace records, not only audit ids.

### M5. One Domain Pack That Drives Next Action

Objective: seed one domain pack that proves Atlas improves next-action quality.

Recommended pack: Public Atlas recovery-tech-tree seed, because it matches the durable product north
star and can reuse existing record types without enterprise bloat.

Non-goals:

- No huge public knowledge base.
- No marketplace.
- No survival-manual generation.

Acceptance criteria:

- Seeded records are validated by fixtures.
- Candidate/generated records remain visible but non-authoritative.
- One operational task has clear evidence, blockers, done criteria, and next action.

## Test Specifications

### Current Baseline

`npm test` passes on 2026-06-29 with 152 tests.

### Required Tests For M0/M1

1. MCP initialize returns Atlas server info and tool capability metadata.
2. MCP tools/list proxies the API manifest and exposes no tool absent from the manifest.
3. MCP tools/list does not require delegation.
4. MCP tools/call requires a delegation and returns structured `authorization` failure when missing.
5. MCP tools/call returns structured `dependency` failure when the API is unreachable.
6. MCP tools/call returns structured `authorization` failure for expired or invalid delegation.
7. MCP tools/call returns structured `policy` failure for denied tools.
8. MCP tools/call records audit evidence for allowed and denied Tool Router calls.
9. Default operational bootstrap prints or writes a complete MCP host config every run.
10. Default runtime smoke proves bootstrap -> MCP initialize -> tools/list -> governed tools/call ->
    review packet -> audit verify.
11. Manifest test continues proving there is no merge tool and no merge scope.
12. Slack read-only test continues proving there is no Slack write tool.

### Required Tests For Later Hardening

1. JWT signature, issuer, audience, expiry, not-before, token id, workspace, and scope denials.
2. DB RLS cross-tenant and cross-workspace denial even under intentionally wrong application query.
3. Tool input schema and output schema validation for every manifest tool.
4. Classification propagation from source records to derived artifacts.
5. Run trace continuity from GoalContract to AuditEvent.
6. Human-only boundary tests for protected branch merge, deploy, public export, permission change,
   destructive delete, and secret/key access.

## Architectural Decision Required Before Implementation

Default-on MCP has one open architectural decision:

Should the default local runtime persist the active MCP delegation in a generated local session file,
or should it print/export environment variables only?

Recommendation: generated local session file owned by the platform runtime, not the MCP adapter.
Reason: it supports default-on operation and refresh without giving MCP the ability to mint or widen
authority. The file must contain only the current scoped bearer/session envelope, be ignored by git,
and fail closed when absent or expired.
