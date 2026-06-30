# ADR: Atlas + MoO import map (Paperclip graft inventory)

**Status:** accepted (planning — no code ports in this doc)
**Date:** 2026-06-30
**Task:** PA-P2M0
**Tracker:** `TASKS.md` § PA-P2M
**Architecture:** `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md`

## Purpose

Before grafting Atlas knowledge + MoO surfaces into the Paperclip trunk, every legacy differentiator
must have an explicit disposition: **graft**, **bridge**, **retire**, **defer**, or **keep-ref**.
This ADR is the inventory Ben/Codex use for PA-P2M1–M7 and PA-P2.

**Rule:** no blind ports. If a legacy file is not listed here, it does not move.

## Disposition legend

| Disposition | Meaning |
| --- | --- |
| **graft** | Port logic to the Paperclip target path; legacy becomes reference-only |
| **bridge** | Thin shim calling Paperclip API during migration (max one release) |
| **retire** | Paperclip already implements; delete legacy path after parity test |
| **defer** | Out of Public Atlas scope (P5 / H-* trust hardening) |
| **keep-ref** | Unchanged until PA-P3 epic gate; used for migration tests only |

## Paperclip primitive map (authority)

| Unified PRD / Atlas concept | Paperclip primitive (live) | Atlas legacy | Disposition |
| --- | --- | --- | --- |
| Workspace / tenant | `Company` | `Workspace` in ontology-store | **retire** → Company |
| Scoped delegation | Agent key/JWT + run-id | `AgentDelegation` bearer | **bridge** → signed JWT (H2) |
| Human authority | Board token + Approvals | review inbox PATCH revoke | **graft** → Approvals API |
| GoalContract | Goals & Projects | `GoalContract` objects | **graft** → Goals mapping (PA-P2M4) |
| Audit ledger | Activity log | hash-chained `AuditEvent` | **graft** → audit-chain sidecar (PA-P2a/g) |
| Tool Router | Adapter registry + plugins | `agent-gateway.js` | **graft** → tools/adapters (PA-P2M1) |
| Knowledge graph | — (none) | ontology records + tools | **graft** → PA-P2e–h |
| Heartbeat / cron | Routines | Hermes cron docs | **bridge** → Routines + skills (PA-P2M6) |
| Budget cap | Costs | delegation display stub | **retire** → Costs |
| MCP transport | `@paperclipai/mcp-server` (exists) | `atlas-mcp-stdio.js` | **graft** → PA-P2M2 |

---

## 1. `apps/api/src/` — file inventory

Every file below **must** appear in this table (enforced by `scripts/test/import-map.test.js`).

| Legacy file | Responsibility | Paperclip target | Task | Disposition |
| --- | --- | --- | --- | --- |
| `agent-gateway.js` | Tool manifest, dispatch, verification order, 15 tools | `server/src/routes/` tool/plugin surface + `packages/adapters/` | PA-P2M1 | **graft** |
| `server.js` | HTTP router: workspaces, agents, delegations, audit, personal, agent gateway | `server/src/routes/` + `server/src/app.ts` middleware | PA-P2M1, PA-P2g | **bridge** then **retire** |
| `ontology-store.js` | In-memory store: objects, links, policy, GoalContract, review, audit, agents | `packages/atlas-ontology/` + `server/.../knowledge/` + Paperclip DB | PA-P2b–h, PA-P2M3–4 | **graft** |
| `personal-atlas.js` | Personal workspace bootstrap, five-task spine, overview | Paperclip `Company` kind + Goals/Projects for personal pack | PA-P2M5 | **graft** |
| `next-action.js` | Next-action selector over task graph | Paperclip Issues/Goals priority + atlas next-action rules | PA-P2M5 | **graft** |
| `persistence.js` | `ATLAS_DATA_FILE` JSON snapshot | Paperclip DB + optional export; PS-P1 Postgres path | PA-P2M5, PS-P1 | **bridge** then **retire** |
| `github-client.js` | GitHub open-PR-not-merge tool backend | `packages/adapters/` GitHub adapter (new or extend) | PA-P2M7 | **graft** |
| `slack-client.js` | Read-only Slack channel info | `packages/adapters/` Slack adapter (new or extend) | PA-P2M7 | **graft** |

### 1.1 `agent-gateway.js` — tool-level graft map

