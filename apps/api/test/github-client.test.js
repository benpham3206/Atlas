import test from "node:test";
import assert from "node:assert/strict";
import { createGitHubClient } from "../src/github-client.js";

test("openPullRequest sends draft=true by default", async () => {
  const calls = [];
  const client = createGitHubClient({
    token: "test-token",
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return {
        ok: true,
        async json() {
          return { number: 12, html_url: "https://github.com/org/repo/pull/12", state: "open" };
        }
      };
    }
  });

  const result = await client.openPullRequest({
    repository: "org/repo",
    title: "Draft PR",
    body: "Body",
    head_branch: "codex/test",
    base_branch: "main"
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.draft, true);
  assert.equal(result.url, "https://github.com/org/repo/pull/12");
});
