import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";
import { AGENT_TOOLS, dispatchAgentTool, getAgentManifest } from "../src/agent-gateway.js";

const TASK_TYPE = "object_type_task";
const BLOCKS_LINK = "link_type_blocks";
const ACTION_TYPE = "action_type_complete";

function seedWorkspace(store, { governed } = { governed: false }) {
  const workspace = store.createWorkspace({ id: "workspace_demo", name: "Demo" });

  store.createObjectType(workspace.id, {
    id: TASK_TYPE,
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
  });

  const taskA = store.createObjectInstance(workspace.id, {
    id: "object_task_a",
    object_type_id: TASK_TYPE,
    properties_json: { title: "Design schema", status: "todo", priority: 1, acceptance_criteria: "All 3 tables defined" }
  });
  const taskB = store.createObjectInstance(workspace.id, {
    id: "object_task_b",
    object_type_id: TASK_TYPE,
    properties_json: { title: "Implement API", status: "todo", priority: 2, acceptance_criteria: "All 5 endpoints pass" }
  });

  store.createLinkType(workspace.id, {
    id: BLOCKS_LINK,
    name: "blocks",
    from_object_type_id: TASK_TYPE,
    to_object_type_id: TASK_TYPE
  });
  store.createLinkInstance(workspace.id, {
    link_type_id: BLOCKS_LINK,
    from_object_id: taskA.id,
    to_object_id: taskB.id
  });

  store.createActionType(workspace.id, {
    id: ACTION_TYPE,
    name: "Complete task",
    target_object_type_id: TASK_TYPE,
    input_schema_json: { type: "object", properties: {} },
    effect_json: { type: "update_object_properties", set_properties_json: { status: "done" } }
  });

  if (governed) {
    store.createPolicy(workspace.id, {
      name: "Editors may run task actions",
      rules_json: [
        { effect: "allow", action: "run_action", resource_type: TASK_TYPE, roles: ["editor", "admin", "owner"] }
      ]
    });
  }

  return { workspace, taskA, taskB };
}

function delegate(store, workspaceId, overrides = {}) {
  const agent = store.createAgent({ display_name: overrides.display_name ?? "Coding Agent" });
  return store.createAgentDelegation(workspaceId, {
    agent_id: agent.id,
    role: overrides.role ?? "editor",
    scopes: overrides.scopes ?? ["atlas.read", "atlas.act"],
    allowed_tools: overrides.allowed_tools ?? ["*"],
    expires_at: overrides.expires_at
  });
}

test("manifest advertises tools, scopes, and verification order", () => {
  const manifest = getAgentManifest();
  assert.equal(manifest.tools.length, AGENT_TOOLS.length);
  assert.ok(manifest.scopes.includes("atlas.read"));
  assert.ok(manifest.scopes.includes("atlas.act"));
  assert.equal(manifest.verification_order[0], "resolve_delegation_token");
  assert.ok(manifest.tools.every((tool) => typeof tool.input_schema === "object"));
});

test("an agent can read the graph through scoped tools", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { scopes: ["atlas.read"] });

  const overview = dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "get_workspace_overview",
    input: {}
  });
  assert.equal(overview.result.object_types[0].object_count, 2);

  const search = dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "search_records",
    input: { query: "schema" }
  });
  assert.equal(search.result.match_count, 1);
  assert.equal(search.result.matches[0].id, "object_task_a");

  const next = dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "get_next_action",
    input: { task_object_type_id: TASK_TYPE, blocks_link_type_id: BLOCKS_LINK }
  });
  assert.equal(next.result.task.id, "object_task_a");
});

test("read-only delegation cannot run actions (scope enforced + audited)", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskA } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { scopes: ["atlas.read"] });

  assert.throws(
    () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "run_action",
        input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "scope_not_granted");
      return true;
    }
  );

  const denied = store.listAuditEvents(workspace.id, { event_type: "agent.tool_call" }).filter(
    (event) => event.decision === "deny"
  );
  assert.equal(denied.length, 1);
  assert.equal(store.verifyAuditChain().valid, true);
});

test("tool allowlist is enforced", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { allowed_tools: ["query_object"] });

  assert.throws(
    () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "search_records",
        input: { query: "schema" }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "tool_not_allowed");
      return true;
    }
  );
});

test("expired delegation is rejected", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { expires_at: "2026-06-13T00:00:00.000Z" });

  assert.throws(
    () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "query_object",
        input: { object_id: "object_task_a" }
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, "delegation_expired");
      return true;
    }
  );
});

test("invalid delegation token is rejected", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);

  assert.throws(
    () =>
      dispatchAgentTool(store, {
        delegationId: "delegation_nope",
        toolName: "query_object",
        input: { object_id: "object_task_a" }
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, "invalid_delegation");
      return true;
    }
  );

  assert.equal(workspace.id, "workspace_demo");
});

test("governed run_action: editor allowed, viewer denied, with full audit chain", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskA } = seedWorkspace(store, { governed: true });

  const editor = delegate(store, workspace.id, { role: "editor", display_name: "Editor Agent" });
  const viewer = delegate(store, workspace.id, { role: "viewer", display_name: "Viewer Agent" });

  const available = dispatchAgentTool(store, {
    delegationId: viewer.id,
    toolName: "get_available_actions",
    input: {}
  });
  assert.equal(available.result[0].allowed_for_role, false);

  assert.throws(
    () =>
      dispatchAgentTool(store, {
        delegationId: viewer.id,
        toolName: "run_action",
        input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "policy_denied");
      return true;
    }
  );
  assert.equal(store.getObjectInstance(workspace.id, taskA.id).properties_json.status, "todo");

  const run = dispatchAgentTool(store, {
    delegationId: editor.id,
    toolName: "run_action",
    input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
  });
  assert.equal(run.result.status, "completed");
  assert.equal(store.getObjectInstance(workspace.id, taskA.id).properties_json.status, "done");

  const verification = dispatchAgentTool(store, {
    delegationId: editor.id,
    toolName: "verify_audit_chain",
    input: {}
  });
  assert.equal(verification.result.valid, true);
});
