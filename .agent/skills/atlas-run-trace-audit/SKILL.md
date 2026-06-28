---
name: atlas-run-trace-audit
description: "Produce Atlas/MoO run traces and audit-style closure records for dogfooding loops, including GoalContract lineage, orchestrator decisions, tool calls, policy checks, file mutations, verification evidence, cost/latency notes, and next action. Use when closing a task, explaining a run, preparing a review packet, or simulating AuditEvent coverage before the audit service exists."
---

# Atlas Run Trace Audit

Use this skill to close a run with durable evidence.

## Trace Scope

Capture the chain:

`UserIntent -> AtlasTask -> GoalContract -> MetaOrchestrationRun -> OrchestratorRun -> AgentSession -> ToolCall -> ToolResult -> VerificationEvidence -> NextActionDecision`

If some entities are not implemented yet, label them `simulated` or `planned`; do not imply runtime enforcement exists.

## Required Trace Fields

For each run, record:

- objective
- workspace and scope
- source evidence
- selected strategy
- allowed and blocked actions
- tool calls and command outcomes
- files changed
- policy or approval decisions
- verification evidence
- unresolved risks
- next action
- token/cost/latency estimate when relevant

## Audit Event Shape

Use this structure for audit-style entries:

- `event_type`
- `actor`
- `workspace_id`
- `resource_refs`
- `action`
- `decision`
- `policy_refs`
- `before_ref`
- `after_ref`
- `evidence_refs`
- `timestamp`
- `previous_hash` if real hash chaining exists
- `event_hash` if real hash chaining exists

For local dogfooding before an audit service exists, omit hashes or mark them `not_implemented`.

## Closure Packet

End each dogfood loop with:

- what changed
- how it was tested
- which Atlas/MoO records or trace entries were affected
- which approvals were needed or bypassed by the fatigue filter
- what remains incomplete
- the recommended next action

Do not bury failed checks. A failed or skipped verification is a first-class trace event.
