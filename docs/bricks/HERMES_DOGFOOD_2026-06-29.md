# Brick handoff — Hermes dogfood session (Ben)

**Date:** 2026-06-29  
**Architect:** Hermes (not implementer)  
**Implementers:** Codex (ChatGPT Edu) + Cursor (Auto/Composer)

## What we exercised (live)

| Step | Result |
|------|--------|
| `npm test` | 150/150 pass |
| `npm run dev:api` | `:4000` healthy |
| `npm run operational:bootstrap` | Workspace `workspace_operational_dogfood`, GoalContract `goal_contract_001`, delegation `delegation_001` |
| `npm run smoke:operational` | Full path green (tools → artifact/evidence → review packet → dry-run PR → audit) |
| `POST /personal/bootstrap` | `workspace_personal` + 5 seeded tasks + blocker graph |
| `GET /personal/next-action` | **Next:** `object_task_harden_personal_loop` (priority 1) |
| Governed `get_workspace_overview` | Allow via `delegation_001` |
| `GET /audit/verify` | `valid: true` on dogfood workspace |

## Cursor MCP (paste into project MCP config)

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["scripts/atlas-mcp-stdio.js"],
      "env": {
        "ATLAS_API_URL": "http://127.0.0.1:4000",
        "ATLAS_DELEGATION_ID": "delegation_001"
      }
    }
  }
}
```

Run MCP from repo root: `~/Documents/Atlas`.

## Architecture choice for this sprint

**Parallel tracks (both valid; pick one for Codex first):**

1. **Personal spine (matches `/personal/next-action`)** — Harden self-hosting loop: read-only GET proofs, blocked-task complete rejection, acceptance criteria on all seeded tasks. *Improves dogfood trust before new domain content.*

2. **MoO map (TASKS.md)** — **D8.1** game-development domain pack seed: fixtures + tests that next-action returns **concrete AAA** actions, not generic labels.

**Recommendation:** Finish **(1)** in one small PR, then **(2)** — same GoalContract objective, sequential bricks.

## GoalContract objective (for next bootstrap)

```text
Complete personal-loop hardening (acceptance criteria in seeded task) OR land D8.1 domain seed with tests; record artifact + evidence via agent tools; human merges PR outside Atlas.
```

## AGI-lite concepts to borrow (design only)

- **Constitution** → GoalContract `constraints` + blocked actions list  
- **Hippocampal buffer** → candidate ingestion / review before promotion (I9)  
- **Multi-agent split** → Hermes spec, Cursor/Codex code, Atlas audit — already operational  

Do **not** merge AGI-lite repos into Atlas; encode patterns as ontology + domain pack.

## Verification bar for implementers

- `npm test` + `npm run smoke:operational`  
- Append **CONTEXT_LOG** Turn with INTENT/OUTCOME  
- Optional: governed `submit_artifact` + `attach_evidence` for this brick doc URI