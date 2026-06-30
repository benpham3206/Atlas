import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  api,
  bootstrapOperationalSession,
  publishOperationalSession,
  requireOk,
  startEphemeralApi
} from "./operational-support.js";
import { runMcpExchange } from "./mcp-smoke-support.js";

function fail(component, rootCause, failureType, details = {}) {
  console.error(
    JSON.stringify(
      {
        component,
        root_cause: rootCause,
        failure_type: failureType,
        ...details
      },
      null,
      2
    )
  );
  process.exit(1);
}

async function callTool(baseUrl, delegationId, toolName, body = {}) {
  return api(baseUrl, "POST", `/agent/tools/${toolName}`, {
    token: delegationId,
    body
  });
}

async function main() {
  const started = Date.now();
  const testRun = spawnSync(process.execPath, ["--test", "scripts/test/outputs-shelf.test.js"], {
    encoding: "utf8"
  });

  if (testRun.status !== 0) {
    fail("polish_quickstart", "outputs shelf tests failed", "verification_failed", {
      stderr: testRun.stderr?.trim()
    });
  }

  const runtime = await startEphemeralApi({ dataFilePrefix: "atlas-polish-quickstart" });

  try {
    const session = await bootstrapOperationalSession(runtime.baseUrl, {
      workspaceId: "workspace_polish_quickstart",
      workspaceName: "Polish Quickstart"
    });
    const { sessionFile } = publishOperationalSession(session, runtime.baseUrl, {
      repoRoot: process.cwd(),
      sessionFile: `${process.cwd()}/.tmp-polish-quickstart-session.json`
    });

    const next = requireOk(
      await callTool(runtime.baseUrl, session.delegation.id, "get_next_action"),
      "get next action"
    );
    assert.equal(next.result.task.id, session.task.id);

    const mcpCall = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "verify_audit_chain", arguments: {} }
      },
      { ATLAS_SESSION_FILE: sessionFile, ATLAS_API_URL: runtime.baseUrl }
    );

    if (mcpCall.isError) {
      fail("polish_quickstart", "MCP verify_audit_chain failed", "mcp_tool_failed", {
        session_file: sessionFile
      });
    }

    const verify = requireOk(await api(runtime.baseUrl, "GET", "/audit/verify"), "audit verify");
    assert.equal(verify.valid, true);

    const elapsedMs = Date.now() - started;
    if (elapsedMs > 180_000) {
      fail("polish_quickstart", "quickstart exceeded 3 minute budget", "timeout", { elapsed_ms: elapsedMs });
    }

    console.log(
      JSON.stringify(
        {
          status: "ok",
          workspace_id: session.workspace.id,
          delegation_id: session.delegation.id,
          next_action_task_id: next.result.task.id,
          session_file: sessionFile,
          audit_valid: verify.valid,
          elapsed_ms: elapsedMs
        },
        null,
        2
      )
    );

    const { updateVerificationLedger } = await import("./update-verification-ledger.js");
    updateVerificationLedger("polish quickstart", { command: "npm run smoke:polish" });
  } catch (error) {
    fail(
      "polish_quickstart",
      error instanceof Error ? error.message : String(error),
      "unexpected_error"
    );
  } finally {
    await runtime.close();
    const { refreshPersonalMcpSession } = await import("./refresh-personal-mcp-session.js");
    await refreshPersonalMcpSession();
  }
}

main();
