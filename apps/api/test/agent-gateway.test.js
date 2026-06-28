import test from "node:test";
import assert from "node:assert/strict";
import { createOntologyStore } from "../src/ontology-store.js";
import { AGENT_TOOLS, dispatchAgentTool, getAgentManifest } from "../src/agent-gateway.js";

const TASK_TYPE = "object_type_task";
const BLOCKS_LINK = "link_type_blocks";
const ACTION_TYPE = "action_type_complete";

function seedWorkspace(store, { governed } = { governed: false }) {
  const workspace = store.createWorkspace({ id: "workspace_demo", name: "Demo" });

  store.createObjectType(workspace.id, {
    id: TASK_TYPE,
    name: "Task",
    schema_json: {
      type: "object",
      required: ["title", "status", "priority"],
      properties: {
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "done"] },
        priority: { type: "integer" },
        acceptance_criteria: { type: "string" }
      }
    }
  });

  const taskA = store.createObjectInstance(workspace.id, {
    id: "object_task_a",
    object_type_id: TASK_TYPE,
    properties_json: { title: "Design schema", status: "todo", priority: 1, acceptance_criteria: "All 3 tables defined" }
  });
  const taskB = store.createObjectInstance(workspace.id, {
    id: "object_task_b",
    object_type_id: TASK_TYPE,
    properties_json: { title: "Implement API", status: "todo", priority: 2, acceptance_criteria: "All 5 endpoints pass" }
  });

  store.createLinkType(workspace.id, {
    id: BLOCKS_LINK,
    name: "blocks",
    from_object_type_id: TASK_TYPE,
    to_object_type_id: TASK_TYPE
  });
  store.createLinkInstance(workspace.id, {
    link_type_id: BLOCKS_LINK,
    from_object_id: taskA.id,
    to_object_id: taskB.id
  });

  store.createActionType(workspace.id, {
    id: ACTION_TYPE,
    name: "Complete task",
    target_object_type_id: TASK_TYPE,
    input_schema_json: { type: "object", properties: {} },
    effect_json: { type: "update_object_properties", set_properties_json: { status: "done" } }
  });

  if (governed) {
    store.createPolicy(workspace.id, {
      name: "Editors may run task actions",
      rules_json: [
        { effect: "allow", action: "run_action", resource_type: TASK_TYPE, roles: ["editor", "admin", "owner"] }
      ]
    });
  }

  return { workspace, taskA, taskB };
}

function delegate(store, workspaceId, overrides = {}) {
  const agent = store.createAgent({ display_name: overrides.display_name ?? "Coding Agent" });
  return store.createAgentDelegation(workspaceId, {
    agent_id: agent.id,
    role: overrides.role ?? "editor",
    scopes: overrides.scopes ?? ["atlas.read", "atlas.act"],
    allowed_tools: overrides.allowed_tools ?? ["*"],
    expires_at: overrides.expires_at,
    goal_contract_id: overrides.goal_contract_id
  });
}

function githubPolicy(overrides = {}) {
  return {
    allowed_repositories: overrides.allowed_repositories ?? ["benpham3206/Atlas"],
    allowed_base_branches: overrides.allowed_base_branches ?? ["main"],
    dry_run: overrides.dry_run ?? false
  };
}

function slackPolicy(overrides = {}) {
  return {
    allowed_channel_ids: overrides.allowed_channel_ids ?? ["C0123456789"]
  };
}

test("manifest advertises tools, scopes, and verification order", () => {
  const manifest = getAgentManifest();
  assert.equal(manifest.tools.length, AGENT_TOOLS.length);
  assert.ok(manifest.scopes.includes("atlas.read"));
  assert.ok(manifest.scopes.includes("atlas.act"));
  assert.equal(manifest.verification_order[0], "resolve_delegation_token");
  assert.ok(manifest.tools.every((tool) => typeof tool.input_schema === "object"));
});

