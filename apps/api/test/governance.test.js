import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/server.js";

async function startTestServer(t) {
  const server = createApiServer({
    now: () => "2026-06-28T00:00:00.000Z"
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

async function createWorkspace(baseUrl, id = "workspace_game_studio") {
  return requestJson(baseUrl, "/workspaces", {
    method: "POST",
    body: {
      id,
      name: "Game Studio"
    }
  });
}

async function createUser(baseUrl, id = "user_lead_engineer") {
  return requestJson(baseUrl, "/users", {
    method: "POST",
    body: {
      id,
      email: "lead@example.com",
      display_name: "Lead Engineer",
      identity_provider_subject: "idp|lead"
    }
  });
}

test("creates, lists, and fetches local User records", async (t) => {
  const baseUrl = await startTestServer(t);

  const created = await createUser(baseUrl);

  assert.equal(created.status, 201);
  assert.equal(created.payload.data.id, "user_lead_engineer");
  assert.equal(created.payload.data.email, "lead@example.com");
  assert.equal(created.payload.data.status, "active");
  assert.equal(created.payload.data.identity_provider_subject, "idp|lead");

  const list = await requestJson(baseUrl, "/users");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 1);

  const fetched = await requestJson(baseUrl, "/users/user_lead_engineer");

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.display_name, "Lead Engineer");
});

test("rejects invalid local User status and email", async (t) => {
  const baseUrl = await startTestServer(t);

  const invalidStatus = await requestJson(baseUrl, "/users", {
    method: "POST",
    body: {
      id: "user_suspended",
      email: "suspended@example.com",
      display_name: "Suspended User",
      status: "disabled"
    }
  });

  assert.equal(invalidStatus.status, 400);
  assert.equal(invalidStatus.payload.error, "invalid_request");

  const invalidEmail = await requestJson(baseUrl, "/users", {
    method: "POST",
    body: {
      id: "user_invalid_email",
      email: "not-an-email",
      display_name: "Invalid Email"
    }
  });

  assert.equal(invalidEmail.status, 400);
  assert.equal(invalidEmail.payload.error, "invalid_user");
});

test("rejects duplicate local User id or email", async (t) => {
  const baseUrl = await startTestServer(t);
  await createUser(baseUrl);

  const duplicateId = await createUser(baseUrl);

  assert.equal(duplicateId.status, 409);
  assert.equal(duplicateId.payload.error, "user_conflict");

  const duplicateEmail = await requestJson(baseUrl, "/users", {
    method: "POST",
    body: {
      id: "user_second",
      email: "lead@example.com",
      display_name: "Second User"
    }
  });

  assert.equal(duplicateEmail.status, 409);
  assert.equal(duplicateEmail.payload.error, "user_conflict");
});

test("creates, lists, and fetches WorkspaceMembership with role enum", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);
  await createUser(baseUrl);

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      id: "membership_game_studio_owner",
      user_id: "user_lead_engineer",
      role: "owner"
    }
  });

  assert.equal(created.status, 201);
  assert.equal(created.payload.data.workspace_id, "workspace_game_studio");
  assert.equal(created.payload.data.user_id, "user_lead_engineer");
  assert.equal(created.payload.data.role, "owner");

  const list = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 1);

  const fetched = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships/membership_game_studio_owner");

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.role, "owner");
});

test("rejects invalid WorkspaceMembership role and duplicate user membership", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);
  await createUser(baseUrl);

  const invalidRole = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      user_id: "user_lead_engineer",
      role: "superuser"
    }
  });

  assert.equal(invalidRole.status, 400);
  assert.equal(invalidRole.payload.error, "invalid_request");

  const first = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      id: "membership_first",
      user_id: "user_lead_engineer",
      role: "editor"
    }
  });

  assert.equal(first.status, 201);

  const duplicate = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      id: "membership_second",
      user_id: "user_lead_engineer",
      role: "viewer"
    }
  });

  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.payload.error, "workspace_membership_conflict");
});

