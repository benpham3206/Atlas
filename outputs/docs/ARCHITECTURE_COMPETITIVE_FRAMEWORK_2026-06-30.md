# Atlas — Architecture, Competitive Framework & Polish Roadmap

**Date:** 2026-06-30 (rev 2 — Paperclip-foundation pivot)
**Author role:** Architect (Hermes/JARVIS). **Implementation:** Codex/Cursor. **Authority:** Atlas knowledge + proof layer over the Paperclip control plane.
**Status:** Reference doc. **Reverses** the prior "Paperclip spec-only (Option A)" stance (`outputs/docs/PAPERCLIP_INTEGRATION_OPTIONS.md`) on Ben's direction: **fork & extend Paperclip (MIT) as the Public Atlas foundation**, then layer the full zero-trust Atlas system.

**Decisions locked this pass (Ben, 2026-06-30):**
1. **Topology:** **Paperclip is the trunk; Atlas merges in.** Paperclip is the bigger, more finished, MIT project — it hosts; Atlas contributes the knowledge + proof layer. Single system of record = the Paperclip codebase.
2. **"Merge" = port, not `git merge`.** Atlas (zero-dep, Node built-in HTTP) and Paperclip (full app, deps, DB, dashboard) are unrelated histories on incompatible stacks. Codex **grafts Atlas's 3 differentiated pieces** as Paperclip modules and **drops** Atlas's redundant control-plane code (Paperclip already has it). Do **not** attempt a literal unrelated-histories git merge.
3. **Snapshot first.** Tag the current Atlas state (`atlas-pre-paperclip-v0`) before Paperclip becomes the trunk; keep `apps/api` as the migration reference until parity. Brand stays **The Atlas Project** on `benpham3206/Atlas`; add `upstream` → Paperclip for pulling updates.
4. **Existing Atlas API fate:** **Keep the differentiators, delete the redundancy.** Graft `packages/ontology-core` (registry + lifecycle + audit hash-chain) + knowledge tools; retire workspaces/delegations/goal-contracts/review-packets/gateway.

**Verification (v0 spine, run 2026-06-30):** `npm test` **PASS** · `npm run lint` **PASS** · `npm run smoke:polish` **PASS** (`audit_valid: true`) · `npm run demo:flagship` **PASS**. The current server stays green as the migration reference until the fork reaches parity.

---

## 1. Mission & scope

**North star.** Atlas exists to **democratize human knowledge and capability**. Concretely, the public goal is to put **The Atlas Project** on the shelf with **Wikipedia, Wikidata, Britannica, and Grokipedia** — but as the **proof-closed** member of that set: a structured knowledge graph where **nothing becomes canon without a traced, evidenced, reviewed, hash-chained path**, and where the authoring is done by **governed agent staff** under scoped delegation, not an anonymous crowd or an opaque single model.

### 1.1 Where Atlas sits in the knowledge tier

| Property | Wikipedia | Wikidata | Britannica | Grokipedia | **Atlas** |
|---|---|---|---|---|---|
| Authoring | human crowd | humans + bots | expert staff | one AI model | **governed agent staff (hires)** |
| Structure | prose | structured graph | prose | prose | **structured graph → derived prose** |
| Verifiability | citation norm | references on statements | editorial authority | model trust | **proof-closed: every operational statement traces to `source`+`evidence`, lifecycle-gated, hash-chained audit** |
| Openness | free / CC | free / CC | paywalled | proprietary | **MIT / forkable (Paperclip foundation + Atlas layer)** |
| Governance | community policy | community | editorial board | opaque | **scoped delegation + approvals + tamper-evident audit** |

**One-line wedge:** *Wikidata's structured truth + Britannica's authority + Grokipedia's agent-scale authoring + Wikipedia's openness — made honest by proof.*

### 1.2 Full Atlas vision (unchanged) vs Public Atlas (the on-ramp)

The Unified PRD (`docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md`) is still the destination: zero-trust control plane, six planes (§1.4), short-lived JWT subset delegation (§4.1), PostgreSQL RLS (§5), sandboxed Tool Router (§3.1), classification propagation (§5.6), Lean/ZK proof hooks (§6), and the `GoalContract → MetaOrchestrationRun → … → AuditEvent` trace (AC1). **None of this is shrunk** — it is now **partially pre-built by Paperclip** (see §4) and **completed by the Atlas layer**.

