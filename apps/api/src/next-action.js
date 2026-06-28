const DEFAULT_OPTIONS = {
  statusProperty: "status",
  doneValue: "done",
  priorityProperty: "priority",
  titleProperty: "title",
  acceptanceProperty: "acceptance_criteria"
};

function resolveOptions(options = {}) {
  const merged = { ...DEFAULT_OPTIONS };

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}

function isDone(task, opts) {
  return task.properties_json[opts.statusProperty] === opts.doneValue;
}

export function getTaskBlockers(store, workspaceId, taskId, options) {
  const opts = resolveOptions(options);
  const links = store.listLinkInstances(workspaceId, {
    link_type_id: opts.blocksLinkTypeId,
    object_id: taskId
  });
  const inboundBlockLinks = links.filter(
    (link) => link.to_object_id === taskId && link.link_type_id === opts.blocksLinkTypeId
  );
  const blockers = [];

  for (const link of inboundBlockLinks) {
    const blocker = store.getObjectInstance(workspaceId, link.from_object_id);

    if (!isDone(blocker, opts)) {
      blockers.push(blocker);
    }
  }

  return blockers;
}

function summarizeBlocker(blocker, opts) {
  return {
    id: blocker.id,
    title: blocker.properties_json[opts.titleProperty],
    status: blocker.properties_json[opts.statusProperty],
    priority: blocker.properties_json[opts.priorityProperty]
  };
}

export function buildBlockersMap(store, workspaceId, tasks, options) {
  const opts = resolveOptions(options);
  const blockers = {};

  for (const task of tasks) {
    if (isDone(task, opts)) {
      continue;
    }

    blockers[task.id] = getTaskBlockers(store, workspaceId, task.id, opts).map((blocker) =>
      summarizeBlocker(blocker, opts)
    );
  }

  return blockers;
}

export function selectNextActionForWorkspace(store, workspaceId, options) {
  const opts = resolveOptions(options);

  if (!opts.taskObjectTypeId || !opts.blocksLinkTypeId) {
    throw new Error("selectNextActionForWorkspace requires taskObjectTypeId and blocksLinkTypeId");
  }

  const allTasks = store.listObjectInstances(workspaceId, {
    object_type_id: opts.taskObjectTypeId
  });
  const openTasks = allTasks.filter((task) => !isDone(task, opts));

  const candidates = [];

  for (const task of openTasks) {
    const blockers = getTaskBlockers(store, workspaceId, task.id, opts);

    if (blockers.length === 0) {
      candidates.push({ task, blockers });
    }
  }

  if (candidates.length === 0) {
    return {
      task: null,
      acceptance_criteria: null,
      explanation: "No unblocked open tasks remain.",
      blockers: buildBlockersMap(store, workspaceId, allTasks, opts)
    };
  }

  candidates.sort(
    (left, right) =>
      left.task.properties_json[opts.priorityProperty] - right.task.properties_json[opts.priorityProperty]
  );
  const selected = candidates[0];
  const priority = selected.task.properties_json[opts.priorityProperty];

  return {
    task: selected.task,
    acceptance_criteria: selected.task.properties_json[opts.acceptanceProperty] ?? null,
    explanation: `Dependencies satisfied. Selected highest-priority unblocked task (priority ${priority}).`,
    blockers: selected.blockers.map((blocker) => summarizeBlocker(blocker, opts))
  };
}
