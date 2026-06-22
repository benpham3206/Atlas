# Atlas Task Tracker

Current objective: complete the Atlas tasks from `ChatGPT Lean Access.md` until implementation behavior matches the requested Atlas requirements.

## Completion Rules

- Only mark a task complete after code, docs, and tests prove it.
- Every implementation task must include or update tests in the same change.
- Candidate/generated records must not become authoritative without explicit promotion.
- A feature is useful only if it improves next-action validity, evidence quality, permission safety, or state accuracy.
- Keep scope boundaries explicit; do not add attractive but unverified product surface.
- For each phase, complete tasks in order unless a dependency forces a different sequence.

## Active Workflow Task

| ID | Status | Branch | Spec | State | Log |
|----|--------|--------|------|-------|-----|
| TASK-2026-06-22-personal-atlas-composer-25 | REVIEW | not created yet | `100X/tasks/TASK-2026-06-22-personal-atlas-composer-25.md` | `100X/state/TASK-2026-06-22-personal-atlas-composer-25.md` | `100X/logs/TASK-2026-06-22-personal-atlas-composer-25.md` |
| TASK-2026-06-15-100x-separation | DONE | cursor/separate-100x-workflow-8207 | `100X/tasks/TASK-2026-06-15-100x-separation.md` | `100X/state/TASK-2026-06-15-100x-separation.md` | `100X/logs/TASK-2026-06-15-100x-separation.md` |
| TASK-2026-06-15-api-version-endpoint | PLAN | not created yet | `100X/tasks/TASK-2026-06-15-api-version-endpoint.md` | `100X/state/TASK-2026-06-15-api-version-endpoint.md` | `100X/logs/TASK-2026-06-15-api-version-endpoint.md` |
| TASK-2026-06-15-100x-local-codex-hooks | REVIEW | local-main | `100X/tasks/TASK-2026-06-15-100x-local-codex-hooks.md` | `100X/state/TASK-2026-06-15-100x-local-codex-hooks.md` | `100X/logs/TASK-2026-06-15-100x-local-codex-hooks.md` |

## Upcoming Work Map

| Phase | Next Atomic Task | Required Verification | Likely Challenges |
|-------|------------------|-----------------------|-------------------|
| Phase 2: Capability Graph Records | Complete | `npm test`, `npm run validate:records` | Keep future schema additions registry-based |
| Phase 3: Actions | A3.1 implement `ActionType` storage/API | API tests for create/list/fetch and target validation | Actions must stay declarative before policy/audit are complete |
| Phase 4: Governance | G4.1 add local `User` record | API tests for create/list/fetch and role fixtures | No real auth yet; prevent pretending route scoping is identity security |
| Phase 5: Audit And Trust | T5.1 add append-only `AuditEvent` | Unit/API tests that events cannot be mutated in place | In-memory storage can prove behavior, not durability |
| Phase 6: Human UI | U6.1 add web API client module | Web unit tests for URL building and JSON error handling | Current frontend is dependency-free and may strain under richer state |
| Phase 7: Agent Layer | AG7.1 add `AgentIdentity` | API tests for scoped agent identity records | Agents must default to least privilege and avoid tool overexposure |
| Phase 8: Domain Pack And Next Action | D8.1 seed game-development domain | Seed validation tests and fixture count checks | Content must drive concrete AAA next actions, not generic taxonomy |
| Phase 9: Ingestion, Search, Graph, Workflow | I9.1 add `DataSource` and `IngestionJob` schemas | Fixture validation tests with credentials excluded | Ingested data must remain candidate until reviewed |
| Phase 10: Enterprise And Formal Layers | E10.1 add `Tenant` and `Organization` | Tenant isolation tests and workspace association tests | Enterprise claims must not exceed implemented isolation/proof mechanisms |
| MVP Release Gates | R1 add benchmark fixture count check | Test requiring at least 20 benchmark prompts | Benchmarks must test behavior, not hardcoded prose |

## Phase 0: Foundation

### Phase Challenges

- Closed for now; revisit only if CI, lint, local start scripts, or fixture loading drift.
- CI status cannot be proven locally until the project is pushed to a GitHub repository with Actions enabled.

