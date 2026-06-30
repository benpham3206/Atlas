# Atlas system + orchestrator mixture — progress map (personal address)

**Personal address:** `workspace_personal` · API `http://127.0.0.1:4000` · UI `http://127.0.0.1:3000`
**Goal object:** `object_personal_project_orchestrator_map`
**Updated:** 2026-06-29
**Canonical spine:** `outputs/internal/PERSONAL_WORKSPACE_STATUS.md` (five roadmap tasks)

This document maps **how far Atlas is** and **which orchestrator owns which lane** for Ben’s dogfood stack. It is the human-readable companion to the Personal Project goal in ontology.

---

## 1. Atlas system (product + runtime)

| Layer | Status | Proof / pointer |
| --- | --- | --- |
| **Ontology API** (`apps/api`) | **live** | Personal + operational routes, audit chain, agent manifest |
| **Personal cockpit** (`apps/web`) | **live** | File-tree UI, next-action, bootstrap, task complete with evidence |
| **JSON persistence** | **live** | `ATLAS_DATA_FILE` + launchd (`daemon:handoff`) |
| **Postgres + migrations** | **todo** | Personal task P2 `object_task_runtime_foundation` |
| **Policy on every mutation** | **partial** | Agent gateway + personal guards; full PermissionCheck = P3 |
| **Public / enterprise layers** | **todo** | P4–P5 on personal spine |

---

## 2. Mixture of orchestrators (who does what)

| Orchestrator | Role in Ben’s stack | Maturity | Atlas surface |
| --- | --- | --- | --- |
| **Hermes / JARVIS** | Architecture, dogfood, MCP client, memory/skills, cron | **live** | Personal reads/patch via MCP; terminal on clone |
| **Codex** (ChatGPT Edu) | Primary implementation, PRs | **live** | Host sandbox; `github.open_pr` via delegation only |
| **Cursor Pro** | Local agentic coding (Auto, Composer) | **live** | Same clone; not in Atlas audit unless artifact attached |
| **Atlas agent gateway** | Governed tools, GoalContracts, delegations | **partial** | `workspace_operational_dogfood`, 16+4 MCP tools |
| **Operational bootstrap** | Session file, smoke, delegation mint | **live** | `npm run operational:bootstrap`, `.atlas/local-session.json` |
| **Meta-orchestrator** (PRD) | Classify intent, route orchestrators | **stub** | MoO tree — strategy selector, router |
| **Paperclip / Board** (pattern) | Company hires, pause delegations | **partial** | `?view=board`, GoalContracts read |
| **Matrix.build** (polish bar) | Product craft reference | **reference** | Parallel polish program, not personal tasks |

**Control loop (today):**

```text
Ben intent
  → Personal Atlas (tasks, evidence, next-action)
  → Hermes (plan, MCP, handoff)
  → Codex/Cursor (implement in ~/Documents/Atlas)
  → Atlas API (artifacts, audit, optional PR dry-run)
  → Human merge / complete task with artifact_uri
```

---

## 3. Progress vs personal spine

| Personal task | Orchestrator-heavy work | Progress |
| --- | --- | --- |
| P1 Harden personal loop | Hermes + launchd + MCP | **done** |
| P2 Runtime foundation | Codex/Cursor + API | **todo** (next-action) |
| P3 Policy + audit | Gateway + store | **blocked** on P2 |
| P4 Public Atlas | Review + publish | **blocked** on P3 |
| P5 Enterprise | Tenant isolation | **blocked** on P3 |

**Parallel (not spine):** polish E1–E7, `outputs/internal/NEXT_ACTION.md`, branch `polish/e1-outputs-shelf`.

---

## 4. MCP personal surface (Hermes)

| Route | Purpose |
| --- | --- |
| `GET /personal/overview` | Full cockpit |
| `GET /personal/tasks` | Tasks + blockers |
| `GET /personal/next-action` | Unblocked highest priority |
| `PATCH /personal/objects/:id` | Progress notes / reopen (not `done`) |
| `POST /personal/tasks/:id/complete` | Governed completion |

Operational MCP session may still be `workspace_operational_dogfood` — personal routes do not require matching workspace id.

---

## 5. Maintenance tasks (ontology)

| Task ID | Purpose |
| --- | --- |
| `object_task_orch_map_publish` | Keep this file aligned with overview + MoO tree status |
| `object_task_orch_map_reconcile` | Quarterly: operational GoalContracts ↔ personal carbon copy |

Priorities **10+** so they do not preempt spine next-action.

---

## 6. Update rule

When a lane moves (e.g. Postgres lands, meta-orchestrator stub → partial):

1. Edit this file + `PERSONAL_WORKSPACE_STATUS.md` if spine changes.
2. `PATCH` carbon copy `orchestrator_progress_map` if URI changes.
3. Attach evidence on governed completes only — not status PATCH to `done`.