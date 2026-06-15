import { validateObjectProperties } from "../../../packages/ontology-core/src/index.js";

export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function createOntologyStore(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? createIdFactory();
  const workspaces = new Map();
  const objectTypes = new Map();
  const objectInstances = new Map();
  const linkTypes = new Map();
  const linkInstances = new Map();
  const objectSets = new Map();

  function createWorkspace(input) {
    assertPlainObject(input, "request body");
    const name = requireString(input.name, "name");
    const timestamp = now();
    const workspace = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("workspace"),
      name,
      visibility: input.visibility ?? "private",
      created_at: timestamp,
      updated_at: timestamp
    };

    if (workspaces.has(workspace.id)) {
      throw new ApiError(409, "workspace_conflict", "Workspace already exists");
    }

    workspaces.set(workspace.id, workspace);
    return clone(workspace);
  }

  function listWorkspaces() {
    return [...workspaces.values()].map(clone);
  }

  function getWorkspace(workspaceId) {
    const workspace = workspaces.get(workspaceId);

    if (!workspace) {
      throw new ApiError(404, "workspace_not_found", "Workspace not found");
    }

    return clone(workspace);
  }

  function createObjectType(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const name = requireString(input.name, "name");
    const schema = input.schema_json ?? input.schema;
    assertPlainObject(schema, "schema_json");

    const timestamp = now();
    const objectType = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("object_type"),
      workspace_id: workspaceId,
      name,
      description: input.description ?? "",
      schema_json: clone(schema),
      created_at: timestamp,
      updated_at: timestamp
    };

    if (objectTypes.has(objectType.id)) {
      throw new ApiError(409, "object_type_conflict", "ObjectType already exists");
    }

    objectTypes.set(objectType.id, objectType);
    return clone(objectType);
  }

  function listObjectTypes(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...objectTypes.values()]
      .filter((objectType) => objectType.workspace_id === workspaceId)
      .map(clone);
  }

  function getObjectType(workspaceId, objectTypeId) {
    assertWorkspaceExists(workspaceId);
    const objectType = objectTypes.get(objectTypeId);

    if (!objectType || objectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "ObjectType not found in workspace");
    }

    return clone(objectType);
  }

  function createObjectInstance(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const objectTypeId = requireString(input.object_type_id, "object_type_id");
    const objectType = objectTypes.get(objectTypeId);

    if (!objectType || objectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "ObjectType not found in workspace");
    }

    const properties = input.properties_json ?? input.properties ?? {};
    const validation = validateObjectProperties(objectType.schema_json, properties);

    if (!validation.valid) {
      throw new ApiError(400, "object_validation_failed", "ObjectInstance properties do not match ObjectType schema", validation.errors);
    }

    const timestamp = now();
    const objectInstance = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("object"),
      workspace_id: workspaceId,
      object_type_id: objectTypeId,
      external_id: input.external_id ?? null,
      properties_json: clone(properties),
      created_at: timestamp,
      updated_at: timestamp
    };

    if (objectInstances.has(objectInstance.id)) {
      throw new ApiError(409, "object_instance_conflict", "ObjectInstance already exists");
    }

    objectInstances.set(objectInstance.id, objectInstance);
    return clone(objectInstance);
  }

  function listObjectInstances(workspaceId, filters = {}) {
    assertWorkspaceExists(workspaceId);

    return [...objectInstances.values()]
      .filter((objectInstance) => objectInstance.workspace_id === workspaceId)
      .filter((objectInstance) => !filters.object_type_id || objectInstance.object_type_id === filters.object_type_id)
      .map(clone);
  }

  function getObjectInstance(workspaceId, objectInstanceId) {
    assertWorkspaceExists(workspaceId);
    const objectInstance = objectInstances.get(objectInstanceId);

    if (!objectInstance || objectInstance.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_instance_not_found", "ObjectInstance not found in workspace");
    }

    return clone(objectInstance);
  }

  function createLinkType(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const name = requireString(input.name, "name");
    const fromObjectTypeId = requireString(input.from_object_type_id, "from_object_type_id");
    const toObjectTypeId = requireString(input.to_object_type_id, "to_object_type_id");
    const fromObjectType = objectTypes.get(fromObjectTypeId);
    const toObjectType = objectTypes.get(toObjectTypeId);

    if (!fromObjectType || fromObjectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "From ObjectType not found in workspace");
    }

    if (!toObjectType || toObjectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "To ObjectType not found in workspace");
    }

    const propertiesSchema = input.properties_schema ?? {
      type: "object",
      properties: {}
    };
    assertPlainObject(propertiesSchema, "properties_schema");

    const cardinality = input.cardinality ?? "many_to_many";
    assertEnum(cardinality, "cardinality", ["one_to_one", "one_to_many", "many_to_one", "many_to_many"]);

    const timestamp = now();
    const linkType = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("link_type"),
      workspace_id: workspaceId,
      name,
      from_object_type_id: fromObjectTypeId,
      to_object_type_id: toObjectTypeId,
      cardinality,
      properties_schema: clone(propertiesSchema),
      created_at: timestamp,
      updated_at: timestamp
    };

    if (linkTypes.has(linkType.id)) {
      throw new ApiError(409, "link_type_conflict", "LinkType already exists");
    }

    linkTypes.set(linkType.id, linkType);
    return clone(linkType);
  }

  function listLinkTypes(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...linkTypes.values()]
      .filter((linkType) => linkType.workspace_id === workspaceId)
      .map(clone);
  }

  function getLinkType(workspaceId, linkTypeId) {
    assertWorkspaceExists(workspaceId);
    const linkType = linkTypes.get(linkTypeId);

    if (!linkType || linkType.workspace_id !== workspaceId) {
      throw new ApiError(404, "link_type_not_found", "LinkType not found in workspace");
    }

    return clone(linkType);
  }

  function createLinkInstance(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const linkTypeId = requireString(input.link_type_id, "link_type_id");
    const fromObjectId = requireString(input.from_object_id, "from_object_id");
    const toObjectId = requireString(input.to_object_id, "to_object_id");

    if (fromObjectId === toObjectId) {
      throw new ApiError(400, "self_link_not_allowed", "LinkInstance endpoints must be different objects");
    }

    const linkType = linkTypes.get(linkTypeId);

    if (!linkType || linkType.workspace_id !== workspaceId) {
      throw new ApiError(404, "link_type_not_found", "LinkType not found in workspace");
    }

    const fromObject = objectInstances.get(fromObjectId);
    const toObject = objectInstances.get(toObjectId);

    if (!fromObject || fromObject.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_instance_not_found", "From ObjectInstance not found in workspace");
    }

    if (!toObject || toObject.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_instance_not_found", "To ObjectInstance not found in workspace");
    }

    const mismatchErrors = [];

    if (fromObject.object_type_id !== linkType.from_object_type_id) {
      mismatchErrors.push(`from_object_id must reference ${linkType.from_object_type_id}`);
    }

    if (toObject.object_type_id !== linkType.to_object_type_id) {
      mismatchErrors.push(`to_object_id must reference ${linkType.to_object_type_id}`);
    }

    if (mismatchErrors.length > 0) {
      throw new ApiError(400, "link_endpoint_type_mismatch", "LinkInstance endpoints do not match LinkType", mismatchErrors);
    }

    const properties = input.properties_json ?? input.properties ?? {};
    const validation = validateObjectProperties(linkType.properties_schema, properties);

    if (!validation.valid) {
      throw new ApiError(400, "link_validation_failed", "LinkInstance properties do not match LinkType schema", validation.errors);
    }

    const timestamp = now();
    const linkInstance = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("link"),
      workspace_id: workspaceId,
      link_type_id: linkTypeId,
      from_object_id: fromObjectId,
      to_object_id: toObjectId,
      properties_json: clone(properties),
      created_at: timestamp,
      updated_at: timestamp
    };

    if (linkInstances.has(linkInstance.id)) {
      throw new ApiError(409, "link_instance_conflict", "LinkInstance already exists");
    }

    linkInstances.set(linkInstance.id, linkInstance);
    return clone(linkInstance);
  }

  function listLinkInstances(workspaceId, filters = {}) {
    assertWorkspaceExists(workspaceId);

    return [...linkInstances.values()]
      .filter((linkInstance) => linkInstance.workspace_id === workspaceId)
      .filter((linkInstance) => !filters.link_type_id || linkInstance.link_type_id === filters.link_type_id)
      .filter((linkInstance) => !filters.object_id || linkInstance.from_object_id === filters.object_id || linkInstance.to_object_id === filters.object_id)
      .map(clone);
  }

  function getLinkInstance(workspaceId, linkInstanceId) {
    assertWorkspaceExists(workspaceId);
    const linkInstance = linkInstances.get(linkInstanceId);

    if (!linkInstance || linkInstance.workspace_id !== workspaceId) {
      throw new ApiError(404, "link_instance_not_found", "LinkInstance not found in workspace");
    }

    return clone(linkInstance);
  }

  function getObjectLinks(workspaceId, objectInstanceId) {
    const objectInstance = getObjectInstance(workspaceId, objectInstanceId);
    const links = listLinkInstances(workspaceId, {
      object_id: objectInstance.id
    });

    return {
      object_id: objectInstance.id,
      inbound: links.filter((linkInstance) => linkInstance.to_object_id === objectInstance.id),
      outbound: links.filter((linkInstance) => linkInstance.from_object_id === objectInstance.id)
    };
  }

  function createObjectSet(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const name = requireString(input.name, "name");
    const objectTypeId = requireString(input.object_type_id, "object_type_id");
    const objectType = objectTypes.get(objectTypeId);

    if (!objectType || objectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "ObjectType not found in workspace");
    }

    const filterExpression = normalizeObjectSetFilter(input.filter_expression ?? {});
    const timestamp = now();
    const objectSet = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("object_set"),
      workspace_id: workspaceId,
      name,
      object_type_id: objectTypeId,
      filter_expression: filterExpression,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (objectSets.has(objectSet.id)) {
      throw new ApiError(409, "object_set_conflict", "ObjectSet already exists");
    }

    objectSets.set(objectSet.id, objectSet);
    return clone(objectSet);
  }

  function listObjectSets(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...objectSets.values()]
      .filter((objectSet) => objectSet.workspace_id === workspaceId)
      .map(clone);
  }

  function getObjectSet(workspaceId, objectSetId) {
    assertWorkspaceExists(workspaceId);
    const objectSet = objectSets.get(objectSetId);

    if (!objectSet || objectSet.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_set_not_found", "ObjectSet not found in workspace");
    }

    return clone(objectSet);
  }

  function listObjectSetObjects(workspaceId, objectSetId) {
    const objectSet = getObjectSet(workspaceId, objectSetId);
    const propertyEquals = objectSet.filter_expression.property_equals;

    return listObjectInstances(workspaceId, {
      object_type_id: objectSet.object_type_id
    }).filter((objectInstance) => {
      return Object.entries(propertyEquals).every(([propertyName, expectedValue]) => {
        return deepEqual(objectInstance.properties_json[propertyName], expectedValue);
      });
    });
  }

  function assertWorkspaceExists(workspaceId) {
    if (!workspaces.has(workspaceId)) {
      throw new ApiError(404, "workspace_not_found", "Workspace not found");
    }
  }

  return {
    createWorkspace,
    listWorkspaces,
    getWorkspace,
    createObjectType,
    listObjectTypes,
    getObjectType,
    createObjectInstance,
    listObjectInstances,
    getObjectInstance,
    createLinkType,
    listLinkTypes,
    getLinkType,
    createLinkInstance,
    listLinkInstances,
    getLinkInstance,
    getObjectLinks,
    createObjectSet,
    listObjectSets,
    getObjectSet,
    listObjectSetObjects
  };
}

