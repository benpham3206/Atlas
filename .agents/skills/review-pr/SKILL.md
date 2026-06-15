---
name: review-pr
description: Use when reviewing a PR or branch for correctness, missing tests, security risk, regressions, and incomplete acceptance criteria.
---

# Review PR Skill

Review against:

- `AGENTS.md`
- `docs/AGENT_WORKFLOW.md`
- `tasks/<TASK_ID>.md` when present
- Acceptance criteria
- Test plan
- Diff against the base branch
- `docs/ARCHITECTURE.md`

Flag:

- P0: blocks merge
- P1: should block merge
- P2: follow-up acceptable

Required checks:

1. Does the implementation satisfy the task?
2. Are changed behaviors tested?
3. Are migrations reversible or safe for the current persistence model?
4. Are public APIs compatible?
5. Are errors handled?
6. Are secrets and private data protected?
7. Are docs updated if behavior changed?
8. Did the author verify claims with commands or other evidence?

Output:

- Summary
- Blocking findings
- Non-blocking findings
- Missing tests
- Commands to run

