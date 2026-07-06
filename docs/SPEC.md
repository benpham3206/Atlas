# Atlas + Paperclip — System Index

**Project:** The Atlas Project (`benpham3206/Atlas`)
**Date:** 2026-06-30
**Upstream:** Paperclip MIT — `upstream` remote → `https://github.com/paperclipai/paperclip.git`

This index maps what lives in the repo after the root-trunk import (PA-P1). It does not duplicate full API reference; see linked specs.

---

## Paperclip base (live)

| Surface | Path | Status |
| --- | --- | --- |
| API server | `server/` | **live** — `@paperclipai/server`, embedded Postgres default |
| Web UI | `ui/` | **live** — `@paperclipai/ui` |
| CLI | `cli/` | **live** — `pnpm run paperclipai` |
| Adapters | `packages/adapters/` | **live** |
| DB schema | `packages/db/` | **live** |
| Shared types | `packages/shared/` | **live** |
| Plugin SDK | `packages/plugins/sdk/` | **live** — build before first server boot |
| Paperclip spec | `doc/SPEC.md` | **live** (upstream) |
| Mintlify docs | `docs/paperclip/` | **live** (upstream copy) |

**Boot (local):**

```sh
pnpm install
pnpm --filter @paperclipai/plugin-sdk build
pnpm run dev:server   # API http://127.0.0.1:3100/api
pnpm run paperclipai onboard   # first-run wizard
pnpm run paperclipai run       # onboard + run
```

**Smoke:** `GET /api/health` · `GET /api/openapi.json`

---

## Atlas differentiators (live on Paperclip trunk)

**Import inventory (PA-P2M0):** [Atlas + MoO graft map](../docs/bricks/2026-06-30-atlas-moo-import-map.md)

| Capability | Migration reference | Graft target | Status |
| --- | --- | --- | --- |
| Ontology registry + lifecycle | `packages/ontology-core/` | `packages/atlas-ontology/` | **grafted** (PA-P2b) |
| Knowledge tools | `apps/api/src/agent-gateway.js` | `server/src/routes/atlas.ts` | **live** (PA-P2e–f, PA-P2M1) |
| Hash-chained audit + verify | `packages/ontology-core`, legacy `/audit/verify` | `atlas_audit_events` + `/api/companies/:id/atlas/audit/verify` | **live** (PA-P2g) |
| Record validation | `npm run validate:records` | fork CI script | **live** (PA-P2h) |
| MCP Tool Router | `scripts/atlas-mcp-stdio.js` | Paperclip backend (`ATLAS_BACKEND=paperclip`) | **live** (PA-P2M2) |
| GoalContract / review bridge | legacy workspace routes | `/atlas/goal-contracts`, `/atlas/review-packets` | **live** (PA-P2M4) |
| Operational bootstrap | `scripts/operational-bootstrap.js` | `scripts/paperclip-operational-bootstrap.js` | **live** (PA-P2M5) |
| MoO skills mapping | `.agent/skills/` | [skills on Paperclip](./atlas-moo-skills-on-paperclip.md) | **live** (PA-P2M6) |
| GitHub / Slack adapters | `apps/api/src/*-client.js` | `server/src/atlas/external/` | **live** (PA-P2M7) |
| Encyclopedia knowledge pack | — | `tests/fixtures/encyclopedia-knowledge-pack.json` + staff manifest + E2E harness | **live** (PA-P3) |
| Proof-closed public hero | `outputs/site/` | dashboard + site copy | **live** (PA-P4) |

---

## Migration reference (legacy — keep until parity)

| Surface | Path | Status |
| --- | --- | --- |
| Legacy API | `apps/api/` | **reference** — port :4000, file-backed store |
| Legacy web | `apps/web/` | **reference** — static placeholder |
| Atlas scripts | `scripts/` (atlas smoke, MCP, gates) | **reference** — use `pnpm run test:atlas`, `pnpm run lint` |
| Ontology spec | `docs/ONTOLOGY_SPEC.md` | **reference** |
| Architecture | `outputs/docs/ARCHITECTURE_COMPETITIVE_FRAMEWORK_2026-06-30.md` | **reference** |

**Legacy gates:**

```sh
npm run test:atlas && npm run lint && npm run smoke:polish && npm run demo:flagship
```

**Import + dual harness (PA-P1g):**

```sh
npm test                    # test:atlas + test:paperclip:import
npm run test:paperclip      # full Paperclip vitest (long)
PAPERCLIP_LIVE_SMOKE=1 npm run test:paperclip:import   # requires server on :3100
```

---

## Attribution

See [ATTRIBUTION.md](../ATTRIBUTION.md) and [PAPERCLIP_LICENSE](../PAPERCLIP_LICENSE).