### Completed

- [x] F0.1 Create initial monorepo skeleton.
  - Tests: `npm test`.
  - Evidence: API/web/core packages exist and prior tests passed.
- [x] F0.2 Add minimal API server and healthcheck.
  - Tests: API health route test and live healthcheck.
- [x] F0.3 Add minimal frontend placeholder and healthcheck.
  - Tests: web render test and web health route test.
- [x] F0.4 Add shared `ontology-core` package.
  - Tests: core package export tests.
- [x] F0.5 Add migrations directory and README.
  - Tests: file inspection.
- [x] F0.6 Add local README instructions.
  - Tests: local start and healthcheck verification.
- [x] F0.7 Initialize rigorous context log.
  - Tests: `CONTEXT_LOG.md` and `.kimi/context_log.tail` readback.

### Next Atomic Tasks

- [x] F0.8 Add CI workflow for tests.
  - Implement: `.github/workflows/test.yml` running Node setup and `npm test`.
  - Tests: local validation of workflow YAML shape; `npm test`.
  - Challenges: repo is not currently a git repo locally; CI cannot be proven green until pushed to GitHub.
- [x] F0.9 Add lint/format baseline without external dependencies.
  - Implement: minimal syntax/style checks using Node scripts or documented no-op decision.
  - Tests: `npm run lint`.
  - Challenges: adding ESLint/Prettier may require network install; avoid dependency churn unless approved.
- [x] F0.10 Add stable test fixtures directory.
  - Implement: reusable JSON examples for workspace, object type, object instance, link type, links.
  - Tests: fixture loader test validates all fixture JSON parses.
  - Challenges: fixtures must not become authoritative domain records prematurely.

## Phase 1: Ontology Nouns

### Phase Challenges

- Closed for now; revisit when persistence replaces in-memory storage.
- Migration verification is static because no local Postgres runtime is configured.
- Workspace scoping is route-based only until governance/auth exists.

### Completed

- [x] O1.1 Implement `Workspace`.
  - Tests: API create/list/fetch tests.
- [x] O1.2 Implement `ObjectType`.
  - Tests: API create/list/fetch tests scoped by workspace.
- [x] O1.3 Implement `ObjectInstance`.
  - Tests: valid object creation and list/fetch tests.
- [x] O1.4 Add object schema validation.
  - Tests: valid properties, missing required, wrong type, invalid enum.
- [x] O1.5 Enforce route-level workspace scoping.
  - Tests: cross-workspace object type and object read attempts return not found.
- [x] O1.6 Add migrations for workspace/object tables.
  - Tests: migration file inspection; future DB migration test still needed.

### Next Atomic Tasks

- [x] O1.7 Implement `LinkType`.
  - Implement: in-memory store methods, API routes, migration SQL.
  - Tests: create/list/fetch `LinkType` in a workspace.
  - Challenges: must validate from/to object types exist in the same workspace.
- [x] O1.8 Implement `LinkInstance`.
  - Implement: in-memory store methods, API routes, migration SQL.
  - Tests: create/list/fetch link instance between two objects.
  - Challenges: must validate endpoint objects exist and match the `LinkType` endpoint object types.
- [x] O1.9 Reject invalid links.
  - Implement: invalid workspace, missing endpoint, wrong endpoint type, self-link handling.
  - Tests: each invalid case returns a precise 400 or 404 error.
  - Challenges: error codes must distinguish not found from type mismatch without leaking cross-workspace data.
- [x] O1.10 Add link traversal endpoint.
  - Implement: `GET /workspaces/:id/objects/:object_id/links`.
  - Tests: returns inbound/outbound links scoped to workspace.
  - Challenges: avoid graph traversal complexity beyond one-hop links for now.
- [x] O1.11 Implement `ObjectSet`.
  - Implement: simple dynamic filters by object type and property equality.
  - Tests: object set returns matching objects only.
  - Challenges: avoid building a full query language too early.
- [x] O1.12 Add database migration verification.
  - Implement: lightweight SQL smoke validation or documented Postgres test harness.
  - Tests: migration syntax check if a local Postgres-compatible tool exists.
  - Challenges: no DB runtime is currently configured.

