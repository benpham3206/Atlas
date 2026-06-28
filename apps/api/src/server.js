import { createServer } from "node:http";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import { ApiError, createOntologyStore } from "./ontology-store.js";
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

  return createServer((request, response) => {
    handleRequest({ request, response, now, store }).catch((error) => {
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

async function handleRequest({ request, response, now, store }) {
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
  const server = createApiServer();

  server.listen(port, host, () => {
    console.log(`Atlas API listening at http://${host}:${port}`);
  });
}