test("manifest exposes github.open_pr but no merge capability", () => {
  const manifest = getAgentManifest();
  const toolNames = manifest.tools.map((tool) => tool.name);

  assert.ok(toolNames.includes("github.open_pr"));
  assert.ok(toolNames.includes("generate_review_packet"));
  assert.ok(toolNames.includes("slack.get_channel_info"));
  assert.ok(manifest.scopes.includes("github.pr:create"));
  assert.ok(manifest.scopes.includes("slack.read"));
  assert.equal(toolNames.some((toolName) => toolName.includes("merge")), false);
  assert.equal(manifest.scopes.some((scope) => scope.includes("merge")), false);
});

test("an agent can read the graph through scoped tools", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { scopes: ["atlas.read"] });

  const overview = await dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "get_workspace_overview",
    input: {}
  });
  assert.equal(overview.result.object_types[0].object_count, 2);

  const search = await dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "search_records",
    input: { query: "schema" }
  });
  assert.equal(search.result.match_count, 1);
  assert.equal(search.result.matches[0].id, "object_task_a");

  const next = await dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "get_next_action",
    input: { task_object_type_id: TASK_TYPE, blocks_link_type_id: BLOCKS_LINK }
  });
  assert.equal(next.result.task.id, "object_task_a");
});

test("read-only delegation cannot run actions (scope enforced + audited)", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskA } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { scopes: ["atlas.read"] });

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "run_action",
        input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "scope_not_granted");
      return true;
    }
  );

  const denied = store.listAuditEvents(workspace.id, { event_type: "agent.tool_call" }).filter(
    (event) => event.decision === "deny"
  );
  assert.equal(denied.length, 1);
  assert.equal(store.verifyAuditChain().valid, true);
});

test("tool allowlist is enforced", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { allowed_tools: ["query_object"] });

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "search_records",
        input: { query: "schema" }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "tool_not_allowed");
      return true;
    }
  );
});

test("expired delegation is rejected", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const delegation = delegate(store, workspace.id, { expires_at: "2026-06-13T00:00:00.000Z" });

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "query_object",
        input: { object_id: "object_task_a" }
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, "delegation_expired");
      return true;
    }
  );
});

test("invalid delegation token is rejected", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: "delegation_nope",
        toolName: "query_object",
        input: { object_id: "object_task_a" }
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, "invalid_delegation");
      return true;
    }
  );

  assert.equal(workspace.id, "workspace_demo");
});

test("governed run_action: editor allowed, viewer denied, with full audit chain", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskA } = seedWorkspace(store, { governed: true });

  const editor = delegate(store, workspace.id, { role: "editor", display_name: "Editor Agent" });
  const viewer = delegate(store, workspace.id, { role: "viewer", display_name: "Viewer Agent" });

  const available = await dispatchAgentTool(store, {
    delegationId: viewer.id,
    toolName: "get_available_actions",
    input: {}
  });
  assert.equal(available.result[0].allowed_for_role, false);

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: viewer.id,
        toolName: "run_action",
        input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "policy_denied");
      return true;
    }
  );
  assert.equal(store.getObjectInstance(workspace.id, taskA.id).properties_json.status, "todo");

  const run = await dispatchAgentTool(store, {
    delegationId: editor.id,
    toolName: "run_action",
    input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
  });
  assert.equal(run.result.status, "completed");
  assert.equal(store.getObjectInstance(workspace.id, taskA.id).properties_json.status, "done");

  const verification = await dispatchAgentTool(store, {
    delegationId: editor.id,
    toolName: "verify_audit_chain",
    input: {}
  });
  assert.equal(verification.result.valid, true);
});

