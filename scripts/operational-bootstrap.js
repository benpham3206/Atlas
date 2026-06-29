import { api, bootstrapOperationalSession, publishOperationalSession, requireOk } from "./operational-support.js";

const apiUrl = process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";

function printUsage() {
  console.log(`Atlas operational bootstrap

Requires a running API. Start it with:
  npm run dev:api

Optional environment:
  ATLAS_API_URL=http://127.0.0.1:4000
  OBJECTIVE="..."
  ALLOWED_ACTIONS=get_workspace_overview,get_next_action,generate_review_packet,github.open_pr,verify_audit_chain
  BLOCKED_ACTIONS=github.merge_pr,protected_branch_merge
  RISK_CLASS=medium
  WORKSPACE_ID=workspace_operational_dogfood
  WORKSPACE_NAME="Atlas Operational Dogfood"
  AGENT_NAME="Operational Dogfood Agent"
`);
}

async function assertApiUp() {
  const health = await api(apiUrl, "GET", "/health");
  requireOk(health, `connect to Atlas API at ${apiUrl}`);
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  await assertApiUp();
  const session = await bootstrapOperationalSession(apiUrl);
  const { sessionFile, kit } = publishOperationalSession(session, apiUrl);

  console.log(JSON.stringify(kit, null, 2));
  console.error(
    [
      "",
      "Operational session ready.",
      `Workspace: ${session.workspace.id}`,
      `GoalContract: ${session.goalContract.id}`,
      `Delegation: ${session.delegation.id}`,
      `Session file: ${sessionFile}`,
      "MCP reads the local session file by default. Paste cursor_mcp_config into Cursor once, then rerun bootstrap to refresh authority."
    ].join("\n")
  );
}

main().catch((error) => {
  console.error("Operational bootstrap failed:");
  console.error(error);
  process.exit(1);
});
