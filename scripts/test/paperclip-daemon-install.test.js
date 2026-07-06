import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const atlasRoot = join(import.meta.dirname, "..", "..");

test("package.json exposes paperclip daemon npm scripts", () => {
  const pkg = JSON.parse(readFileSync(join(atlasRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["paperclip:daemon:install"], "bash scripts/install-paperclip-launchagent.sh");
  assert.equal(pkg.scripts["paperclip:daemon:handoff"], "bash scripts/handoff-paperclip-to-daemon.sh");
});

test("paperclip launchd assets exist and shell scripts parse", () => {
  const paths = [
    "scripts/install-paperclip-launchagent.sh",
    "scripts/handoff-paperclip-to-daemon.sh",
    "scripts/launchd/com.benpham.paperclip.plist",
  ];
  for (const rel of paths) {
    assert.ok(existsSync(join(atlasRoot, rel)), rel);
  }
  for (const sh of ["scripts/install-paperclip-launchagent.sh", "scripts/handoff-paperclip-to-daemon.sh"]) {
    execFileSync("bash", ["-n", join(atlasRoot, sh)], { stdio: "pipe" });
  }
  const plist = readFileSync(join(atlasRoot, "scripts/launchd/com.benpham.paperclip.plist"), "utf8");
  assert.match(plist, /com\.benpham\.paperclip/);
  assert.match(plist, /__HERMES_PAPERCLIP_WRAPPER__/);
});