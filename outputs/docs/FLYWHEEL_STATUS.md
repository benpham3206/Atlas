# Internal momentum flywheel — status (110–120%)

**Updated:** 2026-06-30
**Playbook:** `outputs/internal/GIANTS_DOGFOOD_MOMENTUM.md`
**Verify:** `npm run flywheel:check` · `npm run momentum:pulse`

## Target tiers

| Tier | Meaning |
|------|---------|
| **100%** | Pulse + compound + docs aligned; no dual-spine confusion |
| **110%** | + watchdog crons + weekly turn cron + `flywheel:check` in repo |
| **120%** | + compounder reads this file + PA weekly turn evidence in `CONTEXT_LOG` / `TASKS.md` |

## Rhythm inventory (Hermes profile)

| Job | Cadence | Deliver | Role |
|-----|---------|---------|------|
| Atlas Giants momentum | 9am, 5pm | Photon | Pulse agent: `momentum:pulse`, Ben inch from **Now** (Doc Do), Hermes executes one upgrade |
| Capability compounder | 7am | origin | Bidirectional skill/memory + Ben brick aligned with `NEXT_ACTION.md` |
| Atlas personal heartbeat | 120m | origin | Silent if OK; next-action title when up |
| Atlas momentum watchdog | 90m | Photon | **no_agent** — only if `:4000` down |
| Atlas weekly company turn | Mon 10am | Photon | **attach_to_session** — PA-* or spine turn |
| Hermes docs drift notify | 6h | Photon | Upstream Hermes docs only on drift |
| Photon iMessage watchdog | 20m | origin | Gateway/sidecar health — fix if error streak |

## Sprint mode (Public Atlas)

While `NEXT_ACTION.md` § Public Atlas is active:

- **Ben inch** = current **PA-P*** task in **Cursor** (not ontology spine title).
- **Weekly turn** = complete one PA-* slice + gate + `TASKS.md` checkbox + optional `CONTEXT_LOG` epic line (not `POST /personal/complete` for smoke).
- **Pulse** prints **Now:** first; spine labeled **deferred**.

## 110% checklist

- [x] `momentum:pulse` sprint-aware output
- [x] `npm run flywheel:check`
- [x] `FLYWHEEL_STATUS.md` (this file)
- [x] Giants + compounder skills reference sprint mode
- [x] Hermes crons: watchdog (`7b713650a883`) + weekly turn (`d21ab2c2beff`) registered
- [ ] 4 consecutive weeks: pulse ok + one traced turn (PA or personal) with evidence
- [ ] `POLISH_SCORECARD` flywheel row ≥ 2

## 120% stretch

- Compounder prep includes `flywheel:check` result in signals JSON (optional script hook).
- Monday turn auto-suggests Cursor handoff block from `TASKS.md` active PA row.
- Scorecard **operating metaphor** ≥ 2 after Paperclip trunk boot smoke passes (PA-P1 gate).

## Recovery

1. `outputs/internal/NEXT_ACTION.md`
2. `npm run daemon:handoff` if pulse silent / watchdog fired
3. `hermes gateway restart` if Photon delivery fails (see photon-imessage-watchdog)
4. `npm run dev:personal` for legacy `:4000` personal spine during graft phase