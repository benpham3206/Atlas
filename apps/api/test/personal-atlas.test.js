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
    "object_personal_project_aaa",
    "object_task_movement",
    "object_task_camera",
    "object_task_collision"
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
  assert.equal(tasks.payload.data.length, 3);
});

test("GET /personal/next-action returns movement task first", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const nextAction = await requestJson(baseUrl, "/personal/next-action");

  assert.equal(nextAction.status, 200);
  assert.equal(nextAction.payload.data.task.id, "object_task_movement");
  assert.equal(nextAction.payload.data.task.properties_json.priority, 1);
  assert.equal(
    nextAction.payload.data.acceptance_criteria,
    "Player moves, collision works, camera follows, test scene runs"
  );
  assert.equal(nextAction.payload.data.blockers.length, 0);
});

test("completing first task advances next action to camera", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const complete = await requestJson(baseUrl, "/personal/tasks/object_task_movement/complete", {
    method: "POST",
    body: {
      artifact_uri: "artifacts/movement-demo.md",
      evidence_note: "Movement prototype runs in test scene"
    }
  });

  assert.equal(complete.status, 200);
  assert.equal(complete.payload.data.task.properties_json.status, "done");
  assert.equal(complete.payload.data.next_action.task.id, "object_task_camera");
  assert.equal(complete.payload.data.next_action.task.properties_json.priority, 2);

  const nextAction = await requestJson(baseUrl, "/personal/next-action");

  assert.equal(nextAction.status, 200);
  assert.equal(nextAction.payload.data.task.id, "object_task_camera");
});

test("missing artifact or evidence is rejected and task status unchanged", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const missingEvidence = await requestJson(baseUrl, "/personal/tasks/object_task_movement/complete", {
    method: "POST",
    body: {
      artifact_uri: "artifacts/movement-demo.md"
    }
  });

  assert.equal(missingEvidence.status, 400);
  assert.equal(missingEvidence.payload.error, "action_input_validation_failed");

  const taskAfterMissingEvidence = await requestJson(
    baseUrl,
    "/workspaces/workspace_personal/objects/object_task_movement"
  );

  assert.equal(taskAfterMissingEvidence.status, 200);
  assert.equal(taskAfterMissingEvidence.payload.data.properties_json.status, "todo");

  const missingArtifact = await requestJson(baseUrl, "/personal/tasks/object_task_movement/complete", {
    method: "POST",
    body: {
      evidence_note: "Movement prototype runs in test scene"
    }
  });

  assert.equal(missingArtifact.status, 400);
  assert.equal(missingArtifact.payload.error, "action_input_validation_failed");

  const taskAfterMissingArtifact = await requestJson(
    baseUrl,
    "/workspaces/workspace_personal/objects/object_task_movement"
  );

  assert.equal(taskAfterMissingArtifact.status, 200);
  assert.equal(taskAfterMissingArtifact.payload.data.properties_json.status, "todo");
});

test("empty artifact or evidence strings are rejected", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const emptyEvidence = await requestJson(baseUrl, "/personal/tasks/object_task_movement/complete", {
    method: "POST",
    body: {
      artifact_uri: "artifacts/movement-demo.md",
      evidence_note: ""
    }
  });

  assert.equal(emptyEvidence.status, 400);
  assert.equal(emptyEvidence.payload.error, "action_input_validation_failed");

  const emptyArtifact = await requestJson(baseUrl, "/personal/tasks/object_task_movement/complete", {
    method: "POST",
    body: {
      artifact_uri: "",
      evidence_note: "Movement prototype runs in test scene"
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
  assert.equal(overview.payload.data.project.id, "object_personal_project_aaa");
  assert.equal(overview.payload.data.tasks.length, 3);
  assert.equal(overview.payload.data.next_action.task.id, "object_task_movement");
  assert.match(overview.payload.data.security_boundary, /No authentication/);
});

test("PATCH cannot bypass governed personal task completion", async (t) => {
  const baseUrl = await startTestServer(t);

  await requestJson(baseUrl, "/personal/bootstrap", {
    method: "POST"
  });

  const patchAttempt = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_movement", {
    method: "PATCH",
    body: {
      properties_json: {
        status: "done"
      }
    }
  });

  assert.equal(patchAttempt.status, 400);
  assert.equal(patchAttempt.payload.error, "governed_action_required");

  const task = await requestJson(baseUrl, "/workspaces/workspace_personal/objects/object_task_movement");

  assert.equal(task.payload.data.properties_json.status, "todo");
});
