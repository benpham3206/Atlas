# Brick: Public Atlas atomic tasks (Paperclip-first)

**Status:** PA-P1 in progress (root-trunk import)
**Date:** 2026-06-30
**Architecture:** `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md`
**Tracker:** `TASKS.md` § Public Atlas (Paperclip pivot)

## Intent

Decompose the Paperclip fork pivot into PR-sized atomic tasks so Codex/Cursor can implement
straightforwardly without stopping for scope or naming decisions.

## Locked decisions

1. **Priority:** Public Atlas Paperclip pivot (PA-*) before personal spine Postgres (PS-*).
2. **Layout:** Paperclip at **repo root** — `server/`, `ui/`, `cli/`, `packages/adapters/`.
3. **Graft target:** `packages/atlas-ontology/` (from `packages/ontology-core/`).
4. **Migration reference:** keep `apps/api` and `packages/ontology-core` until PA-P3 epic gate.
5. **Merge means port**, not unrelated-histories git merge.

## Lane prefixes

| Prefix | Lane | When |
| --- | --- | --- |
| **PA-** | Public Atlas / Paperclip pivot | **Now** |
| **PS-** | Personal spine (Postgres, policy, publish) | After PA-P1 epic gate |
| **H-** | Trust hardening (JWT, RLS, trace records) | After PA-P4 or parallel when unblocked |

## Root-trunk layout

```text
server/          ui/          cli/           # Paperclip trunk (imported at root)
packages/adapters/                           # Paperclip adapters
packages/atlas-ontology/                     # grafted PA-P2 (from ontology-core)
apps/api/          packages/ontology-core/  # migration reference (unchanged until parity)
outputs/  .agent/  infra/migrations/         # kept
docs/SPEC.md                                 # PA-P1f index
```

## Epic gates

| Epic | Done when |
| --- | --- |
| **PA-P1** | Tag `atlas-pre-paperclip-v0`; Paperclip boots; health + openapi smoke; SPEC index + spec-index test; legacy gates green; no graft |
| **PA-P2M** | Import inventory ADR merged; agent/MCP/policy/GoalContract/adapters mapped; all legacy differentiators live or retired |
| **PA-P2** | atlas-ontology mounted; company-scoped knowledge routes; `/audit/verify` green; `validate:records` PASS |
| **PA-P3** | Seven staff fixtures; one knowledge pack end-to-end; promotion blocked without evidence; `knowledge-pack.test.js` green |
| **PA-P4** | Encyclopedia hero (not agent-company); site-smoke; forker quickstart doc |

## Dependency order

```text
PA-P0.1 → PA-P1a → PA-P1b…P1g → PA-P2M0…P2M7 → PA-P2a…P2h → PA-P3a…P3g → PA-P4a…P4d → PA-P5 backlog
                              ↘ PS-P1 unblocked after PA-P1 epic gate
```

**Queued after PA-P1 (not during trunk import):** **PA-P2M** — import everything Atlas + MoO related into Paperclip (inventory ADR first, then tool/MCP/policy/GoalContract/adapter ports). PA-P2 knowledge + proof graft runs inside this track.

## Hard gates (do not skip)

1. **PA-P2 audit graft** — `/audit/verify` must pass before treating fork as Atlas; proof moat is non-negotiable.
2. **PA-P2M inventory** — no blind ports; every legacy differentiator must appear in the graft map before code moves.
3. **PA-P3 knowledge pack** — end-to-end lifecycle loop must work before public slice.
4. **PA-P4 re-hero** — product must read as proof-closed encyclopedia (§1.1), not Paperclip agent-company.

## Next action

**PA-P2d** — Company ↔ workspace mapping. Audit ADR + `packages/atlas-ontology/` done (PA-P2a–c).

## Test commands (post-import)

| Command | Purpose |
| --- | --- |
| `npm run test:atlas` | Legacy Atlas `node --test` suite (migration reference) |
| `npm run test:import` | Layout + SPEC index + upstream remote smoke |
| `npm run test:paperclip` | Full Paperclip vitest suite (`test:run:general`) |
| `PAPERCLIP_LIVE_SMOKE=1 npm run test:import` | Live `/api/health` + `/api/openapi.json` (server on :3100) |

## Non-goals (this brick)

- Postgres personal spine until PA-P1 epic gate.
- Literal git history merge with Paperclip upstream.
- Deleting `apps/api` before PA-P3 epic gate.
