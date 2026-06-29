# Atlas Internal Output State

Read this before starting or resuming long-running Atlas work. This file supports the production of
customer-facing outputs; it is not itself a customer-facing deliverable.

## Current Task

### 2026-06-29-001 - Harden Outputs And Long-Running Work Surface

**Status:** complete
**Created:** 2026-06-29
**Complexity Score:** 5/10
**Agent State:** resting
**Workspace:** `/Users/benjaminpham/Documents/Atlas`

### Objective

Create a durable `outputs/` surface that separates customer-facing deliverables from internal
long-running work state, while preserving enough recovery/proof structure for METR-style tasks.

### Success Criteria

- [x] `outputs/` is framed as the customer-facing product shelf.
- [x] `outputs/site/` exists for Matrix-style website direction.
- [x] `outputs/app/` exists for the customer-facing Atlas app surface.
- [x] `outputs/docs/` contains finished product/architecture notes.
- [x] `outputs/codebase/` exists for technical implementation/package notes.
- [x] `outputs/demos/` exists for demo scenarios and walkthroughs.
- [x] `outputs/proofs/` defines what proof must accompany finished outputs.
- [x] Internal restart state lives under `outputs/internal/`, not the top-level customer shelf.
- [x] Repo verification has been run after these file changes.

### Blockers

- None.

### Recovery Path

If context is lost, read in this order:

1. `outputs/internal/NEXT_ACTION.md`
2. `outputs/internal/STATE.md`
3. `outputs/README.md`
4. `outputs/proofs/README.md`
5. `TASKS.md`
6. `CONTEXT_LOG.md`

Then run the narrowest verification command for the next action before editing code.

### Notes

- The customer-facing output should eventually include a polished Atlas website/app comparable in
  clarity to `matrix.build`.
- Authority-bearing runtime records still belong in the API/Tool Router path.
- Verification passed: `npm run lint`, `git diff --check`, and `npm test`.

## Recent Tasks

| Date | Task | Status | Proof |
| --- | --- | --- | --- |
| 2026-06-29 | Reframe `outputs/` as customer-facing product shelf | complete | `npm run lint`, `git diff --check`, `npm test` |
| 2026-06-29 | Atlas MCP direct API wrapper tools | complete | `npm run smoke:mcp`, `npm run lint`, `npm test` |
| 2026-06-29 | PRD import into local Atlas MCP/API state | complete | MCP overview/list/search/next-action/audit verification |

