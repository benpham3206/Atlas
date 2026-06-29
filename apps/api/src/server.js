import { createServer } from "node:http";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import { ApiError, createOntologyStore } from "./ontology-store.js";
import { dispatchAgentTool, getAgentManifest } from "./agent-gateway.js";
import { createGitHubClientFromEnv, createGitHubPolicyFromEnv } from "./github-client.js";
import { createFilePersistence } from "./persistence.js";
import { createSlackClientFromEnv, createSlackPolicyFromEnv } from "./slack-client.js";
import {
  bootstrapPersonalAtlas,
  completePersonalTask,
  getPersonalOverview,
  guardPersonalActionRun,
  guardPersonalObjectPatch,
  selectNextAction,
  PERSONAL_WORKSPACE_ID
} from "./personal-atlas.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4000;

export function createApiServer(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const store = options.store ?? createOntologyStore({ now });
  const persistence = options.persistence ?? null;
  const githubClient = options.githubClient ?? null;
  const githubPolicy = options.githubPolicy ?? { allowed_repositories: [], allowed_base_branches: [], dry_run: false };
  const slackClient = options.slackClient ?? null;
  const slackPolicy = options.slackPolicy ?? { allowed_channel_ids: [] };

  if (persistence) {
    const snapshot = persistence.load();

    if (snapshot) {
      store.restore(snapshot);
    }
  }

  return createServer((request, response) => {
    handleRequest({ request, response, now, store, githubClient, githubPolicy, slackClient, slackPolicy })
      .then(() => {
        if (persistence && request.method && request.method !== "GET") {
          try {
            persistence.save(store.snapshot());
          } catch (error) {
            console.error("Failed to persist Atlas snapshot", error);
          }
        }
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          return sendJson(response, error.statusCode, {
            error: error.code,
            message: error.message,
            details: error.details ?? []
          });
        }

        console.error(error);
        return sendJson(response, 500, {
          error: "internal_error",
          message: "Internal server error"
        });
      });
  });
}

