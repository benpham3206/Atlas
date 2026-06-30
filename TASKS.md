# Atlas Task Tracker

Current objective: **Public Atlas first** — fork Paperclip (MIT) as repo-root trunk, graft Atlas
knowledge + proof layer, ship encyclopedia MVP; then resume personal-spine hardening (PS-*) and
trust backlog (H-*). Planning source: `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md`
and `docs/bricks/2026-06-30-public-atlas-atomic-tasks.md`.

## Completion Rules

- Only mark a task complete after code, docs, and tests prove it.
- Every implementation task must include or update tests in the same change.
- Candidate/generated records must not become authoritative without explicit promotion.
- A feature is useful only if it improves next-action validity, evidence quality, permission safety, or state accuracy.
- Keep scope boundaries explicit; do not add attractive but unverified product surface.
- For each phase, complete tasks in order unless a dependency forces a different sequence.

## Upcoming Work Map

| Phase | Next Atomic Task | Required Verification | Blocked by |
|-------|------------------|-----------------------|------------|
| **PA-P0** Legacy spine guard | PA-P0.1 confirm migration-reference gates | `npm test`, `smoke:polish`, `demo:flagship` | — |
| **PA-P2M** Atlas + MoO import | **PA-P2a** Activity audit ADR | audit integration doc | PA-P2M0 done |
| **PA-P2** Knowledge + proof graft | PA-P2a Activity audit ADR | ADR merged | PA-P2M0 |
| **PA-P3** Staff + knowledge pack | PA-P3a staff manifest | fixture loads | PA-P2 |
| **PA-P4** Re-hero + public slice | PA-P4a encyclopedia hero copy | site-smoke | PA-P3 |
| **PS-*** Personal spine | PS-P1 runtime foundation | `gate:test` + object history | **PA-P1** |
| **H-*** Trust hardening | H1 structured failure payloads | path-specific tests | PA-P4 (sprint order) |

| Phase | Next Atomic Task | Required Verification | Likely Challenges |
|-------|------------------|-----------------------|-------------------|
| Phase 2: Capability Graph Records | Complete | `npm test`, `npm run validate:records` | Keep future schema additions registry-based |
| Phase 3: Actions | Complete | `npm test`, `npm run verify:migrations` | Policy and audit still need to wrap action execution in later phases |
| Phase 4: Governance | Complete | Cross-workspace + role/action/resource tests | Keep policy changes matrix-tested and deny-by-default in governed workspaces |
| Phase 5: Audit And Trust | Complete | `npm run test:web`, `npm run lint` | Keep audit UI honest: local hash-chain evidence, not external compliance retention |
| Phase 6: Human UI | Complete | `npm test`, `npm run lint` | Keep richer UI additions dependency-free unless a stable backend contract requires otherwise |
| Phase 7: Agent Layer | Complete | `npm run test:api`, `npm run smoke:operational` | Keep future tool additions least-privilege and absent unless proven useful |
| Operational MCP/API | Complete | `npm run smoke:operational`, MCP stdio smoke, `npm run operational:bootstrap` | Keep MCP transport-only; do not add orchestration machinery before dogfood proof |
| Default-On MCP Runtime | Complete | `npm run smoke:mcp`, `npm run smoke:operational`, `npm run operational:bootstrap` | MCP reads platform-written `.atlas/local-session.json`; env overrides remain for tests |
| Customer-Facing Outputs | **In progress** — `outputs/` shelf (site, app, docs, codebase, demos, proofs, internal) | `npm run lint`, `npm test -- outputs-shelf` | Keep internal runtime state under `outputs/internal/`; `STATE.md` is bootstrap-refreshed and gitignored |
| Persistence | Wire Postgres + RLS runtime | DB migration apply + isolation tests | File-backed snapshot persistence (`ATLAS_DATA_FILE`) now bridges restarts |
| Phase 8: Domain Pack And Next Action | D8.1 seed game-development domain | Seed validation tests and fixture count checks | Content must drive concrete AAA next actions, not generic taxonomy |
| Phase 9: Ingestion, Search, Graph, Workflow | I9.1 add `DataSource` and `IngestionJob` schemas | Fixture validation tests with credentials excluded | Ingested data must remain candidate until reviewed |
| Phase 10: Enterprise And Formal Layers | E10.1 add `Tenant` and `Organization` | Tenant isolation tests and workspace association tests | Enterprise claims must not exceed implemented isolation/proof mechanisms |
| MVP Release Gates | R1 add benchmark fixture count check | Test requiring at least 20 benchmark prompts | Benchmarks must test behavior, not hardcoded prose |

## v0 Agent-Usable Spine

Goal: a system any agent can actually drive and trust. Completed this turn (all verified by
`npm test` + `npm run smoke:agent` + `npm run lint`):

- Append-only, hash-chained audit log (`canonicalJson`/`auditEventHash`/`verifyAuditEventChain` in
  `ontology-core`; emitted on object writes, action runs, decisions, delegations, and tool calls).
- Policy enforcement on the action path: deny-by-default in governed workspaces, decisions recorded
  as `PermissionCheck` + audit event, denied runs do not mutate.
- Agent layer: `Agent` identities, scoped/expiring `AgentDelegation` bearers, a discoverable tool
  manifest (`GET /agent/manifest`), and a governed gateway (`POST /agent/tools/:tool`) that verifies
  delegation -> scope -> tool allowlist -> policy -> execute -> audit.
- Generalized next-action selector usable on any workspace (Personal Atlas now delegates to it).
- Durable file-backed persistence via `ATLAS_DATA_FILE` (snapshot/restore, survives restart).
- End-to-end proof: `scripts/agent-smoke.js` walks discover -> delegate -> read -> govern -> audit -> persist.

Deliberately deferred to hardening (target architecture, not yet implemented): signed JWT delegation,
Postgres + Row-Level Security, OS-level tool sandboxing, classification propagation/redaction.

## Public Atlas (Paperclip pivot) — active sprint

**Lane prefix:** `PA-*` (Public Atlas). **Deferred lanes:** `PS-*` (personal spine Postgres/policy),
`H-*` (trust hardening on legacy or fork). Complete PA tasks in order unless a dependency note says
otherwise. One PR per task; ~300 LOC target except PA-P1b fork import.