Public Atlas is the **forkable encyclopedia engine** that ships first: **Paperclip's MIT control plane** (companies/agents/approvals/activity/routines/adapters) **+ Atlas's knowledge layer** (ontology, entities, statements, sources, evidence, lifecycle) **+ Atlas's proof layer** (hash-chained audit, `/audit/verify`). They connect by **subset, not divergence**: Paperclip already implements ~80% of the MoO control plane the PRD describes; Atlas supplies the 20% that makes it a *knowledge* system and the proof spine that makes it *trustworthy*. Build Public Atlas first; the remaining PRD hardening (RLS, classification, Lean/ZK) lands on the same fork.

---

## 2. Paperclip foundation — what we inherit (MIT © 2026 Paperclip Labs, Inc.)

Source: `https://docs.paperclip.ing/reference/api/overview`, `.../reference/cli/overview`. License: MIT — we may fork, modify, and ship, preserving the copyright/attribution.

### 2.1 API surface we stand on

- **Company-scoped control plane:** `/api/companies/{companyId}/...`; cross-company access returns `403/404` (tenant isolation **already enforced** — a down payment on PRD §5 RLS at the app layer).
- **Two-persona auth:** Board token = full authority; Agent key/JWT = **company-bound, scoped** (a down payment on PRD §4.1 delegation). `X-Paperclip-Run-Id` correlates mutating requests to a run (a down payment on the PRD run-trace chain, AC1).
- **Resources:** Companies, Agents, Issues, Approvals, Goals & Projects, Costs, Secrets, Activity, Dashboard, Routines.
- **Machine-readable contract:** `GET /api/openapi.json`; health at `GET /api/health`.

### 2.2 CLI surface we stand on

- **Two layers:** Setup (`onboard`, `doctor`, `configure`, `env`, `db:backup`, `run`) against `~/.paperclip`; Control-plane (authenticated HTTP client: `company`, `project`, `goal`, `issue`, `agent`, `run`, `routine`, `approval`, `activity`, `cost`, `workspace`, `adapter`, `skills`, `secrets`, `plugin`).
- **Critical alignment:** *"The CLI does not run the model"* — agents execute server-side; the CLI triggers and observes. This **is** the Atlas authority/worker split (`docs/HERMES_SKILL_BUNDLE.md`): Paperclip = control plane + authority; Hermes/Codex/Cursor = workers; `agent local-cli` is the worker seat.

### 2.3 PRD-concept ↔ Paperclip-primitive map

| Unified PRD concept | Paperclip primitive (exists, MIT) | Atlas still must add |
|---|---|---|
| Workspace / tenant | `Company` (403 on mismatch) | **Knowledge** workspace as a first-class company kind |
| Scoped delegation | Agent key/JWT, company-bound + run-id | Subset-of-parent scope proof; classification ceiling (PRD §4.1/§5.6) |
| Human authority / review inbox | Board token + Approvals | Lifecycle promotion gate (candidate→operational) |
| GoalContract | Goals & Projects | Acceptance-criteria + evidence binding |
| Audit ledger | Activity (logging) | **Hash-chain + `/audit/verify` + Lean/ZK hooks (PRD §6)** |
| Budget cap | Costs | enforcement parity |
| Heartbeat / cron | Routines | next-action over a knowledge graph |
| Tool Router / adapters | Adapter registry + openapi | Knowledge tools (`search_records`, `attach_evidence`), sandbox profiles |
| **Ontology / knowledge graph** | **— (none; company-shaped)** | **Entities, statements, sources, evidence, links, lifecycle — the entire encyclopedia** |
| **Tamper-evident proof** | **— (Activity ≠ hash-chain)** | **Append-only hash-chained audit** |

**Reading:** Paperclip gives us the control plane, org/staff model, budgets, approvals, adapters, CLI, and dashboard — the parts Atlas was reimplementing in `apps/api`. Atlas keeps the two things Paperclip lacks and that justify a separate project: **the knowledge graph** and **the proof spine**.

---

## 3. Atlas staff (our own hires)

"Create our own staff" = define the **agent roster** that builds and maintains the encyclopedia, modeled as **Paperclip hires** (company-bound agent keys), each carrying an **Atlas delegation scope** and mapped to a **MoO orchestrator profile** (PRD §3.1). The lifecycle gate is the staff's shared law: only **operational + approved** records become canon. (Codex already runs proto-staff automations — `weekly-pr-team-summary`, `daily-issue-triage` — which formalize as hires here.)

