/**
 * Pure-JS mirror of server/src/atlas/entity-page.ts for node --test (no tsx IPC).
 */

function flattenRecord(record) {
  const props = record.properties ?? {};
  return {
    ...record,
    ...props,
    label: record.label ?? props.label,
    statement_text: record.statement_text ?? props.statement_text,
    citation: record.citation ?? props.citation,
    source_type: record.source_type ?? props.source_type,
    evidence_refs: record.evidence_refs ?? props.evidence_refs,
    evidence_kind: record.evidence_kind ?? props.evidence_kind,
    source_id: record.source_id ?? props.source_id,
  };
}

function indexRecords(records) {
  return new Map(records.map((record) => [record.id, flattenRecord(record)]));
}

export function resolveSourceCitations(sourceRefs, recordsById) {
  return sourceRefs.map((ref) => {
    const source = recordsById.get(ref);
    return {
      id: ref,
      citation: source?.citation ?? source?.title ?? ref,
      source_type: source?.source_type,
    };
  });
}

export function resolveEvidenceRefs(evidenceRefs, recordsById) {
  return evidenceRefs.map((ref) => {
    const evidence = recordsById.get(ref);
    return {
      id: ref,
      title: evidence?.title,
      evidence_kind: evidence?.evidence_kind,
      source_id: evidence?.source_id,
    };
  });
}

export function relatedStatements(entity, allRecords) {
  const entitySources = new Set(entity.source_refs ?? []);
  return allRecords.filter(
    (record) =>
      record.record_type === "statement" &&
      record.workspace_id === entity.workspace_id &&
      (record.source_refs ?? []).some((ref) => entitySources.has(ref)),
  );
}

function toMarkdown(page) {
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

export function renderEntityPage(entity, allRecords, format = "json", options) {
  const normalizedEntity = flattenRecord(entity);
  const recordsById = indexRecords(allRecords);
  const sources = resolveSourceCitations(normalizedEntity.source_refs ?? [], recordsById);
  const statements = relatedStatements(normalizedEntity, [...recordsById.values()]).map((statement) => {
    const flat = flattenRecord(statement);
    const evidenceRefs = flat.evidence_refs ?? [];
    return {
      id: statement.id,
      title: statement.title,
      lifecycle: statement.lifecycle,
      review_state: statement.review_state,
      statement_text: flat.statement_text,
      source_refs: statement.source_refs ?? [],
      sources: resolveSourceCitations(statement.source_refs ?? [], recordsById),
      evidence_refs: evidenceRefs,
      evidences: resolveEvidenceRefs(evidenceRefs, recordsById),
    };
  });

  const page = {
    entity_id: normalizedEntity.id,
    record_type: normalizedEntity.record_type,
    title: normalizedEntity.title,
    lifecycle: normalizedEntity.lifecycle,
    review_state: normalizedEntity.review_state,
    label: normalizedEntity.label,
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