**Root-trunk layout (locked):** Paperclip at repo root (`server/`, `ui/`, `cli/`,
`packages/adapters/`); graft target `packages/atlas-ontology/`; migration reference unchanged
(`apps/api`, `packages/ontology-core`).

### PA-P0 — Legacy spine guard (mostly done)

- [x] PA-P0.1 Confirm migration-reference gates green; no new features on `apps/api`
  - Implement: run full legacy gate suite; document baseline in CONTEXT_LOG if not already tagged
  - Tests: `npm test`, `npm run lint`, `npm run smoke:polish`, `npm run demo:flagship`
  - Non-goals: no Paperclip import; no API feature work
  - Depends-on: none
  - Challenges: uncommitted polish branch should land or be explicitly excluded before PA-P1a tag
  - Evidence: 2026-06-30 — `npm test` 199 pass; lint; smoke:polish `audit_valid: true`; demo:flagship ok

### PA-P1 — Snapshot + Paperclip trunk — **start here**

- [x] PA-P1a Tag pre-paperclip snapshot
  - Implement: commit working tree; `git tag -a atlas-pre-paperclip-v0 -m "Baseline before Paperclip root trunk"`
  - Tests: `git tag -l atlas-pre-paperclip-v0`; legacy gates still green
  - Verification: `npm test && npm run lint && npm run smoke:polish && npm run demo:flagship`
  - Non-goals: no Paperclip import; no file moves
  - Depends-on: PA-P0.1
  - Challenges: tag must point at recoverable green tree
  - Evidence: tag `atlas-pre-paperclip-v0` on commit with atomic task backlog + green gates

- [x] PA-P1b Import Paperclip MIT repo to repo root
  - Implement: add `server/`, `ui/`, `cli/`, `packages/adapters/` from `https://github.com/paperclipai/paperclip`; add git remote `upstream` → Paperclip; do not literal unrelated-histories merge
  - Tests: Paperclip directory layout present; `upstream` remote configured
  - Non-goals: no ontology graft; no schema edits; no deletion of `apps/api` or `packages/ontology-core`
  - Depends-on: PA-P1a
  - Challenges: resolve root `package.json` / workspace conflicts with existing monorepo scripts
  - Evidence: branch `pa/p1b-paperclip-root-import`; upstream remote; server/ui/cli/packages imported

- [x] PA-P1c Preserve MIT license and Atlas attribution
  - Implement: preserve Paperclip `LICENSE` + NOTICE; add `ATTRIBUTION.md` delineating Paperclip base vs Atlas additions
  - Tests: LICENSE and NOTICE present at root; ATTRIBUTION.md references both projects
  - Non-goals: no license substitution
  - Depends-on: PA-P1b
  - Evidence: `PAPERCLIP_LICENSE`, `ATTRIBUTION.md`

- [x] PA-P1d Wire root install and local boot (`paperclipai onboard` + `run`)
  - Implement: root workspace/package wiring per Paperclip docs so onboard and run succeed locally
  - Tests: `paperclipai onboard` (or documented non-interactive equivalent) and `paperclipai run` start without error
  - Non-goals: no knowledge routes; no custom Atlas env beyond documented defaults
  - Depends-on: PA-P1c
  - Challenges: dependency install vs Atlas zero-dep scripts coexistence at root
  - Evidence: `pnpm install`; `pnpm --filter @paperclipai/plugin-sdk build`; `pnpm run dev:server` → :3100

- [x] PA-P1e Smoke Paperclip API health and OpenAPI contract
  - Implement: `scripts/test/paperclip-boot.test.js` (or smoke script) asserting `GET /api/health` ok and `GET /api/openapi.json` retrievable
  - Tests: new boot smoke passes against running Paperclip server
  - Non-goals: no Atlas route assertions yet
  - Depends-on: PA-P1d
  - Evidence: `scripts/test/paperclip-boot.test.js`; live verify with `PAPERCLIP_LIVE_SMOKE=1`

- [x] PA-P1f Add `docs/SPEC.md` index (Paperclip base vs Atlas additions)
  - Implement: index sections for Paperclip primitives (live), Atlas differentiators (stub until PA-P2), migration reference (`apps/api`)
  - Tests: `scripts/test/spec-index.test.js` asserts required Atlas differentiator headings exist
  - Non-goals: full API reference duplication
  - Depends-on: PA-P1b
  - Evidence: `docs/SPEC.md`, `scripts/test/spec-index.test.js`

- [x] PA-P1g Confirm Paperclip test suite green alongside legacy gates
  - Implement: document Paperclip test command in SPEC.md; ensure CI/local gate runs both suites where feasible
  - Tests: Paperclip suite green; legacy `npm test` still green for `apps/api` / `packages/ontology-core`
  - Non-goals: no graft code
  - Depends-on: PA-P1e, PA-P1f
  - Evidence: `test:atlas` 199 pass; `test:paperclip:import` 7 pass; `npm run lint`; full vitest via `npm run test:paperclip`
  - **Epic gate (PA-P1 done):** P1a–P1g complete; fork boots; SPEC index live; legacy reference spine green

### PA-P2M — Atlas + MoO import queue (after PA-P1, before encyclopedia MVP)

**Status:** queued — do not start until PA-P1 epic gate passes.
**Intent:** Port everything Atlas + MoO related from the migration reference (`apps/api`, `packages/ontology-core`, Atlas `scripts/`, `.agent/skills/`) into the Paperclip trunk. PA-P2 (knowledge + proof) is the first slice; this epic tracks the full MoO surface map and remaining ports.

- [x] PA-P2M0 Import inventory ADR — graft map: legacy path → Paperclip target, live vs retire vs defer
  - Implement: `docs/bricks/2026-06-30-atlas-moo-import-map.md` — cover ontology, agent gateway tools, MCP, policy, GoalContract/review packet, personal/operational bootstrap, Hermes skills, GitHub/Slack adapters
  - Tests: SPEC.md links inventory; every `apps/api/src/*` differentiator file appears in map
  - Non-goals: no code ports in this task
  - Depends-on: PA-P1 epic gate
  - Evidence: import map ADR; `scripts/test/import-map.test.js` green

- [ ] PA-P2M1 Port agent tool surface (`search_records`, `attach_evidence`, manifest) → Paperclip tool/adapter registry
  - Source: `apps/api/src/agent-gateway.js`
  - Depends-on: PA-P2M0, PA-P2d

