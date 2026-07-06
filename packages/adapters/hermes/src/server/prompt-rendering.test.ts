import { expect, test } from "vitest";

import { buildPrompt } from "./execute.js";

function expectSectionOrder(prompt: string, sections: string[]) {
  let previousIndex = -1;
  for (const section of sections) {
    const nextIndex = prompt.indexOf(section);
    expect(nextIndex, `missing prompt section: ${section}`).toBeGreaterThanOrEqual(0);
    expect(nextIndex, `prompt section out of order: ${section}`).toBeGreaterThan(previousIndex);
    previousIndex = nextIndex;
  }
}

function baseContext(overrides: Record<string, unknown> = {}) {
  return {
    agent: {
      id: "agent-1",
      name: "Hermes Engineer",
      companyId: "company-1",
    },
    runId: "run-1",
    config: {},
    context: {
      issueId: "issue-1",
      paperclipWake: {
        reason: "issue_assigned",
        issue: {
          id: "issue-1",
          identifier: "PAP-3404",
          title: "Plan the Hermes prompt update",
          status: "in_progress",
          priority: "medium",
          workMode: "planning",
        },
        checkedOutByHarness: true,
        commentWindow: { requestedCount: 0, includedCount: 0, missingCount: 0 },
        comments: [],
        fallbackFetchNeeded: false,
      },
      paperclipTaskMarkdown: [
        "Paperclip task context:",
        '- Issue: "PAP-3404"',
        '- Title: "Plan the Hermes prompt update"',
        "",
        "Planning mode directive:",
        "Make the plan only. Do not write code or perform implementation work.",
        "",
        "Issue description:",
        "```text",
        "Use the wake payload as runtime authority.",
        "```",
      ].join("\n"),
      ...overrides,
    },
  } as any;
}

test("renders standard assignment wake with task authority and no backlog discovery guidance", () => {
  const prompt = buildPrompt(baseContext({
    paperclipWake: {
      reason: "issue_assigned",
      issue: {
        id: "issue-1",
        identifier: "PAP-11750",
        title: "Add Hermes prompt rendering regression tests",
        status: "in_progress",
        priority: "medium",
        workMode: "standard",
      },
      checkedOutByHarness: true,
      commentWindow: { requestedCount: 0, includedCount: 0, missingCount: 0 },
      comments: [],
      fallbackFetchNeeded: false,
    },
    paperclipTaskMarkdown: [
      "Paperclip task context:",
      '- Issue: "PAP-11750"',
      '- Title: "Add Hermes prompt rendering regression tests"',
      "",
      "Issue description:",
      "```text",
      "Add focused unit tests for assignment wake and custom prompt rendering.",
      "```",
    ].join("\n"),
  }), {});

  expect(prompt).toContain("## Paperclip Wake Payload");
  expect(prompt).toContain("- reason: issue_assigned");
  expect(prompt).toContain("- issue: PAP-11750 Add Hermes prompt rendering regression tests");
  expect(prompt).toContain("- issue work mode: standard");
  expect(prompt).toContain("Paperclip task context:");
  expect(prompt).toContain("Add focused unit tests for assignment wake and custom prompt rendering.");
  expect(prompt).toContain("The harness already checked out this issue for the current run.");
  expect(prompt).toContain("clear final disposition");
  expect(prompt).not.toContain("check for unassigned issues");
  expect(prompt).not.toContain("status=backlog");
});

test("renders scoped planning wake authority before the Hermes default workflow", () => {
  const prompt = buildPrompt(baseContext(), {
    paperclipApiUrl: "http://127.0.0.1:3101/api",
  });

  expect(prompt).toContain("## Paperclip Wake Payload");
  expect(prompt).toContain("- issue: PAP-3404 Plan the Hermes prompt update");
  expect(prompt).toContain("- planning directive: Make the plan only. Do not write code or perform implementation work.");
  expect(prompt).toContain("- checkout: already claimed by the harness for this run");
  expect(prompt).toContain("The harness already checked out this issue for the current run.");
  expect(prompt).toContain("Issue description:\n```text\nUse the wake payload as runtime authority.\n```");
  expect(prompt).toContain("clear final disposition");
  expect(prompt).toContain("keep `in_progress` only when a live continuation path exists");
  expect(prompt).not.toContain("check for unassigned issues");
  expect(prompt).not.toContain("status=backlog");
});

test("orders fresh-session prompt sections stable-first for provider prefix caching", () => {
  const prompt = buildPrompt(baseContext({
    paperclipSessionHandoffMarkdown: "Session handoff: latest mutable run note.",
  }), {
    promptTemplate: [
      "STABLE TEMPLATE START",
      "Stable cached instructions stay at the prefix.",
      "STABLE TEMPLATE END",
    ].join("\n"),
  });

  expectSectionOrder(prompt, [
    "STABLE TEMPLATE START",
    "Paperclip runtime note:",
    "Paperclip API access note:",
    "Session handoff: latest mutable run note.",
    "Paperclip task context:",
    "## Paperclip Wake Payload",
  ]);
});