function normalizeObjectSetFilter(filterExpression) {
  assertPlainObject(filterExpression, "filter_expression");

  const allowedKeys = new Set(["property_equals"]);

  for (const key of Object.keys(filterExpression)) {
    if (!allowedKeys.has(key)) {
      throw new ApiError(400, "invalid_object_set_filter", `filter_expression.${key} is not supported`);
    }
  }

  const propertyEquals = filterExpression.property_equals ?? {};
  assertPlainObject(propertyEquals, "filter_expression.property_equals");

  return {
    property_equals: clone(propertyEquals)
  };
}

function assertWorkspaceBody(input, workspaceId) {
  if (input.workspace_id && input.workspace_id !== workspaceId) {
    throw new ApiError(400, "workspace_mismatch", "Body workspace_id must match route workspace id");
  }
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "invalid_request", `${field} must be an object`);
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${field} is required`);
  }

  return value.trim();
}

function requireIdentifier(value, field) {
  const identifier = requireString(value, field);

  if (!/^[a-zA-Z0-9_-]+$/.test(identifier)) {
    throw new ApiError(400, "invalid_request", `${field} may only contain letters, numbers, underscores, and hyphens`);
  }

  return identifier;
}

function assertEnum(value, field, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new ApiError(400, "invalid_request", `${field} must be one of: ${allowedValues.join(", ")}`);
  }
}

function createIdFactory() {
  const counters = new Map();

  return (prefix) => {
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);
    return `${prefix}_${String(next).padStart(3, "0")}`;
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