- [ ] PA-P2M2 Wire Atlas MCP stdio (`scripts/atlas-mcp-stdio.js`) to Paperclip API/tool surface
  - Source: `scripts/atlas-mcp-lib.js`, `scripts/atlas-local-session.js`
  - Depends-on: PA-P2M1

- [ ] PA-P2M3 Port policy + PermissionCheck onto Paperclip company write path
  - Source: `apps/api/src/policy-engine.js`, governed workspace rules
  - Depends-on: PA-P2M0

- [ ] PA-P2M4 Map GoalContract + review packet → Paperclip Goals + Approvals
  - Source: GoalContract routes, review packet generator
  - Depends-on: PA-P2M0

- [ ] PA-P2M5 Port operational/personal bootstrap smoke to Paperclip company onboarding
  - Source: `scripts/operational-bootstrap.js`, `scripts/dev-personal.js`
  - Depends-on: PA-P2M2

- [ ] PA-P2M6 Document `.agent/skills/` + Hermes bundle as worker instructions over Paperclip hires
  - Source: `.agent/skills/`, `docs/HERMES_SKILL_BUNDLE.md`
  - Depends-on: PA-P2M0

- [ ] PA-P2M7 Port GitHub open-PR + Slack read adapters to `packages/adapters/` contract
  - Source: inline tools in `agent-gateway.js`
  - Depends-on: PA-P2M1

**Epic gate (PA-P2M done):** no Atlas-only authority path required for dogfood; legacy `apps/api` optional for new work; inventory map shows all items live or explicitly retired.

### PA-P2 — Graft knowledge + proof layer

- [ ] PA-P2a ADR: Activity ↔ hash-chain integration
  - Implement: `docs/bricks/2026-06-30-audit-activity-integration.md` — choose sidecar table, dual-write, or replace; document write path and verify contract
  - Tests: ADR reviewed; no code until merged
  - Non-goals: no implementation in this task
  - Depends-on: PA-P2M0
  - Challenges: Paperclip Activity ≠ hash-chain; proof moat must survive migration

- [ ] PA-P2b Copy `packages/ontology-core` → `packages/atlas-ontology`
  - Implement: zero-dep package copy; update package name; keep registry + lifecycle + hash helpers
  - Tests: `packages/atlas-ontology` exports match ontology-core surface needed for graft
  - Non-goals: no Paperclip server routes yet
  - Depends-on: PA-P2a

- [ ] PA-P2c Port ontology-core tests into fork harness
  - Implement: wire atlas-ontology tests into root `npm test`
  - Tests: all ported ontology-core tests pass
  - Non-goals: no new record types
  - Depends-on: PA-P2b

- [ ] PA-P2d ADR + implement Company ↔ workspace_id mapping
  - Implement: document and implement mapping so knowledge routes scope to Paperclip `companyId`
  - Tests: cross-company knowledge access returns 403/404; same-company access succeeds
  - Non-goals: no second parallel tenant model
  - Depends-on: PA-P2b
  - Challenges: single authority chain (Paperclip Company isolation + Atlas lifecycle)

- [ ] PA-P2e Knowledge routes: entity CRUD (company-scoped)
  - Implement: `server/.../knowledge/` entity routes; port patterns from `apps/api/src/ontology-store.js`
  - Tests: create/list/fetch entity within company; cross-company denied
  - Non-goals: no multi-hop traverse yet
  - Depends-on: PA-P2d

- [ ] PA-P2f Knowledge routes: statement, source, evidence (company-scoped)
  - Implement: CRUD/list routes per `docs/ONTOLOGY_SPEC.md` record types
  - Tests: statement requires valid entity; evidence links to source; lifecycle defaults to candidate
  - Non-goals: no ingestion pipeline
  - Depends-on: PA-P2e

- [ ] PA-P2g Audit-chain module + `GET /audit/verify`
  - Implement: per PA-P2a ADR; port `verifyAuditEventChain` from atlas-ontology; expose verify endpoint
  - Tests: mutations append hash-chained events; verify returns `{ valid: true }`; tamper detected
  - Non-goals: no Lean/ZK hooks
  - Depends-on: PA-P2a, PA-P2f

- [ ] PA-P2h Wire `validate:records` into fork root scripts
  - Implement: root `package.json` script; run against existing fixtures
  - Tests: `npm run validate:records` PASS in fork context
  - Non-goals: no new fixture types beyond existing registry
  - Depends-on: PA-P2c
  - **Epic gate (PA-P2 done):** knowledge routes live; audit verify green; validate:records PASS

### PA-P3 — Staff + one knowledge pack (encyclopedia MVP)

- [ ] PA-P3a Staff manifest: seven Paperclip agent fixtures
  - Implement: `tests/fixtures/public-atlas-staff.json` (or YAML) for librarian, researcher, citation, editor, verifier, curator, owner/board per framework §3
  - Tests: fixture loads; each role has documented scopes
  - Non-goals: no autonomous multi-agent orchestration
  - Depends-on: PA-P2 epic gate

- [ ] PA-P3b Seed knowledge pack fixture
  - Implement: bounded domain seed (entities + candidate statements + sources) under `tests/fixtures/`
  - Tests: fixture validates against atlas-ontology registry
  - Non-goals: no external ingestion
  - Depends-on: PA-P3a

- [ ] PA-P3c Lifecycle gate test: candidate cannot publish
  - Implement: test proving candidate + unreviewed records cannot become operational/public without verifier path
  - Tests: promotion blocked without evidence + review; operational requires approved + evidence
  - Non-goals: no new lifecycle states
  - Depends-on: PA-P3b

- [ ] PA-P3d Port `search_records` + `attach_evidence` to Paperclip tool surface
  - Implement: port from `apps/api/src/agent-gateway.js` to Paperclip adapter/tool registry; MCP-discoverable
  - Tests: authorized agent can search seeded pack; attach_evidence creates evidence + audit event
  - Non-goals: no write tools beyond governed attach_evidence
  - Depends-on: PA-P3b

- [ ] PA-P3e Bounded multi-hop graph traverse
  - Implement: traverse with explicit depth cap (document max depth in test)
  - Tests: returns seeded subgraph; does not leak cross-company nodes; depth limit enforced
  - Non-goals: no unbounded graph query language
  - Depends-on: PA-P3d

