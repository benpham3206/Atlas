import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";

const ensureRuntimeInstalledMock = vi.hoisted(() => vi.fn(async () => {}));
const ensureCommandMock = vi.hoisted(() => vi.fn(async () => {}));
const prepareRuntimeMock = vi.hoisted(() => vi.fn(async () => ({
  workspaceRemoteDir: null,
  restoreWorkspace: async () => {},
})));
const resolveCommandForLogsMock = vi.hoisted(() => vi.fn(async () => "grok"));
const runProcessMock = vi.hoisted(() => vi.fn());

vi.mock("@paperclipai/adapter-utils/execution-target", () => ({
  adapterExecutionTargetIsRemote: () => false,
  adapterExecutionTargetRemoteCwd: (_target: unknown, cwd: string) => cwd,
  overrideAdapterExecutionTargetRemoteCwd: (target: unknown, _cwd: string) => target,
  adapterExecutionTargetSessionIdentity: () => ({ kind: "local" }),
  adapterExecutionTargetSessionMatches: () => true,
  describeAdapterExecutionTarget: () => "local",
  ensureAdapterExecutionTargetCommandResolvable: ensureCommandMock,
  ensureAdapterExecutionTargetRuntimeCommandInstalled: ensureRuntimeInstalledMock,
  prepareAdapterExecutionTargetRuntime: prepareRuntimeMock,
  readAdapterExecutionTarget: ({ executionTarget }: { executionTarget?: unknown }) => executionTarget ?? { kind: "local" },
  resolveAdapterExecutionTargetCommandForLogs: resolveCommandForLogsMock,
  resolveAdapterExecutionTargetTimeoutSec: (_target: unknown, timeoutSec: number) => timeoutSec,
  runAdapterExecutionTargetProcess: runProcessMock,
}));

import { execute } from "./execute.js";

const tempRoots: string[] = [];

function expectSectionOrder(prompt: string, sections: string[]) {
  let previousIndex = -1;
  for (const section of sections) {
    const nextIndex = prompt.indexOf(section);
    expect(nextIndex, `missing prompt section: ${section}`).toBeGreaterThanOrEqual(0);
    expect(nextIndex, `prompt section out of order: ${section}`).toBeGreaterThan(previousIndex);
    previousIndex = nextIndex;
  }
}

async function makeTempRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-grok-local-"));
  tempRoots.push(root);
  return root;
}

async function pathExists(candidate: string): Promise<boolean> {
  return fs.access(candidate).then(() => true).catch(() => false);
}

