# Attribution — The Atlas Project

This repository combines two MIT-licensed codebases.

## Paperclip (control plane foundation)

- **Source:** https://github.com/paperclipai/paperclip
- **Copyright:** Paperclip Labs, Inc. (see [PAPERCLIP_LICENSE](./PAPERCLIP_LICENSE))
- **Imported paths:** `server/`, `ui/`, `cli/`, `packages/adapters/` (and supporting workspace packages), `doc/`, Paperclip `scripts/`, `pnpm-workspace.yaml`
- **Upstream remote:** `upstream` → `https://github.com/paperclipai/paperclip.git`

## Atlas (knowledge + proof layer)

- **Source:** https://github.com/benpham3206/Atlas (pre-paperclip snapshot: tag `atlas-pre-paperclip-v0`)
- **Migration reference (until parity):** `apps/api/`, `packages/ontology-core/`, Atlas-specific `scripts/` (lint, smoke, MCP, gates)
- **Graft target (PA-P2+):** `packages/atlas-ontology/`

## License

Paperclip portions are distributed under the MIT License in [PAPERCLIP_LICENSE](./PAPERCLIP_LICENSE). Atlas additions follow the same MIT intent; see repository history for authorship.
