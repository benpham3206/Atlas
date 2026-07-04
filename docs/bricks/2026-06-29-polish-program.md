# Brick: Atlas polish program (Matrix · Paperclip · Hermes)

**Status:** E1–E7 complete; gates + ledger on branch `polish/e1-outputs-shelf`
**Plan:** `.hermes/plans/2026-06-29_atlas-polish-matrix-paperclip-hermes.md`
**Status + competitive bar:** `.hermes/plans/2026-06-29_polish-status-competitive-bar.md`
**Scorecard (skill):** `outputs/docs/POLISH_SCORECARD.md` — use with Hermes skill `matrix-hermes-product-craft`

## Intent

Raise usage/perceived completeness using Matrix roles, Paperclip control-plane philosophy, Hermes as harness — file-tree UI + zero-trust Tool Router unchanged.

## Epics

1. **E1** — `outputs/` shelf *(complete)*
2. **E2** — USAGE_GUIDE + `smoke:polish` *(complete)*
3. **E3** — `?view=board`, company org, heartbeat doc, goal trace, budget stub *(complete)*
4. **E4** — Company loop, `projects[]`, `demo:flagship`, ROLES.md *(complete)*
5. **E5** — Hermes skill bundle + MCP docs *(complete)*
6. **E6** — VERIFICATION_LEDGER automation *(complete — `run-gate-ledger.js` + `gate:*` scripts)*
7. **E7** — Optional static `outputs/site` *(minimal `index.html` + site-smoke test)*

## New API / MCP (Algorithm: add only what survived deletion)

| Surface | Purpose |
| --- | --- |
| `PATCH .../agent-delegations/:id` `{ status: "revoked" }` | Board pause (human authority; no agent tool) |
| MCP `list_goal_contracts`, `list_delegations` | Hermes heartbeat reads |
| MCP `atlas.api.patch` route for revoke | Generic transport for Board |
| `GET /personal/overview` → `projects[]` | Multi-department tree |

## Acceptance gate

```sh
npm test && npm run lint && npm run smoke:polish && npm run demo:flagship
```

## Non-goals (deleted per Algorithm)

- Paperclip Node server inside Atlas
- Agent `revoke_delegation` Tool Router tool (safety-by-absence)
- Budget enforcement subsystem (display stub only)
