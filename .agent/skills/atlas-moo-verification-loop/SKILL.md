---
name: atlas-moo-verification-loop
description: "Verify Atlas/MoO outputs with tests, critic review, evidence checks, acceptance criteria, and regression analysis. Use after a code patch, architecture artifact, ontology delta, GoalContract, ToolCall sequence, or NextActionDecision needs proof before closure or human review."
---

# Atlas MoO Verification Loop

Use this skill to convert "looks right" into evidence-backed completion.

## Verification Inputs

Collect:

- GoalContract or user objective.
- Acceptance criteria and non-goals.
- Changed files or generated artifacts.
- Tool results and command output.
- Atlas records affected by the run.
- Known risks, blockers, and critic objections.

## Evidence Levels

Use the strongest practical evidence:

- `direct`: relevant automated test, validator, compiler, schema check, rendered artifact, or live endpoint result.
- `structural`: file inspection proves schema, routing, or documentation shape.
- `behavioral`: manual or automated scenario proves user-visible behavior.
- `review`: critic or human review finds no blocking issue.
- `weak`: reasoning-only or indirect evidence; do not use alone for high-risk claims.

## Critic Pass

Run a critic pass for medium or high risk work:

1. Identify the most likely failure mode.
2. Challenge boundary assumptions.
3. Check whether acceptance criteria can be satisfied without the intended behavior.
4. Look for authority drift, data leakage, stale docs, missing tests, and overbroad claims.
5. Convert valid objections into fix tasks or residual risks.

## Test Selection

- For code: run focused tests covering the changed behavior, then broader suite if blast radius justifies it.
- For schemas: run validators and fixture tests.
- For docs or PRDs: inspect required sections and generated PDF/rendered artifact when applicable.
- For security or policy: verify both allowed and denied cases.
- For dogfood traces: check every step has owner, record mutation, policy/scope, and evidence.

## Closure Decision

Return one of:

- `verified`: direct or sufficient evidence satisfies acceptance criteria.
- `verified_with_residual_risk`: evidence is adequate but known risk remains.
- `blocked`: required evidence cannot be produced yet.
- `failed`: verification contradicted the claimed result.

Never mark completion based only on the absence of obvious errors.
