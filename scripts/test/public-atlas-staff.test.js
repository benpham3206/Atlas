import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const FIXTURE_PATH = join(ROOT, "tests/fixtures/public-atlas-staff.json");

const REQUIRED_FIELDS = [
  "role_key",
  "display_name",
  "moo_profile",
  "paperclip_role",
  "scopes",
  "lifecycle_authority",
];

const EXPECTED_AGENT_ROLE_KEYS = [
  "librarian",
  "researcher",
  "citation",
  "editor",
  "verifier",
  "curator",
];

function loadFixture() {
  const raw = readFileSync(FIXTURE_PATH, "utf8");
  return JSON.parse(raw);
}

test("public-atlas-staff fixture parses as JSON", () => {
  const parsed = loadFixture();
  assert.ok(parsed && typeof parsed === "object");
  assert.ok(Array.isArray(parsed.staff), "fixture must expose a staff array");
});

test("public-atlas-staff fixture has exactly seven staff entries with required fields", () => {
  const { staff } = loadFixture();
  assert.equal(staff.length, 7, "expected seven staff entries per framework §3");

  const roleKeys = new Set();
  for (const entry of staff) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        Object.hasOwn(entry, field),
        `${entry.role_key ?? "unknown"} missing required field ${field}`,
      );
    }
    assert.equal(typeof entry.role_key, "string");
    assert.equal(typeof entry.display_name, "string");
    assert.equal(typeof entry.moo_profile, "string");
    assert.equal(typeof entry.paperclip_role, "string");
    assert.ok(Array.isArray(entry.scopes), `${entry.role_key} scopes must be an array`);
    assert.equal(typeof entry.lifecycle_authority, "string");
    assert.ok(entry.lifecycle_authority.length > 0, `${entry.role_key} lifecycle_authority must be non-empty`);
    roleKeys.add(entry.role_key);
  }

  assert.equal(roleKeys.size, 7, "role_key values must be unique");
  for (const roleKey of [...EXPECTED_AGENT_ROLE_KEYS, "owner"]) {
    assert.ok(roleKeys.has(roleKey), `missing staff role_key ${roleKey}`);
  }
});

test("each agent role has non-empty documented scopes", () => {
  const { staff } = loadFixture();
  const agents = staff.filter((entry) => entry.role_key !== "owner");

  assert.equal(agents.length, 6, "expected six Paperclip agent hires");

  for (const agent of agents) {
    assert.equal(agent.actor_type, "agent", `${agent.role_key} must be an agent hire`);
    assert.ok(agent.scopes.length > 0, `${agent.role_key} must declare at least one scope`);
    for (const scope of agent.scopes) {
      assert.equal(typeof scope, "string");
      assert.ok(scope.length > 0, `${agent.role_key} scope entries must be non-empty strings`);
    }
  }
});

test("owner entry uses board actor_type not agent hire", () => {
  const { staff } = loadFixture();
  const owner = staff.find((entry) => entry.role_key === "owner");
  assert.ok(owner, "owner entry must exist");
  assert.equal(owner.actor_type, "board");
  assert.notEqual(owner.paperclip_role, "agent");
  assert.equal(owner.paperclip_role, "board");
  assert.ok(owner.scopes.length > 0, "owner must declare full authority scopes");
});
