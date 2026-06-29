# Alice Duo custom keyboard — Atlas project artifact

**Lifecycle:** candidate → accepted (Ben review)  
**Atlas project ID:** `object_personal_project_alice_duo`  
**Workspace:** `workspace_personal`  
**Hermes skill:** `custom-alice-duo-build`  
**Sources:** Ben constraints (2026-06-29), QK Alice Duo vendor/review pages, build-process reference video

---

## 1. Reference product — QK Alice Duo (Qwertykeys)

What Ben is riffing on — not a 1:1 clone goal, but the **feature bar** and ergonomics target.

| Area | QK Alice Duo (market / reviews) |
|------|----------------------------------|
| **Layout** | Split **Alice** stagger (ergo angle + split halves for shoulder/wrist) |
| **Case** | CNC aluminum; anodized colors (incl. **Sand Gold**); gasket-style mount with silicone tabs |
| **PCB** | **1.2 mm** with **flex cuts** (hotswap) or **1.6 mm** without flex cuts (hotswap); dual-mode wireless-capable PCB option |
| **Plate** | User choice (e.g. **PC**, FR4); PCB-mounted gasket |
| **Tenting** | **Dual-hinge**: **0° or 5°** (two discrete angles, not continuous) |
| **Halves link** | **POGO pins** between halves; magnetic proprietary **USB-C** charge cable |
| **Wireless** | Separate **pod** (dongle + charge hub); **small display** (battery, connection, OS); **volume knob** on pod; color-matched to kit |
| **Polling** | Claimed **8000 Hz** wired and wireless |
| **Wrist rest** | Optional, color-matched (~$45 add-on) |
| **In box** | Hardshell case; **keycaps not included** |
| **Street price** | ~**$289 USD** kit starting (before shipping, switches, keycaps) — above Ben’s all-in cap |

**Community notes (ergo subs):** praised build/flex/sound; some call Alice split “less ergo” than column-stagger splits — layout is a **conscious trade** (aesthetic + Alice typing vs aggressive column stagger).

**References**

