#!/usr/bin/env bash
# Cursor MCP launcher — absolute paths so GUI apps find node + script (no shell PATH).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="${ATLAS_NODE:-/usr/local/bin/node}"
SESSION="${ATLAS_SESSION_FILE:-$ROOT/.atlas/local-session.json}"
export ATLAS_SESSION_FILE="$SESSION"
export ATLAS_API_URL="${ATLAS_API_URL:-http://127.0.0.1:4000}"
exec "$NODE" "$ROOT/scripts/atlas-mcp-stdio.js"
