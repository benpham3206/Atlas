import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHealthStatus } from "../../../packages/ontology-core/src/index.js";
import { ApiError, createOntologyStore } from "./ontology-store.js";

const ROOT_PACKAGE_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../package.json"), "utf8")
).version;

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

  if (request.method === "GET" && url.pathname === "/version") {
    return sendJson(response, 200, {
      service: "atlas-api",
      version: ROOT_PACKAGE_VERSION
    });
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
