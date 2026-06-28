---
name: atlas-moo-dogfood-loop
description: "Run real work through the unified Atlas + MoO dogfooding loop: capture ontology deltas, create a GoalContract, select fast-path or blended orchestrators, execute tools under policy discipline, verify results, apply approval gates, and close with trace/audit evidence. Use when the user asks to dogfood Atlas/MoO, run the platform on its own repo, turn an issue into a verified patch, or operate the architecture rather than merely describe it."
---

# Atlas MoO Dogfood Loop

Use this skill as the top-level operating procedure for applying Atlas + MoO to an actual task in the current workspace.

## Required Stance

- Treat the current worktree as authoritative.
- Use `.agent/skills` or `.codex/skills`; do not create or depend on legacy workflow directories unless the repo already uses them and the user asks for them.
- Distinguish target architecture from implemented behavior. If auth, RLS, audit, or persistence are not implemented, model them in the trace but do not claim they are enforced.
- Preserve Atlas authority boundaries: candidate/generated records may be visible, but only accepted or operational records may drive actions.
- Prefer the smallest verified execution loop that proves next-action quality, evidence quality, permission safety, or state accuracy.

## Operating Loop

1. Intake the request and source evidence.
   - Read relevant user files, repo instructions, task trackers, architecture docs, and current code.
   - Identify explicit deliverables, non-goals, safety constraints, and verification commands.

2. Capture the Atlas delta.
   - Use `atlas-ontology-delta-capture` to describe new or changed tasks, artifacts, statements, links, classifications, and lifecycle states.
   - If the repo has implemented record APIs or fixtures, update those; otherwise produce the structural delta in the run artifact.

3. Create the GoalContract.
   - Use `moo-goal-contract-routing` to define objective, constraints, allowed actions, blocked actions, budgets, risk class, approval requirements, and strategy mode.

4. Create or update the transparency blueprint.
   - Use `workspace-transparency-blueprint` before non-trivial tool execution.
   - Keep it concise and current; do not let it become a stale manifesto.

5. Select strategy.
   - Use the low-risk fast path only when the criteria are fully satisfied.
   - Use a blended strategy when the task changes code behavior, touches safety/security/data boundaries, changes architecture, or has ambiguous acceptance criteria.

6. Execute through tool discipline.
   - Use `moo-tool-execution-runbook`.
   - Every file edit, shell command, test, or external call must be traceable to the GoalContract and current permission boundary.

7. Verify and critique.
   - Use `atlas-moo-verification-loop`.
   - Convert objections into concrete fix loops or explicit residual risks.

8. Apply the fatigue gate.
   - Use `approval-fatigue-filter`.
   - Auto-complete reversible local operations when policy allows; ask humans only at irreversible or high-exposure boundaries.

9. Close the run.
   - Use `atlas-run-trace-audit`.
   - Record decisions, changed files, verification evidence, denied or skipped actions, cost/latency estimates when relevant, and next action.

## Completion Criteria

Do not call the loop complete until:

- The requested artifact or code change exists.
- The ontology/control-plane impact is captured at the appropriate fidelity.
- Verification commands were run or explicitly blocked.
- Any human approval need is resolved or clearly pending.
- The final response states what changed, how it was verified, and what remains unsafe or unimplemented.
