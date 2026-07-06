export const ATLAS_AGENT_TOOLS = Object.freeze([
  {
    name: "get_workspace_overview",
    category: "read",
    required_scope: "atlas.read",
    description: "Atlas knowledge overview for the company workspace (record counts, policy status).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "query_object",
    category: "read",
    required_scope: "atlas.read",
    description: "Fetch a single knowledge record by id.",
    input_schema: {
      type: "object",
      required: ["object_id"],
      properties: { object_id: { type: "string" } },
    },
  },
  {
    name: "list_objects",
    category: "read",
    required_scope: "atlas.read",
    description: "List knowledge records, optionally filtered by record_type.",
    input_schema: {
      type: "object",
      properties: { object_type_id: { type: "string", description: "Alias for record_type" } },
    },
  },
  {
    name: "search_records",
    category: "read",
    required_scope: "atlas.read",
    description: "Case-insensitive keyword search across record titles and properties.",
    input_schema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", minLength: 1 },
        object_type_id: { type: "string" },
      },
    },
  },
  {
    name: "traverse_graph",
    category: "read",
    required_scope: "atlas.read",
    description: "Return inbound and outbound links for a record up to a bounded hop depth (default 2).",
    input_schema: {
      type: "object",
      required: ["object_id"],
      properties: {
        object_id: { type: "string" },
        depth: { type: "integer", minimum: 1, maximum: 10, description: "Max hop depth (default 2)" },
      },
    },
  },
  {
    name: "verify_audit_chain",
    category: "read",
    required_scope: "atlas.read",
    description: "Verify hash-chained atlas_audit_events integrity for this company.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "attach_evidence",
    category: "action",
    required_scope: "atlas.act",
    description: "Create an evidence record linked to a target record.",
    input_schema: {
      type: "object",
      required: ["target_object_id", "title"],
      properties: {
        target_object_id: { type: "string" },
        title: { type: "string" },
        uri: { type: "string" },
        summary: { type: "string" },
      },
    },
  },
  {
    name: "github.open_pr",
    category: "external_action",
    required_scope: "github.pr:create",
    description: "Open a GitHub pull request (delegates to atlas GitHub adapter).",
    input_schema: {
      type: "object",
      required: ["repository", "title", "body", "head_branch"],
      properties: {
        repository: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        head_branch: { type: "string" },
        base_branch: { type: "string" },
        dry_run: { type: "boolean" },
      },
    },
  },
]);

export type AtlasToolName = (typeof ATLAS_AGENT_TOOLS)[number]["name"];

export function getAtlasToolManifest() {
  return {
    tools: ATLAS_AGENT_TOOLS,
    router: "paperclip-atlas",
    execution_path: "/api/companies/:companyId/atlas/tools/:tool",
  };
}
