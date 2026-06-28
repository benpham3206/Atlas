# Database Migrations

This directory contains schema artifacts for the future Atlas Postgres runtime.

The current app still uses in-memory storage. These migrations document the intended durable tables
and are validated statically by `npm run verify:migrations`.

Current migrations:

- `0001_ontology_nouns.sql`: workspaces, object types, and object instances.
- `0002_links.sql`: link types and link instances.
- `0003_object_sets.sql`: object sets.
- `0004_actions.sql`: action types and action runs.
- `0005_governance.sql`: local users and workspace memberships.
- `0006_policies.sql`: local policies.
- `0007_permission_checks.sql`: permission check decision records.
- `0008_agents.sql`: agent identities and scoped, expiring delegations.
- `0009_audit_events.sql`: append-only, hash-chained audit log (insert-only by contract).
- `0010_goal_contracts_review_packets.sql`: GoalContracts, PullRequestArtifacts, and ReviewPackets.
