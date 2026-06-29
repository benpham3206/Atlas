# MoO file-tree UI (v0)

## Intent
Personal Atlas web is a **two-pane explorer**: left = your full **Mixture of Orchestrators Platform** tree (ASCII `|-` / `` `-`` style); right = **one** surface at a time.

## Sidebar (stacked file trees)

1. **`atlas/`** — PRD monorepo layout (`apps/`, `packages/`, `services/`, `connectors/`, `infra/`, `docs/`). Defined in `apps/web/src/atlas-repo-tree.js`. **live** = exists in repo; **stub** = PRD-only.
2. **Mixture of Orchestrators Platform** — product ontology map (`apps/web/src/moo-tree.js`).

Both use `apps/web/src/ascii-tree.js` (`|-` / `` `-`` rendering).
- Query: `?view=<pane>&workspace_id=...&object_id=...`
- Tree definition: `apps/web/src/moo-tree.js`
- **live** = wired to API today; **partial** / **stub** = placeholder or API-only

## Panes (v0)
| view | MoO home |
|------|----------|
| home | Product Surfaces → orchestration console |
| next-action | Meta-Orchestration → next-action selector |
| carbon-copy | User and Goal Layer |
| tasks | Orchestration Runtime → workflow steps |
| workspaces | workspace switcher |
| ontology | Registry → capability declarations |
| objects / object-detail / graph | Runtime graph |
| actions | action proposals |
| review-inbox | Human Authority → approval queues |
| audit | Governance and Audit |
| goal-contracts / delegation | stubs (API exists; editor TBD) |

## Implementer notes (Codex/Cursor)
- Do not add marketing chrome or card stacks — keep monospace tree primary.
- New features: add tree node + `view` pane; never another full-page scroll stack.
- Stub nodes stay visible so the map matches `UNIFIED_ATLAS_MOO_MASTER_PRD.md`.