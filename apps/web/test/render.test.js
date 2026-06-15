import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";
import { renderHomePage } from "../src/render.js";

test("home page renders Atlas placeholder", () => {
  const html = renderHomePage({ apiUrl: "http://api.example.test" });

  assert.match(html, /<h1>Atlas<\/h1>/);
  assert.match(html, /Operational ontology platform skeleton/);
  assert.match(html, /http:\/\/api\.example\.test\/health/);
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
