> **⚠️ Superseded 2026-06-30.** Ben locked **fork & extend Paperclip (MIT)** as the Public Atlas foundation — see `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md` §2/§7/§8. The "Option A spec-only" recommendation below is **no longer the stance**; this file is retained for the option analysis and decision history.

# Paperclip integration options (Atlas v0)

Paperclip ([paperclip.ing](https://paperclip.ing), [SPEC](https://github.com/paperclipai/paperclip/blob/main/doc/SPEC.md)) is an open **company control plane** over bring-your-own agents (org chart, Board, heartbeats, budgets, goal alignment). Atlas already maps Paperclip **methodology** in `outputs/docs/LONG_RUNNING_WORK.md` and the web **Board** view — without running Paperclip inside the monorepo.

**Recommendation for v0: Option A — spec-only.** Aligns with `docs/bricks/2026-06-29-polish-program.md` non-goals (no Paperclip Node server in Atlas).

## Option A — Spec-only reference (recommended v0)

**What:** Read Paperclip `doc/SPEC.md` and adapter boundaries; implement equivalent primitives in Atlas API + file-tree UI only.

| Paperclip concept | Atlas v0 surface |
| --- | --- |
| Board | `?view=board`, review inbox, human-only `PATCH` revoke delegation |
| Hires / org | Agent manifest + `list_delegations` (MCP) |
| Heartbeat | Hermes cron → `outputs/docs/HEARTBEAT_CRON.md` |
| Goal alignment | GoalContract + `list_goal_contracts` |
| Budget cap | Display stub on delegation (enforcement deferred) |
| Ticket log | Hash-chained `AuditEvent` + ReviewPacket |

**Pros:** Zero new runtime; safety-by-absence (no second authority). **Cons:** No Paperclip dashboard UX out of the box.

**When to choose:** Daily dogfood on Atlas; Hermes as harness; competitive bar per `matrix-hermes-product-craft`.

## Option B — Sidecar Paperclip + Atlas authority

**What:** Run `npx paperclipai onboard` locally; wire Hermes via `hermes_gateway` or `hermes_local` adapter; treat Atlas as proof/audit sink via artifacts and governed tools.

**Pros:** Study live control-plane UX and adapter registry. **Cons:** Two systems of record unless carefully scoped; onboarding and secrets management; not in CI gates today.

**When to choose:** Ben explicitly wants a Paperclip sandbox for coordination experiments while Atlas remains Tool Router authority for governed writes.

## Option C — Embedded Paperclip server in Atlas

**What:** Vendor or fork `server/` + `ui/` into the monorepo.

**Pros:** Single deployable “company” product. **Cons:** Violates Algorithm step 2 for v0; duplicates MoO file-tree + API; large maintenance surface.

**Status:** **Deleted** for polish program — see brick non-goals.

## Hermes adapter note (future B only)

Paperclip ships `@paperclipai/hermes-paperclip-adapter` (`hermes_gateway`, `hermes_local`). That path does **not** replace Atlas MCP (`mcp_atlas_*`); it positions Hermes as a **worker runtime** under Paperclip’s org chart. Atlas delegation minting stays on the platform API.

## Decision record (2026-06-29)

| Option | v0 |
| --- | --- |
| A Spec-only | **Yes** |
| B Sidecar | Optional research |
| C Embedded | No |

## Further reading

- Hermes skill reference: `matrix-hermes-product-craft` → `references/paperclip-control-plane-reference.md`
- Scorecard row “Operating metaphor / Authority”: `outputs/docs/POLISH_SCORECARD.md`
- Example heartbeat (no secrets): `outputs/docs/HEARTBEAT_CRON.md` § E5-T4