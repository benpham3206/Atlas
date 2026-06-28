import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  fetchPersonalNextAction,
  fetchPersonalOverview
} from "../src/api-client.js";
import { renderBootstrapPage, renderPersonalDashboard } from "../src/render.js";

const sampleOverview = {
  security_boundary:
    "Local in-memory personal state. No authentication. Data resets on API restart.",
  carbon_copy: {
    id: "object_personal_carbon_copy",
    properties_json: {
      goal: "Build Atlas into a Palantir-class ontology platform",
      constraints: "Use Personal Atlas as the cockpit"
    }
  },
  project: {
    id: "object_personal_project_atlas",
    properties_json: {
      name: "Atlas self-hosting roadmap",
      goal: "Use Personal Atlas to build the public and enterprise Atlas versions"
    }
  },
  tasks: [
    {
      id: "object_task_harden_personal_loop",
      properties_json: {
        title: "Harden Personal Atlas self-hosting loop",
        status: "todo"
      }
    },
    {
      id: "object_task_runtime_foundation",
      properties_json: {
        title: "Add durable Atlas runtime foundation",
        status: "todo"
      }
    }
  ],
  blockers: {
    object_task_runtime_foundation: ["object_task_harden_personal_loop"]
  },
  next_action: {
    task_id: "object_task_harden_personal_loop",
    title: "Harden Personal Atlas self-hosting loop",
    acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria",
    explanation: "Highest-priority unblocked task.",
    blockers: []
  }
};

test("bootstrap page renders form", () => {
  const html = renderBootstrapPage();

  assert.match(html, /<h1>Personal Atlas<\/h1>/);
  assert.match(html, /Bootstrap Personal Atlas/);
  assert.match(html, /<form method="post" action="\/bootstrap">/);
});

test("dashboard renders API-shaped next action", () => {
  const apiOverview = {
    security_boundary: "Local in-memory personal state. No authentication.",
    carbon_copy: {
      id: "object_personal_carbon_copy",
      properties_json: {
        goal: "Build Atlas into a Palantir-class ontology platform",
        constraints: "Use Personal Atlas as the cockpit"
      }
    },
    project: {
      id: "object_personal_project_atlas",
      properties_json: {
        name: "Atlas self-hosting roadmap",
        goal: "Use Personal Atlas to build the public and enterprise Atlas versions"
      }
    },
    tasks: [
      {
        id: "object_task_harden_personal_loop",
        properties_json: { title: "Harden Personal Atlas self-hosting loop", status: "todo" }
      },
      {
        id: "object_task_runtime_foundation",
        properties_json: { title: "Add durable Atlas runtime foundation", status: "todo" }
      }
    ],
    blockers: {
      object_task_runtime_foundation: [{ id: "object_task_harden_personal_loop", title: "Harden Personal Atlas self-hosting loop" }]
    },
    next_action: {
      task: {
        id: "object_task_harden_personal_loop",
        properties_json: {
          title: "Harden Personal Atlas self-hosting loop",
          acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria"
        }
      },
      acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria",
      explanation: "Dependencies satisfied.",
      blockers: []
    }
  };

  const html = renderPersonalDashboard(apiOverview);

  assert.match(html, /<form method="post" action="\/tasks\/object_task_harden_personal_loop\/complete">/);
  assert.match(html, /Harden Personal Atlas self-hosting loop/);
});

test("bootstrap page renders security boundary notice", () => {
  const html = renderBootstrapPage();

  assert.match(html, /Security boundary/);
  assert.match(html, /No authentication/);
});

test("dashboard renders next action, blockers, and complete form", () => {
  const html = renderPersonalDashboard(sampleOverview);

  assert.match(html, /Security boundary/);
  assert.match(html, /Build Atlas into a Palantir-class ontology platform/);
  assert.match(html, /Atlas self-hosting roadmap/);
  assert.match(html, /Harden Personal Atlas self-hosting loop/);
  assert.match(html, /object_task_harden_personal_loop/);
  assert.match(html, /object_task_runtime_foundation/);
  assert.match(html, /Blockers:/);
  assert.match(html, /Acceptance criteria/);
  assert.match(html, /Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria/);
  assert.match(html, /<form method="post" action="\/tasks\/object_task_harden_personal_loop\/complete">/);
  assert.match(html, /name="artifact_uri"/);
  assert.match(html, /name="evidence_note"/);
});

test("GET /health returns web ok", async (t) => {
  const server = createWebServer({
    now: () => "2026-06-14T00:00:00.000Z",
    apiUrl: "http://api.example.test"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "atlas-web",
    timestamp: "2026-06-14T00:00:00.000Z"
  });
});