describe("grok_local execute", () => {
  beforeEach(() => {
    ensureRuntimeInstalledMock.mockClear();
    ensureCommandMock.mockClear();
    prepareRuntimeMock.mockClear();
    resolveCommandForLogsMock.mockClear();
    runProcessMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  });

  it("stages Grok-native instructions and skills into the workspace for the run and cleans them up afterward", async () => {
    const root = await makeTempRoot();
    const instructionsPath = path.join(root, "managed", "AGENTS.md");
    const skillSource = path.join(root, "runtime-skills", "paperclip");
    await fs.mkdir(path.dirname(instructionsPath), { recursive: true });
    await fs.writeFile(instructionsPath, "You are Grok.\n", "utf8");
    await fs.mkdir(skillSource, { recursive: true });
    await fs.writeFile(path.join(skillSource, "SKILL.md"), "---\nname: paperclip\ndescription: test\n---\n", "utf8");

    runProcessMock.mockImplementation(async (_runId, _target, _command, args, options) => {
      expect(args).toEqual(
        expect.arrayContaining([
          "--output-format",
          "streaming-json",
          "--always-approve",
          "--permission-mode",
          "dontAsk",
        ]),
      );
      expect(await fs.readFile(path.join(root, "Agents.md"), "utf8")).toContain("You are Grok.");
      expect(await pathExists(path.join(root, ".claude", "skills", "paperclip", "SKILL.md"))).toBe(true);
      await options.onLog?.("stdout", '{"type":"text","data":"done"}\n');
      return {
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: [
          JSON.stringify({ type: "text", data: "done" }),
          JSON.stringify({ type: "end", stopReason: "EndTurn", sessionId: "sess-1", requestId: "req-1" }),
        ].join("\n"),
        stderr: "",
      };
    });

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    const ctx: AdapterExecutionContext = {
      runId: "run-1",
      agent: {
        id: "agent-1",
        companyId: "company-1",
        name: "Grok Agent",
        adapterType: "grok_local",
        adapterConfig: {},
      },
      runtime: {
        sessionId: null,
        sessionParams: null,
        sessionDisplayId: null,
        taskKey: null,
      },
      config: {
        cwd: root,
        instructionsFilePath: instructionsPath,
        paperclipRuntimeSkills: [{
          key: "paperclip",
          runtimeName: "paperclip",
          source: skillSource,
          required: false,
        }],
        paperclipSkillSync: { desiredSkills: ["paperclip"] },
      },
      context: {},
      authToken: "run-token",
      onLog: async (stream: "stdout" | "stderr", chunk: string) => {
        logs.push({ stream, chunk });
      },
    };

    const result = await execute(ctx);

    expect(result).toMatchObject({
      exitCode: 0,
      errorMessage: null,
      summary: "done",
      sessionId: "sess-1",
      sessionDisplayId: "sess-1",
    });
    expect(await pathExists(path.join(root, "Agents.md"))).toBe(false);
    expect(await pathExists(path.join(root, ".claude", "skills", "paperclip"))).toBe(false);
    expect(logs.map((entry) => entry.chunk)).not.toEqual([]);
  });

  it("orders fresh-session prompt sections stable-first for provider prefix caching", async () => {
    const root = await makeTempRoot();
    let capturedPrompt = "";

    runProcessMock.mockImplementation(async (_runId, _target, _command, args, options) => {
      const singleIndex = args.indexOf("--single");
      expect(singleIndex).toBeGreaterThanOrEqual(0);
      capturedPrompt = String(args[singleIndex + 1] ?? "");
      await options.onLog?.("stdout", '{"type":"text","data":"done"}\n');
      return {
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: [
          JSON.stringify({ type: "text", data: "done" }),
          JSON.stringify({ type: "end", stopReason: "EndTurn", sessionId: "sess-1", requestId: "req-1" }),
        ].join("\n"),
        stderr: "",
      };
    });

    const ctx: AdapterExecutionContext = {
      runId: "run-fresh-order",
      agent: {
        id: "agent-1",
        companyId: "company-1",
        name: "Grok Agent",
        adapterType: "grok_local",
        adapterConfig: {},
      },
      runtime: {
        sessionId: null,
        sessionParams: null,
        sessionDisplayId: null,
        taskKey: null,
      },
      config: {
        cwd: root,
        promptTemplate: [
          "STABLE TEMPLATE START",
          "Stable cached instructions stay at the prefix.",
          "STABLE TEMPLATE END",
        ].join("\n"),
      },
      context: {
        paperclipSessionHandoffMarkdown: "Session handoff: latest mutable run note.",
        paperclipWake: {
          reason: "issue_assigned",
          issue: {
            id: "issue-1",
            identifier: "PAP-11750",
            title: "Add Grok prompt ordering regression tests",
            status: "in_progress",
            priority: "medium",
            workMode: "standard",
          },
          checkedOutByHarness: true,
          commentWindow: { requestedCount: 0, includedCount: 0, missingCount: 0 },
          comments: [],
          fallbackFetchNeeded: false,
        },
      },
      authToken: "run-token",
      onLog: async () => {},
    };

    await execute(ctx);

    expectSectionOrder(capturedPrompt, [
      "STABLE TEMPLATE START",
      "Paperclip runtime note:",
      "Paperclip API access note:",
      "Session handoff: latest mutable run note.",
      "## Paperclip Wake Payload",
    ]);
  });

  it("cleans up staged assets when setup fails before the Grok process starts", async () => {
    const root = await makeTempRoot();
    const instructionsPath = path.join(root, "managed", "AGENTS.md");
    const skillSource = path.join(root, "runtime-skills", "paperclip");
    await fs.mkdir(path.dirname(instructionsPath), { recursive: true });
    await fs.writeFile(instructionsPath, "You are Grok.\n", "utf8");
    await fs.mkdir(skillSource, { recursive: true });
    await fs.writeFile(path.join(skillSource, "SKILL.md"), "---\nname: paperclip\ndescription: test\n---\n", "utf8");
    ensureCommandMock.mockRejectedValueOnce(new Error("grok not installed"));

    const ctx: AdapterExecutionContext = {
      runId: "run-setup-fail",
      agent: {
        id: "agent-1",
        companyId: "company-1",
        name: "Grok Agent",
        adapterType: "grok_local",
        adapterConfig: {},
      },
      runtime: {
        sessionId: null,
        sessionParams: null,
        sessionDisplayId: null,
        taskKey: null,
      },
      config: {
        cwd: root,
        instructionsFilePath: instructionsPath,
        paperclipRuntimeSkills: [{
          key: "paperclip",
          runtimeName: "paperclip",
          source: skillSource,
          required: false,
        }],
        paperclipSkillSync: { desiredSkills: ["paperclip"] },
      },
      context: {},
      authToken: "run-token",
      onLog: async () => {},
    };

    await expect(execute(ctx)).rejects.toThrow("grok not installed");
    expect(runProcessMock).not.toHaveBeenCalled();
    expect(await pathExists(path.join(root, "Agents.md"))).toBe(false);
    expect(await pathExists(path.join(root, ".claude", "skills", "paperclip"))).toBe(false);
  });

  it("caps oversized session handoffs in fresh and resumed prompts", async () => {
    const root = await makeTempRoot();
    const longHandoff = [
      "HANDOFF-START-",
      "A".repeat(7000),
      "-HANDOFF-MIDDLE-",
      "B".repeat(2500),
      "-HANDOFF-END",
    ].join("");
    const omittedChars = longHandoff.length - 6000 - 1500;
    const prompts: string[] = [];

    runProcessMock.mockImplementation(async (_runId, _target, _command, _args, options) => {
      await options.onLog?.("stdout", '{"type":"text","data":"done"}\n');
      return {
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: [
          JSON.stringify({ type: "text", data: "done" }),
          JSON.stringify({ type: "end", stopReason: "EndTurn", sessionId: "sess-next", requestId: "req-1" }),
        ].join("\n"),
        stderr: "",
      };
    });

    const makeCtx = (sessionId: string | null): AdapterExecutionContext => ({
      runId: sessionId ? "run-resume" : "run-fresh",
      agent: {
        id: "agent-1",
        companyId: "company-1",
        name: "Grok Agent",
        adapterType: "grok_local",
        adapterConfig: {},
      },
      runtime: {
        sessionId,
        sessionParams: null,
        sessionDisplayId: sessionId,
        taskKey: null,
      },
      config: { cwd: root },
      context: {
        paperclipSessionHandoffMarkdown: longHandoff,
        paperclipWake: sessionId
          ? {
            reason: "issue_commented",
            issue: {
              id: "issue-1",
              identifier: "PAP-11750",
              title: "Cap Grok handoff",
              status: "in_progress",
              priority: "medium",
              workMode: "standard",
            },
            latestCommentId: "comment-2",
            commentWindow: { requestedCount: 1, includedCount: 1, missingCount: 0 },
            comments: [{ id: "comment-2", body: "Resume with a capped handoff." }],
            fallbackFetchNeeded: false,
          }
          : undefined,
      },
      authToken: "run-token",
      onLog: async () => {},
      onMeta: async (meta) => {
        if (typeof meta.prompt === "string") prompts.push(meta.prompt);
      },
    });

    await execute(makeCtx(null));
    await execute(makeCtx("sess-existing"));

    expect(prompts).toHaveLength(2);
    for (const prompt of prompts) {
      expect(prompt).toContain("HANDOFF-START-");
      expect(prompt).toContain("-HANDOFF-END");
      expect(prompt).toContain(`[... ${omittedChars} chars omitted — full handoff available via Paperclip API ...]`);
      expect(prompt).not.toContain("-HANDOFF-MIDDLE-");
    }
  });
});