| Tool | Legacy handler | Paperclip target | Task |
| --- | --- | --- | --- |
| `get_workspace_overview` | workspace stats | Company dashboard summary API | PA-P2M1 |
| `query_object` | object fetch | knowledge entity fetch | PA-P2e |
| `list_objects` | object list | knowledge entity list | PA-P2e |
| `search_records` | scoped search | knowledge search tool | PA-P2M1, PA-P3d |
| `traverse_graph` | one-hop links | knowledge traverse (bounded multi-hop PA-P3e) | PA-P2M1 |
| `get_available_actions` | policy-annotated actions | company action catalog + policy | PA-P2M3 |
| `get_next_action` | task selector | Issues/Goals next-action | PA-P2M5 |
| `run_action` | governed action run | company-scoped mutation + Activity + audit-chain | PA-P2M3 |
| `github.open_pr` | open PR, no merge | GitHub adapter | PA-P2M7 |
| `submit_artifact` | artifact record | knowledge Artifact route | PA-P2f |
| `attach_evidence` | evidence link | knowledge Evidence route | PA-P2M1, PA-P3d |
| `generate_review_packet` | review summary | Approvals + Activity export | PA-P2M4 |
| `slack.get_channel_info` | Slack read | Slack adapter | PA-P2M7 |
| `verify_audit_chain` | hash-chain verify | `GET /audit/verify` | PA-P2g |
| `list_goal_contracts` | read GoalContracts | Goals API (read) | PA-P2M4 |
| `list_delegations` | read delegations | Agents API (read) | **retire** (Paperclip native) |

### 1.2 `server.js` — route-level graft map

| Route group | Legacy path | Paperclip target | Disposition |
| --- | --- | --- | --- |
| Health | `GET /health` | `GET /api/health` | **retire** |
| Workspaces CRUD | `/workspaces/*` | `/api/companies/*` | **retire** |
| Users / memberships | `/users`, memberships | Paperclip auth + company members | **retire** |
| Object types / instances | `/workspaces/:id/objects/*` | `server/.../knowledge/*` | **graft** PA-P2e–f |
| Links / object sets | link routes | knowledge graph links | **graft** PA-P2e |
| Actions / runs | action routes | Issues + Activity + audit-chain | **graft** PA-P2M3 |
| Policies | policy routes | company policy middleware | **graft** PA-P2M3 |
| GoalContracts | goal contract routes | Goals & Projects | **graft** PA-P2M4 |
| Review packets | review routes | Approvals workflow | **graft** PA-P2M4 |
| Agents / delegations | `/agents`, delegations | Paperclip Agents + tokens | **retire** |
| Agent gateway | `/agent/manifest`, `/agent/tools/:tool` | plugin tool registry + MCP | **graft** PA-P2M1–2 |
| Audit verify | `GET /audit/verify` | `server/.../audit-chain/verify` | **graft** PA-P2g |
| Personal spine | `/personal/*` | Company kind + bootstrap fixture | **graft** PA-P2M5 |
| Board revoke | `PATCH .../agent-delegations/:id` | Approvals / token revoke (human) | **retire** → Board |

---

## 2. `packages/ontology-core/` — graft map

| Export / concern | Paperclip target | Task | Disposition |
| --- | --- | --- | --- |
| `RECORD_TYPE_SPECS`, validators | `packages/atlas-ontology/` | PA-P2b | **graft** |
| `validateRecord`, `validateRecordSet` | server knowledge write path | PA-P2f, PA-P2h | **graft** |
| Lifecycle / review enums | atlas-ontology + promotion gate | PA-P3c | **graft** |
| `canonicalJson`, `auditEventHash`, `verifyAuditEventChain` | `server/.../audit-chain/` | PA-P2a, PA-P2g | **graft** |
| `createHealthStatus` | — | — | **retire** (use Paperclip health) |

---

## 3. Atlas scripts — graft map

| Script | Role | Paperclip target | Task | Disposition |
| --- | --- | --- | --- | --- |
| `atlas-mcp-stdio.js` | MCP stdio transport | Wire to Paperclip API or `@paperclipai/mcp-server` | PA-P2M2 | **graft** |
| `atlas-mcp-lib.js` | MCP framing + tool call | shared lib under `packages/atlas-mcp/` or scripts bridge | PA-P2M2 | **graft** |
| `atlas-local-session.js` | Session file reader | Paperclip CLI context / company token file | PA-P2M2 | **graft** |
| `operational-bootstrap.js` | Mint delegation + session | `paperclipai onboard` + company fixture | PA-P2M5 | **graft** |
| `operational-support.js` | Session publish, smoke helpers | Paperclip CLI + test fixtures | PA-P2M5 | **bridge** |
| `dev-personal.js` | Personal :4000 dev | `pnpm run dev:server` + legacy :4000 until parity | PA-P2M5 | **bridge** |
| `atlas-personal-daemon.js` | launchd personal API | defer until PS-P1 or Paperclip deploy mode | PS-P1 | **defer** |
| `agent-smoke.js` | E2E agent loop proof | `scripts/test/knowledge-pack.test.js` on fork | PA-P3g | **graft** |
| `operational-smoke.js` | MCP operational smoke | Paperclip company smoke | PA-P2M5 | **graft** |
| `personal-smoke.js` | Personal spine smoke | personal company fixture smoke | PA-P2M5 | **graft** |
| `polish-quickstart-smoke.js` | Legacy :4000 gate | keep until `apps/api` retired | — | **keep-ref** |
| `validate-records.js` | Record fixture validation | root CI script on fork | PA-P2h | **graft** |
| `lint.js` | Atlas-owned lint | skip Paperclip trees; merge later | — | **keep-ref** |
| `run-gate-ledger.js` | Verification ledger | extend for Paperclip gates | PA-P1g+ | **bridge** |
| `github-open-pr-smoke.js` | GitHub tool proof | adapter smoke on fork | PA-P2M7 | **graft** |
| `momentum-pulse.js` | Hermes heartbeat read | Paperclip Routine + NEXT_ACTION | PA-P2M6 | **bridge** |