- [ ] PA-P3f Derived entity page renderer
  - Implement: graph → human-readable entity page (server route or ui view)
  - Tests: seeded entity renders operational statements with source refs
  - Non-goals: no full public CMS
  - Depends-on: PA-P3b

- [ ] PA-P3g End-to-end `scripts/test/knowledge-pack.test.js`
  - Implement: Researcher drafts → Citation attaches → Editor reviews → Verifier promotes → Curator renders; every step in hash-chained audit
  - Tests: search returns seeded statements with `source_refs`; candidate cannot publish; full path green
  - Non-goals: no external APIs
  - Depends-on: PA-P3c, PA-P3d, PA-P3f
  - **Epic gate (PA-P3 done):** one knowledge pack dogfood loop proven end-to-end

### PA-P4 — Re-hero + public slice

- [ ] PA-P4a Dashboard hero copy → encyclopedia tier (framework §1.1)
  - Implement: Paperclip dashboard landing leads with proof-closed knowledge framing, not agent-company metaphor
  - Tests: snapshot or string test for required hero terms
  - Non-goals: full redesign
  - Depends-on: PA-P3 epic gate

- [ ] PA-P4b Update `outputs/site/index.html` encyclopedia framing
  - Implement: public shelf copy aligned with §1.1 knowledge-tier table
  - Tests: site-smoke passes
  - Non-goals: no new npm deps for site
  - Depends-on: PA-P4a

- [ ] PA-P4c Fork quickstart doc (`onboard` → entity → page → audit verify)
  - Implement: step-by-step in `outputs/docs/` or `docs/` for forkers
  - Tests: doc paths referenced in spec-index test
  - Non-goals: no video/marketing assets
  - Depends-on: PA-P3 epic gate

- [ ] PA-P4d Extend site-smoke for knowledge/evidence/audit terms
  - Implement: assert page contains "knowledge", "evidence", "audit"
  - Tests: site-smoke green
  - Non-goals: no agent-company hero strings as primary framing
  - Depends-on: PA-P4b
  - **Epic gate (PA-P4 done):** public slice shippable; forker quickstart documented

### PA-P5 — Full Atlas hardening (deferred stub)

Resume after PA-P4. Backlog pointer: `docs/PRD_ALIGNMENT_NEXT_STEPS_2026-06-29.md` — signed JWT
subset delegation, classification propagation, Postgres RLS parity, sandbox profiles, Lean/ZK hooks.
Do not add unchecked PA-P5 tasks until PA-P4 epic gate passes.

### PS-* — Personal spine (deferred until PA-P1 epic gate)

- [ ] PS-P1 Runtime foundation (Postgres + migration runner + object history)
  - Implement: wire Postgres when configured; transaction boundary; migration runner; object history tests — was `object_task_runtime_foundation`
  - Tests: `npm run gate:test`; object history tests under `node --test`
  - Non-goals: no duplicate of Paperclip company model on legacy API
  - Depends-on: **PA-P1 epic gate**
  - Challenges: may reconcile with Paperclip DB schema instead of standalone legacy path — decide at PS-P1 start
  - Pointer: `docs/bricks/2026-06-30-runtime-foundation-handoff.md`

## What's Next (prioritized) — trust hardening lane (H-*)

*Sprint order superseded by PA-* until PA-P4 epic gate. Resume H-* after Public Atlas MVP or on fork in parallel only when explicitly unblocked.*

Apply `.agent/skills/the-algorithm` before each item: question the requirement, prefer
safety-by-absence, build the smallest verifiable inch.

Planning source: `docs/PRD_ALIGNMENT_NEXT_STEPS_2026-06-29.md`.

### H0. Default-on MCP runtime contract — Complete
- Goal: make the existing MCP stdio adapter the default local agent operating surface whenever Atlas
  operational runtime is started.
- Architecture: MCP remains transport-only over `GET /agent/manifest` and `POST /agent/tools/:tool`;
  platform-side runtime owns bootstrap/delegation, and all tools still execute through the Tool Router.
- Session file: platform runtime writes `.atlas/local-session.json` (gitignored); MCP reads it and
  fails closed when absent or expired. Env overrides (`ATLAS_API_URL`, `ATLAS_DELEGATION_ID`,
  `ATLAS_SESSION_FILE`) remain for tests and advanced setups.
- Tests required: framed MCP initialize/list/call smoke, missing delegation structured failure,
  API-unreachable structured failure, expired delegation failure, denied-tool failure, audit evidence
  for allowed and denied calls, and manifest regression proving no merge or Slack write tool exists.
- Evidence: `scripts/atlas-local-session.js`, `scripts/atlas-mcp-lib.js`, `publishOperationalSession`
  in `scripts/operational-support.js`, session refresh in `scripts/dev-personal.js`,
  `scripts/test/atlas-local-session.test.js`, `scripts/test/atlas-mcp-stdio.test.js`,
  `npm run smoke:mcp`, extended `npm run smoke:operational`, `npm test` (168 tests).
- Non-goals: no MCP-side delegation minting, no separate MCP permission model, no external npm
  package, no merge/deploy/secret/permission/destructive/public-export tool.

### H1. Structured failure payload standard — Planned
- Goal: every MCP/API/Tool Router failure reachable by an agent returns `component`, `root_cause`,
  `failure_type`, and `message`.
- Tests required: authorization, validation, dependency, upstream-client, policy, and GoalContract
  denial paths.
- Non-goal: do not rewrite success payloads or introduce a framework.

### H2. Signed delegation hardening — Planned
- Goal: replace local unsigned bearer delegations with short-lived signed JWT-style delegation.
- Tests required: signature, issuer, audience, expiry, not-before, workspace, scope, tool allowlist,
  and replay/invalid-token denials.
- Non-goal: no full end-user login in this slice.

### H3. Postgres + RLS runtime proof — Planned
- Goal: prove DB-enforced tenant/workspace isolation for the records already modeled.
- Tests required: cross-workspace and cross-tenant denial at the database policy layer.
- Non-goal: no broad future-record migration, search upgrade, or graph database replacement.

