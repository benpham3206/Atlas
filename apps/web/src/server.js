import { createServer } from "node:http";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  createWorkspaceActionRun,
  createWorkspaceObjectType,
  fetchAgentManifest,
  fetchAgents,
  fetchPersonalOverview,
  fetchPersonalSessionContext,
  fetchWorkspaces,
  fetchWorkspaceActionTypes,
  fetchWorkspaceAgentDelegations,
  fetchWorkspaceAuditEvents,
  fetchWorkspaceGoalContracts,
  fetchWorkspaceObject,
  fetchWorkspaceObjectLinks,
  fetchWorkspaceObjectTypes,
  fetchWorkspaceObjects,
  fetchWorkspaceLinks,
  fetchWorkspacePullRequestArtifacts,
  fetchWorkspaceReviewPackets,
  revokeWorkspaceAgentDelegation
} from "./api-client.js";
import { renderBootstrapPage, renderPersonalDashboard } from "./render.js";
import {
  readGateStatusHint,
  readLocalMcpSession,
  resolveRepoRoot
} from "./read-local-mcp-session.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

function bootstrapPageOptions(overviewResult, queryError) {
  const apiUnreachable = overviewResult?.error?.code === "network_error";
  const notBootstrapped =
    overviewResult?.error?.status === 404 ||
    overviewResult?.error?.code === "not_found" ||
    overviewResult?.error?.code === "workspace_not_bootstrapped";

  let error = queryError ?? null;
  if (!error && overviewResult && !overviewResult.ok && !notBootstrapped) {
    error = overviewResult.error?.message ?? "Failed to load personal overview";
  }

  return { error, apiUnreachable };
}

