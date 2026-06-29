# Atlas + MoO Holistic Progress Plan

> **For Hermes:** Synthesis and prioritization only — not an execution mandate. Use `subagent-driven-development` when implementing individual bricks below.

**Goal:** Capture where **Atlas** (operational ontology platform) and **MoO** (Mixture of Orchestrators product map) stand as of 2026-06-29, what was proven in live dogfood, what is in flight, and what should happen next.

**Architecture:** Atlas repo implements a **zero-trust agent-usable spine**: ontology store, policy on writes, hash-chained audit, scoped delegations, Tool Router gateway, Personal + operational workspaces, and a web explorer aligned to the MoO file-tree map. MoO is the **canonical product ontology** (layers, surfaces, governance) documented in skills/PRD references and rendered in `apps/web/src/moo-tree.js` — not a separate codebase.

**Tech stack:** Node 22 monorepo (`apps/api`, `apps/web`, `packages/ontology-core`), no external npm deps, `node --test`, in-memory store + optional `ATLAS_DATA_FILE` snapshot persistence.

---

## 1. Executive summary

| Dimension | Status |
|-----------|--------|
| **Core platform (Phases 2–7)** | Complete per `TASKS.md` — capability records, actions, governance, audit UI, human UI baseline, agent layer |
| **Operational loop (N0–N6, O1–O4)** | Complete — GoalContract, review packets, GitHub open-PR boundary (no merge), Slack read-only tool, review inbox UI, operational bootstrap/smoke, MCP stdio |
| **Personal Atlas v0** | Runnable — bootstrap, overview, next-action, task completion with evidence; web now **MoO file-tree explorer** (PR #17) |
| **Live dogfood (Turn 25)** | Proven on Ben's machine — operational + personal bootstrap, smoke green, next-action `object_task_harden_personal_loop` |
| **MoO UI map** | Sidebar shows full platform tree; many nodes **stub**; **live** panes wired via `?view=` |
| **Next product inch** | **Personal-loop hardening** (trust) *or* **D8.1** domain pack (concrete AAA next-actions) — brick doc recommends (1) then (2) |

**In flight:** [PR #17](https://github.com/benpham3206/Atlas/pull/17) — `feat/personal-atlas-moo-file-tree-ui` (lint fix pushed; await full CI green).

---

## 2. Definitions (avoid conflating names)

### Atlas (this repository)

- **What it is:** Minimal operational ontology platform — workspaces, object types/instances, links, actions, policy, audit, agent tools.
- **Evidence of “real”:** `npm test` (~151 tests), `npm run smoke:operational`, `npm run smoke:agent`, `npm run operational:bootstrap`.
- **Persistence:** In-memory default; `ATLAS_DATA_FILE` for snapshot across API restarts; Postgres/RLS **not wired** (deferred).

### MoO (Mixture of Orchestrators)

- **What it is:** Zero-trust orchestration **product model** — User/Goal layer, Meta-Orchestration, Orchestration Runtime, Registry, Runtime Graph, Human Authority, Governance/Audit, Product Surfaces.
- **Where it lives in repo:**
  - Canonical rules: `AGENTS.md` → `docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md` (referenced; verify path in repo when implementing).
  - Skill: `.agent/skills/zero-trust-orchestration/SKILL.md`, `.agent/skills/atlas-moo-dogfood-loop/SKILL.md`.
  - **UI projection:** `apps/web/src/moo-tree.js` + `docs/UI_MOO_FILE_TREE.md`.
- **What MoO is not (yet):** A fleet of separate orchestrator services — the tree’s `services/*` and most `packages/*` entries are **PRD stubs**, not running microservices.

### Personal Atlas

- **Slice:** Self-hosting cockpit for Ben — Carbon Copy, roadmap tasks, dependency-aware next-action, bootstrap without auth (local trust boundary).
- **API:** `/personal/bootstrap`, `/personal/overview`, `/personal/next-action`, task complete with `artifact_uri` + `evidence_note`.
- **Web:** Two-pane explorer (atlas/ monorepo tree + MoO tree); bootstrap layout stabilized; `npm run dev:personal` for API+web.

### Ben’s role split (from memory / brick)

| Actor | Role |
|-------|------|
| **Hermes / JARVIS** | Architecture, specs, MoO alignment, dogfood orchestration, bricks |
| **Codex (ChatGPT Edu)** | Implementation PRs |
| **Cursor (Pro)** | Implementation, MCP host, Auto/Composer |
| **Atlas** | Governance, audit, next-action, tool gateway — not primary code author |

---

## 3. Completed work (evidence-backed)

### 3.1 v0 agent-usable spine (`TASKS.md` § v0)

- Append-only hash-chained audit (`ontology-core`).
- Policy on action path (deny-by-default in governed workspaces).
- Agent delegations, manifest, `POST /agent/tools/:tool`.
- Generalized next-action selector (Personal uses it).
- `ATLAS_DATA_FILE` persistence bridge.
- `scripts/agent-smoke.js` end-to-end proof.

### 3.2 N-series — external loop + human boundary

| Item | Outcome |
|------|---------|
| **N1** | `github.open_pr` — no merge tool/scope |
| **N2** | `GoalContract` drives allowed/blocked actions + next-action |
| **N3** | `generate_review_packet` + pending human merge action |
| **N4** | Repo/branch allowlists, dry-run, draft PR default |
| **N5** | `slack.get_channel_info` read-only |
| **N6** | Review inbox in web (pre–file-tree dashboard) |

### 3.3 O-series — operational connection

| Item | Outcome |
|------|---------|
| **O1** | `npm run operational:bootstrap` + MCP env printout |
| **O2** | `npm run smoke:operational` |
| **O3** | `npm run mcp:atlas` stdio adapter |
| **O4** | README + CONTEXT_LOG documentation |

### 3.4 AG7 / artifacts (CONTEXT_LOG Turn ~24)

- Artifact + evidence routes and agent tools `submit_artifact`, `attach_evidence`.
- Smoke operational path includes artifact/evidence.

### 3.5 Phases 2–7 (tracker)

Marked **Complete** in `TASKS.md` Upcoming Work Map — with explicit caveat that enterprise/formal layers (Phase 10) and ingestion (Phase 9) are **not** done; only through Phase 7 + operational MCP.

### 3.6 Session work (2026-06-29) — UI + dev ergonomics

**Branch:** `feat/personal-atlas-moo-file-tree-ui` (PR #17)

- `ascii-tree.js`, `atlas-repo-tree.js`, `moo-tree.js`
- `render.js` — two-pane layout, `?view=`, `?path=`, bootstrap grid fixes
- `server.js` — routing, bootstrap options, EADDRINUSE message
- `scripts/dev-personal.js` — skip already-listening ports
- Tests updated (`render.test.js`, `dashboard.test.js`)
- `docs/UI_MOO_FILE_TREE.md`, `docs/bricks/HERMES_DOGFOOD_2026-06-29.md`
- CONTEXT_LOG Turn 25

---

## 4. MoO map vs implementation (honest matrix)

Use this when prioritizing — **visible stub ≠ hidden debt** if the algorithm says delete until needed.

| MoO layer (tree) | v0 status | Notes |
|------------------|-----------|--------|
| User and Goal Layer | **partial** | Carbon Copy / personal tasks via API; web `carbon-copy`, `tasks` views |
| Meta-Orchestration | **partial** | Next-action live; full planner stub |
| Orchestration Runtime | **partial** | Workflow steps as tasks; no separate workflow engine service |
| Registry | **partial** | Ontology manager UI + API object types |
| Runtime Graph | **live** | Objects, links, graph explorer views |
| Human Authority | **partial** | Review inbox live; approval queues stub |
| Governance and Audit | **live** | Audit timeline + verify API |
| Product Surfaces | **partial** | Home console; MoO tree is the map |
| `services/*` (identity, graph, …) | **stub** | PRD placeholders in `atlas-repo-tree.js` |
| `packages/*` (policy-engine, …) | **stub** | Logic largely in `ontology-core` + `apps/api` today |

**PRD `atlas/` monorepo tree:** `apps/web`, `apps/api` **live**; most other dirs **stub** per `atlas-repo-tree.js` filesystem scan.

---

## 5. Live dogfood state (Ben, Turn 25)

**Proven commands:**

```bash
cd ~/Documents/Atlas
npm run dev:personal   # or dev:api + dev:web
npm run operational:bootstrap
npm run smoke:operational
# Browser :3000 → Bootstrap Personal Atlas
```

**Seeded next-action:** `object_task_harden_personal_loop` (priority 1).

**MCP handoff** (from brick): `ATLAS_DELEGATION_ID=delegation_001`, `scripts/atlas-mcp-stdio.js`.

**Friction addressed this session:**

- `fetch failed` when API not running → `dev:personal` + UI hint
- Bootstrap panel layout jump in Hermes webview → grid areas + critical CSS
- CI lint on brick doc trailing whitespace → fixed in follow-up commit

**Still true limitations:**

- No auth on Personal Atlas (local trust only).
- Data lost on API restart unless `ATLAS_DATA_FILE` set.
- `AGENTS.md` still says web “does not make live calls” — **stale**; update in a small docs PR after #17 merges.

---

## 6. Deferred / not started (explicit)

From `TASKS.md`:

| Track | Item | Why it waits |
|-------|------|----------------|
| Persistence | Postgres + RLS | After loop proof — file snapshot exists |
| Security | Signed JWT delegations | Model works unsigned locally |
| Tools | OS sandbox profiles | No N1-scale need yet |
| Phase 8 | **D8.1** game-dev domain seed | Next content inch |
| Phase 9 | I9.1 ingestion schemas | Candidate-not-authoritative pipeline |
| Phase 10 | E10.1 tenant/org | No false enterprise claims |
| MVP gates | R1 benchmark fixture count | Behavior benchmarks |

---

## 7. Recommended next bricks (prioritized)

Align with `docs/bricks/HERMES_DOGFOOD_2026-06-29.md` and `/personal/next-action`.

### Brick A — Personal-loop hardening (recommended first)

**Objective:** Make dogfood **trustworthy** before adding domain fiction.

**Likely acceptance criteria (from seeded task theme):**

- Read-only GET proofs for personal routes (tests).
- Reject completing blocked tasks (dependency graph).
- Acceptance criteria fields enforced on all seeded personal tasks.

**Files likely touched:**

- `apps/api/src/` personal routes + task completion
- `apps/api/test/` personal / next-action tests
- `packages/ontology-core/` if shared validation
- `CONTEXT_LOG.md` turn on completion

**Verification:**

```bash
npm test
npm run smoke:operational   # regression
# manual: bootstrap → attempt complete blocked task → expect 4xx
```

### Brick B — D8.1 game-development domain pack

**Objective:** Next-action returns **concrete AAA** actions from fixtures, not generic labels.

**Files likely touched:**

- `tests/fixtures/` domain records
- Seed scripts / bootstrap payloads
- Tests asserting next-action payload shape

**Verification:** `npm test`, fixture count checks per `TASKS.md` Phase 8 row.

### Brick C — Docs hygiene (small, parallel)

- Update `AGENTS.md` web bullet to describe live API-backed MoO explorer.
- Ensure `docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md` path exists or fix reference.

### Brick D — Merge PR #17

- Confirm CI green (lint + test + verify migrations).
- Squash merge; dogfood on `main` with file-tree UI.

---

## 8. Risks, tradeoffs, open questions

| Risk | Mitigation |
|------|------------|
| **Stub-heavy MoO tree over-promises** | Keep stub labels; link panes to API or “not wired” copy |
| **In-memory personal state** | Document `ATLAS_DATA_FILE`; set in Ben’s `dev:personal` env when ready |
| **Hermes webview resize layout** | Fixed grid; if flicker persists, test only in external browser |
| **Role drift (Hermes implements)** | Bricks + CONTEXT_LOG; Codex/Cursor own PRs |
| **Brain dump / Atlas mid-2026 gap** | MoO tasks may be ahead of `~/Desktop/my-brain-dump` ingest — treat TASKS.md + CONTEXT_LOG as source of truth for repo |

**Open questions for Ben:**

1. After Brick A, is **game-dev D8.1** still the right domain, or WORLDVIEW / pipeline-gates content first?
2. Should `ATLAS_DATA_FILE` be default in `dev:personal` for Ben’s machine?
3. Is PR #17 the last UI-only PR before Brick A, or more explorer panes (goal-contract editor) wanted first?

---

## 9. Progress metrics (snapshot)

| Metric | Value |
|--------|--------|
| Tests | ~151 pass locally (pre-#17); CI target same |
| CONTEXT_LOG turns | Through Turn 25 |
| Open PRs | #17 (MoO file-tree UI) |
| Completed N/O tracks | N0–N6, O1–O4 per TASKS.md |
| MoO tree nodes **live** | ~10 panes via `?view=` (see `UI_MOO_FILE_TREE.md`) |
| Operational delegation | `delegation_001` (regenerated per bootstrap) |

---

## 10. How to use this document

1. **Merge PR #17** when CI is green.
2. **Pick Brick A or B** — default **A** per brick recommendation.
3. **Codex/Cursor:** one PR per brick; Hermes updates brick + CONTEXT_LOG only.
4. **Re-run dogfood checklist** from §5 after each merge.

---

## Appendix: Key file index

| Purpose | Path |
|---------|------|
| Task truth | `TASKS.md` |
| Session log | `CONTEXT_LOG.md` |
| MoO UI contract | `docs/UI_MOO_FILE_TREE.md` |
| Dogfood handoff | `docs/bricks/HERMES_DOGFOOD_2026-06-29.md` |
| MoO tree data | `apps/web/src/moo-tree.js` |
| Repo tree data | `apps/web/src/atlas-repo-tree.js` |
| Agent rules | `AGENTS.md`, `.agent/skills/the-algorithm/SKILL.md` |
| Operational entry | `scripts/operational-bootstrap.js`, `scripts/operational-smoke.js` |
| MCP | `scripts/atlas-mcp-stdio.js` |
| Dev both servers | `scripts/dev-personal.js`, `npm run dev:personal` |

---

*Plan authored in Hermes plan mode — no repo mutations except this file.*