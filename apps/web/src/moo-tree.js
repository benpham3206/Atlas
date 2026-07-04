/**
 * MoO platform navigation tree — visual map of the product.
 * `view` links to dashboard detail panes; `status` marks v0 implementation.
 */

import { renderAsciiTreeHtml, treeHref } from "./ascii-tree.js";
import { renderAtlasRepoTreeHtml } from "./atlas-repo-tree.js";

export { treeHref };

export const MOO_PLATFORM_TREE = {
  label: "Mixture of Orchestrators Platform",
  children: [
    {
      label: "User and Goal Layer",
      children: [
        { label: "user requests", status: "stub" },
        { label: "goal contracts", view: "goal-contracts", status: "partial" },
        { label: "constraints", view: "carbon-copy", status: "live" },
        { label: "acceptance criteria", view: "next-action", status: "live" },
        { label: "human authority boundaries", status: "stub" },
        { label: "preference records", view: "carbon-copy", status: "partial" }
      ]
    },
    {
      label: "Meta-Orchestration Layer",
      children: [
        { label: "task classifier", status: "stub" },
        { label: "strategy selector", status: "stub" },
        { label: "orchestrator router", status: "stub" },
        { label: "conflict resolver", status: "stub" },
        { label: "budget manager", status: "stub" },
        { label: "risk manager", status: "stub" },
        { label: "stop condition evaluator", status: "stub" },
        { label: "next-action selector", view: "next-action", status: "live" }
      ]
    },
    {
      label: "Orchestrator Registry",
      children: [
        { label: "orchestrator types", status: "stub" },
        { label: "orchestrator packages", status: "stub" },
        { label: "capability declarations", view: "ontology", status: "partial" },
        { label: "tool requirements", view: "delegation", status: "partial" },
        { label: "policy requirements", status: "stub" },
        { label: "evaluation suites", status: "stub" },
        { label: "version history", status: "stub" },
        { label: "deployment status", status: "stub" }
      ]
    },
    {
      label: "Orchestration Runtime",
      children: [
        { label: "orchestrator runs", status: "stub" },
        { label: "subtask graph", view: "graph", status: "live" },
        { label: "agent sessions", status: "stub" },
        { label: "tool calls", view: "audit", status: "live" },
        { label: "workflow steps", view: "tasks", status: "live" },
        { label: "approval requests", view: "review-inbox", status: "live" },
        { label: "action proposals", view: "actions", status: "live" },
        { label: "dry runs", status: "stub" },
        { label: "state updates", view: "objects", status: "live" }
      ]
    },
    {
      label: "Human-Governed Improvement Platform",
      children: [
        { label: "user feedback", status: "stub" },
        { label: "human overrides", status: "stub" },
        { label: "strategy corrections", status: "stub" },
        { label: "failure reports", status: "stub" },
        { label: "regression cases", status: "stub" },
        { label: "improvement proposals", status: "stub" },
        { label: "improvement decisions", status: "stub" },
        { label: "preference updates", status: "stub" },
        { label: "policy change proposals", status: "stub" },
        { label: "workflow revisions", status: "stub" }
      ]
    },
    {
      label: "Delegation Platform",
      children: [
        { label: "agent identities", status: "stub" },
        { label: "human assignees", status: "stub" },
        { label: "tool registry", view: "delegation", status: "partial" },
        { label: "scoped delegation", view: "goal-contracts", status: "partial" },
        { label: "capability grants", status: "stub" },
        { label: "model routing", status: "stub" },
        { label: "execution sandbox", status: "stub" },
        { label: "retry and fallback", status: "stub" }
      ]
    },
    {
      label: "Verification Platform",
      children: [
        { label: "critic runs", view: "review-inbox", status: "partial" },
        { label: "evidence checks", view: "next-action", status: "live" },
        { label: "test runs", status: "stub" },
        { label: "policy checks", status: "stub" },
        { label: "simulation checks", status: "stub" },
        { label: "artifact assessments", view: "review-inbox", status: "partial" },
        { label: "contradiction maps", status: "stub" },
        { label: "verification reports", view: "audit", status: "partial" }
      ]
    },
    {
      label: "Human Authority Platform",
      children: [
        { label: "approval queues", view: "review-inbox", status: "live" },
        { label: "decision records", status: "stub" },
        { label: "override records", status: "stub" },
        { label: "escalation policies", status: "stub" },
        { label: "quorum rules", status: "stub" },
        { label: "delegated authority", view: "goal-contracts", status: "partial" },
        { label: "break-glass controls", status: "stub" },
        { label: "accountability records", view: "audit", status: "live" }
      ]
    },
    {
      label: "Evaluation and Learning Platform",
      children: [
        { label: "orchestrator metrics", status: "stub" },
        { label: "task outcomes", view: "tasks", status: "live" },
        { label: "human feedback", status: "stub" },
        { label: "cost and latency logs", status: "stub" },
        { label: "failure taxonomies", status: "stub" },
        { label: "regression tests", status: "stub" },
        { label: "benchmark suites", status: "stub" },
        { label: "orchestrator scorecards", status: "stub" }
      ]
    },
    {
      label: "Governance and Audit Platform",
      children: [
        { label: "orchestration audit events", view: "audit", status: "live" },
        { label: "action audit events", view: "audit", status: "live" },
        { label: "tool audit events", view: "audit", status: "live" },
        { label: "approval audit events", view: "audit", status: "partial" },
        { label: "improvement audit events", status: "stub" },
        { label: "policy decision records", status: "stub" },
        { label: "replay logs", status: "stub" },
        { label: "signed attestations", status: "stub" },
        { label: "transparency checkpoints", view: "audit", status: "partial" }
      ]
    },
    {
      label: "Product Surfaces",
      children: [
        { label: "orchestration console", view: "home", status: "live" },
        { label: "board (Paperclip)", view: "board", status: "live" },
        { label: "company hires", view: "company", status: "live" },
        { label: "goal contract editor", view: "goal-contracts", status: "stub" },
        { label: "strategy inspector", status: "stub" },
        { label: "orchestrator registry", view: "ontology", status: "partial" },
        { label: "run trace viewer", view: "audit", status: "partial" },
        { label: "approval inbox", view: "review-inbox", status: "live" },
        { label: "improvement review queue", status: "stub" },
        { label: "evaluation dashboard", status: "stub" },
        { label: "failure review board", status: "stub" },
        { label: "policy console", status: "stub" },
        { label: "orchestrator package marketplace", status: "stub" }
      ]
    }
  ]
};

