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
      goal: "Build AAA sci-fi action game",
      constraints: "30-second movement prototype first"
    }
  },
  project: {
    id: "object_personal_project_aaa",
    properties_json: {
      name: "AAA third-person combat vertical slice",
      goal: "Produce a playable AAA vertical slice prototype"
    }
  },
  tasks: [
    {
      id: "object_task_movement",
      properties_json: {
        title: "Implement third-person movement controller",
        status: "todo"
      }
    },
    {
      id: "object_task_camera",
      properties_json: {
        title: "Implement camera follow",
        status: "todo"
      }
    }
  ],
  blockers: {
    object_task_camera: ["object_task_movement"]
  },
  next_action: {
    task_id: "object_task_movement",
    title: "Implement third-person movement controller",
    acceptance_criteria: "Player moves, collision works, camera follows, test scene runs",
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
        goal: "Build AAA sci-fi action game",
        constraints: "30-second movement prototype first"
      }
    },
    project: {
      id: "object_personal_project_aaa",
      properties_json: {
        name: "AAA third-person combat vertical slice",
        goal: "Produce a playable AAA vertical slice prototype"
      }
    },
    tasks: [
      {
        id: "object_task_movement",
        properties_json: { title: "Implement third-person movement controller", status: "todo" }
      },
      {
        id: "object_task_camera",
        properties_json: { title: "Implement camera follow", status: "todo" }
      }
    ],
    blockers: {
      object_task_camera: [{ id: "object_task_movement", title: "Implement third-person movement controller" }]
    },
    next_action: {
      task: {
        id: "object_task_movement",
        properties_json: {
          title: "Implement third-person movement controller",
          acceptance_criteria: "Player moves, collision works, camera follows, test scene runs"
        }
      },
      acceptance_criteria: "Player moves, collision works, camera follows, test scene runs",
      explanation: "Dependencies satisfied.",
      blockers: []
    }
  };

  const html = renderPersonalDashboard(apiOverview);

  assert.match(html, /<form method="post" action="\/tasks\/object_task_movement\/complete">/);
  assert.match(html, /Implement third-person movement controller/);
});

test("bootstrap page renders security boundary notice", () => {
  const html = renderBootstrapPage();

  assert.match(html, /Security boundary/);
  assert.match(html, /No authentication/);
});

test("dashboard renders next action, blockers, and complete form", () => {
  const html = renderPersonalDashboard(sampleOverview);

  assert.match(html, /Security boundary/);
  assert.match(html, /Build AAA sci-fi action game/);
  assert.match(html, /AAA third-person combat vertical slice/);
  assert.match(html, /Implement third-person movement controller/);
  assert.match(html, /object_task_movement/);
  assert.match(html, /object_task_camera/);
  assert.match(html, /Blockers:/);
  assert.match(html, /Acceptance criteria/);
  assert.match(html, /Player moves, collision works, camera follows, test scene runs/);
  assert.match(html, /<form method="post" action="\/tasks\/object_task_movement\/complete">/);
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
