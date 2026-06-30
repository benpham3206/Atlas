# Atlas App Output

This folder is for the customer-facing Atlas application output.

## Current Runnable App

The current app is the local Atlas dashboard in `apps/web`.

Run:

```sh
npm run dev:api
npm run dev:web
```

Open:

```text
http://127.0.0.1:3000
```

## Current Surface

The dashboard currently exposes:

- Personal Atlas bootstrap and next action.
- Workspace selector.
- Object type and object instance inventory.
- Object detail with one-hop links.
- Graph explorer.
- Governed action runner.
- Review inbox with review packets and PR artifacts.
- Audit timeline.

## App Output Contract

An app output should include:

- App source path.
- Run command.
- Demo workspace or seed data.
- Primary user workflow.
- Verification commands.
- Screenshot or inspection note.
- Known residual risk.

## Next Customer-Facing App Slice

The next useful app slice is a long-running-work cockpit:

```text
GoalContract
-> current state
-> next action
-> active blockers
-> tool/audit trace
-> review packet
```

