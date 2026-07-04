# Atlas Demo Outputs

This folder is for customer-facing demos and walkthroughs.

## Current Demo Candidates

### 1. PRD To Task Graph

Show Atlas parsing complex Atlas + MoO PRDs into:

- Source records.
- Atomic tasks.
- Dependency links.
- GoalContract.
- Next action.
- Evidence and review packet.

### 2. MCP As Agent Interface

Show the mental model:

```text
Agent host -> Atlas MCP -> Atlas API / Tool Router -> Atlas store + audit
```

### 3. Long-Running Work Cockpit

Show a task that survives interruption:

```text
STATE
-> NEXT_ACTION
-> Tool call
-> Artifact
-> Evidence
-> Review packet
-> Memory update
```

## Demo Output Contract

Each demo should include:

- Scenario.
- Setup command.
- Steps.
- Expected visible result.
- Verification command.
- Screenshot, recording, or review packet.

