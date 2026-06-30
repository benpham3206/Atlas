# Hermes skill bundle (Atlas polish · E5)

Atlas is **authority** (GoalContract, delegations, Tool Router, audit). Hermes is **runtime** (MCP transport, skills, cron delivery, session memory). Do not mint delegations from Hermes; refresh session files from Atlas scripts only.

## Core skills (load order)

| Skill | When to load | Purpose |
| --- | --- | --- |
| `atlas-personal-dogfood` | Every Atlas/MoO session on `~/Documents/Atlas` | Operational path, MCP wiring, daemon, polish vs personal spine, pitfalls (`smoke:polish` session repoint) |
| `matrix-hermes-product-craft` | Competitive bar, E3–E7 polish, scorecard | Matrix + Hermes product patterns; score `outputs/docs/POLISH_SCORECARD.md` |
| `plan` | New epic or multi-step brick | Structured planning before implementation handoff |
| `writing-plans` | Codex/Cursor handoff docs | Brick/plan prose with acceptance gates |

Load in Hermes: `skill_view(name='atlas-personal-dogfood')` (and siblings as needed). Hermes docs: https://hermes-agent.nousresearch.com/docs/

## Atlas repo skills (implementation)

Project-local procedures live under `.agent/skills/` (not Hermes profile skills):

- `atlas-moo-dogfood-loop` — governed loop on real tasks
- `the-algorithm` — question/delete/simplify before new machinery
- `zero-trust-orchestration` — ToolCall verification order

Constitution: `AGENTS.md`, `docs/UNIFIED_ATLAS_MOO_MASTER_PRD.md`.

## Division of labor

| Role | Surface | Does |
| --- | --- | --- |
| Owner | Board, review inbox | Irreversible approvals, pause delegations |
| Lead | GoalContract, carbon copy | Domain memory, objective alignment |
| Worker | Cursor, Codex, Hermes tools | Scoped execution + proof |
| System | `dev:personal`, cron, smoke gates | Cadence, `outputs/internal/NEXT_ACTION.md` |

Hermes **architects** bricks and dogfood; **Codex/Cursor** edit the clone; Atlas **records** artifacts and audit.

## MCP + session (summary)

- Cursor / Hermes: `node scripts/atlas-mcp-stdio.js` with `ATLAS_SESSION_FILE` → `.atlas/local-session.json`
- Publish session: `npm run operational:bootstrap` or `npm run dev:personal` (when `:4000` is up)
- Hermes desktop: **Settings → MCP → Reload** after session refresh (not `/reload-mcp` in GUI chat)
- After `npm run smoke:polish`: repoint session at `:4000` — see `outputs/docs/USAGE_GUIDE.md` § MCP session hygiene

## Related outputs

| Doc | Role |
| --- | --- |
| `outputs/docs/USAGE_GUIDE.md` | 15-minute governed path + Hermes split |
| `outputs/docs/PAPERCLIP_INTEGRATION_OPTIONS.md` | v0 Paperclip stance (spec-only) |
| `outputs/docs/HEARTBEAT_CRON.md` | Paperclip-style heartbeat → Hermes cron (E5-T4) |
| `outputs/docs/LONG_RUNNING_WORK.md` | Matrix / Paperclip → Atlas mapping |
| `docs/bricks/2026-06-29-polish-program.md` | E1–E7 status and gates |

## Verification

```sh
cd ~/Documents/Atlas
npm test
npm run smoke:mcp
npm run smoke:polish && node scripts/dev-personal.js   # if :4000 up — refresh personal MCP session
```

Gate for polish program: `npm test && npm run lint && npm run smoke:polish && npm run demo:flagship`.