## Phase 2: Capability Graph Records

### Phase Challenges

- Keep schemas small enough to validate and use; avoid building a general knowledge graph too early.
- Lifecycle, review state, provenance, and permissions must be present before records can drive recommendations.
- Every accepted claim needs evidence or an explicit exception; unsupported claims must remain candidate/draft.
- Validation should remain dependency-free unless a real schema tooling need outweighs network/install cost.

### Next Atomic Tasks

- [x] C2.1 Define `BaseRecord` schema.
  - Tests: valid/invalid base records; lifecycle/review authority gates; timestamp/source reference hygiene.
  - Challenges: must include lifecycle/review fields without overfitting current examples.
  - Evidence: `npm run test:core`.
- [x] C2.A Add record validation engine and registry.
  - Tests: registry exports all Phase 2 record specs and rejects unknown record types.
  - Challenges: keep specs declarative and avoid one-off validators except for real invariants.
- [x] C2.B Add all Phase 2 record type specs.
  - Tests: table-driven valid/invalid fixtures cover Domain, Node, Edge, Statement, Source, Evidence, Context, Skill, Task, Assessment, Project, Artifact, Decision, Risk, CarbonCopy, Permission, Agent, Action, Overlay, and Version.
  - Challenges: broad coverage must not become vague; each spec needs at least one useful required field beyond BaseRecord.
- [x] C2.C Add AAA-wedge valid and invalid fixtures.
  - Tests: all valid fixtures pass; invalid fixtures fail for the intended reasons.
  - Challenges: examples must support the AAA wedge, not abstract toy data.
- [x] C2.D Add record validation command.
  - Tests: command passes valid fixtures and fails invalid fixtures.
  - Challenges: avoid depending on external JSON schema tooling unless approved.
- [x] C2.E Add authority-boundary regression tests.
  - Tests: candidate records cannot drive action; operational records require approval/source; statements need evidence or exception; tasks need measurable acceptance criteria; private overlays cannot be public.
  - Challenges: these gates must stay executable because they are the anti-slop boundary.

## Phase 3: Actions

### Phase Challenges

- Actions must be modelled as typed operational changes, not arbitrary code execution.
- Input validation must reuse the same conservative schema subset as ontology properties where possible.
- Until governance and audit exist, action execution must clearly mark its trust limitations.
- Mutations need before/after metadata early so audit integration does not require a rewrite.

### Next Atomic Tasks

- [ ] A3.1 Implement `ActionType` storage and API.
  - Tests: create/list/fetch action type.
  - Challenges: action type must reference valid workspace and target object type.
- [ ] A3.2 Validate `ActionType.input_schema_json`.
  - Tests: reject invalid action schemas.
  - Challenges: reuse JSON schema subset without blocking future complexity.
- [ ] A3.3 Implement `ActionRun` storage and API.
  - Tests: create action run record with actor, target, input, status.
  - Challenges: no real auth yet, so actor is supplied input for now.
- [ ] A3.4 Implement simple property update effect.
  - Tests: `MarkBugResolved` changes `Bug.status` from `open` to `resolved`.
  - Challenges: mutation must stay transactional once DB exists.
- [ ] A3.5 Reject invalid action input.
  - Tests: wrong type, missing required, invalid enum.
  - Challenges: error details must be actionable.
- [ ] A3.6 Reject action target type mismatch.
  - Tests: action type for `Bug` cannot run on `Build`.
  - Challenges: preserve workspace scoping.
- [ ] A3.7 Add rollback metadata placeholder.
  - Tests: action run includes before/after enough for later audit/rollback.
  - Challenges: avoid implementing full rollback before audit exists.

## Phase 4: Governance

### Phase Challenges

- Local users and memberships are not authentication; docs and errors must not imply real login security.
- Policy rules need to stay narrow enough to reason about and test with a matrix.
- Cross-workspace data leakage must be tested before adding richer query, search, or agent endpoints.
- Permission checks should become auditable records rather than invisible control flow.

### Next Atomic Tasks

