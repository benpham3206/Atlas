import test from "node:test";
import assert from "node:assert/strict";
import { verifyMigrations } from "../../scripts/verify-migrations.js";

test("migration files pass static verification", () => {
  const result = verifyMigrations();

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.files, [
    "0001_ontology_nouns.sql",
    "0002_links.sql",
    "0003_object_sets.sql"
  ]);
});
