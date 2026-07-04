import { ApiError } from "./ontology-store.js";
import { selectNextActionForWorkspace } from "./next-action.js";

export const PERSONAL_WORKSPACE_ID = "workspace_personal";

const OBJECT_TYPE_PERSONAL_CARBON_COPY = "object_type_personal_carbon_copy";
const OBJECT_TYPE_PERSONAL_PROJECT = "object_type_personal_project";
const OBJECT_TYPE_PERSONAL_TASK = "object_type_personal_task";
const LINK_TYPE_TASK_BLOCKS_TASK = "link_type_task_blocks_task";
const ACTION_TYPE_COMPLETE_PERSONAL_TASK = "action_type_complete_personal_task";

const SECURITY_BOUNDARY_VOLATILE =
  "Local personal state. No authentication. Data resets on API restart unless ATLAS_DATA_FILE is set. Route scoping is not privacy protection.";
const SECURITY_BOUNDARY_PERSISTENT =
  "Local personal state. No authentication. State persists via ATLAS_DATA_FILE on this host. Route scoping is not privacy protection.";

export function getPersonalSecurityBoundary({ persistState = false } = {}) {
  return persistState ? SECURITY_BOUNDARY_PERSISTENT : SECURITY_BOUNDARY_VOLATILE;
}

const PROJECT_GOAL = "Use Personal Atlas to build the public and enterprise Atlas versions";

function personalWorkspaceExists(store) {
  return store.listWorkspaces().some((workspace) => workspace.id === PERSONAL_WORKSPACE_ID);
}

function assertPersonalBootstrap(store) {
  if (!personalWorkspaceExists(store)) {
    throw new ApiError(
      404,
      "workspace_not_bootstrapped",
      "Personal Atlas has not been bootstrapped"
    );
  }
}

function getPersonalTasks(store, workspaceId = PERSONAL_WORKSPACE_ID) {
  return store.listObjectInstances(workspaceId, {
    object_type_id: OBJECT_TYPE_PERSONAL_TASK
  });
}

