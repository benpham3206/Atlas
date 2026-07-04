import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/server.js";
import { createOntologyStore } from "../src/ontology-store.js";

async function startTestServer(t, store) {
  const server = createApiServer({
    now: () => "2026-06-28T00:00:00.000Z",
    store
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();

  return {
    status: response.status,
    payload
  };
}

function seedScopedRecords(store) {
  const workspaceA = store.createWorkspace({ id: "workspace_scope_a", name: "Scope A" });
  const workspaceB = store.createWorkspace({ id: "workspace_scope_b", name: "Scope B" });
  const user = store.createUser({
    id: "user_scope_owner",
    email: "owner@example.com",
    display_name: "Owner"
  });
  const membership = store.createWorkspaceMembership(workspaceA.id, {
    id: "membership_scope_a",
    user_id: user.id,
    role: "owner"
  });
  const policy = store.createPolicy(workspaceA.id, {
    id: "policy_scope_a",
    name: "Editors can run actions",
    rules_json: [
      { effect: "allow", action: "run_action", resource_type: "object_type_scope_task", roles: ["editor", "owner"] }
    ]
  });
  const permissionCheck = store.createPermissionCheck(workspaceA.id, {
    id: "permission_check_scope_a",
    principal_type: "user",
    principal_id: user.id,
    role: "owner",
    action: "run_action",
    resource_type: "object_type_scope_task",
    decision: "allow",
    policy_id: policy.id,
    reason: "scope fixture"
  });
  const objectType = store.createObjectType(workspaceA.id, {
    id: "object_type_scope_task",
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
  const taskA = store.createObjectInstance(workspaceA.id, {
    id: "object_scope_task_a",
    object_type_id: objectType.id,
    properties_json: { title: "Scope A task", status: "todo" }
  });
  const taskB = store.createObjectInstance(workspaceA.id, {
    id: "object_scope_task_b",
    object_type_id: objectType.id,
    properties_json: { title: "Scope A blocked task", status: "todo" }
  });
  const linkType = store.createLinkType(workspaceA.id, {
    id: "link_type_scope_blocks",
    name: "blocks",
    from_object_type_id: objectType.id,
    to_object_type_id: objectType.id
  });
  const link = store.createLinkInstance(workspaceA.id, {
    id: "link_scope_a",
    link_type_id: linkType.id,
    from_object_id: taskA.id,
    to_object_id: taskB.id
  });
  const objectSet = store.createObjectSet(workspaceA.id, {
    id: "object_set_scope_todo",
    name: "Todo tasks",
    object_type_id: objectType.id,
    filter_expression: { property_equals: { status: "todo" } }
  });
  const actionType = store.createActionType(workspaceA.id, {
    id: "action_type_scope_complete",
    name: "Complete task",
    target_object_type_id: objectType.id,
    input_schema_json: { type: "object", properties: {} },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: { status: "done" }
    }
  });
  const actionRun = store.createActionRun(workspaceA.id, {
    id: "action_run_scope_complete",
    action_type_id: actionType.id,
    target_object_id: taskA.id,
    actor: "scope-test",
    enforce_policy: false
  });
  const agent = store.createAgent({ id: "agent_scope", display_name: "Scope Agent" });
  const goalContract = store.createGoalContract(workspaceA.id, {
    id: "goal_contract_scope",
    objective: "Prove workspace scope",
    allowed_actions: ["generate_review_packet"],
    done_definition: "Cross-workspace routes fail"
  });
  const delegation = store.createAgentDelegation(workspaceA.id, {
    id: "delegation_scope_a",
    agent_id: agent.id,
    role: "editor",
    scopes: ["atlas.read", "atlas.act"],
    allowed_tools: ["generate_review_packet"],
    goal_contract_id: goalContract.id
  });
  const pullRequestArtifact = store.createPullRequestArtifact(workspaceA.id, {
    id: "pull_request_artifact_scope",
    goal_contract_id: goalContract.id,
    repository: "benpham3206/Atlas",
    title: "Scope proof",
    body: "Workspace boundary proof",
    head_branch: "codex/scope-proof",
    base_branch: "main",
    external_url: "https://github.com/benpham3206/Atlas/pull/999"
  });
  const auditEvent = store.listAuditEvents(workspaceA.id)[0];
  const reviewPacket = store.createReviewPacket(workspaceA.id, {
    id: "review_packet_scope",
    goal_contract_id: goalContract.id,
    pull_request_artifact_id: pullRequestArtifact.id,
    summary: "Scope proof packet",
    changed_files: ["apps/api/test/workspace-scope-regression.test.js"],
    verification_commands: ["npm run test:api"],
    audit_event_ids: [auditEvent.id]
  });

  return {
    workspaceA,
    workspaceB,
    ids: {
      membership: membership.id,
      policy: policy.id,
      permissionCheck: permissionCheck.id,
      objectType: objectType.id,
      object: taskA.id,
      objectLinks: taskA.id,
      linkType: linkType.id,
      link: link.id,
      objectSet: objectSet.id,
      objectSetObjects: objectSet.id,
      actionType: actionType.id,
      actionRun: actionRun.id,
      delegation: delegation.id,
      goalContract: goalContract.id,
      pullRequestArtifact: pullRequestArtifact.id,
      reviewPacket: reviewPacket.id,
      auditEvent: auditEvent.id
    }
  };
}

test("workspace-scoped data endpoints do not leak records across route workspace", async (t) => {
  const store = createOntologyStore({ now: () => "2026-06-28T00:00:00.000Z" });
  const { workspaceB, ids } = seedScopedRecords(store);
  const baseUrl = await startTestServer(t, store);

  const scopedRoutes = [
    { collectionPath: "memberships", fetchPath: `memberships/${ids.membership}`, id: ids.membership, error: "workspace_membership_not_found" },
    { collectionPath: "policies", fetchPath: `policies/${ids.policy}`, id: ids.policy, error: "policy_not_found" },
    { collectionPath: "permission-checks", fetchPath: `permission-checks/${ids.permissionCheck}`, id: ids.permissionCheck, error: "permission_check_not_found" },
    { collectionPath: "object-types", fetchPath: `object-types/${ids.objectType}`, id: ids.objectType, error: "object_type_not_found" },
    { collectionPath: "objects", fetchPath: `objects/${ids.object}`, id: ids.object, error: "object_instance_not_found" },
    { collectionPath: "objects", fetchPath: `objects/${ids.objectLinks}/links`, id: ids.objectLinks, error: "object_instance_not_found" },
    { collectionPath: "link-types", fetchPath: `link-types/${ids.linkType}`, id: ids.linkType, error: "link_type_not_found" },
    { collectionPath: "links", fetchPath: `links/${ids.link}`, id: ids.link, error: "link_instance_not_found" },
    { collectionPath: "object-sets", fetchPath: `object-sets/${ids.objectSet}`, id: ids.objectSet, error: "object_set_not_found" },
    { collectionPath: "object-sets", fetchPath: `object-sets/${ids.objectSetObjects}/objects`, id: ids.objectSetObjects, error: "object_set_not_found" },
    { collectionPath: "action-types", fetchPath: `action-types/${ids.actionType}`, id: ids.actionType, error: "action_type_not_found" },
    { collectionPath: "action-runs", fetchPath: `action-runs/${ids.actionRun}`, id: ids.actionRun, error: "action_run_not_found" },
    { collectionPath: "agent-delegations", fetchPath: `agent-delegations/${ids.delegation}`, id: ids.delegation, error: "delegation_not_found" },
    { collectionPath: "goal-contracts", fetchPath: `goal-contracts/${ids.goalContract}`, id: ids.goalContract, error: "goal_contract_not_found" },
    {
      collectionPath: "pull-request-artifacts",
      fetchPath: `pull-request-artifacts/${ids.pullRequestArtifact}`,
      id: ids.pullRequestArtifact,
      error: "pull_request_artifact_not_found"
    },
    { collectionPath: "review-packets", fetchPath: `review-packets/${ids.reviewPacket}`, id: ids.reviewPacket, error: "review_packet_not_found" },
    { collectionPath: "audit-events", fetchPath: `audit-events/${ids.auditEvent}`, id: ids.auditEvent, error: "audit_event_not_found" }
  ];

  for (const route of scopedRoutes) {
    const list = await requestJson(baseUrl, `/workspaces/${workspaceB.id}/${route.collectionPath}`);
    assert.equal(list.status, 200, route.collectionPath);
    assert.equal(
      list.payload.data.some((record) => record.id === route.id),
      false,
      `${route.collectionPath} leaked ${route.id}`
    );

    const fetch = await requestJson(baseUrl, `/workspaces/${workspaceB.id}/${route.fetchPath}`);
    assert.equal(fetch.status, 404, route.fetchPath);
    assert.equal(fetch.payload.error, route.error, route.fetchPath);
  }
});

test("workspace-scoped write endpoints reject cross-workspace references", async (t) => {
  const store = createOntologyStore({ now: () => "2026-06-28T00:00:00.000Z" });
  const { workspaceB, ids } = seedScopedRecords(store);
  const baseUrl = await startTestServer(t, store);

  const writeAttempts = [
    {
      path: "memberships",
      body: { user_id: "user_scope_owner", role: "owner", workspace_id: "workspace_scope_a" },
      error: "workspace_mismatch"
    },
    {
      path: "policies",
      body: {
        name: "Mismatched policy",
        workspace_id: "workspace_scope_a",
        rules_json: [{ effect: "allow", action: "run_action", resource_type: ids.objectType, roles: ["owner"] }]
      },
      error: "workspace_mismatch"
    },
    {
      path: "permission-checks",
      body: {
        principal_type: "user",
        principal_id: "user_scope_owner",
        action: "run_action",
        resource_type: ids.objectType,
        decision: "allow",
        policy_id: ids.policy
      },
      error: "policy_not_found"
    },
    {
      path: "object-types",
      body: { name: "Mismatched object type", workspace_id: "workspace_scope_a", schema_json: { type: "object", properties: {} } },
      error: "workspace_mismatch"
    },
    {
      path: "objects",
      body: { object_type_id: ids.objectType, properties_json: { title: "Leaky task", status: "todo" } },
      error: "object_type_not_found"
    },
    {
      path: "link-types",
      body: { name: "Leaky link type", from_object_type_id: ids.objectType, to_object_type_id: ids.objectType },
      error: "object_type_not_found"
    },
    {
      path: "links",
      body: { link_type_id: ids.linkType, from_object_id: ids.object, to_object_id: "object_scope_task_b" },
      error: "link_type_not_found"
    },
    {
      path: "object-sets",
      body: { name: "Leaky set", object_type_id: ids.objectType },
      error: "object_type_not_found"
    },
    {
      path: "action-types",
      body: {
        name: "Leaky action",
        target_object_type_id: ids.objectType,
        input_schema_json: { type: "object", properties: {} },
        effect_json: { type: "update_object_properties", set_properties_json: { status: "done" } }
      },
      error: "object_type_not_found"
    },
    {
      path: "action-runs",
      body: { action_type_id: ids.actionType, target_object_id: ids.object, input_json: {} },
      error: "action_type_not_found"
    },
    {
      path: "agent-delegations",
      body: {
        agent_id: "agent_scope",
        role: "editor",
        scopes: ["atlas.read"],
        allowed_tools: ["get_workspace_overview"],
        goal_contract_id: ids.goalContract
      },
      error: "goal_contract_not_found"
    },
    {
      path: "goal-contracts",
      body: {
        objective: "Mismatched contract",
        workspace_id: "workspace_scope_a",
        done_definition: "Should fail"
      },
      error: "workspace_mismatch"
    },
    {
      path: "review-packets",
      body: { summary: "Leaky packet", pull_request_artifact_id: ids.pullRequestArtifact },
      error: "pull_request_artifact_not_found"
    }
  ];

  for (const attempt of writeAttempts) {
    const result = await requestJson(baseUrl, `/workspaces/${workspaceB.id}/${attempt.path}`, {
      method: "POST",
      body: attempt.body
    });

    assert.notEqual(result.status, 201, attempt.path);
    assert.equal(result.payload.error, attempt.error, attempt.path);
  }
});