- [ ] G4.1 Add `User`.
  - Tests: create/list/fetch user.
  - Challenges: no auth provider yet; identity fields are local.
- [ ] G4.2 Add `WorkspaceMembership`.
  - Tests: assign user to workspace role.
  - Challenges: prevent cross-workspace membership leakage.
- [ ] G4.3 Add roles: owner, admin, editor, viewer.
  - Tests: role enum validation.
  - Challenges: role semantics must stay small and explicit.
- [ ] G4.4 Add `Policy`.
  - Tests: create policy with action/resource rules.
  - Challenges: avoid premature full ABAC/ReBAC engine.
- [ ] G4.5 Add `PermissionCheck`.
  - Tests: allowed and denied checks are recorded.
  - Challenges: checks must be auditable later.
- [ ] G4.6 Enforce policy before action execution.
  - Tests: viewer denied, editor allowed for `MarkBugResolved`.
  - Challenges: action engine must call policy engine before mutation.
- [ ] G4.7 Enforce workspace scope on every data endpoint.
  - Tests: cross-workspace reads and writes fail.
  - Challenges: future query/search endpoints must inherit the same guardrail.
- [ ] G4.8 Add permission regression suite.
  - Tests: matrix of role/action/resource outcomes.
  - Challenges: avoid brittle tests while roles evolve.

## Phase 5: Audit And Trust

### Phase Challenges

- Audit events must be append-only at the API/storage boundary even before durable persistence exists.
- Canonical JSON will be required before hash chaining can be trusted.
- Snapshots may contain sensitive fields; permission inheritance must be considered before public exports.
- Do not make formal trust claims until verification code proves them.

### Next Atomic Tasks

- [ ] T5.1 Add `AuditEvent` schema and storage.
  - Tests: create audit event with actor, action, resource, workspace.
  - Challenges: audit events must be append-only.
- [ ] T5.2 Emit audit event for object create/update.
  - Tests: object mutation writes audit event.
  - Challenges: no update endpoint exists yet; add narrowly.
- [ ] T5.3 Emit audit event for action run.
  - Tests: successful action writes audit event.
  - Challenges: denied actions should be captured via permission checks too.
- [ ] T5.4 Add before/after snapshots.
  - Tests: mutation audit includes correct before and after JSON.
  - Challenges: snapshots may contain sensitive data later.
- [ ] T5.5 Add hash chaining.
  - Tests: consecutive events include previous hash.
  - Challenges: stable canonical JSON is required for deterministic hashes.
- [ ] T5.6 Add tamper detection.
  - Tests: edited audit event breaks verification.
  - Challenges: in-memory storage cannot prove immutability, only behavior.
- [ ] T5.7 Add audit query endpoint.
  - Tests: list events by workspace and resource.
  - Challenges: queries must respect permissions later.
- [ ] T5.8 Add audit UI view.
  - Tests: web render test shows audit event list.
  - Challenges: UI must not overstate trust before persistence exists.

## Phase 6: Human UI

### Phase Challenges

- Keep the UI operational and compact; avoid a marketing shell or decorative dashboard.
- Dynamic ontology properties make generic tables/forms tricky without introducing a frontend framework.
- Visual graph exploration likely requires dependencies; defer until the backend graph contract is stable.
- UI must expose lifecycle/trust state clearly so candidate records are not mistaken for authoritative data.

### Next Atomic Tasks

- [ ] U6.1 Add API client module in web app.
  - Tests: client builds URLs and handles JSON errors.
  - Challenges: current web app is dependency-free server-rendered HTML.
- [ ] U6.2 Add workspace selector.
  - Tests: render workspace list and selected state.
  - Challenges: state handling without a frontend framework may become awkward.
- [ ] U6.3 Add ontology manager page.
  - Tests: render object types for a workspace.
  - Challenges: keep UI minimal until core model stabilizes.
- [ ] U6.4 Add object type creation form.
  - Tests: form posts valid schema and shows validation errors.
  - Challenges: JSON schema editing is error-prone.
- [ ] U6.5 Add object instance list.
  - Tests: render objects scoped to workspace.
  - Challenges: properties are dynamic.
