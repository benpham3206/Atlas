import assert from "node:assert/strict";
import {
  api,
  baseBranchAllowlist,
  bootstrapOperationalSession,
  publishOperationalSession,
  repositoryAllowlist,
  requireOk,
  startEphemeralApi
} from "./operational-support.js";
import { runMcpExchange } from "./mcp-smoke-support.js";

function step(label) {
  console.log(`\n▶ ${label}`);
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

function liveSmokeRequested() {
  return process.env.GITHUB_LIVE_SMOKE === "1" || process.env.GITHUB_LIVE_SMOKE === "true";
}

async function callTool(baseUrl, delegationId, toolName, body = {}) {
  return api(baseUrl, "POST", `/agent/tools/${toolName}`, {
    token: delegationId,
    body
  });
}

function assertAuditLinkage(events, session) {
  const allowedToolCalls = events.filter(
    (event) =>
      event.event_type === "agent.tool_call" &&
      event.decision === "allow" &&
      event.metadata?.delegation_id === session.delegation.id &&
      event.metadata?.goal_contract_id === session.goalContract.id
  );

  assert.ok(allowedToolCalls.length >= 4);
  assert.ok(
    allowedToolCalls.some((event) => event.resource_id === "generate_review_packet"),
    "review packet tool call must be linked to delegation and GoalContract"
  );
  assert.ok(
    allowedToolCalls.some((event) => event.resource_id === "github.open_pr"),
    "github.open_pr tool call must be linked to delegation and GoalContract"
  );
}

async function main() {
  const runtime = await startEphemeralApi({ dataFilePrefix: "atlas-operational-smoke" });

  try {
    step("Bootstrap operational workspace, GoalContract, and delegation");
    const session = await bootstrapOperationalSession(runtime.baseUrl, {
      workspaceId: "workspace_operational_smoke",
      workspaceName: "Atlas Operational Smoke"
    });
    const { sessionFile, kit } = publishOperationalSession(session, runtime.baseUrl, {
      repoRoot: process.cwd(),
      sessionFile: `${process.cwd()}/.tmp-operational-smoke-session.json`
    });
    ok(`workspace ${session.workspace.id}`);
    ok(`GoalContract ${session.goalContract.id}`);
    ok(`delegation ${session.delegation.id}`);
    ok(`session file ${sessionFile}`);

    step("Call governed tools through the HTTP Tool Router");
    const manifest = requireOk(await api(runtime.baseUrl, "GET", "/agent/manifest"), "get manifest");
    assert.ok(manifest.tools.some((tool) => tool.name === "github.open_pr"));
    assert.equal(manifest.tools.some((tool) => tool.name === "github.merge_pr"), false);
    ok(`manifest exposes ${manifest.tools.length} tools and no merge tool`);

    const overview = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "get_workspace_overview"),
      "get workspace overview"
    );
    assert.equal(overview.goal_contract_id, session.goalContract.id);
    ok(`overview governed=${overview.result.governed}`);

    const next = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "get_next_action"),
      "get next action"
    );
    assert.equal(next.result.task.id, session.task.id);
    ok(`next action ${next.result.task.id}`);

    step("Submit artifact metadata and attach evidence");
    const artifact = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "submit_artifact", {
        artifact_type: "file",
        uri: "artifacts/operational-smoke.md",
        summary: "Operational smoke verification output",
        metadata: { command: "npm run smoke:operational" }
      }),
      "submit artifact"
    );
    const evidence = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "attach_evidence", {
        subject_type: "object",
        subject_id: session.task.id,
        artifact_id: artifact.result.id,
        evidence_kind: "verification",
        note: "Operational smoke reached the Tool Router and selected the expected next action.",
        source_uri: "artifacts/operational-smoke.md"
      }),
      "attach evidence"
    );
    assert.equal(evidence.result.artifact_id, artifact.result.id);
    ok(`artifact ${artifact.result.id} and evidence ${evidence.result.id}`);

    step("Produce a review packet");
    const packet = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "generate_review_packet", {
        summary: "Operational smoke review packet",
        changed_files: ["scripts/operational-bootstrap.js", "scripts/operational-smoke.js"],
        verification_commands: ["npm run smoke:operational"],
        critic_findings: ["MCP adapter remains transport-only"],
        safety_findings: ["No merge tool or merge scope is exposed"],
        pending_human_actions: ["protected_branch_merge"]
      }),
      "generate review packet"
    );
    assert.deepEqual(packet.result.pending_human_actions, ["protected_branch_merge"]);
    ok(`review packet ${packet.result.id}`);

    step("Dry-run github.open_pr through the same delegation");
    const dryRun = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "github.open_pr", {
        repository: repositoryAllowlist()[0],
        title: "Atlas operational dry-run smoke",
        body: "Generated by scripts/operational-smoke.js",
        head_branch: session.config.headBranch,
        base_branch: baseBranchAllowlist()[0],
        dry_run: true
      }),
      "dry-run github.open_pr"
    );
    assert.equal(dryRun.result.state, "dry_run");
    ok(`dry-run PR artifact ${dryRun.result.id}`);

    step("Verify audit chain and GoalContract/delegation linkage");
    const verify = requireOk(await api(runtime.baseUrl, "GET", "/audit/verify"), "verify audit chain");
    assert.equal(verify.valid, true);
    const events = requireOk(
      await api(runtime.baseUrl, "GET", `/workspaces/${session.workspace.id}/audit-events`),
      "list audit events"
    );
    assertAuditLinkage(events, session);
    assert.ok(events.some((event) => event.event_type === "artifact.submitted"));
    assert.ok(events.some((event) => event.event_type === "evidence.attached"));
    assert.ok(events.some((event) => event.event_type === "github.pull_request.open_attempted"));
    ok(`audit chain valid with ${events.length} events`);

    step("Prove default MCP initialize/list/call against the published session file");
    const initialized = await runMcpExchange(
      { jsonrpc: "2.0", id: 100, method: "initialize", params: {} },
      { ATLAS_SESSION_FILE: sessionFile, ATLAS_API_URL: runtime.baseUrl }
    );
    assert.equal(initialized.isError, false);
    assert.equal(initialized.result.serverInfo.name, "atlas");
    ok("MCP initialize");

    const listed = await runMcpExchange(
      { jsonrpc: "2.0", id: 101, method: "tools/list", params: {} },
      { ATLAS_API_URL: runtime.baseUrl }
    );
    assert.equal(listed.isError, false);
    const mcpToolNames = listed.result.tools.map((tool) => tool.name);
    for (const tool of manifest.tools) {
      assert.ok(mcpToolNames.includes(tool.name), `MCP tools/list missing manifest tool ${tool.name}`);
    }
    for (const name of [
      "atlas.api.routes",
      "atlas.api.get",
      "atlas.api.post",
      "atlas.api.patch",
      "personal.list_tasks",
      "personal.get_overview",
      "personal.get_next_action",
      "personal.get_session_context"
    ]) {
      assert.ok(mcpToolNames.includes(name), `MCP tools/list missing direct tool ${name}`);
    }
    assert.equal(listed.result.tools.length, manifest.tools.length + 8);
    ok("MCP tools/list");

    const called = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 102,
        method: "tools/call",
        params: { name: "verify_audit_chain", arguments: {} }
      },
      { ATLAS_SESSION_FILE: sessionFile, ATLAS_API_URL: runtime.baseUrl }
    );
    assert.equal(called.isError, false);
    ok("MCP tools/call verify_audit_chain");
    assert.equal(kit.cursor_mcp_config.mcpServers.atlas.env.ATLAS_SESSION_FILE, ".tmp-operational-smoke-session.json");

    if (!liveSmokeRequested()) {
      ok("live GitHub call skipped (set GITHUB_LIVE_SMOKE=1 with GITHUB_TOKEN + GITHUB_HEAD_BRANCH)");
      console.log("\n✅ Operational smoke complete: bootstrap -> MCP -> tools -> review packet -> dry-run PR -> audit verify.\n");
      return;
    }

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_HEAD_BRANCH) {
      throw new Error("GITHUB_LIVE_SMOKE=1 requires GITHUB_TOKEN and GITHUB_HEAD_BRANCH");
    }

    step("Optional live github.open_pr proof");
    const live = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "github.open_pr", {
        repository: repositoryAllowlist()[0],
        title: "Atlas operational live smoke",
        body: "Generated by scripts/operational-smoke.js",
        head_branch: process.env.GITHUB_HEAD_BRANCH,
        base_branch: baseBranchAllowlist()[0],
        draft: true
      }),
      "live github.open_pr"
    );
    assert.ok(live.result.external_url?.startsWith("https://github.com/"));
    ok(`live draft PR ${live.result.external_url}`);
    console.log("\n✅ Operational smoke complete with live GitHub PR proof.\n");
  } finally {
    await runtime.close();
  }
}

main().catch((error) => {
  console.error("\n❌ Operational smoke failed:");
  console.error(error);
  process.exit(1);
});
