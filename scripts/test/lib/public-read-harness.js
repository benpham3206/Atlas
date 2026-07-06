/**
 * Pure-JS mirror of server/src/atlas/public-read.ts for node --test.
 */

export const CANON_BROWSE_RECORD_TYPES = new Set(["node", "domain"]);

function flattenRecord(record) {
  const props = record.properties ?? {};
  return {
    ...record,
    ...props,
    label: record.label ?? props.label,
  };
}

export function isCanonBrowseRecord(record) {
  const flat = flattenRecord(record);
  return (
    flat.lifecycle === "operational" &&
    flat.review_state === "approved" &&
    CANON_BROWSE_RECORD_TYPES.has(flat.record_type)
  );
}

function entrySortKey(entry) {
  return entry.title ?? entry.label ?? entry.record_id;
}

export function buildCanonBrowseIndex(companyId, allRecords) {
  const entries = allRecords
    .filter((record) => record.workspace_id === companyId && isCanonBrowseRecord(record))
    .map((record) => {
      const flat = flattenRecord(record);
      const sourceRefs = Array.isArray(flat.source_refs) ? flat.source_refs : [];
      return {
        record_id: flat.id,
        record_type: flat.record_type,
        title: flat.title,
        label: flat.label,
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