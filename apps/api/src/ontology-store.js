import {
  auditEventHash,
  sha256Hex,
  canonicalJson,
  validateObjectProperties,
  verifyAuditEventChain
} from "../../../packages/ontology-core/src/index.js";

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
const AGENT_STATUSES = ["active", "suspended"];
const DELEGATION_STATUSES = ["active", "revoked"];
const AGENT_SCOPES = ["atlas.read", "atlas.act", "github.pr:create", "slack.read"];
const GOAL_CONTRACT_STATUSES = ["active", "completed", "cancelled"];
const GOAL_RISK_CLASSES = ["low", "medium", "high", "unacceptable"];
const REVIEW_PACKET_STATUSES = ["draft", "review_ready", "superseded"];
const ALLOWED_PR_HEAD_BRANCH_PREFIXES = ["codex/", "agent/"];
const DEFAULT_DELEGATION_TTL_SECONDS = 3600;

export function createOntologyStore(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const idCounters = new Map();
  const createId = options.createId ?? defaultCreateId;

  function defaultCreateId(prefix) {
    const next = (idCounters.get(prefix) ?? 0) + 1;
    idCounters.set(prefix, next);
    return `${prefix}_${String(next).padStart(3, "0")}`;
  }

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
  const agents = new Map();
  const agentDelegations = new Map();
  const goalContracts = new Map();
  const pullRequestArtifacts = new Map();
  const reviewPackets = new Map();
  const auditEvents = [];
  const auditEventsById = new Map();

  function appendAuditEvent(input) {
    const previousEvent = auditEvents[auditEvents.length - 1];
    const previousHash = previousEvent ? previousEvent.event_hash : null;

    const event = {
      id: createId("audit_event"),
      sequence: auditEvents.length + 1,
      workspace_id: input.workspace_id ?? null,
      actor: input.actor ?? "system",
      event_type: input.event_type,
      resource_type: input.resource_type ?? null,
      resource_id: input.resource_id ?? null,
      decision: input.decision ?? "not_applicable",
      before_hash: input.before === undefined ? null : hashJson(input.before),
      after_hash: input.after === undefined ? null : hashJson(input.after),
      metadata: input.metadata ? clone(input.metadata) : {},
      previous_event_hash: previousHash,
      created_at: now()
    };

    event.event_hash = auditEventHash(event);
    auditEvents.push(event);
    auditEventsById.set(event.id, event);
    return clone(event);
  }

  function listAuditEvents(workspaceId, filters = {}) {
    return auditEvents
      .filter((event) => !workspaceId || event.workspace_id === workspaceId)
      .filter((event) => !filters.resource_id || event.resource_id === filters.resource_id)
      .filter((event) => !filters.event_type || event.event_type === filters.event_type)
      .map(clone);
  }

  function getAuditEvent(eventId) {
    const event = auditEventsById.get(eventId);

    if (!event) {
      throw new ApiError(404, "audit_event_not_found", "AuditEvent not found");
    }

    return clone(event);
  }

  function verifyAuditChain() {
    return verifyAuditEventChain(auditEvents.map(clone));
  }

  function recordIntegrationAuditEvent(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "audit event");
    const metadata = input.metadata ?? {};
    assertPlainObject(metadata, "metadata");

    return appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "system",
      event_type: requireString(input.event_type, "event_type"),
      resource_type: optionalString(input.resource_type, "resource_type"),
      resource_id: optionalString(input.resource_id, "resource_id"),
      decision: input.decision ?? "not_applicable",
      metadata
    });
  }

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

  function isWorkspaceGoverned(workspaceId) {
    return [...policies.values()].some(
      (policy) => policy.workspace_id === workspaceId && policy.status === "active"
    );
  }

  function evaluatePolicy(workspaceId, request) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(request, "request");

    const action = requireString(request.action, "action");
    const resourceType = requireString(request.resource_type, "resource_type");
    const role = request.role ?? null;

    if (role !== null) {
      assertEnum(role, "role", WORKSPACE_ROLES);
    }

    const rules = [...policies.values()]
      .filter((policy) => policy.workspace_id === workspaceId && policy.status === "active")
      .flatMap((policy) => policy.rules_json.map((rule) => ({ ...rule, policy_id: policy.id })));

    if (rules.length === 0) {
      return { decision: "allow", reason: "no_active_policy", policy_id: null };
    }

    if (role === null) {
      return { decision: "deny", reason: "role_required_in_governed_workspace", policy_id: null };
    }

    const matches = rules.filter((rule) => policyRuleMatches(rule, { role, action, resourceType }));
    const denyRule = matches.find((rule) => rule.effect === "deny");

    if (denyRule) {
      return { decision: "deny", reason: "denied_by_policy_rule", policy_id: denyRule.policy_id };
    }

    const allowRule = matches.find((rule) => rule.effect === "allow");

    if (allowRule) {
      return { decision: "allow", reason: "allowed_by_policy_rule", policy_id: allowRule.policy_id };
    }

    return { decision: "deny", reason: "no_matching_allow_rule", policy_id: null };
  }

  function authorize(workspaceId, request) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(request, "request");

    const action = requireString(request.action, "action");
    const resourceType = requireString(request.resource_type, "resource_type");
    const role = request.role ?? null;
    const principalType = request.principal_type ?? "user";
    assertEnum(principalType, "principal_type", PRINCIPAL_TYPES);
    const principalId = optionalString(request.principal_id, "principal_id")
      ?? optionalString(request.actor, "actor")
      ?? "local_user";

    const evaluation = evaluatePolicy(workspaceId, { role, action, resource_type: resourceType });

    const permissionCheck = createPermissionCheck(workspaceId, {
      principal_type: principalType,
      principal_id: principalId,
      role: role ?? undefined,
      action,
      resource_type: resourceType,
      resource_id: request.resource_id ?? undefined,
      decision: evaluation.decision,
      policy_id: evaluation.policy_id ?? undefined,
      reason: evaluation.reason
    });

    appendAuditEvent({
      workspace_id: workspaceId,
      actor: principalId,
      event_type: "permission.decision",
      resource_type: resourceType,
      resource_id: request.resource_id ?? null,
      decision: evaluation.decision,
      metadata: {
        action,
        reason: evaluation.reason,
        policy_id: evaluation.policy_id,
        role,
        principal_type: principalType,
        permission_check_id: permissionCheck.id
      }
    });

    return { ...evaluation, permission_check_id: permissionCheck.id };
  }

  function createGoalContract(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const objective = requireString(input.objective, "objective");
    const status = input.status ?? "active";
    assertEnum(status, "status", GOAL_CONTRACT_STATUSES);
    const riskClass = input.risk_class ?? "low";
    assertEnum(riskClass, "risk_class", GOAL_RISK_CLASSES);

    const constraints = normalizeStringArray(input.constraints ?? [], "constraints");
    const allowedActions = normalizeStringArray(input.allowed_actions ?? [], "allowed_actions");
    const blockedActions = normalizeStringArray(input.blocked_actions ?? [], "blocked_actions");
    const acceptanceCriteria = normalizeStringArray(input.acceptance_criteria ?? [], "acceptance_criteria");
    const approvalBoundaries = normalizeStringArray(input.approval_boundaries ?? [], "approval_boundaries");
    const doneDefinition = requireString(input.done_definition, "done_definition");
    const budgetJson = input.budget_json ?? input.budget ?? {};
    assertPlainObject(budgetJson, "budget_json");
    const nextActionJson = input.next_action_json ?? null;

    if (nextActionJson !== null) {
      assertPlainObject(nextActionJson, "next_action_json");
    }

    const timestamp = now();
    const goalContract = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("goal_contract"),
      workspace_id: workspaceId,
      objective,
      constraints,
      allowed_actions: allowedActions,
      blocked_actions: blockedActions,
      acceptance_criteria: acceptanceCriteria,
      approval_boundaries: approvalBoundaries,
      risk_class: riskClass,
      budget_json: clone(budgetJson),
      done_definition: doneDefinition,
      next_action_json: nextActionJson ? clone(nextActionJson) : null,
      status,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (goalContracts.has(goalContract.id)) {
      throw new ApiError(409, "goal_contract_conflict", "GoalContract already exists");
    }

    goalContracts.set(goalContract.id, goalContract);
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "local_user",
      event_type: "goal_contract.created",
      resource_type: "goal_contract",
      resource_id: goalContract.id,
      decision: "allow",
      after: {
        objective,
        allowed_actions: allowedActions,
        blocked_actions: blockedActions,
        risk_class: riskClass,
        status
      }
    });
    return clone(goalContract);
  }

  function listGoalContracts(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...goalContracts.values()]
      .filter((goalContract) => goalContract.workspace_id === workspaceId)
      .map(clone);
  }

  function getGoalContract(workspaceId, goalContractId) {
    assertWorkspaceExists(workspaceId);
    const goalContract = goalContracts.get(goalContractId);

    if (!goalContract || goalContract.workspace_id !== workspaceId) {
      throw new ApiError(404, "goal_contract_not_found", "GoalContract not found in workspace");
    }

    return clone(goalContract);
  }

  function createPullRequestArtifact(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const repository = requireRepository(input.repository, "repository");
    const title = requireString(input.title, "title");
    const body = requireString(input.body, "body");
    const headBranch = requireBranchName(input.head_branch, "head_branch");
    const baseBranch = requireBranchName(input.base_branch ?? "main", "base_branch");

    if (!ALLOWED_PR_HEAD_BRANCH_PREFIXES.some((prefix) => headBranch.startsWith(prefix))) {
      throw new ApiError(400, "branch_namespace_denied", `head_branch must start with one of: ${ALLOWED_PR_HEAD_BRANCH_PREFIXES.join(", ")}`);
    }

    const provider = optionalString(input.provider, "provider") ?? "github";
    const externalUrl = requireString(input.external_url, "external_url");
    const externalId = optionalString(input.external_id, "external_id");
    const state = optionalString(input.state, "state") ?? "open";
    const goalContractId = optionalString(input.goal_contract_id, "goal_contract_id");

    if (goalContractId) {
      getGoalContract(workspaceId, goalContractId);
    }

    const timestamp = now();
    const artifact = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("pull_request_artifact"),
      workspace_id: workspaceId,
      goal_contract_id: goalContractId,
      provider,
      repository,
      title,
      body,
      head_branch: headBranch,
      base_branch: baseBranch,
      external_id: externalId,
      external_url: externalUrl,
      state,
      merge_capability: "absent",
      created_at: timestamp,
      updated_at: timestamp
    };

    if (pullRequestArtifacts.has(artifact.id)) {
      throw new ApiError(409, "pull_request_artifact_conflict", "PullRequestArtifact already exists");
    }

    pullRequestArtifacts.set(artifact.id, artifact);
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "system",
      event_type: "github.pull_request.opened",
      resource_type: "pull_request_artifact",
      resource_id: artifact.id,
      decision: "allow",
      after: {
        repository,
        head_branch: headBranch,
        base_branch: baseBranch,
        external_url: externalUrl,
        merge_capability: "absent"
      },
      metadata: {
        goal_contract_id: goalContractId,
        provider,
        external_id: externalId
      }
    });
    return clone(artifact);
  }

  function listPullRequestArtifacts(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...pullRequestArtifacts.values()]
      .filter((artifact) => artifact.workspace_id === workspaceId)
      .map(clone);
  }

  function getPullRequestArtifact(workspaceId, artifactId) {
    assertWorkspaceExists(workspaceId);
    const artifact = pullRequestArtifacts.get(artifactId);

    if (!artifact || artifact.workspace_id !== workspaceId) {
      throw new ApiError(404, "pull_request_artifact_not_found", "PullRequestArtifact not found in workspace");
    }

    return clone(artifact);
  }

  function createReviewPacket(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const summary = requireString(input.summary, "summary");
    const goalContractId = optionalString(input.goal_contract_id, "goal_contract_id");
    const pullRequestArtifactId = optionalString(input.pull_request_artifact_id, "pull_request_artifact_id");

    if (goalContractId) {
      getGoalContract(workspaceId, goalContractId);
    }

    if (pullRequestArtifactId) {
      getPullRequestArtifact(workspaceId, pullRequestArtifactId);
    }

    const status = input.status ?? "review_ready";
    assertEnum(status, "status", REVIEW_PACKET_STATUSES);
    const changedFiles = normalizeStringArray(input.changed_files ?? [], "changed_files");
    const verificationCommands = normalizeStringArray(input.verification_commands ?? [], "verification_commands");
    const criticFindings = normalizeStringArray(input.critic_findings ?? [], "critic_findings");
    const safetyFindings = normalizeStringArray(input.safety_findings ?? [], "safety_findings");
    const auditEventIds = normalizeStringArray(input.audit_event_ids ?? [], "audit_event_ids");
    const pendingHumanActions = normalizeStringArray(
      input.pending_human_actions ?? ["protected_branch_merge"],
      "pending_human_actions"
    );

    for (const eventId of auditEventIds) {
      const event = getAuditEvent(eventId);

      if (event.workspace_id !== workspaceId) {
        throw new ApiError(404, "audit_event_not_found", "AuditEvent not found in workspace");
      }
    }

    const timestamp = now();
    const reviewPacket = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("review_packet"),
      workspace_id: workspaceId,
      goal_contract_id: goalContractId,
      pull_request_artifact_id: pullRequestArtifactId,
      summary,
      changed_files: changedFiles,
      verification_commands: verificationCommands,
      critic_findings: criticFindings,
      safety_findings: safetyFindings,
      audit_event_ids: auditEventIds,
      pending_human_actions: pendingHumanActions,
      status,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (reviewPackets.has(reviewPacket.id)) {
      throw new ApiError(409, "review_packet_conflict", "ReviewPacket already exists");
    }

    reviewPackets.set(reviewPacket.id, reviewPacket);
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "system",
      event_type: "review_packet.created",
      resource_type: "review_packet",
      resource_id: reviewPacket.id,
      decision: "allow",
      after: {
        summary,
        pending_human_actions: pendingHumanActions,
        status
      },
      metadata: {
        goal_contract_id: goalContractId,
        pull_request_artifact_id: pullRequestArtifactId,
        audit_event_ids: auditEventIds
      }
    });
    return clone(reviewPacket);
  }

  function listReviewPackets(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...reviewPackets.values()]
      .filter((reviewPacket) => reviewPacket.workspace_id === workspaceId)
      .map(clone);
  }

  function getReviewPacket(workspaceId, reviewPacketId) {
    assertWorkspaceExists(workspaceId);
    const reviewPacket = reviewPackets.get(reviewPacketId);

    if (!reviewPacket || reviewPacket.workspace_id !== workspaceId) {
      throw new ApiError(404, "review_packet_not_found", "ReviewPacket not found in workspace");
    }

    return clone(reviewPacket);
  }

  function createAgent(input) {
    assertPlainObject(input, "request body");

    const displayName = requireString(input.display_name, "display_name");
    const status = input.status ?? "active";
    assertEnum(status, "status", AGENT_STATUSES);

    const timestamp = now();
    const agent = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("agent"),
      display_name: displayName,
      status,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (agents.has(agent.id)) {
      throw new ApiError(409, "agent_conflict", "Agent already exists");
    }

    agents.set(agent.id, agent);
    return clone(agent);
  }

  function listAgents() {
    return [...agents.values()].map(clone);
  }

  function getAgent(agentId) {
    const agent = agents.get(agentId);

    if (!agent) {
      throw new ApiError(404, "agent_not_found", "Agent not found");
    }

    return clone(agent);
  }

  function createAgentDelegation(workspaceId, input) {
    assertWorkspaceExists(workspaceId);
    assertPlainObject(input, "request body");
    assertWorkspaceBody(input, workspaceId);

    const agentId = requireString(input.agent_id, "agent_id");
    const agent = agents.get(agentId);

    if (!agent) {
      throw new ApiError(404, "agent_not_found", "Agent not found");
    }

    if (agent.status !== "active") {
      throw new ApiError(409, "agent_not_active", "Agent must be active to receive a delegation");
    }

    const role = input.role ?? "viewer";
    assertEnum(role, "role", WORKSPACE_ROLES);

    const scopes = input.scopes ?? ["atlas.read"];
    assertStringArray(scopes, "scopes");

    for (const scope of scopes) {
      assertEnum(scope, "scopes", AGENT_SCOPES);
    }

    const allowedTools = input.allowed_tools ?? ["*"];
    assertStringArray(allowedTools, "allowed_tools");
    const goalContractId = optionalString(input.goal_contract_id, "goal_contract_id");

    if (goalContractId) {
      const goalContract = getGoalContract(workspaceId, goalContractId);

      if (goalContract.status !== "active") {
        throw new ApiError(409, "goal_contract_not_active", "GoalContract must be active to bind a delegation");
      }
    }

    const issuedAt = now();
    let expiresAt;

    if (input.expires_at !== undefined && input.expires_at !== null) {
      expiresAt = requireString(input.expires_at, "expires_at");

      if (Number.isNaN(Date.parse(expiresAt))) {
        throw new ApiError(400, "invalid_request", "expires_at must be an ISO timestamp");
      }
    } else {
      const ttlSeconds = input.ttl_seconds ?? DEFAULT_DELEGATION_TTL_SECONDS;

      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new ApiError(400, "invalid_request", "ttl_seconds must be a positive integer");
      }

      expiresAt = new Date(Date.parse(issuedAt) + ttlSeconds * 1000).toISOString();
    }

    const delegation = {
      id: input.id ? requireIdentifier(input.id, "id") : createId("delegation"),
      workspace_id: workspaceId,
      agent_id: agentId,
      role,
      scopes: [...scopes],
      allowed_tools: [...allowedTools],
      goal_contract_id: goalContractId,
      status: "active",
      issued_at: issuedAt,
      expires_at: expiresAt,
      created_at: issuedAt,
      updated_at: issuedAt
    };

    if (agentDelegations.has(delegation.id)) {
      throw new ApiError(409, "delegation_conflict", "AgentDelegation already exists");
    }

    agentDelegations.set(delegation.id, delegation);
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: agentId,
      event_type: "agent.delegation_issued",
      resource_type: "agent_delegation",
      resource_id: delegation.id,
      decision: "allow",
      metadata: {
        role,
        scopes: delegation.scopes,
        allowed_tools: delegation.allowed_tools,
        goal_contract_id: goalContractId,
        expires_at: expiresAt
      }
    });
    return clone(delegation);
  }

  function listAgentDelegations(workspaceId) {
    assertWorkspaceExists(workspaceId);

    return [...agentDelegations.values()]
      .filter((delegation) => delegation.workspace_id === workspaceId)
      .map(clone);
  }

  function getAgentDelegation(workspaceId, delegationId) {
    assertWorkspaceExists(workspaceId);
    const delegation = agentDelegations.get(delegationId);

    if (!delegation || delegation.workspace_id !== workspaceId) {
      throw new ApiError(404, "delegation_not_found", "AgentDelegation not found in workspace");
    }

    return clone(delegation);
  }

  function authorizeAgentTool(delegationId, request) {
    assertPlainObject(request, "request");
    const tool = requireString(request.tool, "tool");
    const requiredScope = requireString(request.required_scope, "required_scope");

    const delegation = agentDelegations.get(delegationId);

    if (!delegation) {
      throw new ApiError(401, "invalid_delegation", "Delegation token is not recognized");
    }

    const denyAndThrow = (statusCode, code, reason) => {
      appendAuditEvent({
        workspace_id: delegation.workspace_id,
        actor: delegation.agent_id,
        event_type: "agent.tool_call",
        resource_type: "agent_tool",
        resource_id: tool,
        decision: "deny",
        metadata: {
          tool,
          delegation_id: delegation.id,
          goal_contract_id: delegation.goal_contract_id,
          role: delegation.role,
          required_scope: requiredScope,
          reason
        }
      });
      throw new ApiError(statusCode, code, `Agent tool call denied: ${reason}`);
    };

    if (delegation.status !== "active") {
      denyAndThrow(401, "delegation_revoked", "delegation_revoked");
    }

    if (Date.parse(delegation.expires_at) <= Date.parse(now())) {
      denyAndThrow(401, "delegation_expired", "delegation_expired");
    }

    if (!delegation.scopes.includes(requiredScope)) {
      denyAndThrow(403, "scope_not_granted", `scope_not_granted:${requiredScope}`);
    }

    if (!delegation.allowed_tools.includes("*") && !delegation.allowed_tools.includes(tool)) {
      denyAndThrow(403, "tool_not_allowed", `tool_not_allowed:${tool}`);
    }

    if (delegation.goal_contract_id) {
      const goalContract = goalContracts.get(delegation.goal_contract_id);

      if (!goalContract || goalContract.workspace_id !== delegation.workspace_id) {
        denyAndThrow(403, "goal_contract_not_found", "goal_contract_not_found");
      }

      if (goalContract.status !== "active") {
        denyAndThrow(403, "goal_contract_not_active", "goal_contract_not_active");
      }

      if (goalContract.blocked_actions.includes("*") || goalContract.blocked_actions.includes(tool)) {
        denyAndThrow(403, "goal_contract_action_blocked", `goal_contract_action_blocked:${tool}`);
      }

      if (
        goalContract.allowed_actions.length > 0 &&
        !goalContract.allowed_actions.includes("*") &&
        !goalContract.allowed_actions.includes(tool)
      ) {
        denyAndThrow(403, "goal_contract_action_not_allowed", `goal_contract_action_not_allowed:${tool}`);
      }
    }

    appendAuditEvent({
      workspace_id: delegation.workspace_id,
      actor: delegation.agent_id,
      event_type: "agent.tool_call",
      resource_type: "agent_tool",
      resource_id: tool,
      decision: "allow",
      metadata: {
        tool,
        delegation_id: delegation.id,
        goal_contract_id: delegation.goal_contract_id,
        role: delegation.role,
        required_scope: requiredScope,
        reason: "granted"
      }
    });

    return clone(delegation);
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
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "local_user",
      event_type: "object_instance.created",
      resource_type: "object_instance",
      resource_id: objectInstance.id,
      decision: "allow",
      after: objectInstance.properties_json
    });
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

    const beforeProperties = clone(objectInstance.properties_json);
    const timestamp = now();
    objectInstance.properties_json = clone(mergedProperties);
    objectInstance.updated_at = timestamp;
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: optionalString(input.actor, "actor") ?? "local_user",
      event_type: "object_instance.updated",
      resource_type: "object_instance",
      resource_id: objectInstance.id,
      decision: "allow",
      before: beforeProperties,
      after: objectInstance.properties_json
    });
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

    if (input.enforce_policy !== false && isWorkspaceGoverned(workspaceId)) {
      const decision = authorize(workspaceId, {
        principal_type: input.principal_type,
        principal_id: input.principal_id,
        actor: actor.trim(),
        role: input.role,
        action: "run_action",
        resource_type: targetObject.object_type_id,
        resource_id: targetObjectId
      });

      if (decision.decision === "deny") {
        throw new ApiError(403, "policy_denied", `Action denied by policy: ${decision.reason}`, [
          {
            reason: decision.reason,
            policy_id: decision.policy_id,
            permission_check_id: decision.permission_check_id
          }
        ]);
      }
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
    appendAuditEvent({
      workspace_id: workspaceId,
      actor: actionRun.actor,
      event_type: "action_run.completed",
      resource_type: "object_instance",
      resource_id: targetObjectId,
      decision: "allow",
      before: beforePropertiesJson,
      after: actionRun.after_properties_json,
      metadata: {
        action_type_id: actionTypeId,
        action_run_id: actionRun.id
      }
    });
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

  const COLLECTIONS = {
    workspaces,
    users,
    workspace_memberships: workspaceMemberships,
    policies,
    permission_checks: permissionChecks,
    object_types: objectTypes,
    object_instances: objectInstances,
    link_types: linkTypes,
    link_instances: linkInstances,
    object_sets: objectSets,
    action_types: actionTypes,
    action_runs: actionRuns,
    agents,
    agent_delegations: agentDelegations,
    goal_contracts: goalContracts,
    pull_request_artifacts: pullRequestArtifacts,
    review_packets: reviewPackets
  };

  function snapshot() {
    const data = {
      version: 1,
      id_counters: Object.fromEntries(idCounters),
      audit_events: auditEvents.map(clone)
    };

    for (const [key, map] of Object.entries(COLLECTIONS)) {
      data[key] = [...map.values()].map(clone);
    }

    return data;
  }

  function restore(state) {
    assertPlainObject(state, "snapshot");

    for (const map of Object.values(COLLECTIONS)) {
      map.clear();
    }

    for (const [key, map] of Object.entries(COLLECTIONS)) {
      const rows = Array.isArray(state[key]) ? state[key] : [];

      for (const row of rows) {
        map.set(row.id, clone(row));
      }
    }

    auditEvents.length = 0;
    auditEventsById.clear();

    for (const event of Array.isArray(state.audit_events) ? state.audit_events : []) {
      const cloned = clone(event);
      auditEvents.push(cloned);
      auditEventsById.set(cloned.id, cloned);
    }

    idCounters.clear();

    for (const [prefix, value] of Object.entries(state.id_counters ?? {})) {
      idCounters.set(prefix, value);
    }

    return snapshot();
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
    evaluatePolicy,
    authorize,
    createGoalContract,
    listGoalContracts,
    getGoalContract,
    createPullRequestArtifact,
    listPullRequestArtifacts,
    getPullRequestArtifact,
    createReviewPacket,
    listReviewPackets,
    getReviewPacket,
    recordIntegrationAuditEvent,
    createAgent,
    listAgents,
    getAgent,
    createAgentDelegation,
    listAgentDelegations,
    getAgentDelegation,
    authorizeAgentTool,
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
    listObjectSetObjects,
    listAuditEvents,
    getAuditEvent,
    verifyAuditChain,
    snapshot,
    restore
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

function policyRuleMatches(rule, { role, action, resourceType }) {
  const actionMatch = rule.action === "*" || rule.action === action;
  const resourceMatch = rule.resource_type === "*" || rule.resource_type === resourceType;
  const roleMatch = rule.roles.includes(role);
  return actionMatch && resourceMatch && roleMatch;
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

function normalizeStringArray(value, field) {
  assertStringArray(value, field);
  return value.map((item) => item.trim());
}

function requireRepository(value, field) {
  const repository = requireString(value, field);

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new ApiError(400, "invalid_request", `${field} must use owner/repo format`);
  }

  return repository;
}

function requireBranchName(value, field) {
  const branchName = requireString(value, field);

  if (
    branchName.includes("..") ||
    branchName.startsWith("/") ||
    branchName.endsWith("/") ||
    branchName.endsWith(".") ||
    /[\x00-\x20\x7f]/.test(branchName) ||
    /[~^:?*\[\]\\]/.test(branchName)
  ) {
    throw new ApiError(400, "invalid_request", `${field} is not a valid branch name`);
  }

  return branchName;
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashJson(value) {
  return sha256Hex(canonicalJson(value));
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