test("workspace membership routes do not leak across workspaces", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl, "workspace_game_studio");
  await createWorkspace(baseUrl, "workspace_other");
  await createUser(baseUrl);

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      id: "membership_game_studio_viewer",
      user_id: "user_lead_engineer",
      role: "viewer"
    }
  });

  assert.equal(created.status, 201);

  const crossWorkspaceFetch = await requestJson(
    baseUrl,
    "/workspaces/workspace_other/memberships/membership_game_studio_viewer"
  );

  assert.equal(crossWorkspaceFetch.status, 404);
  assert.equal(crossWorkspaceFetch.payload.error, "workspace_membership_not_found");

  const crossWorkspaceList = await requestJson(baseUrl, "/workspaces/workspace_other/memberships");

  assert.equal(crossWorkspaceList.status, 200);
  assert.equal(crossWorkspaceList.payload.data.length, 0);
});

test("WorkspaceMembership requires an existing User", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/memberships", {
    method: "POST",
    body: {
      user_id: "user_missing",
      role: "viewer"
    }
  });

  assert.equal(created.status, 404);
  assert.equal(created.payload.error, "user_not_found");
});

test("creates, lists, and fetches local Policy records", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies", {
    method: "POST",
    body: {
      id: "policy_editors_run_actions",
      name: "Editors can run actions",
      description: "Allow editors and owners to create action runs.",
      rules_json: [
        {
          effect: "allow",
          action: "action_run:create",
          resource_type: "ActionRun",
          roles: ["owner", "editor"]
        }
      ]
    }
  });

  assert.equal(created.status, 201);
  assert.equal(created.payload.data.workspace_id, "workspace_game_studio");
  assert.equal(created.payload.data.status, "active");
  assert.deepEqual(created.payload.data.rules_json, [
    {
      effect: "allow",
      action: "action_run:create",
      resource_type: "ActionRun",
      roles: ["owner", "editor"]
    }
  ]);

  const list = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 1);

  const fetched = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies/policy_editors_run_actions");

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.description, "Allow editors and owners to create action runs.");
});

test("rejects invalid Policy rules", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);

  const missingRoles = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies", {
    method: "POST",
    body: {
      name: "Invalid policy",
      rules_json: [
        {
          effect: "allow",
          action: "action_run:create",
          resource_type: "ActionRun",
          roles: []
        }
      ]
    }
  });

  assert.equal(missingRoles.status, 400);
  assert.equal(missingRoles.payload.error, "invalid_policy");

  const invalidRole = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies", {
    method: "POST",
    body: {
      name: "Invalid role policy",
      rules_json: [
        {
          effect: "allow",
          action: "action_run:create",
          resource_type: "ActionRun",
          roles: ["superuser"]
        }
      ]
    }
  });

  assert.equal(invalidRole.status, 400);
  assert.equal(invalidRole.payload.error, "invalid_request");
});

test("policy routes do not leak across workspaces", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl, "workspace_game_studio");
  await createWorkspace(baseUrl, "workspace_other");

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies", {
    method: "POST",
    body: {
      id: "policy_game_studio",
      name: "Game Studio Policy",
      rules_json: [
        {
          effect: "deny",
          action: "action_run:create",
          resource_type: "ActionRun",
          roles: ["viewer"]
        }
      ]
    }
  });

  assert.equal(created.status, 201);

  const crossWorkspaceFetch = await requestJson(baseUrl, "/workspaces/workspace_other/policies/policy_game_studio");

  assert.equal(crossWorkspaceFetch.status, 404);
  assert.equal(crossWorkspaceFetch.payload.error, "policy_not_found");

  const crossWorkspaceList = await requestJson(baseUrl, "/workspaces/workspace_other/policies");

  assert.equal(crossWorkspaceList.status, 200);
  assert.equal(crossWorkspaceList.payload.data.length, 0);
});

