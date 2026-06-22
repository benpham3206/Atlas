import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  fetchPersonalNextAction,
  fetchPersonalOverview
} from "../src/api-client.js";

const sampleOverview = {
  security_boundary: "Local in-memory personal state.",
  carbon_copy: {
    properties_json: {
      goal: "Build AAA sci-fi action game",
      constraints: "30-second movement prototype first"
    }
  },
  project: {
    properties_json: {
      name: "AAA vertical slice",
      goal: "Playable prototype"
    }
  },
  tasks: [
    {
      id: "object_task_movement",
      properties_json: { title: "Movement controller", status: "todo" }
    }
  ],
  blockers: {},
  next_action: {
    task_id: "object_task_movement",
    title: "Movement controller",
    acceptance_criteria: "Player moves at 6 m/s",
    explanation: "Unblocked highest-priority task.",
    blockers: []
  }
};

async function startServer(t, overrides = {}) {
  const server = createWebServer({
    apiUrl: "http://api.example.test",
    ...overrides
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test("api client handles API errors without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "not_found", message: "Overview unavailable" }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });

  try {
    const overview = await fetchPersonalOverview("http://api.example.test");
    assert.equal(overview.ok, false);
    assert.equal(overview.data, null);
    assert.equal(overview.error.status, 404);

    const nextAction = await fetchPersonalNextAction("http://api.example.test");
    assert.equal(nextAction.ok, false);

    const bootstrap = await bootstrapPersonalAtlas("http://api.example.test");
    assert.equal(bootstrap.ok, false);

    const complete = await completePersonalTask("http://api.example.test", "task_1", {
      artifact_uri: "artifacts/demo.md",
      evidence_note: "Verified locally"
    });
    assert.equal(complete.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("api client handles network failures without throwing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("connection refused");
  };

  try {
    const result = await fetchPersonalOverview("http://api.example.test");
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "network_error");
    assert.match(result.error.message, /connection refused/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("server renders bootstrap page when overview is unavailable", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: false,
      data: null,
      error: { status: 404, code: "not_found", message: "Personal workspace not bootstrapped" }
    })
  });

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Bootstrap Personal Atlas/);
  assert.doesNotMatch(html, /Next action/);
});

test("server renders dashboard when overview is available", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    })
  });

  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Personal Atlas/);
  assert.match(html, /Next action/);
  assert.match(html, /Player moves at 6 m\/s/);
  assert.match(html, /action="\/tasks\/object_task_movement\/complete"/);
});

test("server handles API errors gracefully on bootstrap", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: false,
      data: null,
      error: { status: 404, code: "not_found", message: "Personal workspace not bootstrapped" }
    }),
    bootstrapPersonalAtlas: async () => ({
      ok: false,
      data: null,
      error: { status: 500, code: "internal_error", message: "Bootstrap failed in API" }
    })
  });

  const response = await fetch(`${baseUrl}/bootstrap`, { method: "POST" });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Bootstrap failed in API/);
});

test("server redirects with error when task completion fails", async (t) => {
  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    }),
    completePersonalTask: async () => ({
      ok: false,
      data: null,
      error: { status: 400, code: "validation_error", message: "artifact_uri is required" }
    })
  });

  const response = await fetch(`${baseUrl}/tasks/object_task_movement/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "artifact_uri=&evidence_note=",
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.match(response.headers.get("location"), /\?error=/);

  const dashboard = await fetch(`${baseUrl}${response.headers.get("location")}`);
  const html = await dashboard.text();
  assert.match(html, /artifact_uri is required/);
});

test("server completes task and redirects home", async (t) => {
  let completed = false;

  const baseUrl = await startServer(t, {
    fetchPersonalOverview: async () => ({
      ok: true,
      data: sampleOverview,
      error: null
    }),
    completePersonalTask: async (_apiUrl, taskId, input) => {
      completed = true;
      assert.equal(taskId, "object_task_movement");
      assert.equal(input.artifact_uri, "artifacts/demo.md");
      assert.equal(input.evidence_note, "Movement verified");
      return { ok: true, data: { task_id: taskId }, error: null };
    }
  });

  const response = await fetch(`${baseUrl}/tasks/object_task_movement/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "artifact_uri=artifacts%2Fdemo.md&evidence_note=Movement%20verified",
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/");
  assert.equal(completed, true);
});
