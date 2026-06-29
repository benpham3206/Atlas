# Long-Running Work Model

Atlas should perform well on METR-style time-horizon tasks: work that takes long enough that context
loss, agent drift, hidden blockers, and weak proof loops become the main failure mode.

The core product insight is structural: Atlas is not a chatbot. It is a workspace brain, memory and
skills layer, runtime command plane, scoped worker pool, and proof loop. The structure is what keeps
long-running work honest.

## Inputs From Reference Systems

### Matrix-Style Agent Company OS

Useful concepts from the Matrix operating blueprint and screenshot:

- Company or workspace context enters a brain: assets, operating rules, experience, and taste.
- Memory plus skills are read before action.
- A runtime command plane coordinates permissions, routing, proof, and state.
- Department or domain agents are long-running and own taste, memory, task history, and session
  continuity.
- Worker agents are chosen for execution seats, not treated as the product.
- Proof loops turn artifacts and traces into memory.
- Isolated workspace pods keep context, tools, approvals, and proof scoped.

Atlas mapping:

| Matrix Concept | Atlas Equivalent |
| --- | --- |
| Workspace brain | Workspace, objects, links, policies, audit, review packets |
| Memory and skills | `.agent/skills`, GoalContracts, accepted records, outputs |
| Runtime command plane | API + Tool Router + MCP transport |
| Department agents | Orchestrator roles and future MetaOrchestrationRun ownership |
| Worker pool | Codex, browser/computer use, external tools, future worker sessions |
| Proof loop | Artifact + EvidenceRecord + ReviewPacket + AuditEvent |
| Isolated pods | Workspace-scoped API state, scoped delegation, absent cross-workspace authority |

### Enterprise Pipeline Reference

Useful concepts from `/Users/benjaminpham/Downloads/_organized/code/enterprise pipeline`:

- `STATE.md` for current and recent task state.
- `NEXT_ACTION.md` for instant restart.
- `INDEX.md` for document routing.
- Agent states such as reasoning, coding, testing, executing, recovering, and resting.
- Success criteria and blockers captured before and during execution.
- Completion logs and error logs as durable memory.

Atlas adaptation:

- Keep the lightweight durable files in `outputs/`.
- Keep implementation truth in API records, tests, and audit logs.
- Do not import a heavy process gate that blocks small reversible local work.

## Long-Horizon Contract

Every long-running Atlas task should maintain this chain:

```text
User intent
-> GoalContract
-> State snapshot
-> Next action
-> Execution step
-> Artifact
-> Evidence
-> Review packet
-> Audit event
-> Memory or skill update
```

If the chain breaks, the task is not done. It may be useful progress, but it is not reliable
long-horizon work.

## State Model

Long-running work needs explicit states:

| State | Meaning | Required Output |
| --- | --- | --- |
| intake | Goal and constraints are being captured | GoalContract or task draft |
| planning | Work is being decomposed | Task graph with dependencies |
| executing | A scoped actor is changing files or state | ToolCall or command evidence |
| verifying | Output is being checked | Test/audit/review evidence |
| blocked | Progress needs a missing decision or dependency | Blocker record and next question |
| review_ready | Human or critic can inspect one packet | ReviewPacket |
| complete | Criteria are met and proof is captured | Accepted/operational output |
| recovering | Work resumes after interruption | `outputs/internal/STATE.md` plus latest proof |

## METR Time-Horizon Readiness

Atlas is more likely to scale to long tasks when each task has:

- Durable state outside the chat window.
- A single next action after interruption.
- Dependencies represented as links, not prose.
- Explicit blockers and stop conditions.
- Proof before memory update.
- Scoped tools and absent irreversible capabilities.
- Review packets that summarize changed artifacts, tests, findings, and pending human-only actions.

## Product Hardening Implications

The next product step should be runtime trace records, not more prose:

```text
GoalContract
-> MetaOrchestrationRun
-> OrchestratorRun
-> AgentSession
-> ToolCall
-> ToolCallResult
-> AuditEvent
```

`outputs/` is the manual surface for this contract. The product should eventually generate and
update equivalent state from Atlas records.

## Approval Boundaries

Human approval is required before adding:

- MCP tools that mint delegations, write policies, change memberships, merge, deploy, delete,
  access secrets, or public-export records.
- A new persistent runtime beyond the current file-backed snapshot.
- A new product aesthetic or web redesign direction.
