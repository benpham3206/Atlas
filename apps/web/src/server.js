import { createServer } from "node:http";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import { renderHomePage } from "./render.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

export function createWebServer(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const apiUrl = options.apiUrl ?? process.env.ATLAS_API_URL ?? "http://localhost:4000";

  return createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, 200, createHealthStatus("atlas-web", now()));
    }

    if (request.method === "GET" && url.pathname === "/") {
      return sendHtml(response, 200, renderHomePage({ apiUrl }));
    }

    return sendHtml(response, 404, "Not found");
  });
}

function sendHtml(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(body);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(body)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST ?? DEFAULT_HOST;
  const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const server = createWebServer();

  server.listen(port, host, () => {
    console.log(`Atlas web listening at http://${host}:${port}`);
  });
}
