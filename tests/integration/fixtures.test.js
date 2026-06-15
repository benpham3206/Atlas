import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const FIXTURES = [
  "tests/fixtures/ontology-nouns.json",
  "tests/fixtures/ontology-links.json",
  "tests/fixtures/capability-records.valid.json",
  "tests/fixtures/capability-records.invalid.json"
];

test("fixture files parse as JSON and expose record arrays", async () => {
  for (const fixture of FIXTURES) {
    const parsed = JSON.parse(await readFile(fixture, "utf8"));

    assert.equal(typeof parsed, "object", `${fixture} must parse to an object`);
    assert.ok(Object.values(parsed).every(Array.isArray), `${fixture} values must be arrays`);
  }
});
