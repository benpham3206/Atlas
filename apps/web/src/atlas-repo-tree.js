import { renderAsciiTreeHtml } from "./ascii-tree.js";

/** PRD / Atlas Final monorepo map — status reflects this repo today (v0). */
export const ATLAS_REPO_TREE = {
  label: "atlas/",
  children: [
    {
      label: "apps/",
      children: [
        { label: "web/", view: "home", repoPath: "apps/web", status: "live" },
        { label: "api/", view: "repo", repoPath: "apps/api", status: "live" },
        { label: "admin/", repoPath: "apps/admin", status: "stub" }
      ]
    },
    {
      label: "packages/",
      children: [
        { label: "ontology-core/", view: "ontology", repoPath: "packages/ontology-core", status: "live" },
        { label: "policy-engine/", repoPath: "packages/policy-engine", status: "stub" },
        { label: "action-engine/", repoPath: "packages/action-engine", status: "stub" },
        { label: "workflow-engine/", repoPath: "packages/workflow-engine", status: "stub" },
        { label: "audit-log/", repoPath: "packages/audit-log", status: "stub" },
        { label: "search-core/", repoPath: "packages/search-core", status: "stub" },
        { label: "graph-core/", repoPath: "packages/graph-core", status: "stub" },
        { label: "agent-tools/", repoPath: "packages/agent-tools", status: "stub" },
        { label: "proof-core/", repoPath: "packages/proof-core", status: "stub" },
        { label: "lean-specs/", repoPath: "packages/lean-specs", status: "stub" },
        { label: "sdk/", repoPath: "packages/sdk", status: "stub" }
      ]
    },
    {
      label: "services/",
      children: [
        { label: "identity/", status: "stub" },
        { label: "ontology-metadata/", status: "stub" },
        { label: "object-store/", status: "stub" },
        { label: "link-store/", status: "stub" },
        { label: "ingestion/", status: "stub" },
        { label: "search/", status: "stub" },
        { label: "graph/", status: "stub" },
        { label: "workflow/", status: "stub" },
        { label: "proof-service/", status: "stub" },
        { label: "credential-service/", status: "stub" },
        { label: "marketplace/", status: "stub" }
      ]
    },
    {
      label: "connectors/",
      children: [
        { label: "github/", status: "stub" },
        { label: "jira/", status: "stub" },
        { label: "slack/", status: "stub" },
        { label: "drive/", status: "stub" },
        { label: "confluence/", status: "stub" },
        { label: "notion/", status: "stub" },
        { label: "figma/", status: "stub" },
        { label: "snowflake/", status: "stub" },
        { label: "datadog/", status: "stub" }
      ]
    },
    {
      label: "infra/",
      children: [
        { label: "docker/", repoPath: "infra/docker", status: "stub" },
        { label: "migrations/", view: "repo", repoPath: "infra/migrations", status: "live" },
        { label: "seed/", repoPath: "infra/seed", status: "stub" },
        { label: "terraform/", repoPath: "infra/terraform", status: "stub" },
        { label: "helm/", repoPath: "infra/helm", status: "stub" }
      ]
    },
    {
      label: "docs/",
      children: [
        { label: "PRD.md", view: "repo", repoPath: "docs/PRD.md", status: "live" },
        { label: "ARCHITECTURE.md", view: "repo", repoPath: "docs/ARCHITECTURE.md", status: "live" },
        { label: "UI_MOO_FILE_TREE.md", view: "repo", repoPath: "docs/UI_MOO_FILE_TREE.md", status: "live" }
      ]
    }
  ]
};

const REPO_PATH_BLURBS = {
  "apps/web": "Minimal Personal Atlas UI — file-tree shell + governed panes. npm run dev:web.",
  "apps/api": "Express API: personal, ontology, agent tools, audit. npm run dev:api. Health: /health.",
  "apps/admin": "Not in v0 skeleton (PRD future).",
  "packages/ontology-core": "Shared ontology types and helpers used by API.",
  "infra/migrations": "SQL migration specs (static verify in tests); not wired to Postgres in v0.",
  "docs/PRD.md": "Product definition and monorepo acceptance criteria.",
  "docs/ARCHITECTURE.md": "System architecture for Atlas v0 wedge.",
  "docs/UI_MOO_FILE_TREE.md": "MoO + monorepo file-tree UI contract."
};

export function renderAtlasRepoTreeHtml(activeView, activePath, linkParams = {}) {
  return renderAsciiTreeHtml(ATLAS_REPO_TREE, {
    activeView,
    activePath,
    linkParams,
    ariaLabel: "Atlas monorepo",
    rootClass: "ascii-tree repo-tree"
  });
}

export function renderRepoPathPanel(repoPath) {
  const blurb = REPO_PATH_BLURBS[repoPath] ?? "Planned monorepo path from Atlas PRD. Not implemented in this checkout yet.";
  const status = REPO_PATH_BLURBS[repoPath] ? "live" : "stub";
  return `<section>
    <h2>atlas/${escapeRepoPath(repoPath)}</h2>
    <p><span class="badge">${status}</span></p>
    <p class="muted">${blurb}</p>
    <p class="muted">Filesystem: <code>/${escapeRepoPath(repoPath)}</code> in github.com/benpham3206/Atlas</p>
  </section>`;
}

function escapeRepoPath(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}