# Personal Atlas workspace — progress (canonical)

**Workspace:** `workspace_personal`
**Updated:** 2026-06-29
**Read in UI:** Personal home + `?view=next-action` · API: `GET /personal/overview`

This file is the **human-readable map** for the personal cockpit. Operational dogfood (`workspace_operational_dogfood`) and polish program (`outputs/internal/NEXT_ACTION.md`) are **parallel tracks** — not substitutes for this spine.

**Orchestrator mixture map (goal):** `outputs/internal/ATLAS_ORCHESTRATOR_PROGRESS_MAP.md` · ontology project `object_personal_project_orchestrator_map`.

## Spine (roadmap tasks)

| Priority | Task ID | Status | Meaning |
| --- | --- | --- | --- |
| 1 | `object_task_harden_personal_loop` | **done** | launchd `:4000`, `ATLAS_DATA_FILE`, `smoke:personal`, MCP session hygiene |
| 2 | `object_task_runtime_foundation` | **todo** | **Postgres** + migrations + object history tests — *not* file JSON persistence |
| 3 | `object_task_policy_audit` | **todo** | PermissionCheck on mutations + append-only AuditEvent (blocked until #2 done) |
| 4 | `object_task_public_atlas` | **todo** | Reviewed publish layer |
| 5 | `object_task_enterprise_workspace` | **todo** | Tenant / org foundations |

**Live next-action:** `GET /personal/next-action` — currently **`object_task_runtime_foundation`** (priority 2).

## Parallel: Matrix polish program (not personal tasks)

| Epic | Status | Pointer |
| --- | --- | --- |
| E1–E5 | done | `docs/bricks/2026-06-29-polish-program.md` |
| E6–E7 | mechanism + minimal site | `npm run gate:*`, `outputs/site/index.html` |
| Wrap-up | uncommitted branch | `polish/e1-outputs-shelf` — ledger + PR |

Polish “now what”: `outputs/internal/NEXT_ACTION.md` (operational file-tree track).

## Evidence (done work)

- Harden: `docs/evidence/personal-atlas-harden-2026-06-29.md`
- Competitive bar: `outputs/docs/POLISH_SCORECARD.md` + `matrix-hermes-product-craft`

## Governance

- Complete personal tasks only via `POST /personal/tasks/:id/complete` with `artifact_uri` + `evidence_note`.
- Do not mark **runtime foundation** done until Postgres acceptance criteria are met (see `TASKS.md`).