function getPersonalProjects(store, workspaceId = PERSONAL_WORKSPACE_ID) {
  return store
    .listObjectInstances(workspaceId, {
      object_type_id: OBJECT_TYPE_PERSONAL_PROJECT
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function getTaskBlockers(store, workspaceId, taskId) {
  const links = store.listLinkInstances(workspaceId, {
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    object_id: taskId
  });
  const inboundBlockLinks = links.filter(
    (link) => link.to_object_id === taskId && link.link_type_id === LINK_TYPE_TASK_BLOCKS_TASK
  );
  const blockers = [];

  for (const link of inboundBlockLinks) {
    const blockerTask = store.getObjectInstance(workspaceId, link.from_object_id);

    if (blockerTask.properties_json.status !== "done") {
      blockers.push(blockerTask);
    }
  }

  return blockers;
}

function buildBlockersMap(store, workspaceId, tasks) {
  const blockers = {};

  for (const task of tasks) {
    if (task.properties_json.status === "done") {
      continue;
    }

    blockers[task.id] = getTaskBlockers(store, workspaceId, task.id).map((blocker) => ({
      id: blocker.id,
      title: blocker.properties_json.title,
      status: blocker.properties_json.status,
      priority: blocker.properties_json.priority
    }));
  }

  return blockers;
}

export function guardPersonalObjectPatch(store, workspaceId, objectInstanceId, input) {
  const patchProperties = input.properties_json ?? input.properties;

  if (!patchProperties || patchProperties.status !== "done") {
    return;
  }

  const objectInstance = store.getObjectInstance(workspaceId, objectInstanceId);

  if (objectInstance.object_type_id !== OBJECT_TYPE_PERSONAL_TASK) {
    return;
  }

  throw new ApiError(
    400,
    "governed_action_required",
    "Personal tasks must be completed via POST /personal/tasks/:task_id/complete"
  );
}

export function patchPersonalObject(store, objectInstanceId, input) {
  assertPersonalBootstrap(store);
  guardPersonalObjectPatch(store, PERSONAL_WORKSPACE_ID, objectInstanceId, input);
  return store.updateObjectInstance(PERSONAL_WORKSPACE_ID, objectInstanceId, input);
}

function assertPersonalTaskCanComplete(store, taskId) {
  const task = store.getObjectInstance(PERSONAL_WORKSPACE_ID, taskId);

  if (task.object_type_id !== OBJECT_TYPE_PERSONAL_TASK) {
    throw new ApiError(400, "invalid_task", "Object is not a personal task");
  }

  if (task.properties_json.status === "done") {
    throw new ApiError(400, "task_already_done", "Personal task is already complete");
  }

  const blockers = getTaskBlockers(store, PERSONAL_WORKSPACE_ID, taskId);

  if (blockers.length > 0) {
    throw new ApiError(
      409,
      "task_blocked",
      "Personal task cannot be completed until blockers are done",
      blockers.map((blocker) => ({
        id: blocker.id,
        title: blocker.properties_json.title,
        status: blocker.properties_json.status
      }))
    );
  }

  return task;
}

export function guardPersonalActionRun(store, workspaceId, input) {
  if (workspaceId !== PERSONAL_WORKSPACE_ID) {
    return;
  }

  if (input.action_type_id !== ACTION_TYPE_COMPLETE_PERSONAL_TASK) {
    return;
  }

  assertPersonalBootstrap(store);
  const taskId = input.target_object_id;

  if (typeof taskId !== "string" || taskId.trim() === "") {
    return;
  }

  assertPersonalTaskCanComplete(store, taskId);
}

export function bootstrapPersonalAtlas(store) {
  if (personalWorkspaceExists(store)) {
    return summarizePersonalAtlas(store, { already_existed: true });
  }

  const workspace = store.createWorkspace({
    id: PERSONAL_WORKSPACE_ID,
    name: "Personal Atlas",
    visibility: "private"
  });

  store.createObjectType(PERSONAL_WORKSPACE_ID, {
    id: OBJECT_TYPE_PERSONAL_CARBON_COPY,
    name: "Personal Carbon Copy",
    schema_json: {
      type: "object",
      required: ["goal", "constraints", "preferences"],
      properties: {
        goal: { type: "string" },
        constraints: { type: "string" },
        preferences: { type: "string" }
      }
    }
  });

  store.createObjectType(PERSONAL_WORKSPACE_ID, {
    id: OBJECT_TYPE_PERSONAL_PROJECT,
    name: "Personal Project",
    schema_json: {
      type: "object",
      required: ["name", "description", "goal"],
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        goal: { type: "string" }
      }
    }
  });

  store.createObjectType(PERSONAL_WORKSPACE_ID, {
    id: OBJECT_TYPE_PERSONAL_TASK,
    name: "Personal Task",
    schema_json: {
      type: "object",
      required: ["title", "status", "priority", "acceptance_criteria"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "done"] },
        priority: { type: "integer" },
        acceptance_criteria: { type: "string" },
        artifact_uri: { type: "string" },
        evidence_note: { type: "string" }
      }
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_personal_carbon_copy",
    object_type_id: OBJECT_TYPE_PERSONAL_CARBON_COPY,
    properties_json: {
      goal: "Build Atlas into a Palantir-class ontology platform",
      constraints: "Use Personal Atlas as the cockpit; promote only reviewed records into public or enterprise layers",
      preferences: "Keep lifecycle gates, evidence, review packets, and tests visible in the local workflow",
      progress_map: "outputs/internal/PERSONAL_WORKSPACE_STATUS.md",
      polish_track: "outputs/internal/NEXT_ACTION.md (parallel polish program)"
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_personal_project_atlas",
    object_type_id: OBJECT_TYPE_PERSONAL_PROJECT,
    properties_json: {
      name: "Atlas self-hosting roadmap",
      description: "Personal Atlas manages the work needed to build shared core, public Atlas, and enterprise Atlas.",
      goal: PROJECT_GOAL
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_task_harden_personal_loop",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    properties_json: {
      title: "Harden Personal Atlas self-hosting loop",
      status: "todo",
      priority: 1,
      acceptance_criteria: "Read endpoints are side-effect free, blocked tasks cannot complete, and every seeded task has done criteria"
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_task_runtime_foundation",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    properties_json: {
      title: "Add durable Atlas runtime foundation",
      status: "todo",
      priority: 2,
      acceptance_criteria: "Postgres wiring, transaction boundary, migration runner, and object history tests are implemented"
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_task_policy_audit",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    properties_json: {
      title: "Add policy checks and audit events before broader actions",
      status: "todo",
      priority: 3,
      acceptance_criteria: "All mutations pass PermissionCheck and write append-only AuditEvent records with tests"
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_task_public_atlas",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    properties_json: {
      title: "Build reviewed Public Atlas publishing layer",
      status: "todo",
      priority: 4,
      acceptance_criteria: "Candidate personal records can be reviewed, redacted, and promoted into public packages without private leakage"
    }
  });

  store.createObjectInstance(PERSONAL_WORKSPACE_ID, {
    id: "object_task_enterprise_workspace",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    properties_json: {
      title: "Build Enterprise Atlas workspace layer",
      status: "todo",
      priority: 5,
      acceptance_criteria: "Tenant, organization, membership, scoped agent, and admin-console foundations pass isolation tests"
    }
  });

  store.createLinkType(PERSONAL_WORKSPACE_ID, {
    id: LINK_TYPE_TASK_BLOCKS_TASK,
    name: "Task blocks task",
    from_object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    to_object_type_id: OBJECT_TYPE_PERSONAL_TASK
  });

  store.createLinkInstance(PERSONAL_WORKSPACE_ID, {
    id: "link_personal_loop_blocks_runtime",
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    from_object_id: "object_task_harden_personal_loop",
    to_object_id: "object_task_runtime_foundation"
  });

  store.createLinkInstance(PERSONAL_WORKSPACE_ID, {
    id: "link_runtime_blocks_policy_audit",
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    from_object_id: "object_task_runtime_foundation",
    to_object_id: "object_task_policy_audit"
  });

  store.createLinkInstance(PERSONAL_WORKSPACE_ID, {
    id: "link_policy_blocks_public_atlas",
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    from_object_id: "object_task_policy_audit",
    to_object_id: "object_task_public_atlas"
  });

  store.createLinkInstance(PERSONAL_WORKSPACE_ID, {
    id: "link_policy_blocks_enterprise_workspace",
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    from_object_id: "object_task_policy_audit",
    to_object_id: "object_task_enterprise_workspace"
  });

  store.createObjectSet(PERSONAL_WORKSPACE_ID, {
    id: "object_set_open_tasks",
    name: "Open personal tasks",
    object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    filter_expression: {
      property_equals: {
        status: "todo"
      }
    }
  });

  store.createActionType(PERSONAL_WORKSPACE_ID, {
    id: ACTION_TYPE_COMPLETE_PERSONAL_TASK,
    name: "Complete personal task",
    target_object_type_id: OBJECT_TYPE_PERSONAL_TASK,
    input_schema_json: {
      type: "object",
      required: ["artifact_uri", "evidence_note"],
      properties: {
        artifact_uri: { type: "string", minLength: 1 },
        evidence_note: { type: "string", minLength: 1 }
      }
    },
    effect_json: {
      type: "update_object_properties",
      set_properties_json: { status: "done" },
      copy_input_fields: ["artifact_uri", "evidence_note"]
    }
  });

  return summarizePersonalAtlas(store, { already_existed: false, workspace });
}

function summarizePersonalAtlas(store, { already_existed, workspace }) {
  const resolvedWorkspace = workspace ?? store.getWorkspace(PERSONAL_WORKSPACE_ID);
  const tasks = getPersonalTasks(store);

  return {
    already_existed,
    workspace_id: resolvedWorkspace.id,
    workspace: resolvedWorkspace,
    object_type_ids: [
      OBJECT_TYPE_PERSONAL_CARBON_COPY,
      OBJECT_TYPE_PERSONAL_PROJECT,
      OBJECT_TYPE_PERSONAL_TASK
    ],
    object_ids: [
      "object_personal_carbon_copy",
      "object_personal_project_atlas",
      "object_task_harden_personal_loop",
      "object_task_runtime_foundation",
      "object_task_policy_audit",
      "object_task_public_atlas",
      "object_task_enterprise_workspace"
    ],
    link_type_id: LINK_TYPE_TASK_BLOCKS_TASK,
    link_ids: [
      "link_personal_loop_blocks_runtime",
      "link_runtime_blocks_policy_audit",
      "link_policy_blocks_public_atlas",
      "link_policy_blocks_enterprise_workspace"
    ],
    object_set_id: "object_set_open_tasks",
    action_type_id: ACTION_TYPE_COMPLETE_PERSONAL_TASK,
    task_count: tasks.length,
    open_task_count: tasks.filter((task) => task.properties_json.status === "todo").length
  };
}

export function selectNextAction(store, workspaceId = PERSONAL_WORKSPACE_ID) {
  assertPersonalBootstrap(store);

  return selectNextActionForWorkspace(store, workspaceId, {
    taskObjectTypeId: OBJECT_TYPE_PERSONAL_TASK,
    blocksLinkTypeId: LINK_TYPE_TASK_BLOCKS_TASK
  });
}

export function getPersonalOverview(store, options = {}) {
  assertPersonalBootstrap(store);

  const workspace = store.getWorkspace(PERSONAL_WORKSPACE_ID);
  const carbon_copy = store.getObjectInstance(PERSONAL_WORKSPACE_ID, "object_personal_carbon_copy");
  const projects = getPersonalProjects(store);
  const project =
    projects.find((entry) => entry.id === "object_personal_project_atlas") ?? projects[0] ?? null;
  const tasks = getPersonalTasks(store);
  const blockers = buildBlockersMap(store, PERSONAL_WORKSPACE_ID, tasks);
  const next_action = selectNextAction(store, PERSONAL_WORKSPACE_ID);

  return {
    workspace,
    workspace_id: workspace.id,
    carbon_copy,
    project,
    projects,
    tasks,
    blockers,
    next_action,
    security_boundary: getPersonalSecurityBoundary(options)
  };
}

export function getPersonalTasksCatalog(store) {
  assertPersonalBootstrap(store);

  const tasks = getPersonalTasks(store);

  return {
    workspace_id: PERSONAL_WORKSPACE_ID,
    tasks,
    blockers: buildBlockersMap(store, PERSONAL_WORKSPACE_ID, tasks),
    task_count: tasks.length,
    open_task_count: tasks.filter((task) => task.properties_json.status === "todo").length
  };
}

/** Dual-spine header for agents and web: personal tasks vs parallel polish vs operational delegation. */
export function getPersonalSessionContext(store, options = {}) {
  assertPersonalBootstrap(store);

  const catalog = getPersonalTasksCatalog(store);
  const next_action = selectNextAction(store, PERSONAL_WORKSPACE_ID);
  const carbon_copy = store.getObjectInstance(PERSONAL_WORKSPACE_ID, "object_personal_carbon_copy");
  const props = carbon_copy.properties_json ?? {};
  const nextTitle = next_action?.properties_json?.title ?? null;

  return {
    header_version: 1,
    workspace_personal_id: PERSONAL_WORKSPACE_ID,
    operational_workspace_hint:
      options.operational_workspace_hint ?? "workspace_operational_dogfood",
    persist_state: Boolean(options.persistState),
    personal_spine: {
      next_action,
      next_action_id: next_action?.id ?? null,
      next_action_title: nextTitle,
      open_task_count: catalog.open_task_count,
      task_count: catalog.task_count,
      progress_map_uri: props.progress_map ?? null
    },
    parallel_polish: {
      track_uri: props.polish_track ?? null,
      mode: "parallel",
      note:
        "Polish program epics live in outputs/internal/NEXT_ACTION.md — not governed personal task completion."
    },
    agent_contract: {
      personal_planning: [
        "Use personal.list_tasks, personal.get_overview, personal.get_next_action, or personal.get_session_context (MCP).",
        "Or atlas.api.get with path /personal/tasks, /personal/overview, /personal/next-action, or /personal/session-context.",
        "Do not call GET /workspaces/workspace_personal/... with an operational delegation session (workspace_scope_mismatch)."
      ],
      operational_governance: [
        "get_workspace_overview and get_next_action use the MCP session delegation workspace (e.g. workspace_operational_dogfood), not workspace_personal.",
        "Ontology reads/writes on operational dogfood use /workspaces/:session_workspace_id/... via delegation scope."
      ],
      task_completion:
        "POST /personal/tasks/:task_id/complete with artifact_uri and evidence_note — never PATCH personal task status to done."
    },
    security_boundary: getPersonalSecurityBoundary(options)
  };
}

export function completePersonalTask(store, taskId, input) {
  assertPersonalBootstrap(store);
  assertPersonalTaskCanComplete(store, taskId);

  store.createActionRun(PERSONAL_WORKSPACE_ID, {
    action_type_id: ACTION_TYPE_COMPLETE_PERSONAL_TASK,
    target_object_id: taskId,
    actor: "local_user",
    input_json: input ?? {}
  });

  const updatedTask = store.getObjectInstance(PERSONAL_WORKSPACE_ID, taskId);

  return {
    task: updatedTask,
    next_action: selectNextAction(store, PERSONAL_WORKSPACE_ID)
  };
}
