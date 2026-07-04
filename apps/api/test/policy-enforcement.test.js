import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";

function seedGovernableWorkspace(store) {
  const workspace = store.createWorkspace({ name: "Governed Workspace" });
  const taskType = store.createObjectType(workspace.id, {
    name: "Task",
    schema_json: {
      type: "object",
      required: ["title", "status"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "done"] }
      }
    }
  });
  const task = store.createObjectInstance(workspace.id, {
    object_type_id: taskType.id,
    properties_json: { title: "Ship governance", status: "todo" }
  });
  const actionType = store.createActionType(workspace.id, {
    name: "Complete task",
    target_object_type_id: taskType.id,
    input_schema_json: { type: "object", properties: {} },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: { status: "done" }
    }
  });

  return { workspace, taskType, task, actionType };
}

test("ungoverned workspace allows action runs without a role", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, task, actionType } = seedGovernableWorkspace(store);

  const run = store.createActionRun(workspace.id, {
    action_type_id: actionType.id,
    target_object_id: task.id,
    actor: "local_user"
  });

  assert.equal(run.status, "completed");
  assert.equal(store.listPermissionChecks(workspace.id).length, 0);
});

test("governed workspace allows a permitted role and records the decision", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType, task, actionType } = seedGovernableWorkspace(store);

  store.createPolicy(workspace.id, {
    name: "Editors may run task actions",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["editor", "admin", "owner"] }
    ]
  });

  const run = store.createActionRun(workspace.id, {
    action_type_id: actionType.id,
    target_object_id: task.id,
    actor: "agent_editor",
    principal_type: "agent",
    principal_id: "agent_editor",
    role: "editor"
  });

  assert.equal(run.status, "completed");

  const checks = store.listPermissionChecks(workspace.id);
  assert.equal(checks.length, 1);
  assert.equal(checks[0].decision, "allow");
  assert.equal(checks[0].action, "run_action");
  assert.equal(checks[0].role, "editor");

  const decisionEvents = store.listAuditEvents(workspace.id, { event_type: "permission.decision" });
  assert.equal(decisionEvents.length, 1);
  assert.equal(decisionEvents[0].decision, "allow");
  assert.equal(store.verifyAuditChain().valid, true);
});

test("governed workspace denies a forbidden role and does not mutate", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType, task, actionType } = seedGovernableWorkspace(store);

  store.createPolicy(workspace.id, {
    name: "Only editors may run task actions",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["editor"] }
    ]
  });

  assert.throws(
    () =>
      store.createActionRun(workspace.id, {
        action_type_id: actionType.id,
        target_object_id: task.id,
        actor: "agent_viewer",
        principal_type: "agent",
        principal_id: "agent_viewer",
        role: "viewer"
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "policy_denied");
      return true;
    }
  );

  const reread = store.getObjectInstance(workspace.id, task.id);
  assert.equal(reread.properties_json.status, "todo");

  const checks = store.listPermissionChecks(workspace.id);
  assert.equal(checks.length, 1);
  assert.equal(checks[0].decision, "deny");

  const denyEvents = store.listAuditEvents(workspace.id, { event_type: "permission.decision" });
  assert.equal(denyEvents.length, 1);
  assert.equal(denyEvents[0].decision, "deny");
});

test("governed workspace denies when no role is supplied", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType, task, actionType } = seedGovernableWorkspace(store);

  store.createPolicy(workspace.id, {
    name: "Editors may run task actions",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["editor"] }
    ]
  });

  assert.throws(
    () =>
      store.createActionRun(workspace.id, {
        action_type_id: actionType.id,
        target_object_id: task.id,
        actor: "anonymous"
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test("explicit authorize reports decisions with deny rule precedence", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType } = seedGovernableWorkspace(store);

  store.createPolicy(workspace.id, {
    name: "Mixed rules",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: "*", roles: ["editor", "viewer"] },
      { effect: "deny", action: "run_action", resource_type: taskType.id, roles: ["viewer"] }
    ]
  });

  const allow = store.authorize(workspace.id, {
    principal_type: "agent",
    principal_id: "agent_editor",
    role: "editor",
    action: "run_action",
    resource_type: taskType.id
  });
  assert.equal(allow.decision, "allow");

  const deny = store.authorize(workspace.id, {
    principal_type: "agent",
    principal_id: "agent_viewer",
    role: "viewer",
    action: "run_action",
    resource_type: taskType.id
  });
  assert.equal(deny.decision, "deny");
  assert.equal(deny.reason, "denied_by_policy_rule");
});

test("policy matrix covers role, action, and resource outcomes", () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskType } = seedGovernableWorkspace(store);
  const bugType = store.createObjectType(workspace.id, {
    name: "Bug",
    schema_json: {
      type: "object",
      required: ["title", "severity"],
      properties: {
        title: { type: "string" },
        severity: { type: "integer" }
      }
    }
  });

  store.createPolicy(workspace.id, {
    name: "Matrix policy",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: taskType.id, roles: ["owner", "admin", "editor"] },
      { effect: "deny", action: "run_action", resource_type: taskType.id, roles: ["viewer"] },
      { effect: "allow", action: "search_records", resource_type: "*", roles: ["owner", "admin", "editor", "viewer"] },
      { effect: "deny", action: "delete_record", resource_type: "*", roles: ["owner", "admin", "editor", "viewer"] }
    ]
  });

  const cases = [
    {
      name: "owner can run task action",
      role: "owner",
      action: "run_action",
      resource_type: taskType.id,
      decision: "allow",
      reason: "allowed_by_policy_rule"
    },
    {
      name: "admin can run task action",
      role: "admin",
      action: "run_action",
      resource_type: taskType.id,
      decision: "allow",
      reason: "allowed_by_policy_rule"
    },
    {
      name: "editor can run task action",
      role: "editor",
      action: "run_action",
      resource_type: taskType.id,
      decision: "allow",
      reason: "allowed_by_policy_rule"
    },
    {
      name: "viewer cannot run task action",
      role: "viewer",
      action: "run_action",
      resource_type: taskType.id,
      decision: "deny",
      reason: "denied_by_policy_rule"
    },
    {
      name: "editor cannot run action against unlisted resource",
      role: "editor",
      action: "run_action",
      resource_type: bugType.id,
      decision: "deny",
      reason: "no_matching_allow_rule"
    },
    {
      name: "viewer can search records through wildcard resource",
      role: "viewer",
      action: "search_records",
      resource_type: bugType.id,
      decision: "allow",
      reason: "allowed_by_policy_rule"
    },
    {
      name: "owner cannot perform explicitly denied destructive action",
      role: "owner",
      action: "delete_record",
      resource_type: taskType.id,
      decision: "deny",
      reason: "denied_by_policy_rule"
    },
    {
      name: "editor cannot perform unknown action",
      role: "editor",
      action: "export_workspace",
      resource_type: taskType.id,
      decision: "deny",
      reason: "no_matching_allow_rule"
    },
    {
      name: "missing role is denied in governed workspace",
      role: null,
      action: "search_records",
      resource_type: taskType.id,
      decision: "deny",
      reason: "role_required_in_governed_workspace"
    }
  ];

  for (const testCase of cases) {
    const result = store.evaluatePolicy(workspace.id, {
      role: testCase.role,
      action: testCase.action,
      resource_type: testCase.resource_type
    });

    assert.equal(result.decision, testCase.decision, testCase.name);
    assert.equal(result.reason, testCase.reason, testCase.name);
  }
});