- [ ] U6.6 Add object detail page.
  - Tests: render object, properties, and links.
  - Challenges: needs link traversal from Phase 1.
- [ ] U6.7 Add graph explorer.
  - Tests: render nodes/edges from link data.
  - Challenges: visual graph library likely needs dependencies.
- [ ] U6.8 Add action runner.
  - Tests: run action and show result.
  - Challenges: depends on Phase 3/4.
- [ ] U6.9 Add audit viewer.
  - Tests: render audit timeline.
  - Challenges: depends on Phase 5.
- [ ] U6.10 Add next-action dashboard.
  - Tests: render recommended action and reason.
  - Challenges: depends on Phase 8.

## Phase 7: Agent Layer

### Phase Challenges

- Agents must operate through the same policy and audit path as human-triggered actions.
- Tool manifests must not advertise incomplete or unsafe capabilities.
- Prompt/tool injection boundaries are not solved by schema validation alone.
- Search and traversal tools must inherit workspace, lifecycle, and permission constraints.

### Next Atomic Tasks

- [ ] AG7.1 Add `AgentIdentity`.
  - Tests: create/list/fetch agent identity.
  - Challenges: distinguish service agents from users.
- [ ] AG7.2 Add scoped delegation record.
  - Tests: delegation limits workspace, tools, and expiry.
  - Challenges: least-privilege defaults must be hard to bypass.
- [ ] AG7.3 Add tool registry.
  - Tests: registered tools expose input/output schemas.
  - Challenges: tool contracts must remain stable.
- [ ] AG7.4 Add `query_object` tool endpoint.
  - Tests: authorized agent can fetch object; unauthorized cannot.
  - Challenges: depends on policy engine.
- [ ] AG7.5 Add `search_records` tool endpoint.
  - Tests: search respects workspace and permission scope.
  - Challenges: depends on search phase for real search.
- [ ] AG7.6 Add `traverse_graph` tool endpoint.
  - Tests: returns scoped one-hop graph.
  - Challenges: graph traversal must not leak private nodes.
- [ ] AG7.7 Add `get_available_actions`.
  - Tests: only permitted actions returned.
  - Challenges: combines ontology, actions, and policy.
- [ ] AG7.8 Add `run_action`.
  - Tests: agent action runs through policy and audit.
  - Challenges: prompt/tool injection isolation is not yet implemented.
- [ ] AG7.9 Add artifact/evidence tools.
  - Tests: attach evidence and submit artifact creates records.
  - Challenges: depends on Capability Graph schemas.
- [ ] AG7.10 Add MCP-style manifest.
  - Tests: manifest lists callable tools and schemas.
  - Challenges: avoid exposing incomplete tools as production-ready.

## Phase 8: Domain Pack And Next Action

### Phase Challenges

- The AAA domain pack must be concrete enough to force sequencing, dependencies, blockers, and acceptance criteria.
- Next-action selection must ignore candidate, unreviewed, blocked, complete, and unauthorized tasks.
- Explanations must be derived from graph records rather than generated unsupported prose.
- Benchmark fixtures need enough variation to catch hardcoded recommendations.

### Next Atomic Tasks

- [ ] D8.1 Seed game-development domain.
  - Tests: seed validates and creates domain records.
  - Challenges: content must be useful, not generic.
- [ ] D8.2 Seed AAA vertical slice project.
  - Tests: project has milestones, tasks, blockers, acceptance criteria.
  - Challenges: scope must stay finite.
- [ ] D8.3 Seed core object types: `GameProject`, `Milestone`, `Task`, `Build`, `Bug`.
  - Tests: object types validate and seed successfully.
  - Challenges: schemas need enough fields for next-action logic.
- [ ] D8.4 Seed links: task blocks task, bug affects build, milestone contains task.
  - Tests: all seed links validate endpoint types.
  - Challenges: depends on LinkType/LinkInstance.
- [ ] D8.5 Seed actions: mark task done, file bug, mark bug resolved.
  - Tests: seeded actions run in fixture workspace.
  - Challenges: depends on Actions/Governance/Audit.