export function createWebServer(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const apiUrl = options.apiUrl ?? process.env.ATLAS_API_URL ?? "http://127.0.0.1:4000";
  const fetchOverview = options.fetchPersonalOverview ?? fetchPersonalOverview;
  const fetchSessionContext = options.fetchPersonalSessionContext ?? fetchPersonalSessionContext;
  const readMcpSession = options.readLocalMcpSession ?? readLocalMcpSession;
  const repoRootResolver = options.resolveRepoRoot ?? resolveRepoRoot;
  const fetchWorkspaceList = options.fetchWorkspaces ?? fetchWorkspaces;
  const fetchReviewPackets = options.fetchWorkspaceReviewPackets ?? fetchWorkspaceReviewPackets;
  const fetchPullRequestArtifacts = options.fetchWorkspacePullRequestArtifacts ?? fetchWorkspacePullRequestArtifacts;
  const fetchAuditEvents = options.fetchWorkspaceAuditEvents ?? fetchWorkspaceAuditEvents;
  const fetchObjectTypes = options.fetchWorkspaceObjectTypes ?? fetchWorkspaceObjectTypes;
  const fetchObjects = options.fetchWorkspaceObjects ?? fetchWorkspaceObjects;
  const fetchObject = options.fetchWorkspaceObject ?? fetchWorkspaceObject;
  const fetchObjectLinks = options.fetchWorkspaceObjectLinks ?? fetchWorkspaceObjectLinks;
  const fetchLinks = options.fetchWorkspaceLinks ?? fetchWorkspaceLinks;
  const fetchActionTypes = options.fetchWorkspaceActionTypes ?? fetchWorkspaceActionTypes;
  const fetchGoalContracts = options.fetchWorkspaceGoalContracts ?? fetchWorkspaceGoalContracts;
  const fetchAgentDelegations = options.fetchWorkspaceAgentDelegations ?? fetchWorkspaceAgentDelegations;
  const fetchAgentList = options.fetchAgents ?? fetchAgents;
  const fetchManifest = options.fetchAgentManifest ?? fetchAgentManifest;
  const revokeDelegation = options.revokeWorkspaceAgentDelegation ?? revokeWorkspaceAgentDelegation;
  const createActionRun = options.createWorkspaceActionRun ?? createWorkspaceActionRun;
  const createObjectType = options.createWorkspaceObjectType ?? createWorkspaceObjectType;
  const bootstrapAtlas = options.bootstrapPersonalAtlas ?? bootstrapPersonalAtlas;
  const completeTask = options.completePersonalTask ?? completePersonalTask;

  const server = createServer((request, response) => {
    handleRequest({
      request,
      response,
      now,
      apiUrl,
      fetchOverview,
      fetchSessionContext,
      readMcpSession,
      repoRootResolver,
      fetchWorkspaceList,
      fetchReviewPackets,
      fetchPullRequestArtifacts,
      fetchAuditEvents,
      fetchObjectTypes,
      fetchObjects,
      fetchObject,
      fetchObjectLinks,
      fetchLinks,
      fetchActionTypes,
      fetchGoalContracts,
      fetchAgentDelegations,
      fetchAgentList,
      fetchManifest,
      revokeDelegation,
      createActionRun,
      createObjectType,
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
  fetchSessionContext,
  readMcpSession,
  repoRootResolver,
  fetchWorkspaceList,
  fetchReviewPackets,
  fetchPullRequestArtifacts,
  fetchAuditEvents,
  fetchObjectTypes,
  fetchObjects,
  fetchObject,
  fetchObjectLinks,
  fetchLinks,
  fetchActionTypes,
  fetchGoalContracts,
  fetchAgentDelegations,
  fetchAgentList,
  fetchManifest,
  revokeDelegation,
  createActionRun,
  createObjectType,
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
    const sessionContextResult = await fetchSessionContext(apiUrl);
    const mcpSession = readMcpSession();
    const repoRoot = repoRootResolver();
    const gateStatusHint = readGateStatusHint(repoRoot);

    if (!overviewResult.ok) {
      const notBootstrapped =
        overviewResult.error?.status === 404 ||
        overviewResult.error?.code === "not_found" ||
        overviewResult.error?.code === "workspace_not_bootstrapped";

      if (notBootstrapped) {
        return sendHtml(
          response,
          200,
          renderBootstrapPage(bootstrapPageOptions(overviewResult, queryError))
        );
      }

      return sendHtml(
        response,
        200,
        renderBootstrapPage(bootstrapPageOptions(overviewResult, queryError))
      );
    }

    if (!overviewResult.data || Object.keys(overviewResult.data).length === 0) {
      return sendHtml(
        response,
        200,
        renderBootstrapPage(bootstrapPageOptions(overviewResult, queryError))
      );
    }

    const workspaceId = overviewResult.data.workspace_id ?? overviewResult.data.workspace?.id;
    const requestedWorkspaceId = url.searchParams.get("workspace_id");
    const requestedObjectId = url.searchParams.get("object_id");
    const activeView = url.searchParams.get("view") ?? undefined;
    const repoPath = url.searchParams.get("path") ?? undefined;
    let workspaces = [];
    let selectedWorkspaceId = workspaceId;
    let reviewPackets = [];
    let pullRequestArtifacts = [];
    let auditEvents = [];
    let objectTypes = [];
    let objects = [];
    let links = [];
    let actionTypes = [];
    let selectedObject = null;
    let selectedObjectLinks = null;
    let workspaceSelectorError = null;
    let reviewInboxError = null;
    let auditTimelineError = null;
    let ontologyManagerError = null;
    let objectListError = null;
    let objectDetailError = null;
    let graphExplorerError = null;
    let actionRunnerError = null;
    let goalContracts = [];
    let agentDelegations = [];
    let agents = [];
    let agentManifest = null;
    let controlPlaneError = null;

    const workspacesResult = await fetchWorkspaceList(apiUrl);
    if (workspacesResult.ok) {
      workspaces = workspacesResult.data ?? [];
      if (requestedWorkspaceId && workspaces.some((workspace) => workspace.id === requestedWorkspaceId)) {
        selectedWorkspaceId = requestedWorkspaceId;
      } else if (requestedWorkspaceId && requestedWorkspaceId !== workspaceId) {
        workspaceSelectorError = `Workspace ${requestedWorkspaceId} is unavailable`;
      }
    } else {
      workspaceSelectorError = workspacesResult.error?.message ?? "Failed to load workspaces";
    }

    if (workspaceId) {
      const [
        reviewPacketsResult,
        pullRequestArtifactsResult,
        auditEventsResult,
        objectTypesResult,
        objectsResult,
        linksResult,
        actionTypesResult
      ] = await Promise.all([
        fetchReviewPackets(apiUrl, selectedWorkspaceId),
        fetchPullRequestArtifacts(apiUrl, selectedWorkspaceId),
        fetchAuditEvents(apiUrl, selectedWorkspaceId),
        fetchObjectTypes(apiUrl, selectedWorkspaceId),
        fetchObjects(apiUrl, selectedWorkspaceId),
        fetchLinks(apiUrl, selectedWorkspaceId),
        fetchActionTypes(apiUrl, selectedWorkspaceId)
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

      if (auditEventsResult.ok) {
        auditEvents = auditEventsResult.data ?? [];
      } else {
        auditTimelineError = auditEventsResult.error?.message ?? "Failed to load audit events";
      }

      if (objectTypesResult.ok) {
        objectTypes = objectTypesResult.data ?? [];
      } else {
        ontologyManagerError = objectTypesResult.error?.message ?? "Failed to load object types";
      }

      if (objectsResult.ok) {
        objects = objectsResult.data ?? [];
      } else {
        objectListError = objectsResult.error?.message ?? "Failed to load objects";
      }

      if (linksResult.ok) {
        links = linksResult.data ?? [];
      } else {
        graphExplorerError = linksResult.error?.message ?? "Failed to load links";
      }

      if (actionTypesResult.ok) {
        actionTypes = actionTypesResult.data ?? [];
      } else {
        actionRunnerError = actionTypesResult.error?.message ?? "Failed to load action types";
      }

      const [goalContractsResult, delegationsResult, agentsResult, manifestResult] = await Promise.all([
        fetchGoalContracts(apiUrl, selectedWorkspaceId),
        fetchAgentDelegations(apiUrl, selectedWorkspaceId),
        fetchAgentList(apiUrl),
        fetchManifest(apiUrl)
      ]);

      if (goalContractsResult.ok) {
        goalContracts = goalContractsResult.data ?? [];
      } else {
        controlPlaneError = goalContractsResult.error?.message ?? "Failed to load GoalContracts";
      }

      if (delegationsResult.ok) {
        agentDelegations = delegationsResult.data ?? [];
      } else {
        controlPlaneError = controlPlaneError ?? delegationsResult.error?.message ?? "Failed to load delegations";
      }

      if (agentsResult.ok) {
        agents = agentsResult.data ?? [];
      } else {
        controlPlaneError = controlPlaneError ?? agentsResult.error?.message ?? "Failed to load agents";
      }

      if (manifestResult.ok) {
        agentManifest = manifestResult.data ?? null;
      }

      if (requestedObjectId) {
        const [objectResult, objectLinksResult] = await Promise.all([
          fetchObject(apiUrl, selectedWorkspaceId, requestedObjectId),
          fetchObjectLinks(apiUrl, selectedWorkspaceId, requestedObjectId)
        ]);

        if (objectResult.ok) {
          selectedObject = objectResult.data;
        } else {
          objectDetailError = objectResult.error?.message ?? "Failed to load object";
        }

        if (objectLinksResult.ok) {
          selectedObjectLinks = objectLinksResult.data;
        } else {
          objectDetailError = objectLinksResult.error?.message ?? objectDetailError ?? "Failed to load object links";
        }
      }
    }

    return sendHtml(
      response,
      200,
      renderPersonalDashboard(overviewResult.data, {
        view: activeView,
        repoPath,
        error: queryError,
        workspaces,
        selectedWorkspaceId,
        workspaceSelectorError,
        reviewPackets,
        pullRequestArtifacts,
        reviewInboxError,
        auditEvents,
        auditTimelineError,
        objectTypes,
        ontologyManagerError,
        objects,
        objectListError,
        links,
        graphExplorerError,
        actionTypes,
        actionRunnerError,
        goalContracts,
        agentDelegations,
        agents,
        agentManifest,
        controlPlaneError,
        selectedObject,
        selectedObjectLinks,
        objectDetailError,
        sessionContext: sessionContextResult.ok ? sessionContextResult.data : null,
        mcpSession,
        projectCwd: repoRoot,
        gateStatusHint
      })
    );
  }

  if (request.method === "POST" && url.pathname === "/bootstrap") {
    const bootstrapResult = await bootstrapAtlas(apiUrl);

    if (!bootstrapResult.ok) {
      return sendHtml(
        response,
        200,
        renderBootstrapPage(
          bootstrapPageOptions(bootstrapResult, bootstrapResult.error?.message ?? "Bootstrap failed")
        )
      );
    }

    response.writeHead(303, {
      location: "/?view=home",
      "cache-control": "no-store"
    });
    response.end();
    return;
  }

  const createObjectTypeMatch = url.pathname.match(/^\/workspaces\/([^/]+)\/object-types$/);
  if (request.method === "POST" && createObjectTypeMatch) {
    const workspaceId = decodeURIComponent(createObjectTypeMatch[1]);
    const body = await readBody(request);
    const form = parseUrlEncoded(body);
    const redirectPath = `/?workspace_id=${encodeURIComponent(workspaceId)}`;
    let schemaJson;

    try {
      schemaJson = JSON.parse(form.schema_json ?? "");
    } catch {
      response.writeHead(303, {
        location: `${redirectPath}&error=${encodeURIComponent("schema_json must be valid JSON")}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const createResult = await createObjectType(apiUrl, workspaceId, {
      id: form.id || undefined,
      name: form.name ?? "",
      description: form.description ?? "",
      schema_json: schemaJson
    });

    if (!createResult.ok) {
      const message = encodeURIComponent(
        createResult.error?.message ?? "Failed to create object type"
      );
      response.writeHead(303, {
        location: `${redirectPath}&error=${message}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    response.writeHead(303, {
      location: redirectPath,
      "cache-control": "no-store"
    });
    response.end();
    return;
  }

  const createActionRunMatch = url.pathname.match(/^\/workspaces\/([^/]+)\/action-runs$/);
  if (request.method === "POST" && createActionRunMatch) {
    const workspaceId = decodeURIComponent(createActionRunMatch[1]);
    const body = await readBody(request);
    const form = parseUrlEncoded(body);
    const redirectPath = `/?workspace_id=${encodeURIComponent(workspaceId)}`;
    let inputJson;

    try {
      inputJson = JSON.parse(form.input_json ?? "{}");
    } catch {
      response.writeHead(303, {
        location: `${redirectPath}&error=${encodeURIComponent("input_json must be valid JSON")}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const createResult = await createActionRun(apiUrl, workspaceId, {
      action_type_id: form.action_type_id ?? "",
      target_object_id: form.target_object_id ?? "",
      actor: "atlas_web",
      input_json: inputJson
    });

    if (!createResult.ok) {
      const message = encodeURIComponent(
        createResult.error?.message ?? "Failed to run action"
      );
      response.writeHead(303, {
        location: `${redirectPath}&error=${message}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    response.writeHead(303, {
      location: `${redirectPath}&object_id=${encodeURIComponent(form.target_object_id ?? "")}`,
      "cache-control": "no-store"
    });
    response.end();
    return;
  }

  const revokeDelegationMatch = url.pathname.match(
    /^\/workspaces\/([^/]+)\/agent-delegations\/([^/]+)\/revoke$/
  );
  if (request.method === "POST" && revokeDelegationMatch) {
    const workspaceId = decodeURIComponent(revokeDelegationMatch[1]);
    const delegationId = decodeURIComponent(revokeDelegationMatch[2]);
    const redirectPath = `/?view=board&workspace_id=${encodeURIComponent(workspaceId)}`;
    const revokeResult = await revokeDelegation(apiUrl, workspaceId, delegationId, {
      actor: "human_board",
      reason: "board_pause"
    });

    if (!revokeResult.ok) {
      const message = encodeURIComponent(revokeResult.error?.message ?? "Failed to pause delegation");
      response.writeHead(303, {
        location: `${redirectPath}&error=${message}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    response.writeHead(303, {
      location: redirectPath,
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

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the other process or set PORT=3001.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}
