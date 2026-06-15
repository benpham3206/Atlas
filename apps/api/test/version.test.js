import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApiServer } from "../src/server.js";

const ROOT_PACKAGE_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../package.json"), "utf8")
).version;

async function startTestServer(t) {
  const server = createApiServer({
    now: () => "2026-06-14T00:00:00.000Z"
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test("GET /version returns service and root package version", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/version`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await response.json(), {
    service: "atlas-api",
    version: ROOT_PACKAGE_VERSION
  });
});

test("GET /version returns only service and version fields", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/version`);
  const payload = await response.json();

  assert.deepEqual(Object.keys(payload).sort(), ["service", "version"]);
});