async function handleRequest({ request, response, now, store, githubClient, githubPolicy, slackClient, slackPolicy }) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/health") {
    return sendJson(response, 200, createHealthStatus("atlas-api", now()));
  }

  if (request.method === "GET" && url.pathname === "/") {
    return sendJson(response, 200, {
      name: "Atlas API",
      status: "skeleton",
      health: "/health"
    });
  }

  if (request.method === "GET" && url.pathname === "/workspaces") {
    return sendJson(response, 200, {
      data: store.listWorkspaces()
    });
  }

  if (request.method === "POST" && url.pathname === "/workspaces") {
    const workspace = store.createWorkspace(await readJsonBody(request));
    return sendJson(response, 201, {
      data: workspace
    });
  }

  if (segments[0] === "workspaces" && segments[1] && segments.length === 2 && request.method === "GET") {
    return sendJson(response, 200, {
      data: store.getWorkspace(segments[1])
    });
  }

  if (request.method === "GET" && url.pathname === "/users") {
    return sendJson(response, 200, {
      data: store.listUsers()
    });
  }

  if (request.method === "POST" && url.pathname === "/users") {
    const user = store.createUser(await readJsonBody(request));
    return sendJson(response, 201, {
      data: user
    });
  }

  if (segments[0] === "users" && segments[1] && segments.length === 2 && request.method === "GET") {
    return sendJson(response, 200, {
      data: store.getUser(segments[1])
    });
  }

  if (request.method === "GET" && url.pathname === "/agent/manifest") {
    return sendJson(response, 200, {
      data: getAgentManifest()
    });
  }

  if (segments[0] === "agent" && segments[1] === "tools" && segments[2] && request.method === "POST") {
    const body = await readJsonBody(request);
    const delegationId = extractDelegationToken(request, body);
    const result = await dispatchAgentTool(store, {
      delegationId,
      toolName: segments[2],
      input: body.input ?? body
    }, { githubClient, githubPolicy, slackClient, slackPolicy });
    return sendJson(response, 200, {
      data: result
    });
  }

  if (request.method === "GET" && url.pathname === "/agents") {
    return sendJson(response, 200, {
      data: store.listAgents()
    });
  }

  if (request.method === "POST" && url.pathname === "/agents") {
    const agent = store.createAgent(await readJsonBody(request));
    return sendJson(response, 201, {
      data: agent
    });
  }

  if (segments[0] === "agents" && segments[1] && segments.length === 2 && request.method === "GET") {
    return sendJson(response, 200, {
      data: store.getAgent(segments[1])
    });
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "agent-delegations") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listAgentDelegations(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const delegation = store.createAgentDelegation(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: delegation
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getAgentDelegation(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "goal-contracts") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listGoalContracts(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const goalContract = store.createGoalContract(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: goalContract
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getGoalContract(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "pull-request-artifacts") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listPullRequestArtifacts(workspaceId)
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getPullRequestArtifact(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "review-packets") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listReviewPackets(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const reviewPacket = store.createReviewPacket(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: reviewPacket
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getReviewPacket(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "artifacts") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listArtifacts(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const artifact = store.createArtifact(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: artifact
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getArtifact(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "evidence-records") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listEvidenceRecords(workspaceId, {
          subject_id: url.searchParams.get("subject_id"),
          artifact_id: url.searchParams.get("artifact_id")
        })
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const evidenceRecord = store.createEvidenceRecord(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: evidenceRecord
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getEvidenceRecord(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "memberships") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listWorkspaceMemberships(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const membership = store.createWorkspaceMembership(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: membership
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getWorkspaceMembership(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "policies") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listPolicies(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const policy = store.createPolicy(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: policy
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getPolicy(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "permission-checks") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listPermissionChecks(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const permissionCheck = store.createPermissionCheck(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: permissionCheck
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getPermissionCheck(workspaceId, segments[3])
      });
    }
  }

  if (
    segments[0] === "workspaces" &&
    segments[1] &&
    segments[2] === "authorize" &&
    segments.length === 3 &&
    request.method === "POST"
  ) {
    return sendJson(response, 200, {
      data: store.authorize(segments[1], await readJsonBody(request))
    });
  }

  if (request.method === "GET" && url.pathname === "/audit/verify") {
    return sendJson(response, 200, {
      data: store.verifyAuditChain()
    });
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "audit-events") {
    const workspaceId = segments[1];
    store.getWorkspace(workspaceId);

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listAuditEvents(workspaceId, {
          resource_id: url.searchParams.get("resource_id"),
          event_type: url.searchParams.get("event_type")
        })
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      const auditEvent = store.getAuditEvent(segments[3]);

      if (auditEvent.workspace_id !== workspaceId) {
        throw new ApiError(404, "audit_event_not_found", "AuditEvent not found in workspace");
      }

      return sendJson(response, 200, {
        data: auditEvent
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "object-types") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listObjectTypes(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const objectType = store.createObjectType(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: objectType
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getObjectType(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "link-types") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listLinkTypes(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const linkType = store.createLinkType(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: linkType
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getLinkType(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "object-sets") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listObjectSets(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const objectSet = store.createObjectSet(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: objectSet
      });
    }

    if (segments.length === 5 && segments[4] === "objects" && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listObjectSetObjects(workspaceId, segments[3])
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getObjectSet(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "objects") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listObjectInstances(workspaceId, {
          object_type_id: url.searchParams.get("object_type_id")
        })
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const objectInstance = store.createObjectInstance(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: objectInstance
      });
    }

    if (segments.length === 5 && segments[4] === "links" && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getObjectLinks(workspaceId, segments[3])
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getObjectInstance(workspaceId, segments[3])
      });
    }

    if (segments.length === 4 && request.method === "PATCH") {
      const body = await readJsonBody(request);
      guardPersonalObjectPatch(store, workspaceId, segments[3], body);
      const objectInstance = store.updateObjectInstance(workspaceId, segments[3], body);
      return sendJson(response, 200, {
        data: objectInstance
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "action-types") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listActionTypes(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const actionType = store.createActionType(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: actionType
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getActionType(workspaceId, segments[3])
      });
    }
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "action-runs") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listActionRuns(workspaceId)
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const body = await readJsonBody(request);
      guardPersonalActionRun(store, workspaceId, body);
      const actionRun = store.createActionRun(workspaceId, body);
      return sendJson(response, 201, {
        data: actionRun
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getActionRun(workspaceId, segments[3])
      });
    }
  }

  if (request.method === "POST" && url.pathname === "/personal/bootstrap") {
    return sendJson(response, 200, {
      data: bootstrapPersonalAtlas(store)
    });
  }

  if (request.method === "GET" && url.pathname === "/personal/overview") {
    return sendJson(response, 200, {
      data: getPersonalOverview(store)
    });
  }

  if (request.method === "GET" && url.pathname === "/personal/next-action") {
    return sendJson(response, 200, {
      data: selectNextAction(store, PERSONAL_WORKSPACE_ID)
    });
  }

  if (
    segments[0] === "personal" &&
    segments[1] === "tasks" &&
    segments[2] &&
    segments[3] === "complete" &&
    request.method === "POST"
  ) {
    return sendJson(response, 200, {
      data: completePersonalTask(store, segments[2], await readJsonBody(request))
    });
  }

  if (segments[0] === "workspaces" && segments[1] && segments[2] === "links") {
    const workspaceId = segments[1];

    if (segments.length === 3 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.listLinkInstances(workspaceId, {
          link_type_id: url.searchParams.get("link_type_id"),
          object_id: url.searchParams.get("object_id")
        })
      });
    }

    if (segments.length === 3 && request.method === "POST") {
      const linkInstance = store.createLinkInstance(workspaceId, await readJsonBody(request));
      return sendJson(response, 201, {
        data: linkInstance
      });
    }

    if (segments.length === 4 && request.method === "GET") {
      return sendJson(response, 200, {
        data: store.getLinkInstance(workspaceId, segments[3])
      });
    }
  }

  return sendJson(response, 404, {
    error: "not_found",
    message: "Route not found"
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function extractDelegationToken(request, body) {
  const header = request.headers.authorization;

  if (typeof header === "string" && header.trim() !== "") {
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (match) {
      return match[1].trim();
    }

    return header.trim();
  }

  if (body && typeof body.delegation_id === "string") {
    return body.delegation_id;
  }

  throw new ApiError(401, "missing_delegation", "Provide a delegation token via Authorization: Bearer header or delegation_id");
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST ?? DEFAULT_HOST;
  const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const dataFile = process.env.ATLAS_DATA_FILE;
  const persistence = dataFile ? createFilePersistence(dataFile) : null;
  const githubClient = createGitHubClientFromEnv();
  const githubPolicy = createGitHubPolicyFromEnv();
  const slackClient = createSlackClientFromEnv();
  const slackPolicy = createSlackPolicyFromEnv();
  const server = createApiServer({ persistence, githubClient, githubPolicy, slackClient, slackPolicy });

  server.listen(port, host, () => {
    console.log(`Atlas API listening at http://${host}:${port}`);

    if (persistence) {
      console.log(`Persisting state to ${dataFile}`);
    } else {
      console.log("In-memory mode (set ATLAS_DATA_FILE to persist across restarts)");
    }
  });
}