test("renders resume deltas instead of full scoped-wake boilerplate when continuing a session", () => {
  const prompt = buildPrompt(baseContext({
    paperclipWake: {
      reason: "issue_commented",
      issue: {
        id: "issue-1",
        identifier: "PAP-11750",
        title: "Add Hermes prompt rendering regression tests",
        status: "in_progress",
        priority: "medium",
        workMode: "standard",
      },
      latestCommentId: "comment-2",
      commentWindow: { requestedCount: 1, includedCount: 1, missingCount: 0 },
      comments: [{ id: "comment-2", body: "Please add the resume-delta case.", createdAt: "2026-06-23T00:00:00.000Z" }],
      fallbackFetchNeeded: false,
    },
  }), {}, { resumedSession: true });

  expect(prompt).toContain("## Paperclip Resume Delta");
  expect(prompt).toContain("You are resuming an existing Paperclip session.");
  expect(prompt).toContain("Focus on the new wake delta below");
  expect(prompt).toContain("Please add the resume-delta case.");
  expect(prompt).toContain("- fallback fetch needed: no");
  expect(prompt).not.toContain("Before generic repo exploration or boilerplate heartbeat updates");
});

test("uses a slim resumed prompt instead of re-rendering the full prompt template", () => {
  const context = baseContext({
    paperclipSessionHandoffMarkdown: "Session handoff: continue from cached provider prefix.",
    paperclipWake: {
      reason: "issue_commented",
      issue: {
        id: "issue-1",
        identifier: "PAP-11750",
        title: "Add Hermes prompt rendering regression tests",
        status: "in_progress",
        priority: "medium",
        workMode: "standard",
      },
      latestCommentId: "comment-2",
      commentWindow: { requestedCount: 1, includedCount: 1, missingCount: 0 },
      comments: [{ id: "comment-2", body: "Please add the resume-delta case.", createdAt: "2026-06-23T00:00:00.000Z" }],
      fallbackFetchNeeded: false,
    },
  });
  const config = {
    promptTemplate: [
      "FULL TEMPLATE START",
      Array.from({ length: 30 }, (_, i) => `Stable cached instructions line ${i + 1}: keep this only on fresh turns.`).join("\n"),
      "{{paperclipTaskMarkdown}}",
      "FULL TEMPLATE END",
    ].join("\n"),
  };

  const freshPrompt = buildPrompt(context, config);
  const resumedPrompt = buildPrompt(context, config, { resumedSession: true });

  expect(freshPrompt).toContain("FULL TEMPLATE START");
  expect(freshPrompt).toContain("Paperclip task context:");
  expect(resumedPrompt).toContain("## Paperclip Resume Delta");
  expect(resumedPrompt).toContain("Session handoff: continue from cached provider prefix.");
  expect(resumedPrompt).toContain("Paperclip runtime note:");
  expect(resumedPrompt).toContain("Paperclip API access note:");
  expect(resumedPrompt).not.toContain("FULL TEMPLATE START");
  expect(resumedPrompt).not.toContain("Stable cached instructions line");
  expect(resumedPrompt).not.toContain("Paperclip task context:");
  expect(resumedPrompt.length).toBeLessThan(freshPrompt.length / 2);
});

test("caps oversized session handoffs in fresh and resumed prompts", () => {
  const longHandoff = [
    "HANDOFF-START-",
    "A".repeat(7000),
    "-HANDOFF-MIDDLE-",
    "B".repeat(2500),
    "-HANDOFF-END",
  ].join("");
  const omittedChars = longHandoff.length - 6000 - 1500;
  const context = baseContext({
    paperclipSessionHandoffMarkdown: longHandoff,
    paperclipWake: {
      reason: "issue_commented",
      issue: {
        id: "issue-1",
        identifier: "PAP-11750",
        title: "Add Hermes prompt rendering regression tests",
        status: "in_progress",
        priority: "medium",
        workMode: "standard",
      },
      latestCommentId: "comment-2",
      commentWindow: { requestedCount: 1, includedCount: 1, missingCount: 0 },
      comments: [{ id: "comment-2", body: "Resume with a capped handoff.", createdAt: "2026-06-23T00:00:00.000Z" }],
      fallbackFetchNeeded: false,
    },
  });

  for (const prompt of [
    buildPrompt(context, {}),
    buildPrompt(context, {}, { resumedSession: true }),
  ]) {
    expect(prompt).toContain("HANDOFF-START-");
    expect(prompt).toContain("-HANDOFF-END");
    expect(prompt).toContain(`[... ${omittedChars} chars omitted — full handoff available via Paperclip API ...]`);
    expect(prompt).not.toContain("-HANDOFF-MIDDLE-");
  }
});