- [ ] D8.6 Implement deterministic next-action selector.
  - Tests: returns first unblocked operational task.
  - Challenges: must ignore blocked, complete, unauthorized, candidate, and unreviewed tasks.
- [ ] D8.7 Add next-action explanation.
  - Tests: response includes dependency reason and acceptance criteria.
  - Challenges: explanation must be grounded in graph records.
- [ ] D8.8 Add benchmark prompt fixture.
  - Tests: AAA sci-fi action game prompt maps to movement prototype task.
  - Challenges: benchmark should test system behavior, not hardcoded prose.
- [ ] D8.9 Add release-gate evaluator.
  - Tests: computes valid next-action rate and acceptance-criteria coverage.
  - Challenges: meaningful metrics require enough benchmark data.

## Phase 9: Ingestion, Search, Graph, Workflow

### Phase Challenges

- Raw imported content is untrusted input; parser output must default to candidate lifecycle.
- Credentials and private data must not appear in fixtures, logs, or public search results.
- Graph traversal can become expensive and leaky without explicit depth, type, and permission constraints.
- Workflow runtime should begin as a narrow skeleton before retries, approvals, and rollback policies expand.

### Next Atomic Tasks

- [ ] I9.1 Add `DataSource` and `IngestionJob` schemas.
  - Tests: fixtures validate.
  - Challenges: credentials must not be stored in plain fixtures.
- [ ] I9.2 Add raw record vault.
  - Tests: imported raw record preserves source metadata.
  - Challenges: untrusted source content must not become trusted instruction.
- [ ] I9.3 Add parser interface.
  - Tests: simple text source produces candidate records.
  - Challenges: parser output must be candidate lifecycle by default.
- [ ] I9.4 Add review queue.
  - Tests: candidate can be accepted/rejected with audit trail.
  - Challenges: promotion must be explicit and expensive.
- [ ] I9.5 Add keyword search.
  - Tests: query returns scoped records only.
  - Challenges: search over dynamic JSON may need indexing later.
- [ ] I9.6 Add semantic/hybrid search placeholder.
  - Tests: interface exists with deterministic fallback.
  - Challenges: real embeddings require dependencies/services.
- [ ] I9.7 Add graph traversal service.
  - Tests: n-hop traversal respects link types and workspace scope.
  - Challenges: cycles and permissions complicate traversal.
- [ ] I9.8 Add dependency closure.
  - Tests: blocked task closure returns blockers.
  - Challenges: avoid expensive traversal without DB indexes.
- [ ] I9.9 Add workflow definition schema.
  - Tests: workflow fixtures validate nodes/edges/guards.
  - Challenges: workflow DSL can become too large.
- [ ] I9.10 Add workflow runtime skeleton.
  - Tests: runs a two-step workflow with one action.
  - Challenges: rollback, retries, approvals, and audit need careful boundaries.
- [ ] I9.11 Add approval step.
  - Tests: workflow pauses until approval.
  - Challenges: depends on users/policy.

## Phase 10: Enterprise And Formal Layers

### Phase Challenges

- Tenant isolation has to become a hard invariant before enterprise integrations.
- OIDC/SAML/SCIM work requires provider-specific credentials and should start as adapter contracts.
- Formal proof, ZK, and transparency records must be metadata until real verifiers exist.
- Marketplace work remains blocked until assessment quality, permissions, and trust gates are reliable.

### Next Atomic Tasks

- [ ] E10.1 Add `Tenant` and `Organization`.
  - Tests: tenant/org CRUD and workspace association.
  - Challenges: tenant isolation must become a hard invariant.
- [ ] E10.2 Add service accounts.
  - Tests: service account can be scoped to workspace/tool.
  - Challenges: auth is still local until provider integration.
- [ ] E10.3 Add OIDC planning doc and adapter interface.
  - Tests: adapter contract unit tests with mock claims.
  - Challenges: real provider setup requires credentials.
- [ ] E10.4 Add SAML/SCIM planning docs.
  - Tests: schema fixtures for provisioned users/groups.
  - Challenges: full implementation is large and provider-specific.
