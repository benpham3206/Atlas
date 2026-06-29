# Brick — Alice Duo project Atlas entry (Ben)

**Date:** 2026-06-29
**Architect:** Hermes
**Implementers:** Codex/Cursor for UI/bootstrap improvements if needed

## Intent

Capture Ben's **custom Alice Duo keyboard** build as Personal Atlas ontology (not only Hermes skill prose): `Personal Project` + phased `Personal Task` objects with blocker links and measurable acceptance criteria.

## Ontology delta

| Type | ID | Notes |
|------|-----|--------|
| Personal Project | `object_personal_project_alice_duo` | name, description, goal |
| Personal Task | `object_task_alice_phase_0` … `_4` | priorities 10–14 (below Atlas spine 1–5 in queue) |
| Link (blocks) | `link_alice_p0_blocks_p1` … | linear phase dependencies |
| Artifact | `evidence/projects/alice-duo-custom-build.md` | evidence_uri for task completion |

**Lifecycle:** `candidate` until Ben reviews in UI; tasks drive next-action when Atlas spine tasks are done or priorities adjusted.

## Gap (v0 personal UI)

`getPersonalOverview()` returns a **single** hardcoded project (`object_personal_project_atlas`). Additional projects created via API exist in the store but do not appear in overview `project` field.

**Acceptance for follow-up PR (optional):**

- `GET /personal/overview` lists `projects[]` (all `object_type_personal_project` instances), or
- Seed Alice project in `bootstrapPersonalAtlas()` when Ben flags a env var, or
- `?view=projects` panel in web app.

## Research artifact (filled 2026-06-29)

Canonical spec: `evidence/projects/alice-duo-custom-build.md`

- QK Alice Duo reference table (layout, flex PCB, dual-hinge, pod/display/knob, POGO, ~$289)
- Ben requirements + **the-algorithm** pass (v1 wired / delete 8000Hz CNC pod-first scope)
- YouTube pipeline map: [qhuydgdiscI](https://www.youtube.com/watch?v=qhuydgdiscI) (KLE → ai03 → KiCad → JLCPCB → firmware)
- Decisions D1–D5, risks, v1/v2 slices, budget envelope

## Verification

```bash
cd ~/Documents/Atlas
curl -sf http://127.0.0.1:4000/health
curl -X POST http://127.0.0.1:4000/personal/bootstrap
curl http://127.0.0.1:4000/workspaces/workspace_personal/objects?object_type_id=object_type_personal_project
curl http://127.0.0.1:4000/personal/next-action
```

## CONTEXT_LOG

Append Turn: INTENT = dogfood personal ontology with hardware project; OUTCOME = project + 5 tasks + links + evidence artifact.