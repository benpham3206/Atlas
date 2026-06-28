---
name: the-algorithm
description: "Apply Elon Musk's five-step 'algorithm' before and during any build or design decision in Atlas/MoO: question every requirement, delete parts and process, simplify/optimize only what survives, accelerate, then automate. Use when scoping a feature, adding a record type/table/endpoint/subsystem, planning slices, reviewing a design, or whenever you catch yourself about to add structure. Bias toward removal and toward safety-by-absence over safety-by-added-machinery."
---

# The Algorithm

Use this skill to decide whether to build something at all, and to keep solutions small. Run it BEFORE writing code and AGAIN when a design starts growing parts.

## The Five Steps (in order)

1. **Question every requirement.** Each requirement must carry the name of the person who made it, not a department. Most requirements are dumber than they look, including ones from smart people. A requirement you cannot trace to a real need is a fake requirement — attack it first.
2. **Delete the part or process.** If you are not adding things back at least 10% of the time, you are not deleting enough. The bias must be removal. A part/table/endpoint/state/subsystem you delete needs no documentation, no tests, no maintenance, and cannot break or be bypassed.
3. **Simplify and optimize.** Only AFTER deleting. Do not optimize a thing that should not exist. The most common error of a smart engineer is to optimize a part that should be removed.
4. **Accelerate cycle time.** Speed up only what survived steps 1-3. Never speed up a process you have not first questioned and trimmed.
5. **Automate.** Last, never first. Automating a wasteful or wrong step locks in the waste.

Comment 1: The most dangerous step is automating before deleting.
Comment 2: Everyone is required to challenge their own requirements.

## How To Apply It Here

- Before adding a record type, table, endpoint, status, role, flag, or subsystem, ask: *whose requirement is this, and what breaks if it does not exist?*
- Prefer **safety-by-absence over safety-by-machinery.** In a capability/scope model, the strongest control is the absence of the capability, not the presence of a checking subsystem. If an agent must never merge, the answer is "no merge scope/tool exists," not "build an approval gate the agent must pass." Absence needs zero docs and cannot be raced or rubber-stamped.
- Distrust solutions whose safety depends on an LLM (orchestrator or worker) behaving correctly. That is a prompt-level (linguistic) guardrail, not a structural one. Push the guarantee into scopes, tokens, the tool router, policy, and the database.
- When two designs solve the same problem, pick the one with **less documentation and more structure** — the one where correctness is inherent rather than explained.
- Track your delete rate. If a work session added only parts and removed nothing, suspect you skipped step 1.

## Red Flags (you are skipping the algorithm)

| Thought | Reality |
| --- | --- |
| "This feels productive." | Volume is not progress. Question the requirement first. |
| "We'll need an X subsystem for this." | Maybe the dangerous action should simply not be a capability. Delete it. |
| "Let me optimize/clean this part." | Should the part exist at all? Step 2 before step 3. |
| "I'll add a flag to handle that case." | Does the case exist yet? Speculative structure is fake requirement. |
| "The rule is in the prompt/instructions." | Linguistic guardrail. Make it structural or it is not a control. |
| "Let me automate this flow." | Automate last. Have you deleted and trimmed it first? |

## Tie-In: MoO architecture

The algorithm and MoO's zero-trust design reinforce each other. MoO's authority model IS safety-by-absence:

- The orchestration runtime proposes actions; it does not mint its own authority.
- Agents act only through short-lived, scoped delegation + the Tool Router; they cannot self-extend scope.
- Irreversible actions (`merge_to_protected_branch`, deploy, delete, secret access) are denied fast-path by being outside the granted capability set, not by a supervisory approval loop.
- Audit append is a platform operation; agents report asynchronously through the hash-chained log, not via per-step supervision (avoid micromanagement).

When designing any MoO/Atlas feature, run the algorithm and load `zero-trust-orchestration` for the boundary rules and `ToolCall` verification order. Prefer designs where the control is a missing scope or tool, evaluated on the write path, over designs that add a record, state machine, or human-in-the-loop step that did not need to exist.