### H4. Minimal MoO runtime trace records — Planned
- Goal: make every tool-executed action traceable through `GoalContract -> MetaOrchestrationRun ->
  OrchestratorRun -> AgentSession -> ToolCall -> AuditEvent`.
- Tests required: run trace continuity, review packet links, denied tool trace, and audit-chain
  verification.
- Non-goal: no autonomous multi-agent execution before trace records exist.

Agent review and hardening boundary: Coding, Critic, red-team, and Safety-Verification agents may
run inside the PR loop before human review, as scoped, audited, non-merge actors. They can prepare
patches, run tests, record findings, harden the branch, open a PR, and produce a review packet. The
protected-branch merge, production deploy, public export, permission change, secret/key operation,
and destructive delete remain human-only boundaries; do not add merge tools or merge scopes.

### N0. Land the design-discipline docs (tiny, do first) — Complete
- Commit `the-algorithm` skill + `AGENTS.md` wiring (algorithm + MoO architecture references).
- Why: this is the discipline that governs every item below; it should be in place before the next build.
- Evidence: `.agent/skills/the-algorithm/SKILL.md`, `AGENTS.md`, PR #9, `npm run lint`, `npm test`.

### N1. First real Tool Router integration — GitHub "open-PR-not-merge" (keystone) — Complete
- Implement a scoped GitHub tool exposed through the agent gateway: open a PR / push to a branch
  namespace, with **no merge tool and no merge scope in any agent delegation**.
- Verification: an `editor`-role agent can open a PR; there is no code path by which it can merge to a
  protected branch (capability absent, not approval-gated). Audit event recorded for the tool call.
- Why first: converts safety-by-absence from an in-Atlas model into a guarantee over a real external
  system. It is the direct structural answer to the "agent force-merged to dev" incident and the
  highest meaning-per-line increment in the repo. Everything else is plumbing for or polish on this.
- Challenges: real network/credentials cross the sandbox boundary and need scoped tokens; keep the
  tool contract narrow (no merge, no force-push, branch namespace allowlist).
- Evidence: `github.open_pr` in `apps/api/src/agent-gateway.js`, `github.pr:create` scope, `codex/`
  and `agent/` head-branch namespace guard, `PullRequestArtifact`, `github.pull_request.opened`
  audit event, `GITHUB_TOKEN` runtime adapter, and tests proving the manifest has no merge tool or
  merge scope. Live GitHub calls require a scoped `GITHUB_TOKEN`; tests use an injected client.

### N2. GoalContract object (front door) — Complete
- Add a `GoalContract` ontology object: objective, constraints, allowed/blocked actions, risk class,
  budget, done-definition; route a vague goal into a bounded task graph.
- Verification: a GoalContract drives next-action selection and constrains which actions are allowed.
- Why second: it is the single human approval moment that makes this leadership, not autocomplete —
  but it is worth more once N1 lets a contract drive a real external action.
- Evidence: `GoalContract` store/API support, delegations can bind `goal_contract_id`, authorization
  checks `allowed_actions` / `blocked_actions`, and `get_next_action` can use `next_action_json` from
  the bound contract.

### N3. Review-ready packet / approval surface — Complete
- Produce a bundled "what changed + evidence + audit refs + the one irreversible thing pending"
  artifact, surfaced once per loop (not per step).
- Verification: a completed loop yields a packet listing changed objects, audit events, and the
  pending human-only action.
- Why third: this is the "interrupt the human exactly once, at the boundary" payoff; it depends on
  N1 producing real artifacts worth reviewing.
- Evidence: `generate_review_packet` agent tool creates `ReviewPacket` records with changed files,
  verification commands, critic findings, safety findings, audit event ids, and default
  `pending_human_actions: ["protected_branch_merge"]`.

### N4. Prove and harden the GitHub PR boundary — Complete
- Add repository and base-branch allowlists for `github.open_pr`, so a delegation cannot open PRs
  against arbitrary repositories or protected branches.
- Add dry-run mode for the same gateway/audit path without calling GitHub.
- Audit every GitHub PR attempt, including success, dry-run, allowlist denial, and client failure.
- Open live PRs as **draft** by default (no merge capability exists in the gateway).
- Evidence: `github.open_pr` requires `githubPolicy.allowed_repositories` and
  `githubPolicy.allowed_base_branches`, runtime env supports `GITHUB_ALLOWED_REPOSITORIES`,
  `GITHUB_ALLOWED_BASE_BRANCHES`, and `GITHUB_DRY_RUN`, tests cover allowlist denial, dry-run
  without client call, and client failure audit, and `npm run smoke:github-open-pr` proves the
  boundary without network. Optional live proof: `GITHUB_LIVE_SMOKE=1` with scoped token + existing
  `GITHUB_HEAD_BRANCH`.

### N5. Second Tool Router integration — read-only Slack — Complete
- Add one read-only external tool to prove the gateway pattern is not GitHub-specific.
- Start with no write side effects, explicit resource allowlist, and audit on success/failure.
- Evidence: `slack.get_channel_info` uses the Slack `conversations.info` read path behind
  `slack.read`, requires `SLACK_ALLOWED_CHANNELS` / `slackPolicy.allowed_channel_ids`, exposes no
  Slack write tool, and tests cover allowlisted success, channel denial before client call, and
  client failure audit.

### N6. Minimal review inbox UI — Complete
- Surface review packets and PR artifacts in the web app so a human can see what the agent did and
  the one pending human-only action.
- Evidence: web API client fetches `review-packets` and `pull-request-artifacts`, the dashboard
  renders a compact Review inbox with PR URL, verification commands, critic/safety findings, and
  `pending_human_actions`, and web tests cover render plus server paths.

### O1. Operational bootstrap connection kit — Complete
- Add `scripts/operational-bootstrap.js` and `npm run operational:bootstrap`.
- Create or reuse the operational workspace scaffold, create a fresh GoalContract, mint a scoped
  delegation, and print `ATLAS_API_URL`, `ATLAS_DELEGATION_ID`, sample curl, and Cursor MCP config.
- Evidence: temporary API verification on `http://127.0.0.1:4017` ran `npm run operational:bootstrap`
  and printed a usable connection kit.

### O2. Operational smoke proof — Complete
- Add `scripts/operational-smoke.js` and `npm run smoke:operational`.
- Prove bootstrap -> Tool Router calls -> review packet -> dry-run PR -> audit verify without a
  live GitHub call by default.
