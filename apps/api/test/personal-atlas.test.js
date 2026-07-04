import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/server.js";

async function startTestServer(t) {
  const server = createApiServer({
    now: () => "2026-06-14T00:00:00.000Z"
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

test("POST /personal/bootstrap is idempotent", async (t) => {
  const baseUrl = await startTestServer(t);

  const first = await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  assert.equal(first.status, 200);
  assert.equal(first.payload.data.already_existed, false);
  assert.equal(first.payload.data.workspace_id, "workspace_personal");
  assert.deepEqual(first.payload.data.object_ids, [
    "object_personal_carbon_copy",
    "object_personal_project_atlas",
    "object_task_harden_personal_loop",
    "object_task_runtime_foundation",
    "object_task_policy_audit",
    "object_task_public_atlas",
    "object_task_enterprise_workspace"
  ]);

  const second = await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  assert.equal(second.status, 200);
  assert.equal(second.payload.data.already_existed, true);
  assert.deepEqual(second.payload.data.object_ids, first.payload.data.object_ids);

  const workspaces = await requestJson(baseUrl, "/workspaces");

  assert.equal(workspaces.status, 200);
  assert.equal(
    workspaces.payload.data.filter((workspace) => workspace.id === "workspace_personal").length,
    1
  );

  const tasks = await requestJson(baseUrl, "/workspaces/workspace_personal/objects?object_type_id=object_type_personal_task");

  assert.equal(tasks.status, 200);
  assert.equal(tasks.payload.data.length, 5);
});

test("personal read endpoints do not bootstrap workspace", async (t) => {
  const baseUrl = await startTestServer(t);

  const overview = await requestJson(baseUrl, "/personal/overview");
  const nextAction = await requestJson(baseUrl, "/personal/next-action");
  const tasks = await requestJson(baseUrl, "/personal/tasks");
  const workspaces = await requestJson(baseUrl, "/workspaces");

  assert.equal(overview.status, 404);
  assert.equal(overview.payload.error, "workspace_not_bootstrapped");
  assert.equal(nextAction.status, 404);
  assert.equal(nextAction.payload.error, "workspace_not_bootstrapped");
  assert.equal(tasks.status, 404);
  assert.equal(tasks.payload.error, "workspace_not_bootstrapped");
  assert.equal(workspaces.status, 200);
  assert.deepEqual(workspaces.payload.data, []);
});

test("GET /personal/next-action returns Personal Atlas hardening task first", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const nextAction = await requestJson(baseUrl, "/personal/next-action");

  assert.equal(nextAction.status, 200);
  assert.equal(nextAction.payload.data.task.id, "object_task_harden_personal_loop");
  assert.equal(nextAction.payload.data.task.properties_json.priority, 1);
  assert.equal(
    nextAction.payload.data.acceptance_criteria,
    "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria"
  );
  assert.equal(nextAction.payload.data.blockers.length, 0);
});

test("completing first task advances next action to runtime foundation", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const complete = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body: {
      artifact_uri: "evidence/personal-atlas-composer-25-review.md",
      evidence_note: "Personal Atlas review findings were fixed and verified"
    }
  });

  assert.equal(complete.status, 200);
  assert.equal(complete.payload.data.task.properties_json.status, "done");
  assert.equal(complete.payload.data.next_action.task.id, "object_task_runtime_foundation");
  assert.equal(complete.payload.data.next_action.task.properties_json.priority, 2);

  const nextAction = await requestJson(baseUrl, "/personal/next-action");

  assert.equal(nextAction.status, 200);
  assert.equal(nextAction.payload.data.task.id, "object_task_runtime_foundation");
});

test("missing artifact or evidence is rejected and task status unchanged", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const missingEvidence = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body: {
      artifact_uri: "evidence/personal-atlas-composer-25-review.md"
    }
  });

  assert.equal(missingEvidence.status, 400);
  assert.equal(missingEvidence.payload.error, "action_input_validation_failed");

  const taskAfterMissingEvidence = await requestJson(
    baseUrl,
    "/workspaces/workspace_personal/objects/object_task_harden_personal_loop"
  );

  assert.equal(taskAfterMissingEvidence.status, 200);
  assert.equal(taskAfterMissingEvidence.payload.data.properties_json.status, "todo");

  const missingArtifact = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body: {
      evidence_note: "Personal Atlas review findings were fixed and verified"
    }
  });

  assert.equal(missingArtifact.status, 400);
  assert.equal(missingArtifact.payload.error, "action_input_validation_failed");

  const taskAfterMissingArtifact = await requestJson(
    baseUrl,
    "/workspaces/workspace_personal/objects/object_task_harden_personal_loop"
  );

  assert.equal(taskAfterMissingArtifact.status, 200);
  assert.equal(taskAfterMissingArtifact.payload.data.properties_json.status, "todo");
});

test("empty artifact or evidence strings are rejected", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const emptyEvidence = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body: {
      artifact_uri: "evidence/personal-atlas-composer-25-review.md",
      evidence_note: ""
    }
  });

  assert.equal(emptyEvidence.status, 400);
  assert.equal(emptyEvidence.payload.error, "action_input_validation_failed");

  const emptyArtifact = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body: {
      artifact_uri: "",
      evidence_note: "Personal Atlas review findings were fixed and verified"
    }
  });

  assert.equal(emptyArtifact.status, 400);
  assert.equal(emptyArtifact.payload.error, "action_input_validation_failed");
});

