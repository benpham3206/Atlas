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

## Atlas differentiators (stub → PA-P2+)

| Capability | Migration reference | Graft target | Status |
| --- | --- | --- | --- |
| Ontology registry + lifecycle | `packages/ontology-core/` | `packages/atlas-ontology/` | **stub** (PA-P2b) |
| Knowledge tools | `apps/api/src/agent-gateway.js` | Paperclip adapter/tool surface | **stub** (PA-P2/P3) |
| Hash-chained audit + verify | `packages/ontology-core`, `GET /audit/verify` on legacy API | `server/.../audit-chain/` | **stub** (PA-P2g) |
| Record validation | `npm run validate:records` | fork CI script | **stub** (PA-P2h) |
| Encyclopedia knowledge pack | — | `tests/fixtures/` + staff manifest | **stub** (PA-P3) |
| Proof-closed public hero | `outputs/site/` | dashboard + site copy | **stub** (PA-P4) |

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