- Evidence: `npm run smoke:operational` passed, creating a review packet, dry-run PR artifact, valid
  audit chain, and audit events linked to both `delegation_id` and `goal_contract_id`.

### O3. Zero-dependency MCP stdio adapter — Complete
- Add `scripts/atlas-mcp-stdio.js` and `npm run mcp:atlas`.
- Implement only `initialize`, `tools/list`, and `tools/call`; proxy `GET /agent/manifest` and
  `POST /agent/tools/:tool` over HTTP with `ATLAS_DELEGATION_ID`.
- Evidence: framed MCP smoke passed against the temporary API: initialize, tools/list, and
  tools/call `get_workspace_overview`.

### O4. Operational docs/tracker/context — Complete
- Add README Operational Quickstart, update this tracker with O1-O3 evidence, and append the
  verification turn to `CONTEXT_LOG.md`.
- Evidence: README documents bootstrap, smoke, MCP config, and operational env vars; CONTEXT_LOG
  Turn 21 records the completed actions and verification.

### Deferred hardening (do not start until N1 proves the loop)
- Signed JWT delegation (replace unsigned local bearer).
- Postgres + Row-Level Security runtime (replace app-level scope + file snapshot).
- Sandboxed tool execution profiles; classification propagation/redaction.
- Why deferred: these harden guarantees that already exist in model form. By the algorithm, do not
  optimize/secure a part until N1 has proven the product loop is worth hardening.

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

- [x] A3.1 Implement `ActionType` storage and API.
  - Tests: create/list/fetch action type.
  - Challenges: action type must reference valid workspace and target object type.
- [x] A3.2 Validate `ActionType.input_schema_json`.
  - Tests: reject invalid action schemas.
  - Challenges: reuse JSON schema subset without blocking future complexity.
- [x] A3.3 Implement `ActionRun` storage and API.
  - Tests: create action run record with actor, target, input, status.
  - Challenges: no real auth yet, so actor is supplied input for now.
- [x] A3.4 Implement simple property update effect.
  - Tests: `MarkBugResolved` changes `Bug.status` from `open` to `resolved`.
  - Challenges: mutation must stay transactional once DB exists.
- [x] A3.5 Reject invalid action input.
  - Tests: wrong type, missing required, invalid enum.
  - Challenges: error details must be actionable.
- [x] A3.6 Reject action target type mismatch.
  - Tests: action type for `Bug` cannot run on `Build`.
  - Challenges: preserve workspace scoping.
- [x] A3.7 Add rollback metadata placeholder.
  - Tests: action run includes before/after enough for later audit/rollback.
  - Challenges: avoid implementing full rollback before audit exists.
  - Evidence: `apps/api/test/actions.test.js`, `apps/api/test/ontology-store.test.js`, `infra/migrations/0004_actions.sql`, `npm test`.

## Phase 4: Governance

### Phase Challenges

- Local users and memberships are not authentication; docs and errors must not imply real login security.
- Policy rules need to stay narrow enough to reason about and test with a matrix.
- Cross-workspace data leakage must be tested before adding richer query, search, or agent endpoints.
- Permission checks should become auditable records rather than invisible control flow.

### Next Atomic Tasks

- [x] G4.1 Add `User`.
  - Tests: create/list/fetch user.
  - Challenges: no auth provider yet; identity fields are local.
- [x] G4.2 Add `WorkspaceMembership`.
  - Tests: assign user to workspace role.
  - Challenges: prevent cross-workspace membership leakage.
- [x] G4.3 Add roles: owner, admin, editor, viewer.
  - Tests: role enum validation.
  - Challenges: role semantics must stay small and explicit.
  - Evidence: `apps/api/test/governance.test.js`, `infra/migrations/0005_governance.sql`, `npm test`.
- [x] G4.4 Add `Policy`.
  - Tests: create policy with action/resource rules.
  - Challenges: avoid premature full ABAC/ReBAC engine.
  - Evidence: `apps/api/test/governance.test.js`, `infra/migrations/0006_policies.sql`, `npm run test:api`.
- [x] G4.5 Add `PermissionCheck`.
  - Tests: allowed and denied checks are recorded.
  - Challenges: checks must be auditable later.
  - Evidence: `apps/api/test/policy-enforcement.test.js`, `apps/api/test/governance.test.js`, `infra/migrations/0007_permission_checks.sql`.
- [x] G4.6 Enforce policy before action execution.
  - Tests: viewer denied, editor allowed; denial recorded and target not mutated.
  - Challenges: action engine must call policy engine before mutation.
  - Evidence: `apps/api/src/ontology-store.js` (`authorize`/`evaluatePolicy` wired into `createActionRun`), `apps/api/test/policy-enforcement.test.js`, `apps/api/test/agent-gateway.test.js`.
- [x] G4.7 Enforce workspace scope on every data endpoint.
  - Tests: cross-workspace reads and writes fail.
  - Challenges: future query/search endpoints must inherit the same guardrail.
  - Evidence: `apps/api/test/workspace-scope-regression.test.js` covers workspace-scoped list/fetch routes and cross-workspace write references; `apps/api/src/server.js` now rejects audit-event fetches whose event workspace does not match the route workspace.
- [x] G4.8 Add permission regression suite.
  - Tests: matrix of role/action/resource outcomes.
  - Challenges: avoid brittle tests while roles evolve.
  - Evidence: `apps/api/test/policy-enforcement.test.js` includes a table-driven matrix for owner/admin/editor/viewer roles, action/resource matching, wildcard read-style permissions, explicit destructive denial, unknown action denial, and missing-role denial.

## Phase 5: Audit And Trust

### Phase Challenges

- Audit events must be append-only at the API/storage boundary even before durable persistence exists.
- Canonical JSON will be required before hash chaining can be trusted.
- Snapshots may contain sensitive fields; permission inheritance must be considered before public exports.
- Do not make formal trust claims until verification code proves them.

### Next Atomic Tasks

- [x] T5.1 Add `AuditEvent` schema and storage.
  - Tests: create audit event with actor, action, resource, workspace.
  - Challenges: audit events must be append-only.
  - Evidence: `apps/api/src/ontology-store.js` (`appendAuditEvent`), `apps/api/test/audit-store.test.js`, `infra/migrations/0009_audit_events.sql`.
