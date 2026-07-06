/** Atlas workspace scope: companyId is workspace_id (PA-P2d). */
export function resolveWorkspaceId(companyId: string): string {
  return companyId;
}

export function assertWorkspaceMatch(companyId: string, workspaceId: string): void {
  if (resolveWorkspaceId(companyId) !== workspaceId) {
    throw new Error(`workspace_id ${workspaceId} does not match company ${companyId}`);
  }
}

export function toAtlasRecord(row: {
  id: string;
  companyId: string;
  recordType: string;
  lifecycle: string;
  reviewState: string;
  visibility: string;
  title: string | null;
  properties: Record<string, unknown>;
  sourceRefs: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    workspace_id: resolveWorkspaceId(row.companyId),
    record_type: row.recordType,
    lifecycle: row.lifecycle,
    review_state: row.reviewState,
    visibility: row.visibility,
    title: row.title ?? undefined,
    properties: row.properties,
    source_refs: row.sourceRefs,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
