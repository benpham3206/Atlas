import { createServer } from "node:http";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  fetchPersonalOverview,
  fetchWorkspacePullRequestArtifacts,
  fetchWorkspaceReviewPackets
} from "./api-client.js";
import { renderBootstrapPage, renderPersonalDashboard } from "./render.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

export function createWebServer(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const apiUrl = options.apiUrl ?? process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
  const fetchOverview = options.fetchPersonalOverview ?? fetchPersonalOverview;
  const fetchReviewPackets = options.fetchWorkspaceReviewPackets ?? fetchWorkspaceReviewPackets;
  const fetchPullRequestArtifacts = options.fetchWorkspacePullRequestArtifacts ?? fetchWorkspacePullRequestArtifacts;
  const bootstrapAtlas = options.bootstrapPersonalAtlas ?? bootstrapPersonalAtlas;
  const completeTask = options.completePersonalTask ?? completePersonalTask;

  const server = createServer((request, response) => {
    handleRequest({
      request,
      response,
      now,
      apiUrl,
      fetchOverview,
      fetchReviewPackets,
      fetchPullRequestArtifacts,
      bootstrapAtlas,
      completeTask
    }).catch((error) => {
      console.error(error);
      sendHtml(
        response,
        500,
        renderBootstrapPage({
          error: error instanceof Error ? error.message : "Unexpected server error"
        })
      );
    });
  });

  return server;
}

async function handleRequest({
  request,
  response,
  now,
  apiUrl,
  fetchOverview,
  fetchReviewPackets,
  fetchPullRequestArtifacts,
  bootstrapAtlas,
  completeTask
}) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    return sendJson(response, 200, createHealthStatus("atlas-web", now()));
  }

  if (request.method === "GET" && url.pathname === "/") {
    const queryError = url.searchParams.get("error");
    const overviewResult = await fetchOverview(apiUrl);

    if (!overviewResult.ok) {
      const notBootstrapped =
        overviewResult.error?.status === 404 ||
        overviewResult.error?.code === "not_found" ||
        overviewResult.error?.code === "workspace_not_bootstrapped";

      if (notBootstrapped) {
        return sendHtml(
          response,
          200,
          renderBootstrapPage({
            error: queryError ?? (notBootstrapped ? null : overviewResult.error?.message)
          })
        );
      }

      return sendHtml(
        response,
        200,
        renderBootstrapPage({
          error: queryError ?? overviewResult.error?.message ?? "Failed to load personal overview"
        })
      );
    }

    if (!overviewResult.data || Object.keys(overviewResult.data).length === 0) {
      return sendHtml(
        response,
        200,
        renderBootstrapPage({
          error: queryError
        })
      );
    }

    const workspaceId = overviewResult.data.workspace_id ?? overviewResult.data.workspace?.id;
    let reviewPackets = [];
    let pullRequestArtifacts = [];
    let reviewInboxError = null;

    if (workspaceId) {
      const [reviewPacketsResult, pullRequestArtifactsResult] = await Promise.all([
        fetchReviewPackets(apiUrl, workspaceId),
        fetchPullRequestArtifacts(apiUrl, workspaceId)
      ]);

      if (reviewPacketsResult.ok) {
        reviewPackets = reviewPacketsResult.data ?? [];
      } else {
        reviewInboxError = reviewPacketsResult.error?.message ?? "Failed to load review packets";
      }

      if (pullRequestArtifactsResult.ok) {
        pullRequestArtifacts = pullRequestArtifactsResult.data ?? [];
      } else {
        reviewInboxError = pullRequestArtifactsResult.error?.message ?? reviewInboxError ?? "Failed to load PR artifacts";
      }
    }

    return sendHtml(
      response,
      200,
      renderPersonalDashboard(overviewResult.data, {
        error: queryError,
        reviewPackets,
        pullRequestArtifacts,
        reviewInboxError
      })
    );
  }

  if (request.method === "POST" && url.pathname === "/bootstrap") {
    const bootstrapResult = await bootstrapAtlas(apiUrl);

    if (!bootstrapResult.ok) {
      return sendHtml(
        response,
        200,
        renderBootstrapPage({
          error: bootstrapResult.error?.message ?? "Bootstrap failed"
        })
      );
    }

    response.writeHead(303, {
      location: "/",
      "cache-control": "no-store"
    });
    response.end();
    return;
  }

  const completeMatch = url.pathname.match(/^\/tasks\/([^/]+)\/complete$/);
  if (request.method === "POST" && completeMatch) {
    const taskId = decodeURIComponent(completeMatch[1]);
    const body = await readBody(request);
    const form = parseUrlEncoded(body);
    const completeResult = await completeTask(apiUrl, taskId, {
      artifact_uri: form.artifact_uri ?? "",
      evidence_note: form.evidence_note ?? ""
    });

    if (!completeResult.ok) {
      const message = encodeURIComponent(
        completeResult.error?.message ?? "Failed to complete task"
      );
      response.writeHead(303, {
        location: `/?error=${message}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    response.writeHead(303, {
      location: "/",
      "cache-control": "no-store"
    });
    response.end();
    return;
  }

  return sendHtml(response, 404, "Not found");
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

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseUrlEncoded(body) {
  const params = {};

  for (const pair of body.split("&")) {
    if (!pair) {
      continue;
    }

    const separatorIndex = pair.indexOf("=");
    const rawKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
    const rawValue = separatorIndex === -1 ? "" : pair.slice(separatorIndex + 1);
    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    const value = decodeURIComponent(rawValue.replace(/\+/g, " "));
    params[key] = value;
  }

  return params;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST ?? DEFAULT_HOST;
  const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const server = createWebServer();

  server.listen(port, host, () => {
    console.log(`Atlas web listening at http://${host}:${port}`);
  });
}
