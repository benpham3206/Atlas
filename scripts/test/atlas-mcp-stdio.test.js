import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  assertManifestHasNoMergeTool,
  createSmokeSession,
  parseToolErrorText,
  readAuditEvents,
  runMcpExchange,
  runMcpStdioScript,
  startMcpSmokeRuntime
} from "../mcp-smoke-support.js";
import { publishOperationalSession, requireOk, api } from "../operational-support.js";

test("MCP initialize returns Atlas server info and tool capability metadata", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { sessionFile } = await createSmokeSession(runtime);
    const response = await runMcpExchange(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(response.isError, false);
    assert.equal(response.result.serverInfo.name, "atlas");
    assert.ok(response.result.capabilities.tools);
  } finally {
    await runtime.close();
  }
});

test("MCP tools/list proxies manifest without delegation", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    await createSmokeSession(runtime);
    const manifest = await assertManifestHasNoMergeTool(runtime.baseUrl);
    const response = await runMcpExchange(
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      { ATLAS_API_URL: runtime.baseUrl }
    );

    assert.equal(response.isError, false);
    const toolNames = response.result.tools.map((tool) => tool.name);

    for (const tool of manifest.tools) {
      assert.ok(toolNames.includes(tool.name), `missing manifest tool ${tool.name}`);
    }

    assert.ok(toolNames.includes("atlas.api.routes"));
    assert.ok(toolNames.includes("atlas.api.get"));
    assert.ok(toolNames.includes("atlas.api.post"));
    assert.ok(toolNames.includes("atlas.api.patch"));
  } finally {
    await runtime.close();
  }
});

test("MCP direct API tools expose route catalog and require a local session for API calls", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-direct-missing-"));

  try {
    const routes = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 20,
        method: "tools/call",
        params: { name: "atlas.api.routes", arguments: {} }
      },
      { ATLAS_API_URL: runtime.baseUrl }
    );

    assert.equal(routes.isError, false);
    const catalog = JSON.parse(routes.result.content[0].text);
    assert.ok(catalog.routes.some((route) => route.method === "POST" && route.path === "/workspaces/:workspace_id/objects"));
    assert.equal(
      catalog.routes.some((route) => route.method === "POST" && route.path === "/workspaces/:workspace_id/agent-delegations"),
      false
    );
    assert.equal(
      catalog.routes.some((route) => route.method === "POST" && route.path === "/workspaces/:workspace_id/policies"),
      false
    );
    assert.equal(
      catalog.routes.some((route) => route.method === "POST" && route.path === "/workspaces/:workspace_id/memberships"),
      false
    );

    const missingSession = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 21,
        method: "tools/call",
        params: { name: "atlas.api.get", arguments: { path: "/workspaces" } }
      },
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: join(repoRoot, ".atlas", "missing-session.json")
      }
    );

    assert.equal(missingSession.isError, true);
    assert.equal(missingSession.payload.component, "atlas-mcp-stdio");
    assert.equal(missingSession.payload.failure_type, "authorization");
    assert.equal(missingSession.payload.root_cause, "missing_local_session");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP direct API tools can create, read, and patch implemented workspace resources", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime);

    const createdType = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 22,
        method: "tools/call",
        params: {
          name: "atlas.api.post",
          arguments: {
            path: `/workspaces/${session.workspace.id}/object-types`,
            body: {
              id: "object_type_mcp_direct_note",
              name: "MCP Direct Note",
              schema_json: {
                type: "object",
                required: ["title", "status"],
                properties: {
                  title: { type: "string" },
                  status: { type: "string" }
                }
              }
            }
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(createdType.isError, false);
    const createdTypePayload = JSON.parse(createdType.result.content[0].text);
    assert.equal(createdTypePayload.id, "object_type_mcp_direct_note");

    const createdObject = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 23,
        method: "tools/call",
        params: {
          name: "atlas.api.post",
          arguments: {
            path: `/workspaces/${session.workspace.id}/objects`,
            body: {
              id: "object_mcp_direct_note",
              object_type_id: "object_type_mcp_direct_note",
              properties_json: {
                title: "Created through MCP direct API",
                status: "todo"
              }
            }
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(createdObject.isError, false);

    const patchedObject = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 24,
        method: "tools/call",
        params: {
          name: "atlas.api.patch",
          arguments: {
            path: `/workspaces/${session.workspace.id}/objects/object_mcp_direct_note`,
            body: {
              properties_json: {
                status: "done"
              }
            }
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(patchedObject.isError, false);
    const patchedPayload = JSON.parse(patchedObject.result.content[0].text);
    assert.equal(patchedPayload.properties_json.status, "done");

    const listedObjects = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 25,
        method: "tools/call",
        params: {
          name: "atlas.api.get",
          arguments: {
            path: `/workspaces/${session.workspace.id}/objects`,
            query: {
              object_type_id: "object_type_mcp_direct_note"
            }
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(listedObjects.isError, false);
    const listedPayload = JSON.parse(listedObjects.result.content[0].text);
    assert.equal(listedPayload.length, 1);
    assert.equal(listedPayload[0].id, "object_mcp_direct_note");
  } finally {
    await runtime.close();
  }
});

test("MCP direct API tools deny unlisted routes and cross-workspace scoped paths", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime);
    const otherWorkspace = requireOk(
      await api(runtime.baseUrl, "POST", "/workspaces", {
        body: { id: "workspace_other_mcp_direct", name: "Other MCP Direct Workspace" }
      }),
      "create other workspace"
    );

    const crossWorkspace = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 26,
        method: "tools/call",
        params: {
          name: "atlas.api.get",
          arguments: {
            path: `/workspaces/${otherWorkspace.id}/object-types`
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(crossWorkspace.isError, true);
    assert.equal(crossWorkspace.payload.failure_type, "authorization");
    assert.equal(crossWorkspace.payload.root_cause, "workspace_scope_mismatch");
    assert.equal(crossWorkspace.payload.details.session_workspace_id, session.workspace.id);

    const destructive = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 27,
        method: "tools/call",
        params: {
          name: "atlas.api.post",
          arguments: {
            path: `/workspaces/${session.workspace.id}/unknown-admin-delete`,
            body: {}
          }
        }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(destructive.isError, true);
    assert.equal(destructive.payload.failure_type, "policy");
    assert.equal(destructive.payload.root_cause, "api_route_not_allowed");
  } finally {
    await runtime.close();
  }
});

test("MCP tools/call reads delegation from local session file", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime);
    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(response.isError, false);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.goal_contract_id, session.goalContract.id);
  } finally {
    await runtime.close();
  }
});

