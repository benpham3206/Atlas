---
name: moo-goal-contract-routing
description: "Create GoalContracts and select MoO execution strategy for Atlas/MoO tasks, including risk class, fast-path eligibility, orchestrator mix, allowed and blocked actions, token/tool budgets, approval gates, and fallback rules. Use when turning a user intent, Atlas Task, bug report, or PRD into a concrete orchestration plan."
---

# MoO Goal Contract Routing

Use this skill to decide how a task should be executed before tools or agents start acting.

## GoalContract Fields

Define the contract in structured prose or JSON-like records:

- `objective`: concrete outcome, not a broad aspiration.
- `source_task_refs`: Atlas task/object ids or file references.
- `constraints`: user constraints, repo rules, safety boundaries, deadlines.
- `allowed_actions`: explicit operations the run may perform.
- `blocked_actions`: operations that require approval or are prohibited.
- `risk_class`: `low`, `medium`, `high`, or `unacceptable`.
- `reversibility`: `reversible`, `conditionally_reversible`, or `irreversible`.
- `budgets`: token, wall-clock, tool-call, retry, and cost ceilings.
- `required_evidence`: tests, screenshots, logs, citations, review packet, or audit trace.
- `approval_policy`: none, confirmation, explicit approval, or stop.
- `done_definition`: observable completion criteria.

## Fast-Path Eligibility

Allow autonomous low-risk execution only when all are true:

- The action is local to the workspace.
- The action is reversible by a normal patch or file edit.
- No secrets, credentials, customer data, production systems, protected branches, or external payments are touched.
- The scope is narrow and files are allow-listed by the task.
- The verification command is known and cheap enough to run.
- The expected blast radius is limited to docs, tests, fixtures, or isolated implementation files.
- No policy, blocker, or human instruction requires approval.

If any criterion is uncertain, route to at least a planner plus verifier.

## Strategy Modes

- `direct_fast_path`: one agent executes and verifies. Use for low-risk local work.
- `planner_tool_verifier`: planner decomposes, tool agent executes, verifier checks. Use for medium-risk implementation.
- `coding_critic_verifier`: coding orchestrator patches, critic challenges, verifier runs tests. Use for behavior-changing code.
- `research_evidence_planner`: researcher gathers facts, evidence orchestrator validates, planner proposes. Use when facts are unstable or external.
- `human_gate`: pause for approval. Use for irreversible actions or high-exposure boundaries.
- `stop_refuse`: decline or stop when policy prohibits action.

## Orchestrator Selection Matrix

Route by dominant need:

- unclear scope -> Planner Orchestrator
- external facts -> Research Orchestrator
- citations/evidence -> Evidence Orchestrator
- file/tool execution -> Tool Orchestrator
- code patch -> Coding Orchestrator
- adversarial review -> Critic Orchestrator
- tests/security/safety -> Safety-Verification Orchestrator
- cost pressure -> Cost/Latency Orchestrator
- persistent context -> Memory Orchestrator

## Conflict Resolution

Atlas policy and workflow state outrank MoO proposals.

If a `NextActionCandidate` conflicts with a blocked Atlas state:

1. Mark candidate `blocked_by_policy`.
2. Record the policy/workflow edge that denied it.
3. Ask the Strategy Selection Engine for an alternate allowed action.
4. Escalate to human approval only if the policy allows override.
5. Never let an agent generate its own approval or expand its own delegated scope.
