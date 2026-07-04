import test from "node:test";
import assert from "node:assert/strict";
import { verifyMigrations } from "../../scripts/verify-migrations.js";

test("migration files pass static verification", () => {
  const result = verifyMigrations();

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.files, [
    "0001_ontology_nouns.sql",
    "0002_links.sql",
    "0003_object_sets.sql",
    "0004_actions.sql",
    "0005_governance.sql",
    "0006_policies.sql",
    "0007_permission_checks.sql",
    "0008_agents.sql",
    "0009_audit_events.sql",
    "0010_goal_contracts_review_packets.sql"
  ]);
});
