# Giants-shoulders dogfood (momentum program)

**Problem:** Polish bought shelf + gates; Matrix/Paperclip/Hermes inspiration stayed mostly docs. Momentum = **cadence + one traced company turn**, not more markdown.

**Principle:** Atlas = authority. Hermes = harness + delivery. Matrix = loop semantics. Paperclip = Board + heartbeat. **No new servers** (Algorithm).

## Three rhythms

| Rhythm | Giant | Cadence | Artifact |
|--------|-------|---------|----------|
| **Pulse** | Paperclip heartbeat | 2×/day Hermes cron → Photon | `npm run momentum:pulse` + one-line Ben action |
| **Turn** | Matrix company loop | 1×/week on **live** spine | Governed task complete + real `artifact_uri` |
| **Compound** | Hermes capability flywheel | Weekly (existing or merged cron) | One `skill_manage` patch + one ≤20m Ben brick |

## Daily pulse (Paperclip + Hermes)

1. `launchd` / `:4000` up (`npm run daemon:handoff` if needed).
2. Hermes cron **Atlas Giants momentum** runs skills `atlas-personal-dogfood`, `giants-shoulders-atlas-dogfood`.
3. Agent: `momentum:pulse`, read `NEXT_ACTION.md`, **pick exactly one** Ben move (startable in ≤20m), **execute one** Hermes upgrade (patch skill / fix gap). Photon reply ≤6 lines.

Watchdog (optional, no tokens): Hermes `no_agent` script `~/.hermes/scripts/atlas-momentum-watchdog.sh` → only speaks if API down.

## Weekly company turn (Matrix)

One session, real work on `GET /personal/next-action` (not only `demo:flagship` ephemeral):

1. **Owner** — open `?view=board`; confirm delegation not expiring.
2. **Lead** — read GoalContract / carbon copy; align brick to acceptance criteria.
3. **Worker** — Hermes architects → **Codex/Cursor** implements smallest inch.
4. **System** — `npm run gate:personal` or relevant gate; `audit/verify`.
5. **Proof** — `POST /personal/tasks/:id/complete` with real evidence (never `docs/x.md`).

CI still runs `npm run demo:flagship` (synthetic workspace); weekly turn is **workspace_personal**.

## Scorecard target (4 weeks)

Raise `POLISH_SCORECARD.md` rows to **≥2**: operating metaphor, role legibility, long horizon. Requires: pulse cron live + 4 weekly turns with evidence.

## Anti-patterns (high-agency)

- Architecture essays without `dev:personal` + `/personal/next-action`.
- Marking personal tasks done from smoke tests.
- Heartbeat docs without `hermes cron` entry.
- New UI before pulse + turn habits stick.

## Pointers

- `outputs/docs/HEARTBEAT_CRON.md` — template (superseded by this program + Hermes skill)
- `outputs/demos/FLAGSHIP_LOOP.md` — synthetic loop reference
- `.agent/skills/atlas-moo-dogfood-loop` — full loop when turn is non-trivial
- Skill: `giants-shoulders-atlas-dogfood` (Hermes profile)