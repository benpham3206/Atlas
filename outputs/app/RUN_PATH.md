# Atlas Run Path

Single operator path to a governed Personal Atlas session.

## Prerequisites

- Node.js 18.17+
- Repo: `~/Documents/Atlas`

## One command

```sh
cd ~/Documents/Atlas
npm run dev:personal
```

This starts:

| Service | URL | Role |
| --- | --- | --- |
| API | http://127.0.0.1:4000 | Authority, Tool Router, audit |
| Web | http://127.0.0.1:3000 | File-tree MoO UI |

If a port is already listening, `dev:personal` skips starting that service.

After the API is reachable, the script bootstraps an operational session and writes `.atlas/local-session.json` for MCP.

## First governed action

1. Open http://127.0.0.1:3000/?view=home
2. Click **Bootstrap Personal Atlas** if the workspace is empty
3. Open **Next action** in the MoO tree
4. Complete a task with artifact URI + evidence note

## MCP in Cursor (Hermes harness)

Add to Cursor MCP config:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["scripts/atlas-mcp-stdio.js"],
      "env": {
        "ATLAS_SESSION_FILE": ".atlas/local-session.json"
      }
    }
  }
}
```

Refresh authority after bootstrap:

```sh
npm run operational:bootstrap
```

MCP is transport-only: it never mints delegations. Missing or expired session files fail closed.

## Verify

```sh
curl -sf http://127.0.0.1:4000/health
curl -sf http://127.0.0.1:3000/health
npm run smoke:polish
```
