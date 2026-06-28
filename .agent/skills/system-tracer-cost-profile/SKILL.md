---
name: system-tracer-cost-profile
description: Produce end-to-end technical tracers and cost/latency profiles for complex AI operations loops, especially Atlas/MoO workflows, ingestion-to-action dataflows, AAA vertical slice examples, repository patch loops, Tool Router execution, audit anchoring, and coordination-tax analysis. Use when the user asks to simulate a scenario step by step or profile token, financial, tool, sandbox, and human-attention costs.
---

# System Tracer Cost Profile

Use this skill to simulate a full enterprise AI loop across data, control, trust, execution, and audit planes.

## Tracer Shape

Represent the lifecycle as a step matrix. Each step must include:

- Step number and phase.
- Service boundary owner.
- Triggering message or API operation.
- Structural record created or mutated.
- Table, object, or queue affected.
- Permissions, scopes, RLS predicates, and policies evaluated.
- Model boundary, if any.
- Estimated input tokens, output tokens, cached tokens, and tool tokens.
- Estimated LLM latency and physical tool latency.
- Failure mode and containment rule.

## Standard Phases

For Atlas/MoO repository automation tracers, use these phases unless the user changes the scenario:

1. Ingestion and ontology delta.
2. Strategy selection and goal contracting.
3. Execution, critique, sandbox verification, and fatigue gate.
4. Closure, PR decision, audit anchoring, and notification.
5. Total system cost and orchestration tax profile.

## Cost Model Requirements

When profiling cost:

- State model assumptions explicitly.
- Separate meta-orchestrator, specialist orchestrator, agent, verifier, and summarizer token budgets.
- Separate uncached input, cache write, cache read, and output tokens when model pricing supports it.
- Include non-LLM costs qualitatively when exact prices are infrastructure-dependent.
- Distinguish coordination tax from productive task execution.
- Show how fast paths avoid debate, critique, or redundant verification when risk is low.

## Coordination Lock Controls

Every tracer must show how the system prevents coordination lock:

- Deterministic risk classification before multi-agent routing.
- Bounded debate and critique loops.
- Single owner for final `NextActionDecision`.
- Budget ceilings on tokens, wall-clock time, tool calls, and retry count.
- Explicit fallback to human review only at irreversible or high-exposure boundaries.
- Audit-first failure closure instead of indefinite retry.

## Output Discipline

Keep the tracer concrete. Do not describe generic system behavior when a specific record mutation, tool call, or policy decision can be named.