test("creates, lists, and fetches allowed and denied PermissionCheck records", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);

  await requestJson(baseUrl, "/workspaces/workspace_game_studio/policies", {
    method: "POST",
    body: {
      id: "policy_editors_run_actions",
      name: "Editors can run actions",
      rules_json: [
        {
          effect: "allow",
          action: "action_run:create",
          resource_type: "ActionRun",
          roles: ["editor"]
        }
      ]
    }
  });

  const allowed = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks", {
    method: "POST",
    body: {
      id: "permission_check_editor_allow",
      principal_type: "user",
      principal_id: "user_editor",
      role: "editor",
      action: "action_run:create",
      resource_type: "ActionRun",
      resource_id: "action_run_mark_resolved",
      decision: "allow",
      policy_id: "policy_editors_run_actions",
      reason: "Editor role matches allow rule"
    }
  });

  assert.equal(allowed.status, 201);
  assert.equal(allowed.payload.data.decision, "allow");
  assert.equal(allowed.payload.data.policy_id, "policy_editors_run_actions");

  const denied = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks", {
    method: "POST",
    body: {
      id: "permission_check_viewer_deny",
      principal_type: "user",
      principal_id: "user_viewer",
      role: "viewer",
      action: "action_run:create",
      resource_type: "ActionRun",
      decision: "deny",
      reason: "Viewer role cannot run actions"
    }
  });

  assert.equal(denied.status, 201);
  assert.equal(denied.payload.data.decision, "deny");

  const list = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks");

  assert.equal(list.status, 200);
  assert.equal(list.payload.data.length, 2);

  const fetched = await requestJson(
    baseUrl,
    "/workspaces/workspace_game_studio/permission-checks/permission_check_editor_allow"
  );

  assert.equal(fetched.status, 200);
  assert.equal(fetched.payload.data.reason, "Editor role matches allow rule");
});

test("rejects invalid PermissionCheck decisions and missing policy references", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl);

  const invalidDecision = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks", {
    method: "POST",
    body: {
      principal_type: "user",
      principal_id: "user_editor",
      action: "action_run:create",
      resource_type: "ActionRun",
      decision: "maybe"
    }
  });

  assert.equal(invalidDecision.status, 400);
  assert.equal(invalidDecision.payload.error, "invalid_request");

  const missingPolicy = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks", {
    method: "POST",
    body: {
      principal_type: "user",
      principal_id: "user_editor",
      action: "action_run:create",
      resource_type: "ActionRun",
      decision: "allow",
      policy_id: "policy_missing"
    }
  });

  assert.equal(missingPolicy.status, 404);
  assert.equal(missingPolicy.payload.error, "policy_not_found");
});

test("permission check routes do not leak across workspaces", async (t) => {
  const baseUrl = await startTestServer(t);
  await createWorkspace(baseUrl, "workspace_game_studio");
  await createWorkspace(baseUrl, "workspace_other");

  const created = await requestJson(baseUrl, "/workspaces/workspace_game_studio/permission-checks", {
    method: "POST",
    body: {
      id: "permission_check_game_studio",
      principal_type: "user",
      principal_id: "user_editor",
      action: "action_run:create",
      resource_type: "ActionRun",
      decision: "allow"
    }
  });

  assert.equal(created.status, 201);

  const crossWorkspaceFetch = await requestJson(
    baseUrl,
    "/workspaces/workspace_other/permission-checks/permission_check_game_studio"
  );

  assert.equal(crossWorkspaceFetch.status, 404);
  assert.equal(crossWorkspaceFetch.payload.error, "permission_check_not_found");

  const crossWorkspaceList = await requestJson(baseUrl, "/workspaces/workspace_other/permission-checks");

  assert.equal(crossWorkspaceList.status, 200);
  assert.equal(crossWorkspaceList.payload.data.length, 0);
});