test("renders comment wake batch guidance without defaulting to a full-thread refetch", () => {
  const prompt = buildPrompt(baseContext({
    wakeCommentId: "comment-1",
    paperclipWake: {
      reason: "issue_commented",
      issue: {
        id: "issue-1",
        identifier: "PAP-3404",
        title: "Plan the Hermes prompt update",
        status: "in_progress",
        priority: "medium",
        workMode: "standard",
      },
      latestCommentId: "comment-1",
      commentWindow: { requestedCount: 1, includedCount: 1, missingCount: 0 },
      comments: [{ id: "comment-1", body: "Please tighten the prompt.", createdAt: "2026-06-23T00:00:00.000Z" }],
      fallbackFetchNeeded: false,
    },
  }), {});

  expect(prompt).toContain("Use this inline wake data first before refetching the issue thread.");
  expect(prompt).toContain("Only fetch the API thread when `fallbackFetchNeeded` is true");
  expect(prompt).toContain("New comments in order:");
  expect(prompt).toContain("Please tighten the prompt.");
  expect(prompt).toContain("- fallback fetch needed: no");
});

test("renders accepted-plan continuation without authorizing implementation on the planning issue", () => {
  const prompt = buildPrompt(baseContext({
    paperclipWake: {
      reason: "issue_commented",
      issue: {
        id: "issue-1",
        identifier: "PAP-3404",
        title: "Plan the Hermes prompt update",
        status: "in_progress",
        priority: "medium",
        workMode: "planning",
      },
      interactionKind: "request_confirmation",
      interactionStatus: "accepted",
      commentWindow: { requestedCount: 0, includedCount: 0, missingCount: 0 },
      comments: [],
      fallbackFetchNeeded: false,
    },
  }), {});

  expect(prompt).toContain("- planning directive: Create child issues from the approved plan only. Do not write code or perform implementation work on the planning issue.");
  expect(prompt).toContain("- accepted-plan continuation: you may create child implementation issues from the approved plan");
  expect(prompt).toContain("must not start implementation work on the planning issue itself");
  expect(prompt).not.toContain("- planning directive: Make the plan only.");
  expect(prompt).not.toContain("Update the plan only");
});

test("keeps authoritative parent and ancestor context from task markdown", () => {
  const prompt = buildPrompt(baseContext({
    paperclipTaskMarkdown: [
      "Paperclip task context:",
      '- Issue: "PAP-3404"',
      "",
      "Authoritative parent / ancestor context:",
      "- Parent: PAP-11724 Optimize prompt traces (in_progress) [medium]",
      "- Ancestor 2: PAP-11721 Fetch raw traces (done) [medium]",
    ].join("\n"),
  }), {});

  expect(prompt).toContain("Authoritative parent / ancestor context:");
  expect(prompt).toContain("- Parent: PAP-11724 Optimize prompt traces (in_progress) [medium]");
  expect(prompt).not.toContain("check the issue body or comments for references");
});

test("renders safe Paperclip API examples from environment variables with multiline update preservation", () => {
  const prompt = buildPrompt(baseContext(), {
    paperclipApiUrl: "http://paperclip.local/api",
  });

  expect(prompt).toContain("Use `$PAPERCLIP_API_URL`, `$PAPERCLIP_API_KEY`, and `$PAPERCLIP_RUN_ID`");
  expect(prompt).toContain("Displayed command logs may redact secrets");
  expect(prompt).toContain('-H "Authorization: Bearer $PAPERCLIP_API_KEY"');
  expect(prompt).toContain('-H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID"');
  expect(prompt).toContain("body=$(cat <<'MD'");
  expect(prompt).toContain("jq -n --arg status done --arg comment \"$body\"");
  expect(prompt).toContain("--data-binary @-");
  expect(prompt).not.toContain("Authorization: Bearer <");
});

test("preserves custom prompt templates while exposing runtime and wake variables", () => {
  const prompt = buildPrompt(baseContext(), {
    paperclipApiUrl: "http://paperclip.local/api",
    promptTemplate: [
      "CUSTOM TEMPLATE",
      "agent={{agent.name}}",
      "api={{paperclipApiUrl}}",
      "keyEnv={{paperclipApiKeyEnv}}",
      "runEnv={{paperclipRunIdEnv}}",
      "wakePrompt={{paperclipWakePrompt}}",
      "task={{paperclipTaskMarkdown}}",
      "wakeJson={{paperclipWakeJson}}",
      "wake={{wakePayloadJson}}",
    ].join("\n"),
  });

  expect(prompt).toContain("CUSTOM TEMPLATE");
  expect(prompt).toContain("agent=Hermes Engineer");
  expect(prompt).toContain("api=http://paperclip.local/api");
  expect(prompt).toContain("keyEnv=PAPERCLIP_API_KEY");
  expect(prompt).toContain("runEnv=PAPERCLIP_RUN_ID");
  expect(prompt).toContain("wakePrompt=## Paperclip Wake Payload");
  expect(prompt).toContain("task=Paperclip task context:");
  expect(prompt).toContain("wakeJson={\"reason\":\"issue_assigned\"");
  expect(prompt).toContain('"reason":"issue_assigned"');
  expect(prompt).toContain("## Paperclip Wake Payload");
  expect(prompt).toContain("Issue description:\n```text\nUse the wake payload as runtime authority.\n```");
  expect(prompt).not.toContain("Paperclip runtime identity:");
});