test("GoalContract drives next action and blocks tools outside the contract", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace, taskA } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Prepare a review-ready PR without merge authority",
    allowed_actions: ["get_next_action", "github.open_pr", "generate_review_packet"],
    blocked_actions: ["run_action", "github.merge_pr"],
    risk_class: "medium",
    done_definition: "A PR exists with a review packet and no merge path",
    next_action_json: {
      task_object_type_id: TASK_TYPE,
      blocks_link_type_id: BLOCKS_LINK
    }
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["atlas.read", "atlas.act", "github.pr:create"],
    goal_contract_id: goalContract.id
  });

  const next = await dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "get_next_action",
    input: {}
  });
  assert.equal(next.result.task.id, taskA.id);
  assert.equal(next.goal_contract_id, goalContract.id);

  await assert.rejects(
    async () =>
      dispatchAgentTool(store, {
        delegationId: delegation.id,
        toolName: "run_action",
        input: { action_type_id: ACTION_TYPE, target_object_id: taskA.id }
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "goal_contract_action_blocked");
      return true;
    }
  );
});

test("github.open_pr records a pull request artifact, rejects branch escape, and audits the call", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Open a scoped PR",
    allowed_actions: ["github.open_pr"],
    blocked_actions: ["github.merge_pr"],
    done_definition: "Pull request is open for human review"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["atlas.read", "github.pr:create"],
    goal_contract_id: goalContract.id
  });
  const calls = [];
  const githubClient = {
    async openPullRequest(input) {
      calls.push(input);
      return {
        provider: "github",
        external_id: "42",
        url: `https://github.com/${input.repository}/pull/42`,
        state: "open"
      };
    }
  };

  const opened = await dispatchAgentTool(
    store,
    {
      delegationId: delegation.id,
      toolName: "github.open_pr",
      input: {
        repository: "benpham3206/Atlas",
        title: "Document N1",
        body: "Review packet follows.",
        head_branch: "codex/n1-open-pr",
        base_branch: "main"
      }
    },
    { githubClient, githubPolicy: githubPolicy() }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].head_branch, "codex/n1-open-pr");
  assert.equal(opened.result.external_url, "https://github.com/benpham3206/Atlas/pull/42");
  assert.equal(opened.result.merge_capability, "absent");
  assert.equal(store.listPullRequestArtifacts(workspace.id).length, 1);

  const openedEvents = store.listAuditEvents(workspace.id, { event_type: "github.pull_request.opened" });
  assert.equal(openedEvents.length, 1);
  assert.equal(openedEvents[0].decision, "allow");
  assert.equal(store.verifyAuditChain().valid, true);

  await assert.rejects(
    async () =>
      dispatchAgentTool(
        store,
        {
          delegationId: delegation.id,
          toolName: "github.open_pr",
          input: {
            repository: "benpham3206/Atlas",
            title: "Branch escape",
            body: "This should not pass.",
            head_branch: "main",
            base_branch: "main"
          }
        },
        { githubClient, githubPolicy: githubPolicy() }
      ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.code, "branch_namespace_denied");
      return true;
    }
  );
});

test("generate_review_packet bundles audit refs, critic findings, and the human-only merge boundary", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Prepare review-ready packet",
    allowed_actions: ["github.open_pr", "generate_review_packet"],
    blocked_actions: ["github.merge_pr"],
    done_definition: "Review packet lists evidence and pending human merge"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["atlas.read", "atlas.act", "github.pr:create"],
    goal_contract_id: goalContract.id
  });
  const githubClient = {
    async openPullRequest(input) {
      return {
        provider: "github",
        external_id: "43",
        url: `https://github.com/${input.repository}/pull/43`,
        state: "open"
      };
    }
  };

  const opened = await dispatchAgentTool(
    store,
    {
      delegationId: delegation.id,
      toolName: "github.open_pr",
      input: {
        repository: "benpham3206/Atlas",
        title: "Review-ready PR",
        body: "Packet follows.",
        head_branch: "codex/review-packet",
        base_branch: "main"
      }
    },
    { githubClient, githubPolicy: githubPolicy() }
  );
  const packet = await dispatchAgentTool(store, {
    delegationId: delegation.id,
    toolName: "generate_review_packet",
    input: {
      pull_request_artifact_id: opened.result.id,
      summary: "Prepared PR for human review.",
      changed_files: ["TASKS.md"],
      verification_commands: ["npm test"],
      critic_findings: ["No merge tool is exposed."],
      safety_findings: ["GoalContract blocks github.merge_pr."]
    }
  });

  assert.equal(packet.result.goal_contract_id, goalContract.id);
  assert.equal(packet.result.pull_request_artifact_id, opened.result.id);
  assert.deepEqual(packet.result.pending_human_actions, ["protected_branch_merge"]);
  assert.ok(packet.result.audit_event_ids.length >= 2);
  assert.ok(packet.result.critic_findings.includes("No merge tool is exposed."));
  assert.equal(store.listReviewPackets(workspace.id).length, 1);
  assert.equal(store.verifyAuditChain().valid, true);
});

