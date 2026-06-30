import assert from "node:assert/strict";
import {
  api,
  bootstrapOperationalSession,
  publishOperationalSession,
  requireOk,
  startEphemeralApi
} from "./operational-support.js";
import { updateVerificationLedger } from "./update-verification-ledger.js";

async function callTool(baseUrl, delegationId, toolName, body = {}) {
  return api(baseUrl, "POST", `/agent/tools/${toolName}`, {
    token: delegationId,
    body
  });
}

async function main() {
  const runtime = await startEphemeralApi({ dataFilePrefix: "atlas-flagship-loop" });

  try {
    const session = await bootstrapOperationalSession(runtime.baseUrl, {
      workspaceId: "workspace_flagship_loop",
      workspaceName: "Flagship Loop Demo"
    });
    const { sessionFile } = publishOperationalSession(session, runtime.baseUrl, {
      repoRoot: process.cwd(),
      sessionFile: `${process.cwd()}/.tmp-flagship-loop-session.json`
    });

    const next = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "get_next_action"),
      "01 intent -> next action"
    );
    assert.equal(next.goal_contract_id, session.goalContract.id);

    const artifact = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "submit_artifact", {
        artifact_type: "file",
        uri: "outputs/demos/FLAGSHIP_LOOP.md",
        summary: "Flagship loop demo artifact",
        metadata: { command: "npm run demo:flagship" }
      }),
      "04 tool -> artifact"
    );

    const packet = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "generate_review_packet", {
        summary: "Flagship company loop demo",
        changed_files: ["outputs/demos/FLAGSHIP_LOOP.md"],
        verification_commands: ["npm run demo:flagship"],
        critic_findings: [],
        safety_findings: ["Human-only merge boundary preserved"],
        pending_human_actions: ["protected_branch_merge"]
      }),
      "06 proof -> review packet"
    );

    const verify = requireOk(await api(runtime.baseUrl, "GET", "/audit/verify"), "audit verify");
    assert.equal(verify.valid, true);

    updateVerificationLedger("flagship demo", {
      command: "npm run demo:flagship"
    });

    console.log(
      JSON.stringify(
        {
          status: "ok",
          goal_contract_id: session.goalContract.id,
          next_action_task_id: next.result.task.id,
          artifact_id: artifact.result.id,
          artifact_uri: artifact.result.uri,
          review_packet_id: packet.result.id,
          session_file: sessionFile
        },
        null,
        2
      )
    );
  } finally {
    await runtime.close();
    const { refreshPersonalMcpSession } = await import("./refresh-personal-mcp-session.js");
    await refreshPersonalMcpSession();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        component: "flagship_loop_demo",
        root_cause: error instanceof Error ? error.message : String(error),
        failure_type: "demo_failed"
      },
      null,
      2
    )
  );
  process.exit(1);
});
