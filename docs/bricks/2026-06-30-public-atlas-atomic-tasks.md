# Brick: Public Atlas atomic tasks (Paperclip-first)

**Status:** active sprint backlog (doc-only decomposition)
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

**Errata vs framework §4:** the framework table uses `paperclip/packages/atlas-ontology/` and
`paperclip/server/.../knowledge/*`. Under root-trunk layout, paths are `packages/atlas-ontology/`
and `server/.../knowledge/*` at repo root — not under a `paperclip/` subdirectory.

## Epic gates

| Epic | Done when |
| --- | --- |
| **PA-P1** | Tag `atlas-pre-paperclip-v0`; Paperclip boots; health + openapi smoke; SPEC index + spec-index test; legacy gates green; no graft |
| **PA-P2** | atlas-ontology mounted; company-scoped knowledge routes; `/audit/verify` green; `validate:records` PASS |
| **PA-P3** | Seven staff fixtures; one knowledge pack end-to-end; promotion blocked without evidence; `knowledge-pack.test.js` green |
| **PA-P4** | Encyclopedia hero (not agent-company); site-smoke; forker quickstart doc |

## Atomicity rules

- One PR, one outcome; ~300 LOC target (except PA-P1b fork import).
- Tests named before implement; ADR tasks when integration pattern unknown.
- Non-goals required on every task — keeps P5 (RLS, JWT proof, Lean/ZK) out of PA-P1–P4.
- Do not delete `apps/api` until PA-P3 epic gate passes.

## Dependency order

```text
PA-P0.1 → PA-P1a → PA-P1b…P1g → PA-P2a…P2h → PA-P3a…P3g → PA-P4a…P4d → PA-P5 backlog
                              ↘ PS-P1 unblocked after PA-P1 epic gate
```

## Hard gates (do not skip)

1. **PA-P2 audit graft** — `/audit/verify` must pass before treating fork as Atlas; proof moat is non-negotiable.
2. **PA-P3 knowledge pack** — end-to-end lifecycle loop must work before public slice.
3. **PA-P4 re-hero** — product must read as proof-closed encyclopedia (§1.1), not Paperclip agent-company.

## Next action

**PA-P1a** — tag `atlas-pre-paperclip-v0` on current green tree. See `outputs/internal/NEXT_ACTION.md`.

## Non-goals (this brick)

- Executing PA-P1b fork import (separate implementation PR).
- Postgres personal spine until PA-P1 epic gate.
- Literal git history merge with Paperclip upstream.