test("github.open_pr requires repository and base branch allowlist", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Open only allowlisted PRs",
    allowed_actions: ["github.open_pr"],
    blocked_actions: ["github.merge_pr"],
    done_definition: "Disallowed GitHub target is denied and audited"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["github.pr:create"],
    goal_contract_id: goalContract.id
  });
  let calls = 0;
  const githubClient = {
    async openPullRequest() {
      calls += 1;
      return { provider: "github", external_id: "44", url: "https://github.com/other/repo/pull/44", state: "open" };
    }
  };

  await assert.rejects(
    async () =>
      dispatchAgentTool(
        store,
        {
          delegationId: delegation.id,
          toolName: "github.open_pr",
          input: {
            repository: "other/repo",
            title: "Blocked target",
            body: "Should not call GitHub.",
            head_branch: "codex/blocked",
            base_branch: "develop"
          }
        },
        { githubClient, githubPolicy: githubPolicy() }
      ),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "github_repository_not_allowed");
      return true;
    }
  );

  assert.equal(calls, 0);
  const attempts = store.listAuditEvents(workspace.id, { event_type: "github.pull_request.open_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "deny");
  assert.equal(attempts[0].metadata.reason, "repository_not_allowed");
  assert.equal(store.verifyAuditChain().valid, true);
});

test("github.open_pr dry-run records artifact and audit without calling GitHub", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Dry-run PR path",
    allowed_actions: ["github.open_pr"],
    blocked_actions: ["github.merge_pr"],
    done_definition: "Dry-run PR artifact exists"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["github.pr:create"],
    goal_contract_id: goalContract.id
  });
  let calls = 0;
  const githubClient = {
    async openPullRequest() {
      calls += 1;
      throw new Error("dry-run should not call client");
    }
  };

  const result = await dispatchAgentTool(
    store,
    {
      delegationId: delegation.id,
      toolName: "github.open_pr",
      input: {
        repository: "benpham3206/Atlas",
        title: "Dry run",
        body: "No live GitHub call.",
        head_branch: "codex/dry-run",
        base_branch: "main",
        dry_run: true
      }
    },
    { githubClient, githubPolicy: githubPolicy() }
  );

  assert.equal(calls, 0);
  assert.equal(result.result.state, "dry_run");
  assert.equal(result.result.external_id, "dry_run");
  assert.equal(result.result.external_url, "dry-run://github/benpham3206/Atlas/codex/dry-run-to-main");
  const attempts = store.listAuditEvents(workspace.id, { event_type: "github.pull_request.open_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "allow");
  assert.equal(attempts[0].metadata.dry_run, true);
});

test("github.open_pr audits GitHub client failure", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Audit failed GitHub calls",
    allowed_actions: ["github.open_pr"],
    blocked_actions: ["github.merge_pr"],
    done_definition: "Failure is visible in audit"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["github.pr:create"],
    goal_contract_id: goalContract.id
  });
  const githubClient = {
    async openPullRequest() {
      throw new Error("network down");
    }
  };

  await assert.rejects(
    async () =>
      dispatchAgentTool(
        store,
        {
          delegationId: delegation.id,
          toolName: "github.open_pr",
          input: {
            repository: "benpham3206/Atlas",
            title: "Failure",
            body: "GitHub call fails.",
            head_branch: "codex/failure",
            base_branch: "main"
          }
        },
        { githubClient, githubPolicy: githubPolicy() }
      ),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.equal(error.code, "github_call_failed");
      return true;
    }
  );

  const attempts = store.listAuditEvents(workspace.id, { event_type: "github.pull_request.open_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "deny");
  assert.equal(attempts[0].metadata.reason, "github_call_failed");
  assert.equal(attempts[0].metadata.error_message, "network down");
  assert.equal(store.listPullRequestArtifacts(workspace.id).length, 0);
});

