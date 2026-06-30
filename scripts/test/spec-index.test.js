import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const SPEC = readFileSync(join(ROOT, "docs/SPEC.md"), "utf8");

test("spec index lists atlas-ontology graft target", () => {
  assert.match(SPEC, /packages\/atlas-ontology/);
});

test("spec index lists audit verify graft", () => {
  assert.match(SPEC, /audit-chain|audit\/verify/i);
});

test("spec index lists validate:records", () => {
  assert.match(SPEC, /validate:records/);
});

test("spec index preserves migration reference apps/api", () => {
  assert.match(SPEC, /apps\/api/);
});