| Staff role | Paperclip hire | MoO profile (PRD §3.1) | Scopes (write path) | Lifecycle authority |
|---|---|---|---|---|
| **Librarian / Ontologist** (Lead) | agent: `librarian` | Planner | `ontology:read/write` | Owns object/link types + domain packs; cannot promote alone |
| **Researcher** | agent: `researcher` | Research | `web:read`, `artifact:write` | Drafts **candidate** `statement` + `source` |
| **Citation Checker** | agent: `citation` | Evidence | `evidence:write` | Runs `attach_evidence`; flags unsupported claims |
| **Editor / Critic** | agent: `editor` | Critic | `artifact:read`, `verification:write` | Blocks weak records; requests rework |
| **Verifier** | agent: `verifier` | Safety-Verification | `test:run` (`validate:records`) | **Promotes candidate→operational** only when evidence + review pass |
| **Curator / Publisher** | agent: `curator` | Workflow | `artifact:write` | Generates human-readable entity pages from the graph |
| **Owner** (human, Ben) | Board token | — | full | Approves operational promotion + irreversible publish/export |

**Boundary:** staff are **workers** (Paperclip agents / Hermes / Codex seats). Authority is the Atlas lifecycle gate + Paperclip Approvals + the human Board. No agent self-promotes a record to canon; promotion is a Verifier+Owner act recorded in the hash-chained audit.

---

## 4. Target repo map — fork & extend

| Path (target) | Source today | Action | Owner |
|---|---|---|---|
| `paperclip/` (fork) | — | **Fork MIT repo** → `server/`, `ui/`, `cli/`, `packages/adapters/`, `doc/SPEC.md` | platform |
| `paperclip/packages/atlas-ontology/` | `packages/ontology-core/` (zero-dep) | **Graft** registry + lifecycle + audit hash-chain as a module | packages |
| `paperclip/server/.../knowledge/*` | `apps/api/src/agent-gateway.js` (`search_records`, `attach_evidence`), `ontology-store.js` | **Add** knowledge routes (entities/statements/sources/evidence, multi-hop traverse) | server |
| `paperclip/server/.../audit-chain/*` | `packages/ontology-core` hash helpers + `GET /audit/verify` | **Wrap/extend** Paperclip Activity with the hash-chain + verify | server |
| `paperclip/packages/adapters/{github,slack}/` | inline in `agent-gateway.js` | **Port** to Paperclip adapter contract | adapters |
| `apps/api`, `apps/web` (current) | live | **Keep as migration reference + dogfood**, deprecate at parity | — |
| `outputs/` | live | **Keep** — the public shelf, now also fork docs | doc |
| `.agent/skills/`, `.hermes/plans/` | live | **Keep** — architect + operating skills | doc |
| `infra/migrations/` | `0001`–`0010` | **Reconcile** with Paperclip's schema; keep as the Atlas-tables contract | infra |

**Zero-dep note:** the graft target (`packages/ontology-core`) is dependency-free, so it ports without dragging deps into the fork. Paperclip itself carries deps — the zero-dep constraint (`AGENTS.md`) applied to *our* code, and survives for the grafted module; we accept Paperclip's runtime deps as the cost of standing on its shoulders.

---

## 5. Four-way architecture matrix (post-pivot)

Cells: parity / partial / absent / deferred→PRD phase. "Atlas target" = the fork + grafted layer.

| Row | Atlas now (`apps/api`) | **Atlas target (fork+layer)** | Paperclip (foundation) | Hermes (worker) |
|---|---|---|---|---|
| Data | partial (in-memory, one-hop) | parity | parity (companies/issues) | partial |
| Control | partial (no MetaOrchestrationRun) | parity (Goals + run-id) | **parity** | partial (cron) |
| Identity | partial (local bearers) | partial→parity (agent JWT + company isolation from Paperclip; subset-scope proof deferred→PRD §4) | **partial (real)** | parity |
| Tools | partial | parity (adapter registry + knowledge tools) | partial (adapters) | parity (MCP) |
| Audit | **parity (hash-chain)** | **parity (grafted)** | partial (Activity only) | partial |
| UX | partial (file-tree) | parity (Paperclip dashboard + Atlas knowledge view) | parity | partial |
| Proof | **parity** | **parity** | partial | parity |
| Cadence | partial | parity (Routines) | **parity** | parity |
| **Knowledge graph** | partial (registry + 2 tools) | **parity — the differentiator** | **absent** | n/a |