test("slack.get_channel_info reads allowlisted channel metadata and audits success", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Read one Slack channel",
    allowed_actions: ["slack.get_channel_info"],
    blocked_actions: ["chat.postMessage"],
    done_definition: "Channel metadata is read and audited"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["slack.read"],
    goal_contract_id: goalContract.id
  });
  const calls = [];
  const slackClient = {
    async getChannelInfo(input) {
      calls.push(input);
      return {
        provider: "slack",
        channel: { id: input.channel_id, name: "atlas-review", is_channel: true }
      };
    }
  };

  const result = await dispatchAgentTool(
    store,
    {
      delegationId: delegation.id,
      toolName: "slack.get_channel_info",
      input: { channel_id: "C0123456789", include_num_members: true }
    },
    { slackClient, slackPolicy: slackPolicy() }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].include_num_members, true);
  assert.equal(result.result.channel.name, "atlas-review");
  const attempts = store.listAuditEvents(workspace.id, { event_type: "slack.conversation.info_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "allow");
  assert.equal(attempts[0].metadata.reason, "slack_call_succeeded");
});

test("slack.get_channel_info requires channel allowlist before client call", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Reject non-allowlisted Slack channels",
    allowed_actions: ["slack.get_channel_info"],
    done_definition: "Non-allowlisted channel is denied and audited"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["slack.read"],
    goal_contract_id: goalContract.id
  });
  let calls = 0;
  const slackClient = {
    async getChannelInfo() {
      calls += 1;
      return { provider: "slack", channel: { id: "C9999999999" } };
    }
  };

  await assert.rejects(
    async () =>
      dispatchAgentTool(
        store,
        {
          delegationId: delegation.id,
          toolName: "slack.get_channel_info",
          input: { channel_id: "C9999999999" }
        },
        { slackClient, slackPolicy: slackPolicy() }
      ),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.code, "slack_channel_not_allowed");
      return true;
    }
  );

  assert.equal(calls, 0);
  const attempts = store.listAuditEvents(workspace.id, { event_type: "slack.conversation.info_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "deny");
  assert.equal(attempts[0].metadata.reason, "channel_not_allowed");
});

test("slack.get_channel_info audits client failure", async () => {
  const store = createOntologyStore({ now: () => "2026-06-14T00:00:00.000Z" });
  const { workspace } = seedWorkspace(store);
  const goalContract = store.createGoalContract(workspace.id, {
    objective: "Audit Slack read failures",
    allowed_actions: ["slack.get_channel_info"],
    done_definition: "Failure is visible in audit"
  });
  const delegation = delegate(store, workspace.id, {
    scopes: ["slack.read"],
    goal_contract_id: goalContract.id
  });
  const slackClient = {
    async getChannelInfo() {
      throw new Error("slack unavailable");
    }
  };

  await assert.rejects(
    async () =>
      dispatchAgentTool(
        store,
        {
          delegationId: delegation.id,
          toolName: "slack.get_channel_info",
          input: { channel_id: "C0123456789" }
        },
        { slackClient, slackPolicy: slackPolicy() }
      ),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.equal(error.code, "slack_call_failed");
      return true;
    }
  );

  const attempts = store.listAuditEvents(workspace.id, { event_type: "slack.conversation.info_attempted" });
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].decision, "deny");
  assert.equal(attempts[0].metadata.reason, "slack_call_failed");
  assert.equal(attempts[0].metadata.error_message, "slack unavailable");
});
