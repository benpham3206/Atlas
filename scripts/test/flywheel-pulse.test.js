import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseNextActionMarkdown } from "../momentum-pulse.js";

describe("parseNextActionMarkdown", () => {
  it("detects Public Atlas sprint and PA task", () => {
    const md = `## Next Action (Public Atlas — Paperclip pivot)

**Do:** **PA-P1b** — import Paperclip MIT repo.
**Because:** tag in place.
`;
    const p = parseNextActionMarkdown(md);
    assert.equal(p.publicSprint, true);
    assert.equal(p.paTask, "PA-P1b");
    assert.match(p.docDo, /PA-P1b/);
  });

  it("handles missing Do", () => {
    const p = parseNextActionMarkdown("# empty\n");
    assert.equal(p.docDo, null);
    assert.equal(p.publicSprint, false);
  });
});