**Reading:** the fork **inherits** Control/Identity/Cadence/UX from Paperclip (rows Atlas was weakest on), and **contributes** Audit/Proof/Knowledge (rows Paperclip lacks). The merge is additive, not competitive.

---

## 6. Craft & dogfood scorecard (mission = knowledge + capability)

Score 0/1/2 (missing / partial / shippable).

| Dimension | Score | Note |
|---|---|---|
| Narrative legibility | **1** | Loop copy on `?view=home`; **must re-hero to encyclopedia tier (§1.1)**, currently "agent company." |
| Proof closure | **2** | Hash-chain + `/audit/verify` + ReviewPacket + `demo:flagship`. Best row; **the moat to graft.** |
| Long-horizon restart | **2** | `NEXT_ACTION.md`/`STATE.md` + launchd + audit verify. |
| Surface / site | **1** | `outputs/site/index.html` unshipped; will inherit Paperclip dashboard at fork. |
| **Dogfood (Hermes bar)** | **1.5** | Stack/MCP/flagship/quickstart green; heartbeat + knowledge tools still gateway-only (not MCP-discoverable / no seeded knowledge pack). |
| **Structure (Public Atlas)** | **1** | No fork yet; no single `doc/SPEC.md`; no adapter seam. Pivot closes this. |

**Composite craft 1.5/2** — proof/restart shippable; narrative + surface are the drag, both **resolved by the fork** (inherit Paperclip surface) **+ re-hero** (encyclopedia copy).

---

## 7. Build path — Public Atlas first, then full Atlas

Ordered phases. Each: acceptance, files, tests, non-goals.

### P0 — Spine harden (current server) — *mostly done*
Keep `apps/api` green as migration reference. **Acceptance:** `smoke:polish` keeps `.atlas/local-session.json` on :4000; personal harden closed. **Non-goal:** no new features on the legacy server.