- [x] T5.2 Emit audit event for object create/update.
  - Tests: object mutation writes audit event.
  - Challenges: no update endpoint exists yet; add narrowly.
  - Evidence: `apps/api/test/audit-store.test.js`.
- [x] T5.3 Emit audit event for action run.
  - Tests: successful action writes audit event; denied actions captured via permission decisions.
  - Challenges: denied actions should be captured via permission checks too.
  - Evidence: `apps/api/test/audit-store.test.js`, `apps/api/test/policy-enforcement.test.js`.
- [x] T5.4 Add before/after snapshots.
  - Tests: mutation audit includes before and after hashes.
  - Challenges: snapshots may contain sensitive data later.
  - Evidence: `apps/api/test/audit-store.test.js`.
- [x] T5.5 Add hash chaining.
  - Tests: consecutive events include previous hash.
  - Challenges: stable canonical JSON is required for deterministic hashes.
  - Evidence: `packages/ontology-core/test/audit-chain.test.js`, `apps/api/test/audit-store.test.js`.
- [x] T5.6 Add tamper detection.
  - Tests: edited audit event breaks verification; broken link detected.
  - Challenges: in-memory storage cannot prove immutability, only behavior.
  - Evidence: `packages/ontology-core/test/audit-chain.test.js`.
- [x] T5.7 Add audit query endpoint.
  - Tests: list events by workspace and resource; verify chain.
  - Challenges: queries must respect permissions later.
  - Evidence: `apps/api/src/server.js` (`/audit/verify`, `/workspaces/:id/audit-events`).
- [x] T5.8 Add audit UI view.
  - Tests: web render test shows audit event list.
  - Challenges: UI must not overstate trust before persistence exists.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaceAuditEvents`), `apps/web/src/render.js` (`renderAuditTimeline`), `apps/web/src/server.js` dashboard fetch path, `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.

## Phase 6: Human UI

### Phase Challenges

- Keep the UI operational and compact; avoid a marketing shell or decorative dashboard.
- Dynamic ontology properties make generic tables/forms tricky without introducing a frontend framework.
- Visual graph exploration likely requires dependencies; defer until the backend graph contract is stable.
- UI must expose lifecycle/trust state clearly so candidate records are not mistaken for authoritative data.

### Next Atomic Tasks

- [x] U6.1 Add API client module in web app.
  - Tests: client builds URLs and handles JSON errors.
  - Challenges: current web app is dependency-free server-rendered HTML.
  - Evidence: `apps/web/src/api-client.js`, `apps/web/test/dashboard.test.js` (`api client handles API errors without throwing`, network failure coverage), `npm run test:web`.
