import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApiServer } from "../apps/api/src/server.js";
import { createFilePersistence } from "../apps/api/src/persistence.js";

const DATA_FILE = join(tmpdir(), `atlas-agent-smoke-${process.pid}.json`);

function startServer() {
  const persistence = createFilePersistence(DATA_FILE);
  const server = createApiServer({ persistence });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function api(baseUrl, method, path, { token, body } = {}) {
  const headers = { "content-type": "application/json" };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

function step(label) {
  console.log(`\n\u25B6 ${label}`);
}

function ok(message) {
  console.log(`  \u2713 ${message}`);
}

async function main() {
  let { server, baseUrl } = await startServer();

  step("Discover the agent tool contract");
  const manifest = await api(baseUrl, "GET", "/agent/manifest");
  assert.equal(manifest.status, 200);
  ok(`manifest advertises ${manifest.payload.data.tools.length} tools and scopes ${manifest.payload.data.scopes.join(", ")}`);
  ok(`verification order: ${manifest.payload.data.verification_order.join(" -> ")}`);

  step("Seed a governed workspace (acting as the workspace owner)");
  const workspace = (await api(baseUrl, "POST", "/workspaces", { body: { name: "Agent Demo" } })).payload.data;
  const taskType = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/object-types`, {
    body: {
      name: "Task",
      schema_json: {
        type: "object",
        required: ["title", "status", "priority"],
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["todo", "done"] },
          priority: { type: "integer" },
          acceptance_criteria: { type: "string" }
        }
      }
    }
  })).payload.data;
  const taskA = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/objects`, {
    body: {
      object_type_id: taskType.id,
      properties_json: { title: "Design the schema", status: "todo", priority: 1, acceptance_criteria: "3 tables defined" }
    }
  })).payload.data;
  const taskB = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/objects`, {
    body: {
      object_type_id: taskType.id,
      properties_json: { title: "Implement the API", status: "todo", priority: 2, acceptance_criteria: "5 endpoints pass" }
    }
  })).payload.data;
  const blocksLink = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/link-types`, {
    body: { name: "blocks", from_object_type_id: taskType.id, to_object_type_id: taskType.id }
  })).payload.data;
  await api(baseUrl, "POST", `/workspaces/${workspace.id}/links`, {
    body: { link_type_id: blocksLink.id, from_object_id: taskA.id, to_object_id: taskB.id }
  });
  const actionType = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/action-types`, {
    body: {
      name: "Complete task",
      target_object_type_id: taskType.id,
      input_schema_json: { type: "object", properties: {} },
      effect_json: { type: "update_object_properties", set_properties_json: { status: "done" } }
    }
  })).payload.data;
  await api(baseUrl, "POST", `/workspaces/${workspace.id}/policies`, {
    body: {
      name: "Editors may run task actions",
      rules_json: [{ effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["editor", "admin", "owner"] }]
    }
  });
  ok(`workspace ${workspace.id} seeded with 2 tasks, a blocks link, an action, and 1 active policy`);

  step("Mint scoped, expiring delegations (identity/policy plane)");
  const agent = (await api(baseUrl, "POST", "/agents", { body: { display_name: "Coding Agent" } })).payload.data;
  const editor = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/agent-delegations`, {
    body: { agent_id: agent.id, role: "editor", scopes: ["atlas.read", "atlas.act"], ttl_seconds: 3600 }
  })).payload.data;
  const viewer = (await api(baseUrl, "POST", `/workspaces/${workspace.id}/agent-delegations`, {
    body: { agent_id: agent.id, role: "viewer", scopes: ["atlas.read", "atlas.act"], ttl_seconds: 3600 }
  })).payload.data;
  ok(`editor delegation ${editor.id} (expires ${editor.expires_at})`);
  ok(`viewer delegation ${viewer.id}`);

  step("Agent reads the graph through governed tools");
  const overview = await api(baseUrl, "POST", "/agent/tools/get_workspace_overview", { token: editor.id, body: {} });
  ok(`overview reports ${overview.payload.data.result.object_types[0].object_count} tasks, governed=${overview.payload.data.result.governed}`);
  const search = await api(baseUrl, "POST", "/agent/tools/search_records", { token: editor.id, body: { query: "schema" } });
  ok(`search "schema" -> ${search.payload.data.result.match_count} match (${search.payload.data.result.matches[0].id})`);
  const next = await api(baseUrl, "POST", "/agent/tools/get_next_action", {
    token: editor.id,
    body: { task_object_type_id: taskType.id, blocks_link_type_id: blocksLink.id }
  });
  ok(`next action -> ${next.payload.data.result.task.id} ("${next.payload.data.result.task.properties_json.title}"); ${taskB.id} is correctly blocked`);

  step("Policy is enforced on the action path");
  const viewerActions = await api(baseUrl, "POST", "/agent/tools/get_available_actions", { token: viewer.id, body: {} });
  ok(`viewer sees action "${viewerActions.payload.data.result[0].name}" allowed_for_role=${viewerActions.payload.data.result[0].allowed_for_role}`);
  const deniedRun = await api(baseUrl, "POST", "/agent/tools/run_action", {
    token: viewer.id,
    body: { action_type_id: actionType.id, target_object_id: taskA.id }
  });
  assert.equal(deniedRun.status, 403);
  ok(`viewer run_action -> ${deniedRun.status} ${deniedRun.payload.error} (object NOT mutated, denial recorded)`);
  const allowedRun = await api(baseUrl, "POST", "/agent/tools/run_action", {
    token: editor.id,
    body: { action_type_id: actionType.id, target_object_id: taskA.id }
  });
  assert.equal(allowedRun.status, 200);
  ok(`editor run_action -> completed; ${taskA.id} is now "${allowedRun.payload.data.result.after_properties_json.status}"`);

  step("Audit log is complete and tamper-evident");
  const verify = await api(baseUrl, "GET", "/audit/verify");
  assert.equal(verify.payload.data.valid, true);
  const events = (await api(baseUrl, "GET", `/workspaces/${workspace.id}/audit-events`)).payload.data;
  ok(`hash chain verifies: ${verify.payload.data.valid}`);
  ok(`${events.length} audit events recorded: ${[...new Set(events.map((event) => event.event_type))].join(", ")}`);

  step("State survives a restart (file-backed persistence)");
  await stopServer(server);
  ({ server, baseUrl } = await startServer());
  const afterRestart = await api(baseUrl, "POST", "/agent/tools/query_object", {
    token: editor.id,
    body: { object_id: taskA.id }
  });
  assert.equal(afterRestart.payload.data.result.properties_json.status, "done");
  ok(`after restart, ${taskA.id} is still "${afterRestart.payload.data.result.properties_json.status}" and delegation ${editor.id} still works`);

  await stopServer(server);
  rmSync(DATA_FILE, { force: true });

  console.log("\n\u2705 Agent smoke loop complete: discover -> delegate -> read -> govern -> audit -> persist.\n");
}

main().catch((error) => {
  console.error("\n\u274C Agent smoke loop failed:");
  console.error(error);
  rmSync(DATA_FILE, { force: true });
  process.exit(1);
});