---

## 4. `.agent/skills/` — worker instruction map

Skills are **not ported as code**; they instruct workers (Hermes/Codex) operating on Paperclip hires.

| Skill | MoO role | Paperclip hire / surface | Task | Disposition |
| --- | --- | --- | --- | --- |
| `atlas-moo-dogfood-loop` | entry loop | company + agent roster | PA-P2M6 | **graft** (doc paths) |
| `atlas-ontology-delta-capture` | Librarian | knowledge write tools | PA-P2M1 | **graft** |
| `moo-goal-contract-routing` | Lead | Goals & Projects | PA-P2M4 | **graft** |
| `moo-tool-execution-runbook` | Worker | adapter registry | PA-P2M1 | **graft** |
| `atlas-moo-verification-loop` | Verifier | audit verify + tests | PA-P2g | **graft** |
| `atlas-run-trace-audit` | Safety | Activity + audit-chain | PA-P2a | **graft** |
| `approval-fatigue-filter` | Owner | Approvals inbox | PA-P2M4 | **graft** |
| `zero-trust-orchestration` | cross-cutting | agent JWT + tool router | H2, PA-P5 | **defer** partial |
| `the-algorithm` | cross-cutting | — | — | **keep-ref** (process) |
| Others (enterprise, transparency, packaging) | planning | doc links in SPEC | PA-P2M6 | **keep-ref** |

**Hermes bundle:** `docs/HERMES_SKILL_BUNDLE.md` → reference in `docs/SPEC.md` + Paperclip agent prompt templates (PA-P2M6).

---

## 5. Other legacy surfaces

| Path | Disposition | Target / note |
| --- | --- | --- |
| `apps/web/` | **retire** after PA-P4 | Paperclip `ui/` + atlas knowledge view |
| `infra/migrations/` | **graft** reconcile | merge with `packages/db/` schema (PS-P1) |
| `outputs/` shelf | **keep-ref** | public docs, proofs, site — not server code |
| `tests/fixtures/capability-records.*.json` | **graft** | seed knowledge pack PA-P3b |
| `tests/integration/*.test.js` | **bridge** | run on atlas-ontology until fork CI owns validation |

---

## 6. Implementation order (after this ADR)

```text
PA-P2a (audit ADR detail) → PA-P2b–c (atlas-ontology)
  → PA-P2d (company ↔ workspace)
  → PA-P2e–f (knowledge routes)
  → PA-P2g–h (audit verify + validate:records)
PA-P2M1 (tools) ∥ after PA-P2d
PA-P2M2 (MCP) after PA-P2M1
PA-P2M3–4 (policy + GoalContract) after PA-P2d
PA-P2M5 (bootstrap smokes) after PA-P2M2
PA-P2M6 (skills doc) anytime after PA-P2M0
PA-P2M7 (GitHub/Slack adapters) after PA-P2M1
PA-P3 (knowledge pack dogfood) after PA-P2 + PA-P2M1
```

---

## 7. Legacy retirement criteria (`apps/api`)

Delete or archive `apps/api` only when **all** are true:

1. PA-P3g `knowledge-pack.test.js` passes on Paperclip server (:3100).
2. PA-P2g `/audit/verify` returns `{ valid: true }` on fork mutations.
3. PA-P2M5 operational + personal smokes pass against Paperclip company fixtures.
4. `npm run test:atlas` scoped tests have Paperclip equivalents or are explicitly retired in this doc.
5. Ben sign-off on PA-P3 epic gate.

Until then: **`apps/api` stays keep-ref** on :4000 for migration proofs.

---

## 8. Explicit non-goals (defer)

| Item | Defer to |
| --- | --- |
| Signed JWT subset delegation proof | H2 / PA-P5 |
| Postgres RLS tenant isolation | PS-P1 / PA-P5 |
| Classification propagation | PA-P5 |
| Lean/ZK proof hooks | PA-P5 |
| OS-level tool sandbox profiles | PA-P5 |
| Full Paperclip vitest in `npm test` | optional CI lane (`npm run test:paperclip`) |

---

## 9. Acceptance (PA-P2M0)

- [x] Every `apps/api/src/*.js` file appears in §1 table.
- [x] Tool-level map covers all 15 `AGENT_TOOLS` names.
- [x] Ontology-core hash-chain exports mapped to PA-P2g.
- [x] PA-P2M1–M7 tasks in `TASKS.md` trace to this doc.
- [x] `scripts/test/import-map.test.js` enforces §1 file coverage.

**Next task:** PA-P2a — Activity ↔ hash-chain integration ADR (`docs/bricks/2026-06-30-audit-activity-integration.md`).