- [Qwertykeys QK Alice Duo](https://www.qwertykeys.com/products/qk-alice-duo)
- [Alexotos review/spec sheet](https://www.alexotos.com/qk-alice-duo/)
- [LumeKeebs / YouTube reviews](https://www.youtube.com/watch?v=RaEeX3A9ssM) (flex PCB, plate swap, Alice split)

---

## 2. Ben requirements (authoritative)

| Field | Value |
|-------|--------|
| **Budget** | **$200–300 all-in** including switches + keycaps |
| **Timeline** | **3–6 months** |
| **Skills** | **CAD + soldering**; **no firmware/software** today |
| **Must-haves (stated)** | Wireless **pod + screen**, **knob**, **USB-C**, **dual hinge** tenting, **PCB modeled after Alice** |
| **Motivation** | Custom project when retail/pre-order isn’t ideal; portfolio/resume angle |

---

## 3. The algorithm (Atlas `.agent/skills/the-algorithm`)

Applied **before** treating QK spec as a checklist. Steps in order: question → delete → simplify → accelerate → automate.

### Step 1 — Question every requirement

| Requirement | Who | Need trace | Verdict |
|-------------|-----|------------|---------|
| Alice layout PCB | Ben | Matches QK reference + typing preference | **Keep** |
| Dual hinge 0/5° | Ben / QK parity | Real ergo benefit at low cost vs continuous tenting | **Keep** (v1: 3D-print hinge mock) |
| USB-C | Ben | Modern power/data; standard parts | **Keep** on main half / pod |
| Knob | Ben / QK pod | Volume/UI — nice, not blocking typing | **Keep** (defer to pod v2 or main-half encoder v1) |
| Pod + **screen** | Ben / QK | Status UI — **high cost + firmware** | **Question** → defer v2 unless scope slips |
| Wireless | Implied by pod | Needs **ZMK + RF** + Ben’s firmware gap | **Question** → **wired v1** |
| 8000 Hz polling | QK marketing | No traced need for Ben | **Delete** |
| Sand Gold CNC aluminum | QK aesthetic | Budget breaker vs $200–300 | **Delete** for v1 → print/CNC later |
| POGO + magnetic proprietary cable | QK | Engineering luxury | **Delete** v1 → USB-C TRRS or single USB on one half |
| Color-matched wrist rest | QK | Optional $45 | **Delete** v1 → print |
| Portfolio documentation | Ben | Resume/dogfood | **Keep** |

### Step 2 — Delete (target ≥10% scope cut)

**Removed from v1 scope:** 8000 Hz, proprietary magnetic cable, aluminum anodize, POGO polish, display pod, wireless, matched wrist rest, full QK in-box hardshell.

**Surviving v1 spine:** Alice split layout, wired dual-mode path, USB-C, hinge tenting prototype, hotswap flex PCB **or** simpler 1.6 mm if flex adds fab risk, knob optional on PCB, Ergogen/KiCad co-design.

### Step 3 — Simplify

- **One PCB revision goal** for v1 (5 pcs JLCPCB).
- **Ergogen** for layout/plate; **KiCad** for PCB (community footprints).
- **Case:** printed gasket/top mount first, not full QK gasket aluminum.
- **Firmware:** not “write from scratch” — **fork ZMK/QMK** for known split; Ben learns **flash + keymap** only (structural gap vs “no software”).

### Step 4 — Accelerate

- **Phase 1 kit** before custom PCB (video-aligned: de-risk solder/matrix).
- **KLE / ai03 plate DXF → CAD** workflow from reference video for fast layout lock.
- **Parallel:** paper layout + kit build while KiCad in evenings.

### Step 5 — Automate (last)

- Do **not** automate keymap generation or CI until v1 types; Atlas **tasks** and evidence files are enough orchestration for now.

### Safety-by-absence (MoO tie-in)

Treat **wireless + display pod** as capabilities that **do not exist** in v1 delegation scope — not “prompt the agent to be careful.” No ZMK scope until explicit Phase 2b task.

---

## 4. Reference video — custom keyboard from scratch

**Video:** [How to build your own keyboard (Summit)](https://www.youtube.com/watch?v=qhuydgdiscI) — luxury custom board process (HHKB, not Alice), still maps to Ben’s pipeline.

| Video phase | Summit (video) | Alice Duo custom mapping |
|-------------|----------------|---------------------------|
| **Planning** | Layout, mount style, manufacturing path | Alice split + tenting + wired v1; budget cap; delete QK luxuries |
| **Layout CAD** | KLE → **ai03 plate generator** → DXF → Fusion 360 | KLE/Ergogen → plate DXF → Fusion/FreeCAD for split + **hinge** |
| **Case** | CNC polycarbonate + laser-cut weights | **3D print** v1; CNC/aluminum = Phase 4 |
| **PCB** | Custom KiCad, notched for case integration | KiCad Alice stagger split, USB-C, hotswap; co-design with case |
| **Fab** | JLCPCB 2-layer (6-layer for exotic) | JLCPCB 2-layer, 5 qty |
| **Firmware** | QMK flash custom PCB | **Gap:** Ben needs guided ZMK/QMK fork + flash session |
| **Assembly** | Plates/switches/lube/sound test | Same; document for portfolio |

**Lesson from video:** co-design case + PCB together; expect **multiple iterations** — perfection not first spin.

---

## 5. Scope slices (v1 / v2)

### v1 — fits budget band ($200–300 with switches/keycaps)

- Wired split Alice PCB (hotswap)
- USB-C on master half
- 3D printed case + **dual-hinge tenting mock** (0/5° style)
- Optional **rotary encoder** on board (knob without pod screen)
- Ergogen + KiCad + one JLC order
- Build log → `evidence/projects/` + photos

### v2 — QK-parity extras (post-v1 or scope + budget)

- Wireless pod, display, color-matched rests
- POGO / premium inter-half
- CNC aluminum + anodize (Sand Gold target)
- ZMK stable on nRF52

---

## 6. Atlas task graph (personal)

| Task ID | Phase | Priority | Blocked by |
|---------|-------|----------|------------|
| `object_task_alice_phase_0` | Research + algorithm scope | 10 | — |
| `object_task_alice_phase_1` | Practice kit | 11 | phase_0 |
| `object_task_alice_phase_2` | Ergogen + KiCad + CAD | 12 | phase_1 |
| `object_task_alice_phase_3` | PCB prototype | 13 | phase_2 |
| `object_task_alice_phase_4` | Polish / portfolio | 14 | phase_3 |

### Acceptance criteria (enriched)

**Phase 0:** Printed Alice layout; SplitKB compare; **algorithm table** (this doc §3) agreed; v1/v2 split written; link this artifact.

**Phase 1:** Split kit built; firmware flashed with tutorial; matrix documented.

**Phase 2:** Ergogen YAML; KiCad gerbers; Fusion hinge + case STLs; USB-C + hotswap verified in schematic review.

**Phase 3:** JLC order #; assembly types; tenting test notes.

**Phase 4:** Public build log; v2 backlog (pod/screen/ZMK/CNC); lessons learned.

---

## 7. Risks (ontology: prose until `Risk` type in personal)

| Risk | Mitigation |
|------|------------|
| Firmware blocker | Schedule one **guided ZMK flash**; fork existing split |
| Pod+screen blows budget/time | v2 only; encoder v1 |
| Flex 1.2 mm fab/yield | Fallback 1.6 mm non-flex for v1 |
| Alice ergo disappointment | Paper test + kit before KiCad |
| Atlas in-memory loss | `ATLAS_DATA_FILE` + this repo evidence |

---

## 8. Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | **Wired v1** | Algorithm delete + Ben firmware gap |
| D2 | **Defer display pod** | Cost/complexity; knob/encoder sufficient v1 |
| D3 | **Ergogen scratch** over mod kit | Alice layout non-negotiable |
| D4 | **3D print before CNC** | Algorithm accelerate + budget |
| D5 | **Evidence in repo** | Survives API restart; audit trail |

---

## 9. Shopping envelope (v1 rough)

| Item | Est. |
|------|------|
| Practice split kit | $40–80 |
| JLCPCB 5× PCB | $30–50 + ship |
| Switches | $30–50 |
| Keycaps | $40–80 |
| 3D filament / hardware | $20–40 |
| **Total** | ~$160–300 (tight at QK-like extras) |

---

*Last updated: 2026-06-29 — Hermes research pass (QK specs + algorithm + YouTube pipeline).*