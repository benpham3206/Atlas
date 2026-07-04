import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import {
  bootstrapOperationalSession,
  publishOperationalSession,
  requireOk,
  startEphemeralApi,
  api
} from "./operational-support.js";
import { encodeMessage, handleMcpMessage, readMessage } from "./atlas-mcp-lib.js";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

export async function runMcpExchange(message, env, options = {}) {
  const outcome = await handleMcpMessage(message, env, options);

  if (outcome.kind === "notification") {
    throw new Error("Expected a JSON-RPC response");
  }

  if (outcome.kind === "error") {
    throw new Error(outcome.message);
  }

  if (outcome.kind === "tool_error") {
    return {
      isError: true,
      payload: outcome.payload
    };
  }

  return {
    isError: false,
    result: outcome.result
  };
}

export async function runMcpStdioScript(messages, env) {
  const scriptPath = join(REPO_ROOT, "scripts", "atlas-mcp-stdio.js");
  const child = spawn(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdoutBuffer = Buffer.alloc(0);
  const responses = [];

  child.stdout.on("data", (chunk) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);

    while (true) {
      const parsed = readMessage(stdoutBuffer);

      if (!parsed) {
        break;
      }

      stdoutBuffer = stdoutBuffer.subarray(parsed.nextOffset);
      responses.push(parsed.message);
    }
  });

  for (const message of messages) {
    child.stdin.write(encodeMessage(message));
  }

  child.stdin.end();
  await once(child, "exit");

  return responses;
}

export function parseToolErrorText(response) {
  assert.equal(response.result?.isError, true);
  return JSON.parse(response.result.content[0].text);
}

export async function createSmokeSession(runtime, options = {}) {
  const tempDir = mkdtempSync(join(tmpdir(), "atlas-mcp-session-"));
  const session = await bootstrapOperationalSession(runtime.baseUrl, {
    workspaceId: "workspace_mcp_smoke",
    workspaceName: "Atlas MCP Smoke",
    ...options
  });
  const sessionFile = join(tempDir, "local-session.json");
  publishOperationalSession(session, runtime.baseUrl, {
    repoRoot: tempDir,
    sessionFile
  });

  return { session, sessionFile, tempDir };
}

export async function startMcpSmokeRuntime() {
  return startEphemeralApi({ dataFilePrefix: "atlas-mcp-smoke" });
}

export async function assertManifestHasNoMergeTool(baseUrl) {
  const manifest = requireOk(await api(baseUrl, "GET", "/agent/manifest"), "get manifest");
  const toolNames = manifest.tools.map((tool) => tool.name);
  assert.equal(toolNames.some((toolName) => toolName.includes("merge")), false);
  assert.equal(manifest.scopes.some((scope) => scope.includes("merge")), false);
  assert.equal(toolNames.some((toolName) => toolName.startsWith("slack.") && !toolName.includes("get")), false);
  return manifest;
}

export async function readAuditEvents(baseUrl, workspaceId) {
  return requireOk(await api(baseUrl, "GET", `/workspaces/${workspaceId}/audit-events`), "list audit events");
}

export function readSessionEnvelope(sessionFile) {
  return JSON.parse(readFileSync(sessionFile, "utf8"));
}