test("MCP tools/call fails closed with structured authorization error when session is missing", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-missing-"));

  try {
    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: join(repoRoot, ".atlas", "missing-session.json")
      }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.component, "atlas-mcp-stdio");
    assert.equal(response.payload.failure_type, "authorization");
    assert.equal(response.payload.root_cause, "missing_local_session");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP tools/call fails closed with structured dependency error when API is unreachable", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-down-"));
  const runtime = await startMcpSmokeRuntime();

  try {
    const { sessionFile } = await createSmokeSession(runtime);
    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      {
        ATLAS_API_URL: "http://127.0.0.1:1",
        ATLAS_SESSION_FILE: sessionFile
      }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.failure_type, "dependency");
    assert.equal(response.payload.root_cause, "api_unreachable");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP tools/call fails closed with structured authorization error for expired delegation", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-expired-"));

  try {
    const { sessionFile } = await createSmokeSession(runtime, {
      ttlSeconds: 1
    });
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.failure_type, "authorization");
    assert.equal(response.payload.root_cause, "delegation_expired");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP tools/call fails closed with structured authorization error for malformed session file", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-malformed-"));
  const sessionFile = join(repoRoot, ".atlas", "local-session.json");

  try {
    mkdirSync(join(repoRoot, ".atlas"), { recursive: true });
    writeFileSync(sessionFile, "{not-json", "utf8");

    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: sessionFile
      }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.component, "atlas-mcp-stdio");
    assert.equal(response.payload.failure_type, "authorization");
    assert.equal(response.payload.root_cause, "invalid_local_session");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP tools/call fails closed with structured authorization error for unsupported session version", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-version-"));
  const sessionFile = join(repoRoot, ".atlas", "local-session.json");

  try {
    mkdirSync(join(repoRoot, ".atlas"), { recursive: true });
    writeFileSync(
      sessionFile,
      `${JSON.stringify({
        version: 999,
        api_url: runtime.baseUrl,
        delegation_id: "delegation_test",
        expires_at: new Date(Date.now() + 60_000).toISOString()
      })}\n`,
      "utf8"
    );

    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 12,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: sessionFile
      }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.component, "atlas-mcp-stdio");
    assert.equal(response.payload.failure_type, "authorization");
    assert.equal(response.payload.root_cause, "unsupported_local_session");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP tools/call fails closed with structured authorization error for invalid delegation", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_DELEGATION_ID: "delegation_does_not_exist"
      }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.failure_type, "authorization");
    assert.equal(response.payload.root_cause, "invalid_delegation");
  } finally {
    await runtime.close();
  }
});