test("GET /personal/overview returns workspace, tasks, and next action", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const overview = await requestJson(baseUrl, "/personal/overview");

  assert.equal(overview.status, 200);
  assert.equal(overview.payload.data.workspace.id, "workspace_personal");
  assert.equal(overview.payload.data.carbon_copy.id, "object_personal_carbon_copy");
  assert.equal(overview.payload.data.project.id, "object_personal_project_atlas");
  assert.equal(overview.payload.data.tasks.length, 5);
  assert.equal(overview.payload.data.next_action.task.id, "object_task_harden_personal_loop");
  assert.match(overview.payload.data.security_boundary, /No authentication/);
  assert.equal(
    overview.payload.data.tasks.every((task) => task.properties_json.acceptance_criteria.length > 0),
    true
  );
  assert.equal(overview.payload.data.projects.length, 1);
  assert.equal(overview.payload.data.projects[0].id, "object_personal_project_atlas");
});

test("GET /personal/tasks returns tasks and blockers without full overview", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const catalog = await requestJson(baseUrl, "/personal/tasks");
  const overview = await requestJson(baseUrl, "/personal/overview");

  assert.equal(catalog.status, 200);
  assert.equal(catalog.payload.data.workspace_id, "workspace_personal");
  assert.equal(catalog.payload.data.tasks.length, 5);
  assert.equal(catalog.payload.data.task_count, 5);
  assert.equal(catalog.payload.data.open_task_count, 5);
  assert.deepEqual(
    catalog.payload.data.tasks.map((task) => task.id),
    overview.payload.data.tasks.map((task) => task.id)
  );
  assert.ok(Array.isArray(catalog.payload.data.blockers.object_task_runtime_foundation));
  assert.equal(catalog.payload.data.blockers.object_task_runtime_foundation[0].id, "object_task_harden_personal_loop");
});

test("GET /personal/session-context returns dual-spine header and agent_contract", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", { method: "POST" });

  const ctx = await requestJson(baseUrl, "/personal/session-context");

  assert.equal(ctx.status, 200);
  assert.equal(ctx.payload.data.workspace_personal_id, "workspace_personal");
  assert.ok(ctx.payload.data.personal_spine);
  assert.ok(ctx.payload.data.parallel_polish);
  assert.ok(Array.isArray(ctx.payload.data.agent_contract.personal_planning));
  assert.match(ctx.payload.data.agent_contract.task_completion, /complete/);
});

test("GET /personal/overview lists all personal projects", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", { method: "POST" });
  await requestJson(baseUrl, "/workspaces/workspace_personal/objects", {
    method: "POST",
    body: {
      id: "object_personal_project_alice_duo",
      object_type_id: "object_type_personal_project",
      properties_json: {
        name: "Alice Duo keyboard",
        description: "Custom build",
        goal: "Ship v1 wired keyboard"
      }
    }
  });

  const overview = await requestJson(baseUrl, "/personal/overview");
  assert.equal(overview.status, 200);
  assert.equal(overview.payload.data.projects.length, 2);
});

test("PATCH cannot bypass governed personal task completion", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const patchAttempt = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_harden_personal_loop", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "done"
      }
    }
  });

  assert.equal(patchAttempt.status, 400);
  assert.equal(patchAttempt.payload.error, "governed_action_required");

  const task = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_harden_personal_loop");

  assert.equal(task.payload.data.properties_json.status, "todo");
});

test("PATCH /personal/objects updates task fields without workspace session scope", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const patched = await requestJson(baseUrl, "/personal/objects/object_task_runtime_foundation", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "todo",
        progress_note: "MCP patch route test"
      }
    }
  });

  assert.equal(patched.status, 200);
  assert.equal(patched.payload.data.id, "object_task_runtime_foundation");
  assert.equal(patched.payload.data.properties_json.progress_note, "MCP patch route test");

  const governed = await requestJson(baseUrl, "/personal/objects/object_task_harden_personal_loop", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "done"
      }
    }
  });

  assert.equal(governed.status, 400);
  assert.equal(governed.payload.error, "governed_action_required");
});

test("blocked tasks cannot be completed directly", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const blockedComplete = await requestJson(baseUrl, "/personal/tasks/object_task_runtime_foundation/complete", {
    method: "POST",
    body: {
      artifact_uri: "docs/runtime-foundation.md",
      evidence_note: "Tried to skip blocker"
    }
  });

  assert.equal(blockedComplete.status, 409);
  assert.equal(blockedComplete.payload.error, "task_blocked");
  assert.equal(blockedComplete.payload.details[0].id, "object_task_harden_personal_loop");

  const task = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_runtime_foundation");

  assert.equal(task.payload.data.properties_json.status, "todo");
});

test("generic ActionRun endpoint cannot bypass personal blockers", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const directRun = await requestJson(baseUrl, "/workspaces/workspace_personal/action-runs", {
    method: "POST",
    body: {
      action_type_id: "action_type_complete_personal_task",
      target_object_id: "object_task_runtime_foundation",
      input_json: {
        artifact_uri: "docs/runtime-foundation.md",
        evidence_note: "Tried to skip blocker"
      }
    }
  });

  assert.equal(directRun.status, 409);
  assert.equal(directRun.payload.error, "task_blocked");

  const task = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_runtime_foundation");

  assert.equal(task.payload.data.properties_json.status, "todo");
});

test("completed personal task cannot be completed twice", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const body = {
    artifact_uri: "evidence/personal-atlas-composer-25-review.md",
    evidence_note: "Personal Atlas review findings were fixed and verified"
  };
  const first = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body
  });
  const second = await requestJson(baseUrl, "/personal/tasks/object_task_harden_personal_loop/complete", {
    method: "POST",
    body
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 400);
  assert.equal(second.payload.error, "task_already_done");
});
