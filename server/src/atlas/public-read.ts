type AtlasLikeRecord = {
  id: string;
  record_type: string;
  workspace_id: string;
  title?: string;
  lifecycle: string;
  review_state: string;
  label?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Record types visitors browse as encyclopedia entries (not edges/sources/evidence). */
export const CANON_BROWSE_RECORD_TYPES: ReadonlySet<string> = new Set(["node", "domain"]);

export type CanonBrowseEntry = {
  record_id: string;
  record_type: string;
  title?: string;
  label?: string;
  lifecycle: string;
  review_state: string;
  source_ref_count: number;
  entity_page_path: string;
};

export type CanonBrowseIndex = {
  company_id: string;
  rendered_at: string;
  audit_verify_path: string;
  entity_page_path_template: string;
  entries: CanonBrowseEntry[];
};

function flattenRecord(record: AtlasLikeRecord): AtlasLikeRecord {
  const props = (record.properties as Record<string, unknown> | undefined) ?? {};
  return {
    ...record,
    ...props,
    label: (record.label as string | undefined) ?? (props.label as string | undefined),
  };
}

function entrySortKey(entry: CanonBrowseEntry): string {
  return entry.title ?? entry.label ?? entry.record_id;
}

/** Canon for public read = operational + approved (lifecycle gate), same as encyclopedia acceptance. */
export function isCanonBrowseRecord(record: AtlasLikeRecord): boolean {
  const flat = flattenRecord(record);
  return (
    flat.lifecycle === "operational" &&
    flat.review_state === "approved" &&
    CANON_BROWSE_RECORD_TYPES.has(flat.record_type)
  );
}

export function buildCanonBrowseIndex(companyId: string, allRecords: AtlasLikeRecord[]): CanonBrowseIndex {
  const entries = allRecords
    .filter((record) => record.workspace_id === companyId && isCanonBrowseRecord(record))
    .map((record) => {
      const flat = flattenRecord(record);
      const sourceRefs = Array.isArray(flat.source_refs) ? flat.source_refs : [];
      return {
        record_id: flat.id,
        record_type: flat.record_type,
        title: flat.title,
        label: flat.label as string | undefined,
        lifecycle: flat.lifecycle,
        review_state: flat.review_state,
        source_ref_count: sourceRefs.length,
        entity_page_path: `/api/companies/${companyId}/atlas/entities/${flat.id}/page`,
      };
    })
    .sort((a, b) => entrySortKey(a).localeCompare(entrySortKey(b)));

  return {
    company_id: companyId,
    rendered_at: new Date().toISOString(),
    audit_verify_path: `/api/companies/${companyId}/atlas/audit/verify`,
    entity_page_path_template: `/api/companies/${companyId}/atlas/entities/:recordId/page`,
    entries,
  };
}