test("MCP tools/call fails closed with structured policy error for denied tools", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime, {
      allowedActions: ["get_workspace_overview"]
    });
    const response = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "github.open_pr", arguments: { repository: "benpham3206/Atlas" } }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );

    assert.equal(response.isError, true);
    assert.equal(response.payload.failure_type, "policy");
    assert.equal(response.payload.root_cause, "tool_not_allowed");
  } finally {
    await runtime.close();
  }
});

test("MCP tools/call records audit evidence for allowed and denied Tool Router calls", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime, {
      allowedActions: ["get_workspace_overview"]
    });

    const allowed = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 9,
        method: "tools/call",
        params: { name: "get_workspace_overview", arguments: {} }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );
    assert.equal(allowed.isError, false);

    const denied = await runMcpExchange(
      {
        jsonrpc: "2.0",
        id: 10,
        method: "tools/call",
        params: { name: "github.open_pr", arguments: { repository: "benpham3206/Atlas" } }
      },
      { ATLAS_SESSION_FILE: sessionFile }
    );
    assert.equal(denied.isError, true);

    const events = await readAuditEvents(runtime.baseUrl, session.workspace.id);
    assert.ok(
      events.some(
        (event) =>
          event.event_type === "agent.tool_call" &&
          event.resource_id === "get_workspace_overview" &&
          event.decision === "allow"
      )
    );
    assert.ok(
      events.some(
        (event) =>
          event.event_type === "agent.tool_call" &&
          event.resource_id === "github.open_pr" &&
          event.decision === "deny"
      )
    );
  } finally {
    await runtime.close();
  }
});

test("operational bootstrap publishes a complete MCP host config and session file", async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-bootstrap-kit-"));
  const runtime = await startMcpSmokeRuntime();

  try {
    const { session, sessionFile } = await createSmokeSession(runtime);
    const published = publishOperationalSession(session, runtime.baseUrl, {
      repoRoot,
      sessionFile: join(repoRoot, ".atlas", "local-session.json")
    });

    assert.ok(published.kit.cursor_mcp_config.mcpServers.atlas);
    assert.equal(
      published.kit.cursor_mcp_config.mcpServers.atlas.env.ATLAS_SESSION_FILE,
      ".atlas/local-session.json"
    );
    assert.equal(published.kit.ATLAS_API_URL, runtime.baseUrl);
    assert.equal(published.kit.ATLAS_DELEGATION_ID, session.delegation.id);
    assert.ok(published.kit.local_session);
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("MCP stdio script handles framed initialize/list/call over subprocess IO", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    const { sessionFile } = await createSmokeSession(runtime);
    const responses = await runMcpStdioScript(
      [
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "get_workspace_overview", arguments: {} }
        }
      ],
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: sessionFile
      }
    );

    assert.equal(responses.length, 3);
    assert.equal(responses[0].result.serverInfo.name, "atlas");
    assert.ok(responses[1].result.tools.length > 0);
    assert.equal(responses[2].result.isError, undefined);
    assert.ok(responses[2].result.content[0].text.includes("goal_contract_id"));
  } finally {
    await runtime.close();
  }
});

test("MCP stdio subprocess returns structured tool error payload", async () => {
  const runtime = await startMcpSmokeRuntime();
  const repoRoot = mkdtempSync(join(tmpdir(), "atlas-mcp-subprocess-error-"));

  try {
    const responses = await runMcpStdioScript(
      [
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_workspace_overview", arguments: {} }
        }
      ],
      {
        ATLAS_API_URL: runtime.baseUrl,
        ATLAS_SESSION_FILE: join(repoRoot, ".atlas", "missing-session.json")
      }
    );

    const payload = parseToolErrorText(responses[0]);
    assert.equal(payload.failure_type, "authorization");
    assert.equal(payload.root_cause, "missing_local_session");
  } finally {
    await runtime.close();
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("manifest regression keeps no merge tool and Slack remains read-only", async () => {
  const runtime = await startMcpSmokeRuntime();

  try {
    await assertManifestHasNoMergeTool(runtime.baseUrl);
    const manifest = requireOk(await api(runtime.baseUrl, "GET", "/agent/manifest"), "get manifest");
    const slackTools = manifest.tools.filter((tool) => tool.name.startsWith("slack."));
    assert.deepEqual(slackTools.map((tool) => tool.name), ["slack.get_channel_info"]);
  } finally {
    await runtime.close();
  }
});
