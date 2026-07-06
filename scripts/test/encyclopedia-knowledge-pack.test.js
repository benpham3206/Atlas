import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateRecordSet } from "../../packages/atlas-ontology/src/index.js";

const ROOT = join(import.meta.dirname, "..", "..");
const FIXTURE_PATH = join(ROOT, "tests/fixtures/encyclopedia-knowledge-pack.json");

test("encyclopedia knowledge pack fixture validates against atlas-ontology registry", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  const records = fixture.records;

  assert.ok(Array.isArray(records), "fixture.records must be an array");

  const result = validateRecordSet(records);

  assert.equal(
    result.valid,
    true,
    `expected all records valid, got errors:\n${result.errors.join("\n")}`
  );
  assert.deepEqual(result.errors, []);
});

test("encyclopedia knowledge pack includes candidate statements that cannot publish yet", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  const records = fixture.records;

  const candidateUnreviewedStatements = records.filter(
    (record) =>
      record.record_type === "statement" &&
      record.lifecycle === "candidate" &&
      record.review_state === "unreviewed"
  );

  assert.ok(
    candidateUnreviewedStatements.length >= 1,
    "expected at least one candidate+unreviewed statement (not yet publishable)"
  );

  for (const statement of candidateUnreviewedStatements) {
    assert.notEqual(
      statement.lifecycle,
      "operational",
      "candidate statements must not be operational (cannot publish yet)"
    );
    assert.notEqual(
      statement.review_state,
      "approved",
      "unreviewed statements must not be approved (cannot publish yet)"
    );
  }
});