- [x] U6.2 Add workspace selector.
  - Tests: render workspace list and selected state.
  - Challenges: state handling without a frontend framework may become awkward.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaces`), `apps/web/src/server.js` (`?workspace_id=` selection for workspace-scoped panels), `apps/web/src/render.js` (`renderWorkspaceSelector`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.3 Add ontology manager page.
  - Tests: render object types for a workspace.
  - Challenges: keep UI minimal until core model stabilizes.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaceObjectTypes`), `apps/web/src/server.js` selected-workspace object type fetch, `apps/web/src/render.js` (`renderOntologyManager`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`.
- [x] U6.4 Add object type creation form.
  - Tests: form posts valid schema and shows validation errors.
  - Challenges: JSON schema editing is error-prone.
  - Evidence: `apps/web/src/api-client.js` (`createWorkspaceObjectType`), `apps/web/src/server.js` object type POST proxy with local schema JSON validation, `apps/web/src/render.js` create form, `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.5 Add object instance list.
  - Tests: render objects scoped to workspace.
  - Challenges: properties are dynamic.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaceObjects`), `apps/web/src/server.js` selected-workspace object fetch, `apps/web/src/render.js` (`renderObjectList`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.6 Add object detail page.
  - Tests: render object, properties, and links.
  - Challenges: needs link traversal from Phase 1.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaceObject`, `fetchWorkspaceObjectLinks`), `apps/web/src/server.js` selected `object_id` detail fetch, `apps/web/src/render.js` (`renderObjectDetail`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.7 Add graph explorer.
  - Tests: render nodes/edges from link data.
  - Challenges: visual graph library likely needs dependencies.
  - Evidence: dependency-free node/edge explorer using existing object/link lists in `apps/web/src/render.js`, selected-workspace link fetch via `apps/web/src/api-client.js` and `apps/web/src/server.js`, `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.8 Add action runner.
  - Tests: run action and show result.
  - Challenges: depends on Phase 3/4.
  - Evidence: `apps/web/src/api-client.js` (`fetchWorkspaceActionTypes`, `createWorkspaceActionRun`), `apps/web/src/server.js` governed ActionRun POST proxy with local `input_json` validation, `apps/web/src/render.js` (`renderActionRunner`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`, `npm run lint`.
- [x] U6.9 Add audit viewer.
  - Tests: render audit timeline.
  - Challenges: depends on Phase 5.
  - Evidence: `apps/web/src/render.js` (`renderAuditTimeline`), `apps/web/test/render.test.js`, `apps/web/test/dashboard.test.js`, `npm run test:web`.
- [x] U6.10 Add next-action dashboard.
  - Tests: render recommended action and reason.
  - Challenges: depends on Phase 8.
  - Evidence: `apps/web/src/render.js` (`renderPersonalDashboard` next-action section), `apps/web/test/render.test.js` (`dashboard renders next action, blockers, and complete form`), `apps/web/test/dashboard.test.js` (`server renders dashboard when overview is available`), `npm run test:web`.

## Phase 7: Agent Layer

### Phase Challenges

- Agents must operate through the same policy and audit path as human-triggered actions.
- Tool manifests must not advertise incomplete or unsafe capabilities.
- Prompt/tool injection boundaries are not solved by schema validation alone.
- Search and traversal tools must inherit workspace, lifecycle, and permission constraints.

### Next Atomic Tasks

- [x] AG7.1 Add `AgentIdentity`.
  - Tests: create/list/fetch agent identity.
  - Challenges: distinguish service agents from users.
  - Evidence: `apps/api/src/ontology-store.js` (`createAgent`), `apps/api/test/agent-gateway.test.js`, `infra/migrations/0008_agents.sql`.
- [x] AG7.2 Add scoped delegation record.
  - Tests: delegation limits workspace, role, tools, scopes, and expiry; expired/invalid rejected.
  - Challenges: least-privilege defaults must be hard to bypass.
  - Evidence: `apps/api/src/ontology-store.js` (`createAgentDelegation`/`authorizeAgentTool`), `apps/api/test/agent-gateway.test.js`.
- [x] AG7.3 Add tool registry.
  - Tests: registered tools expose input schemas via the manifest.
  - Challenges: tool contracts must remain stable.
  - Evidence: `apps/api/src/agent-gateway.js` (`AGENT_TOOLS`/`getAgentManifest`).
- [x] AG7.4 Add `query_object` tool endpoint.
  - Tests: authorized agent can fetch object; unauthorized/expired cannot.
  - Challenges: depends on policy engine.
  - Evidence: `apps/api/test/agent-gateway.test.js`.
- [x] AG7.5 Add `search_records` tool endpoint.
  - Tests: search respects workspace scope and tool allowlist.
  - Challenges: depends on search phase for real search.
  - Evidence: `apps/api/test/agent-gateway.test.js`.
- [x] AG7.6 Add `traverse_graph` tool endpoint.
  - Tests: returns scoped one-hop graph.
  - Challenges: graph traversal must not leak private nodes.
  - Evidence: `apps/api/src/agent-gateway.js` (`traverse_graph`).
- [x] AG7.7 Add `get_available_actions`.
  - Tests: actions annotated with per-role policy decision (viewer denied).
  - Challenges: combines ontology, actions, and policy.
  - Evidence: `apps/api/test/agent-gateway.test.js`.
- [x] AG7.8 Add `run_action`.
  - Tests: agent action runs through policy and audit; viewer denied, editor allowed.
  - Challenges: prompt/tool injection isolation is not yet implemented.
  - Evidence: `apps/api/test/agent-gateway.test.js`, `npm run smoke:agent`.
- [x] AG7.9 Add artifact/evidence tools.
  - Tests: attach evidence and submit artifact creates records.
  - Challenges: depends on Capability Graph schemas.
  - Evidence: `submit_artifact` and `attach_evidence` are in the agent manifest, create workspace-scoped `Artifact` / `EvidenceRecord` records, audit `artifact.submitted` / `evidence.attached`, reject dangling evidence subjects, and are exercised by `apps/api/test/agent-gateway.test.js` plus `npm run smoke:operational`.
- [x] AG7.10 Add MCP-style manifest.
  - Tests: manifest lists callable tools, scopes, and verification order.
  - Challenges: avoid exposing incomplete tools as production-ready.
  - Evidence: `apps/api/src/agent-gateway.js` (`getAgentManifest`), `GET /agent/manifest`.

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

- Persistence: in-memory by default with optional file-backed snapshots (`ATLAS_DATA_FILE`); Postgres + RLS runtime wiring is still required for multi-tenant durability.
- Scope: Atlas can easily become a generic ontology exercise; every task must improve operational next-action behavior.
- Permissions: route-level workspace scoping plus enforced role-based policy on the action path; identity-based authentication (signed tokens) and DB Row-Level Security do not exist yet.
- Audit: every object write, action run, policy decision, delegation, and agent tool call now emits a hash-chained audit event; keep this invariant for all future mutations.
- Lifecycle: candidate/generated data must remain visible but non-authoritative until promoted.
- Frontend: current web app is intentionally minimal and dependency-free; richer UI likely requires a framework decision.
- Dependencies: network access is restricted, so adding packages may require approval and should be justified.

## Dogfood Skill Pack

- [x] Add project-local architecture skills under `.agent/skills`.
  - Includes: `enterprise-architecture-prd`, `zero-trust-orchestration`, `system-tracer-cost-profile`, and `implementation-task-packaging`.
  - Verification: `quick_validate.py` passed for every skill.
- [x] Add project-local Atlas/MoO operational dogfooding skills under `.agent/skills`.
  - Includes: `atlas-moo-dogfood-loop`, `atlas-ontology-delta-capture`, `moo-goal-contract-routing`, `moo-tool-execution-runbook`, `atlas-moo-verification-loop`, `approval-fatigue-filter`, `atlas-run-trace-audit`, and `workspace-transparency-blueprint`.
  - Verification: `quick_validate.py` passed for every skill; `.agent/skills` has no template TODOs or legacy `100X` references.

## Current Turn Checklist

- [x] Audit Phase 3 tracker state against current ActionType/ActionRun implementation.
- [x] Mark Phase 3 actions complete based on existing code, migration, docs, and tests.
- [x] Implement G4.1-G4.3 local governance records.
- [x] Add `User` and `WorkspaceMembership` API routes.
- [x] Add role enum validation for owner/admin/editor/viewer.
- [x] Add governance migration and migration test expectation.
- [x] Add API tests for user CRUD, membership CRUD, invalid roles, duplicate memberships, missing users, and cross-workspace membership non-leakage.
- [x] Update architecture, security, README, and migration docs.
- [x] Run lint, migration verification, record validation, focused API tests, and full test suite.
- [x] Implement G4.4 local policy records.
- [x] Add policy route tests for CRUD, rule validation, and workspace scoping.
- [x] Add `0006_policies.sql` and update migration verification.

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

### v0 Agent-Usable Spine turn

- [x] Slice 1: append-only hash-chained audit log (core helpers + store + emit on mutations) with tests.
- [x] Slice 2: enforce policy before action execution (G4.6); record `PermissionCheck` + audit on decisions.
- [x] Slice 3: agent identity, scoped delegation, tool registry/manifest, governed gateway dispatch with tests.
- [x] Slice 4: durable file-backed persistence (snapshot/restore + `ATLAS_DATA_FILE`) with tests.
- [x] Slice 5: agent quickstart docs, `scripts/agent-smoke.js`, migrations `0008`/`0009`, tracker/log updates.
- [x] Tick G4.5/G4.6, T5.1–T5.7, AG7.1–AG7.8/AG7.10 with evidence.
- [ ] Run full `npm test` (unsandboxed), `npm run lint`, `npm run verify:migrations`, `npm run smoke:agent`, then append the run trace to `CONTEXT_LOG.md`.