### P1 — Snapshot Atlas, then make Paperclip the trunk — **start here**
- **Snapshot first (safety):** commit the working tree, `git tag -a atlas-pre-paperclip-v0`, push branch + tags. Recoverable baseline before the reframe.
- **Acceptance:** Paperclip fork is the new trunk of `benpham3206/Atlas` (brand stays "The Atlas Project"); `upstream` remote → Paperclip added; `paperclipai onboard` + `paperclipai run` green locally; `GET /api/health` ok; `openapi.json` retrieved; MIT `LICENSE`/NOTICE preserved.
- **Files:** Paperclip trunk in place, `apps/api` kept as migration reference, `docs/SPEC.md` (index: Paperclip base vs Atlas additions, live vs stub).
- **Tests:** Paperclip's own suite green; `scripts/test/spec-index.test.js`.
- **Non-goals:** **no literal git history merge**; no Atlas code grafted yet (that's P2); no schema edits.

### P2 — Graft the knowledge + proof layer
- **Acceptance:** `packages/ontology-core` mounted as `paperclip/packages/atlas-ontology`; entity/statement/source/evidence routes live under a Company; **hash-chained audit + `/audit/verify` wraps Activity**; `validate:records` passes inside the fork.
- **Files:** `paperclip/packages/atlas-ontology/*`, `paperclip/server/.../knowledge/*`, `.../audit-chain/*`.
- **Tests:** ported `ontology-core` tests; new audit-chain verify test; `validate:records`.
- **Non-goals:** don't reimplement Paperclip companies/agents/approvals — reuse them.

### P3 — Stand up the staff + one knowledge pack (the dogfood)
- **Acceptance:** the §3 hires exist as Paperclip agents with Atlas scopes; one seeded **knowledge pack** (a domain's entities/statements with `source`+`evidence`) is built end-to-end: Researcher drafts candidate → Citation attaches evidence → Editor reviews → **Verifier promotes to operational** → Curator renders a human-readable entity page; every step in hash-chained audit; promotion blocked without evidence+review.
- **Files:** staff manifest, seed fixture (`tests/fixtures/`), `search_records`/`attach_evidence` surfaced as **MCP-discoverable** tools, derived-page renderer + multi-hop traverse.
- **Tests:** `scripts/test/knowledge-pack.test.js` (search returns seeded statements with `source_refs`; candidate cannot publish); web/entity-page test.
- **Non-goals:** no external ingestion pipeline; multi-hop = bounded depth; no write tool beyond governed `attach_evidence`.

### P4 — Re-hero + public slice (encyclopedia)
- **Acceptance:** public landing leads with the §1.1 knowledge-tier framing (Wikipedia/Wikidata/Britannica/Grokipedia + "proof-closed"); a forker can run `onboard` → build one entity → see the derived page + audit verify.
- **Files:** Paperclip dashboard copy + `outputs/site/`, `docs/SPEC.md` hero.
- **Tests:** `site-smoke` (contains "knowledge", "evidence", "audit"). **Non-goal:** no agent-company framing as the hero.

### P5 — Full Atlas hardening (the rest of the system)
On the same fork: subset-scope **proof** over Paperclip agent JWTs (PRD §4.1), **classification propagation** (§5.6), Postgres **RLS** parity (§5 — Paperclip's company isolation is the down payment), sandbox profiles (§3.1/§4.2), and the **Lean/ZK proof hooks** (§6). **Out of Public-Atlas scope**; sequenced after the encyclopedia ships. Keep `docs/PRD_ALIGNMENT_NEXT_STEPS_2026-06-29.md` as the trust-spine backlog.

**Dependency order:** P0 → **P1 → P2 → P3** (the encyclopedia MVP) → P4 → P5.

---

## 8. Decisions & risks

| # | Decision | Recommendation |
|---|---|---|
| D1 | **Foundation: build vs adopt** | **Adopt — fork & extend Paperclip (locked).** It already implements ~80% of the MoO control plane under MIT; rebuilding it in `apps/api` was duplicated effort. |
| D2 | **Existing Atlas API fate** | **Migrate differentiators, delete redundancy (locked, recommended).** Graft `packages/ontology-core` + knowledge tools + audit hash-chain; retire workspaces/delegations/goal-contracts/review-packets/gateway (Paperclip covers them). Keep current server as reference until parity. |
| D3 | **Authority blur (two run models)** | **Single system of record = the fork.** Atlas lifecycle gate + Paperclip Approvals + Board are the one authority chain. Hermes/Codex stay workers; never mint authority. |
| D4 | **Knowledge model** | **Reuse the existing registry** (`domain/node/statement/source/evidence` implemented). Gap is packaging + MCP discovery + multi-hop + derived view, not new types. |
| D5 | **Public hero framing** | **Re-hero to the encyclopedia tier (§1.1)** before P4 ships. Knowledge + capability, not "0-person company." |

**Top risks.** (1) **Fork merge drift** from upstream Paperclip — mitigate: graft as an isolated `atlas-ontology` package + thin server routes, minimize edits to Paperclip core. (2) **Losing the proof moat in migration** — mitigate: port `audit-chain` tests first; `/audit/verify` is a P2 acceptance gate. (3) **License/attribution** — preserve MIT `LICENSE` + NOTICE; Atlas additions clearly delineated. (4) **Authority blur** — D3 single-chain rule, enforced by lifecycle gate. (5) **Scope creep into P5** during the encyclopedia push — keep trust hardening in `PRD_ALIGNMENT_NEXT_STEPS`, out of P1–P4.

---

## Appendix — source grounding

- Paperclip API/CLI: `https://docs.paperclip.ing/reference/api/overview`, `.../reference/cli/overview` (MIT © 2026 Paperclip Labs, Inc.).
- Vision/planes/AC: `docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md` §1.3–1.4, §3.1, §4.1, §5, §6, §7.6.
- Differentiators to graft: `packages/ontology-core/src/index.js` (registry + hash-chain), `apps/api/src/agent-gateway.js` (`search_records`/`attach_evidence`), `docs/ONTOLOGY_SPEC.md` (20 record types + lifecycle).
- Constraints: `AGENTS.md` (zero-dep for our code, the-algorithm, safety-by-absence), `docs/UI_MOO_FILE_TREE.md`.
- Prior stance reversed: `outputs/docs/PAPERCLIP_INTEGRATION_OPTIONS.md` (Option A → now fork-and-extend).
- Plans sequenced: `.hermes/plans/2026-06-29_atlas-polish-matrix-paperclip-hermes.md`, `.hermes/plans/2026-06-29_polish-status-competitive-bar.md`.