- [ ] E10.5 Add observability hooks.
  - Tests: request id, timing, and error logs produced.
  - Challenges: avoid logging sensitive data.
- [ ] E10.6 Add backup/export command.
  - Tests: export/import round trip.
  - Challenges: must preserve audit hashes and permissions.
- [ ] E10.7 Add transparency checkpoint schema.
  - Tests: checkpoint hash validates over audit batch.
  - Challenges: canonicalization must be stable.
- [ ] E10.8 Add commitment and ZK proof records.
  - Tests: fixtures validate and do not expose private payloads.
  - Challenges: do not implement cryptographic claims without verifier.
- [ ] E10.9 Add verifier registry.
  - Tests: verifier version compatibility checks.
  - Challenges: verifier deprecation must be modeled.
- [ ] E10.10 Add Lean specification registry.
  - Tests: register formal rule metadata and link to policy/action invariant.
  - Challenges: actual Lean checking requires toolchain and stable semantics.
- [ ] E10.11 Add conformance claims.
  - Tests: claim must reference spec, verifier, evidence, and audit event.
  - Challenges: avoid false confidence from unverified claims.
- [ ] E10.12 Add marketplace only after assessment quality gates pass.
  - Tests: marketplace task remains blocked until skills/assessments verified.
  - Challenges: marketplace before trust layer creates slop and liability.

## MVP Release Gates

- [ ] R1 Benchmark set has at least 20 prompts.
  - Tests: benchmark fixture count check.
  - Challenges: prompts must cover varied failure modes.
- [ ] R2 80 percent of benchmark goals produce a valid next action.
  - Tests: evaluator computes pass rate.
  - Challenges: validity needs grounded acceptance criteria.
- [ ] R3 90 percent of tasks have measurable acceptance criteria.
  - Tests: task schema/evaluator rejects vague criteria.
  - Challenges: measuring "measurable" requires strict fields.
- [ ] R4 90 percent of task recommendations include dependencies.
  - Tests: recommendation output includes dependency chain or explicit none.
  - Challenges: avoid fabricated dependency explanations.
- [ ] R5 90 percent of accepted factual claims have evidence or source links.
  - Tests: accepted statement validator.
  - Challenges: statements without evidence must stay candidate/draft.
- [ ] R6 0 private records leak into public outputs.
  - Tests: public export/search fixtures with private records present.
  - Challenges: derived records and summaries must inherit permissions.
- [ ] R7 User can navigate from vague goal to concrete task without raw JSON.
  - Tests: UI smoke test over seeded AAA wedge.
  - Challenges: requires enough UI and domain data to be meaningful.

## Cross-Cutting Challenges

- Persistence: current storage is in-memory; database runtime wiring must happen before serious use.
- Scope: Atlas can easily become a generic ontology exercise; every task must improve operational next-action behavior.
- Permissions: route-level workspace scoping exists, but identity-based authorization does not.
- Audit: mutation features before audit are temporary; once audit exists, every mutation must emit events.
- Lifecycle: candidate/generated data must remain visible but non-authoritative until promoted.
- Frontend: current web app is intentionally minimal and dependency-free; richer UI likely requires a framework decision.
- Dependencies: network access is restricted, so adding packages may require approval and should be justified.

## Current Turn Checklist

- [x] Read current `TASKS.md`.
- [x] Log Turn 5 intent before edits.
- [x] Add BaseRecord constants, schema, and validator.
- [x] Add TypeScript declarations for BaseRecord exports.
- [x] Add valid/invalid BaseRecord tests.
- [x] Update README and ontology spec.
- [x] Mark C2.1 complete and move next Phase 2 task to C2.2.
- [x] Run lint and full tests.
- [x] Append Turn 5 outcome to `CONTEXT_LOG.md`.
- [x] Agree on collapsed Phase 2 registry method.
- [x] Log Turn 6 intent before edits.
- [x] Replace C2.2-C2.23 with C2.A-C2.E.
- [x] Add failing registry/fixture/command tests.
- [x] Implement registry validation and fixtures.
- [x] Run full verification.
- [x] Append Turn 6 outcome to `CONTEXT_LOG.md`.