export function renderMooTreeHtml(activeView, linkParams = {}) {
  return renderAsciiTreeHtml(MOO_PLATFORM_TREE, {
    activeView,
    linkParams,
    ariaLabel: "MoO platform",
    rootClass: "ascii-tree moo-tree"
  });
}

/** Left sidebar: PRD monorepo tree + MoO platform tree (stacked). */
export function renderPlatformSidebarHtml(activeView, linkParams = {}, activePath = "") {
  const repo = renderAtlasRepoTreeHtml(activeView, activePath, linkParams);
  const moo = renderMooTreeHtml(activeView, linkParams);
  return `<div class="tree-stack">
    <div class="tree-section">${repo}</div>
    <div class="tree-section tree-section-divider">${moo}</div>
  </div>`;
}

export const DEFAULT_VIEW = "home";

export function normalizeView(view) {
  const allowed = new Set([
    "home",
    "board",
    "company",
    "next-action",
    "carbon-copy",
    "tasks",
    "workspaces",
    "ontology",
    "objects",
    "object-detail",
    "graph",
    "actions",
    "review-inbox",
    "audit",
    "goal-contracts",
    "delegation",
    "repo"
  ]);
  if (view && allowed.has(view)) {
    return view;
  }
  return DEFAULT_VIEW;
}