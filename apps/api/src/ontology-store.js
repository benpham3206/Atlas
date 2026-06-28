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

const USER_STATUSES = ["active", "suspended", "deprovisioned"];
const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"];
const POLICY_STATUSES = ["active", "disabled"];
const POLICY_EFFECTS = ["allow", "deny"];
const PERMISSION_DECISIONS = ["allow", "deny"];
const PRINCIPAL_TYPES = ["user", "agent", "service_account", "system"];

export function createOntologyStore(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? createIdFactory();
  const workspaces = new Map();
  const users = new Map();
  const workspaceMemberships = new Map();
  const policies = new Map();
  const permissionChecks = new Map();
  const objectTypes = new Map();
  const objectInstances = new Map();
  const linkTypes = new Map();
  const linkInstances = new Map();
  const objectSets = new Map();
  const actionTypes = new Map();
  const actionRuns = new Map();

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

  function createUser(input) {
    assertPlainObject(input, "request body");

    const email = requireString(input.email, "email").toLowerCase();
    const displayName = requireString(input.display_name, "display_name");
    const status = input.status ?? "active";
    assertEnum(status, "status", USER_STATUSES);

    const timestamp = now();
    const user = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("user"),
      email,
      display_name: displayName,
      status,
      identity_provider_subject: optionalString(input.identity_provider_subject, "identity_provider_subject"),
      created_at: timestamp,
      updated_at: timestamp
    };

    if (!email.includes("@")) {
      throw new ApiError(400, "invalid_user", "email must contain @");
    }

    const existingEmail = [...users.values()].find((existingUser) => existingUser.email === email);

    if (users.has(user.id) || existingEmail) {
      throw new ApiError(409, "user_conflict", "User already exists");
    }

    users.set(user.id, user);
    return clone(user);
  }

  function listUsers() {
    return [...users.values()].map(clone);
  }

  function getUser(userId) {
    const user = users.get(userId);

    if (!user) {
      throw new ApiError(404, "user_not_found", "User not found");
    }

    return clone(user);
  }

  function createWorkspaceMembership(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const userId = requireString(input.user_id, "user_id");
    const user = users.get(userId);

    if (!user) {
      throw new ApiError(404, "user_not_found", "User not found");
    }

    const role = input.role ?? "viewer";
    assertEnum(role, "role", WORKSPACE_ROLES);

    const existingMembership = [...workspaceMemberships.values()].find((membership) => {
      return membership.workspace_id === workspaceId && membership.user_id === userId;
    });

    if (existingMembership) {
      throw new ApiError(409, "workspace_membership_conflict", "User is already a member of workspace");
    }

    const timestamp = now();
    const membership = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("workspace_membership"),
      workspace_id: workspaceId,
      user_id: userId,
      role,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (workspaceMemberships.has(membership.id)) {
      throw new ApiError(409, "workspace_membership_conflict", "WorkspaceMembership already exists");
    }

    workspaceMemberships.set(membership.id, membership);
    return clone(membership);
  }

  function listWorkspaceMemberships(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...workspaceMemberships.values()]
      .filter((membership) => membership.workspace_id === workspaceId)
      .map(clone);
  }

  function getWorkspaceMembership(workspaceId, membershipId) {
    assertWorkspaceExists(workspaceId);
    const membership = workspaceMemberships.get(membershipId);

    if (!membership || membership.workspace_id !== workspaceId) {
      throw new ApiError(404, "workspace_membership_not_found", "WorkspaceMembership not found in workspace");
    }

    return clone(membership);
  }

  function createPolicy(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const name = requireString(input.name, "name");
    const status = input.status ?? "active";
    assertEnum(status, "status", POLICY_STATUSES);

    const rules = normalizePolicyRules(input.rules_json ?? input.rules);
    const timestamp = now();
    const policy = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("policy"),
      workspace_id: workspaceId,
      name,
      description: optionalString(input.description, "description") ?? "",
      status,
      rules_json: rules,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (policies.has(policy.id)) {
      throw new ApiError(409, "policy_conflict", "Policy already exists");
    }

    policies.set(policy.id, policy);
    return clone(policy);
  }

  function listPolicies(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...policies.values()]
      .filter((policy) => policy.workspace_id === workspaceId)
      .map(clone);
  }

  function getPolicy(workspaceId, policyId) {
    assertWorkspaceExists(workspaceId);
    const policy = policies.get(policyId);

    if (!policy || policy.workspace_id !== workspaceId) {
      throw new ApiError(404, "policy_not_found", "Policy not found in workspace");
    }

    return clone(policy);
  }

  function createPermissionCheck(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const principalType = input.principal_type ?? "user";
    assertEnum(principalType, "principal_type", PRINCIPAL_TYPES);

    const principalId = requireString(input.principal_id, "principal_id");
    const action = requireString(input.action, "action");
    const resourceType = requireString(input.resource_type, "resource_type");
    const decision = input.decision ?? input.result;
    assertEnum(decision, "decision", PERMISSION_DECISIONS);

    const policyId = optionalString(input.policy_id, "policy_id");

    if (policyId) {
      const policy = policies.get(policyId);

      if (!policy || policy.workspace_id !== workspaceId) {
        throw new ApiError(404, "policy_not_found", "Policy not found in workspace");
      }
    }

    const role = optionalString(input.role, "role");

    if (role) {
      assertEnum(role, "role", WORKSPACE_ROLES);
    }

    const timestamp = now();
    const permissionCheck = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("permission_check"),
      workspace_id: workspaceId,
      principal_type: principalType,
      principal_id: principalId,
      role,
      action,
      resource_type: resourceType,
      resource_id: optionalString(input.resource_id, "resource_id"),
      decision,
      policy_id: policyId,
      reason: optionalString(input.reason, "reason") ?? "",
      created_at: timestamp
    };

    if (permissionChecks.has(permissionCheck.id)) {
      throw new ApiError(409, "permission_check_conflict", "PermissionCheck already exists");
    }

    permissionChecks.set(permissionCheck.id, permissionCheck);
    return clone(permissionCheck);
  }

  function listPermissionChecks(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...permissionChecks.values()]
      .filter((permissionCheck) => permissionCheck.workspace_id === workspaceId)
      .map(clone);
  }

  function getPermissionCheck(workspaceId, permissionCheckId) {
    assertWorkspaceExists(workspaceId);
    const permissionCheck = permissionChecks.get(permissionCheckId);

    if (!permissionCheck || permissionCheck.workspace_id !== workspaceId) {
      throw new ApiError(404, "permission_check_not_found", "PermissionCheck not found in workspace");
    }

    return clone(permissionCheck);
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

  function updateObjectInstance(workspaceId, objectInstanceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const objectInstance = objectInstances.get(objectInstanceId);

    if (!objectInstance || objectInstance.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_instance_not_found", "ObjectInstance not found in workspace");
    }

    const patchProperties = input.properties_json ?? input.properties;

    if (patchProperties === undefined) {
      throw new ApiError(400, "invalid_request", "properties_json is required");
    }

    assertPlainObject(patchProperties, "properties_json");

    const objectType = objectTypes.get(objectInstance.object_type_id);

    if (!objectType || objectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "ObjectType not found in workspace");
    }

    const mergedProperties = {
      ...objectInstance.properties_json,
      ...patchProperties
    };
    const validation = validateObjectProperties(objectType.schema_json, mergedProperties);

    if (!validation.valid) {
      throw new ApiError(400, "object_validation_failed", "ObjectInstance properties do not match ObjectType schema", validation.errors);
    }

    const timestamp = now();
    objectInstance.properties_json = clone(mergedProperties);
    objectInstance.updated_at = timestamp;
    return clone(objectInstance);
  }

  function createActionType(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const name = requireString(input.name, "name");
    const targetObjectTypeId = requireString(input.target_object_type_id, "target_object_type_id");
    const targetObjectType = objectTypes.get(targetObjectTypeId);

    if (!targetObjectType || targetObjectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "Target ObjectType not found in workspace");
    }

    const inputSchema = input.input_schema_json ?? input.input_schema;
    assertPlainObject(inputSchema, "input_schema_json");

    if (inputSchema.type !== "object") {
      throw new ApiError(400, "invalid_action_type", "input_schema_json.type must be object");
    }

    const effect = input.effect_json ?? input.effect;
    assertPlainObject(effect, "effect_json");

    if (effect.type !== "update_object_properties") {
      throw new ApiError(400, "invalid_action_type", "effect_json.type must be update_object_properties");
    }

    const setPropertiesJson = effect.set_properties_json ?? {};
    assertPlainObject(setPropertiesJson, "effect_json.set_properties_json");

    const copyInputFields = effect.copy_input_fields ?? [];
    assertStringArray(copyInputFields, "effect_json.copy_input_fields");

    const timestamp = now();
    const actionType = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("action_type"),
      workspace_id: workspaceId,
      name,
      target_object_type_id: targetObjectTypeId,
      input_schema_json: clone(inputSchema),
      effect_json: {
        type: "update_object_properties",
        set_properties_json: clone(setPropertiesJson),
        copy_input_fields: [...copyInputFields]
      },
      created_at: timestamp,
      updated_at: timestamp
    };

    if (actionTypes.has(actionType.id)) {
      throw new ApiError(409, "action_type_conflict", "ActionType already exists");
    }

    actionTypes.set(actionType.id, actionType);
    return clone(actionType);
  }

  function listActionTypes(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...actionTypes.values()]
      .filter((actionType) => actionType.workspace_id === workspaceId)
      .map(clone);
  }

  function getActionType(workspaceId, actionTypeId) {
    assertWorkspaceExists(workspaceId);
    const actionType = actionTypes.get(actionTypeId);

    if (!actionType || actionType.workspace_id !== workspaceId) {
      throw new ApiError(404, "action_type_not_found", "ActionType not found in workspace");
    }

    return clone(actionType);
  }

  function createActionRun(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const actionTypeId = requireString(input.action_type_id, "action_type_id");
    const targetObjectId = requireString(input.target_object_id, "target_object_id");
    const actor = input.actor ?? "local_user";

    if (typeof actor !== "string" || actor.trim() === "") {
      throw new ApiError(400, "invalid_request", "actor must be a non-empty string");
    }

    const actionType = actionTypes.get(actionTypeId);

    if (!actionType || actionType.workspace_id !== workspaceId) {
      throw new ApiError(404, "action_type_not_found", "ActionType not found in workspace");
    }

    const targetObject = objectInstances.get(targetObjectId);

    if (!targetObject || targetObject.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_instance_not_found", "Target ObjectInstance not found in workspace");
    }

    if (targetObject.object_type_id !== actionType.target_object_type_id) {
      throw new ApiError(400, "action_target_type_mismatch", "Target object type does not match ActionType target_object_type_id");
    }

    const inputJson = input.input_json ?? {};
    assertPlainObject(inputJson, "input_json");

    const inputValidation = validateObjectProperties(actionType.input_schema_json, inputJson);

    if (!inputValidation.valid) {
      throw new ApiError(400, "action_input_validation_failed", "input_json does not match ActionType input_schema_json", inputValidation.errors);
    }

    const objectType = objectTypes.get(targetObject.object_type_id);

    if (!objectType || objectType.workspace_id !== workspaceId) {
      throw new ApiError(404, "object_type_not_found", "ObjectType not found in workspace");
    }

    const beforePropertiesJson = clone(targetObject.properties_json);
    const appliedChanges = clone(actionType.effect_json.set_properties_json);

    for (const fieldName of actionType.effect_json.copy_input_fields) {
      if (Object.hasOwn(inputJson, fieldName)) {
        appliedChanges[fieldName] = inputJson[fieldName];
      }
    }

    const mergedProperties = {
      ...targetObject.properties_json,
      ...appliedChanges
    };
    const outputValidation = validateObjectProperties(objectType.schema_json, mergedProperties);

    if (!outputValidation.valid) {
      throw new ApiError(400, "action_effect_validation_failed", "Action effect would produce invalid object properties", outputValidation.errors);
    }

    const actionRunId = input.id ? requireIdentifier(input.id, "id") : createId("action_run");

    if (actionRuns.has(actionRunId)) {
      throw new ApiError(409, "action_run_conflict", "ActionRun already exists");
    }

    const timestamp = now();
    targetObject.properties_json = clone(mergedProperties);
    targetObject.updated_at = timestamp;

    const actionRun = {
      id: actionRunId,
      workspace_id: workspaceId,
      action_type_id: actionTypeId,
      target_object_id: targetObjectId,
      actor: actor.trim(),
      input_json: clone(inputJson),
      output_json: appliedChanges,
      status: "completed",
      before_properties_json: beforePropertiesJson,
      after_properties_json: clone(mergedProperties),
      created_at: timestamp,
      updated_at: timestamp
    };

    actionRuns.set(actionRun.id, actionRun);
    return clone(actionRun);
  }

  function listActionRuns(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...actionRuns.values()]
      .filter((actionRun) => actionRun.workspace_id === workspaceId)
      .map(clone);
  }

  function getActionRun(workspaceId, actionRunId) {
    assertWorkspaceExists(workspaceId);
    const actionRun = actionRuns.get(actionRunId);

    if (!actionRun || actionRun.workspace_id !== workspaceId) {
      throw new ApiError(404, "action_run_not_found", "ActionRun not found in workspace");
    }

    return clone(actionRun);
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
    createUser,
    listUsers,
    getUser,
    createWorkspaceMembership,
    listWorkspaceMemberships,
    getWorkspaceMembership,
    createPolicy,
    listPolicies,
    getPolicy,
    createPermissionCheck,
    listPermissionChecks,
    getPermissionCheck,
    createObjectType,
    listObjectTypes,
    getObjectType,
    createObjectInstance,
    listObjectInstances,
    getObjectInstance,
    updateObjectInstance,
    createActionType,
    listActionTypes,
    getActionType,
    createActionRun,
    listActionRuns,
    getActionRun,
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

function normalizePolicyRules(rules) {
  if (!Array.isArray(rules)) {
    throw new ApiError(400, "invalid_policy", "rules_json must be an array");
  }

  return rules.map((rule, index) => {
    assertPlainObject(rule, `rules_json[${index}]`);

    const effect = rule.effect ?? "allow";
    assertEnum(effect, `rules_json[${index}].effect`, POLICY_EFFECTS);

    const action = requireString(rule.action, `rules_json[${index}].action`);
    const resourceType = requireString(rule.resource_type, `rules_json[${index}].resource_type`);
    const roles = rule.roles ?? [];

    assertStringArray(roles, `rules_json[${index}].roles`);

    if (roles.length === 0) {
      throw new ApiError(400, "invalid_policy", `rules_json[${index}].roles must include at least one role`);
    }

    for (const role of roles) {
      assertEnum(role, `rules_json[${index}].roles`, WORKSPACE_ROLES);
    }

    return {
      effect,
      action,
      resource_type: resourceType,
      roles: [...roles]
    };
  });
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

function optionalString(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${field} must be a non-empty string when provided`);
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

function assertStringArray(value, field) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, "invalid_request", `${field} must be an array`);
  }

  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new ApiError(400, "invalid_request", `${field}[${index}] must be a non-empty string`);
    }
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
