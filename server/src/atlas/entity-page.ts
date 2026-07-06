type AtlasLikeRecord = {
  id: string;
  record_type: string;
  workspace_id: string;
  title?: string;
  lifecycle: string;
  review_state: string;
  source_refs?: string[];
  label?: string;
  statement_text?: string;
  citation?: string;
  source_type?: string;
  [key: string]: unknown;
};

export type EntityPageSource = {
  id: string;
  citation: string;
  source_type?: string;
};

export type EntityPageEvidence = {
  id: string;
  title?: string;
  evidence_kind?: string;
  source_id?: string;
};

export type EntityPageStatement = {
  id: string;
  title?: string;
  lifecycle: string;
  review_state: string;
  statement_text?: string;
  source_refs: string[];
  sources: EntityPageSource[];
  evidence_refs: string[];
  evidences: EntityPageEvidence[];
};

export type EntityPage = {
  entity_id: string;
  record_type: string;
  title?: string;
  lifecycle: string;
  review_state: string;
  label?: string;
  sources: EntityPageSource[];
  statements: EntityPageStatement[];
  rendered_at: string;
  audit_verify_path?: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function flattenRecord(record: AtlasLikeRecord): AtlasLikeRecord {
  const props = (record.properties as Record<string, unknown> | undefined) ?? {};
  return {
    ...record,
    ...props,
    label: (record.label as string | undefined) ?? (props.label as string | undefined),
    statement_text: (record.statement_text as string | undefined) ?? (props.statement_text as string | undefined),
    citation: (record.citation as string | undefined) ?? (props.citation as string | undefined),
    source_type: (record.source_type as string | undefined) ?? (props.source_type as string | undefined),
    evidence_refs: (record.evidence_refs as string[] | undefined) ?? (props.evidence_refs as string[] | undefined),
    evidence_kind: (record.evidence_kind as string | undefined) ?? (props.evidence_kind as string | undefined),
    source_id: (record.source_id as string | undefined) ?? (props.source_id as string | undefined),
  };
}

function indexRecords(records: AtlasLikeRecord[]): Map<string, AtlasLikeRecord> {
  return new Map(records.map((record) => [record.id, flattenRecord(record)]));
}

export function resolveSourceCitations(
  sourceRefs: string[],
  recordsById: Map<string, AtlasLikeRecord>,
): EntityPageSource[] {
  return sourceRefs.map((ref) => {
    const source = recordsById.get(ref);
    return {
      id: ref,
      citation: (source?.citation as string | undefined) ?? source?.title ?? ref,
      source_type: source?.source_type as string | undefined,
    };
  });
}

export function resolveEvidenceRefs(
  evidenceRefs: string[],
  recordsById: Map<string, AtlasLikeRecord>,
): EntityPageEvidence[] {
  return evidenceRefs.map((ref) => {
    const evidence = recordsById.get(ref);
    return {
      id: ref,
      title: evidence?.title,
      evidence_kind: evidence?.evidence_kind as string | undefined,
      source_id: evidence?.source_id as string | undefined,
    };
  });
}

export function relatedStatements(entity: AtlasLikeRecord, allRecords: AtlasLikeRecord[]): AtlasLikeRecord[] {
  const entitySources = new Set(entity.source_refs ?? []);
  return allRecords.filter(
    (record) =>
      record.record_type === "statement" &&
      record.workspace_id === entity.workspace_id &&
      (record.source_refs ?? []).some((ref) => entitySources.has(ref)),
  );
}

function toMarkdown(page: EntityPage): string {
  const lines = [
    `# ${page.title ?? page.label ?? page.entity_id}`,
    "",
    `- **Lifecycle:** ${page.lifecycle}`,
    `- **Review:** ${page.review_state}`,
    "",
    "## Sources",
  ];

  if (page.sources.length === 0) {
    lines.push("- _(none)_");
  } else {
    for (const source of page.sources) {
      lines.push(`- \`${source.id}\`: ${source.citation}`);
    }
  }

  lines.push("", "## Statements");

  if (page.statements.length === 0) {
    lines.push("- _(none)_");
  } else {
    for (const statement of page.statements) {
      lines.push(
        "",
        `### ${statement.title ?? statement.id}`,
        "",
        `- Lifecycle: ${statement.lifecycle}`,
        `- Review: ${statement.review_state}`,
        `- Sources: ${statement.sources.map((s) => s.citation).join("; ") || "_(none)_"}`,
        `- Evidence: ${
          statement.evidences.map((e) => `${e.id}${e.evidence_kind ? ` (${e.evidence_kind})` : ""}`).join("; ") ||
          "_(none)_"
        }`,
        "",
        statement.statement_text ?? "",
      );
    }
  }

  return lines.join("\n");
}

export type EntityPageRenderOptions = {
  companyId?: string;
};

export function renderEntityPage(
  entity: AtlasLikeRecord,
  allRecords: AtlasLikeRecord[],
  format: "markdown" | "json" = "json",
  options?: EntityPageRenderOptions,
): { format: "markdown" | "json"; content?: string; page: EntityPage } {
  const normalizedEntity = flattenRecord(entity);
  const recordsById = indexRecords(allRecords);
  const sources = resolveSourceCitations(normalizedEntity.source_refs ?? [], recordsById);
  const statements = relatedStatements(normalizedEntity, [...recordsById.values()]).map((statement) => {
    const flat = flattenRecord(statement);
    const evidenceRefs = asStringArray(flat.evidence_refs);
    return {
      id: statement.id,
      title: statement.title,
      lifecycle: statement.lifecycle,
      review_state: statement.review_state,
      statement_text: flat.statement_text as string | undefined,
      source_refs: statement.source_refs ?? [],
      sources: resolveSourceCitations(statement.source_refs ?? [], recordsById),
      evidence_refs: evidenceRefs,
      evidences: resolveEvidenceRefs(evidenceRefs, recordsById),
    };
  });

  const page: EntityPage = {
    entity_id: normalizedEntity.id,
    record_type: normalizedEntity.record_type,
    title: normalizedEntity.title,
    lifecycle: normalizedEntity.lifecycle,
    review_state: normalizedEntity.review_state,
    label: normalizedEntity.label as string | undefined,
    sources,
    statements,
    rendered_at: new Date().toISOString(),
    audit_verify_path: options?.companyId
      ? `/api/companies/${options.companyId}/atlas/audit/verify`
      : undefined,
  };

  if (format === "markdown") {
    return { format: "markdown", content: toMarkdown(page), page };
  }

  return { format: "json", page };
}
