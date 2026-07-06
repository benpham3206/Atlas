/**
 * In-memory harness mirroring server/src/atlas/knowledge-service.ts search,
 * attach_evidence, traverse depth, and audit append for encyclopedia fixture tests.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { auditEventHash, verifyAuditEventChain } from "../../../packages/atlas-ontology/src/index.js";

export const DEFAULT_TRAVERSE_MAX_DEPTH = 2;
export const ABSOLUTE_TRAVERSE_MAX_DEPTH = 10;

const ROOT = join(import.meta.dirname, "..", "..", "..");

export function loadEncyclopediaFixture() {
  const fixture = JSON.parse(
    readFileSync(join(ROOT, "tests/fixtures/encyclopedia-knowledge-pack.json"), "utf8"),
  );
  return fixture.records.map((record) => ({ ...record }));
}

export function loadStaffFixture() {
  return JSON.parse(readFileSync(join(ROOT, "tests/fixtures/public-atlas-staff.json"), "utf8"));
}

export function searchRecords(records, companyId, query, recordType) {
  const pattern = query.trim().toLowerCase();
  return records.filter((record) => {
    if (record.workspace_id !== companyId) {
      return false;
    }
    if (recordType && record.record_type !== recordType) {
      return false;
    }
    const haystack = [
      record.id,
      record.title ?? "",
      record.statement_text ?? "",
      record.label ?? "",
      JSON.stringify(record),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(pattern);
  });
}

export function attachEvidence(records, auditEvents, companyId, input, actor) {
  const targetId = input.target_object_id;
  const target = records.find((r) => r.id === targetId && r.workspace_id === companyId);
  if (!target) {
    throw new Error(`target record ${targetId} not found in workspace ${companyId}`);
  }

  const evidenceId = `atlas_record_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const linkId = `atlas_link_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = new Date().toISOString();

  const evidence = {
    id: evidenceId,
    record_type: "evidence",
    workspace_id: companyId,
    lifecycle: "candidate",
    review_state: "unreviewed",
    visibility: "workspace",
    title: input.title,
    source_refs: [targetId],
    created_at: now,
    updated_at: now,
    statement_id: targetId,
    source_id: input.uri ?? targetId,
    evidence_kind: "attachment",
    summary: input.summary,
    target_object_id: targetId,
    created_by: actor,
  };

  records.push(evidence);

  const link = {
    id: linkId,
    companyId,
    from_record_id: evidenceId,
    to_record_id: targetId,
    link_type: "evidence_for",
  };

  appendAuditEvent(auditEvents, companyId, actor, "knowledge.record.created", {
    resourceType: "atlas_knowledge_record",
    resourceId: evidenceId,
    afterHash: auditEventHash({ id: evidenceId, record_type: "evidence" }),
    metadata: { record_type: "evidence", target_object_id: targetId },
  });

  appendAuditEvent(auditEvents, companyId, actor, "knowledge.link.created", {
    resourceType: "atlas_knowledge_link",
    resourceId: linkId,
    metadata: link,
  });

  return { evidence, link };
}

export function appendAuditEvent(auditEvents, companyId, actor, eventType, extra = {}) {
  const last = auditEvents.filter((e) => e.company_id === companyId).at(-1);
  const sequence = (last?.sequence ?? 0) + 1;
  const previousEventHash = last?.event_hash ?? null;
  const eventBody = {
    id: `audit_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    company_id: companyId,
    sequence,
    actor,
    event_type: eventType,
    resource_type: extra.resourceType ?? null,
    resource_id: extra.resourceId ?? null,
    decision: extra.decision ?? "not_applicable",
    before_hash: extra.beforeHash ?? null,
    after_hash: extra.afterHash ?? null,
    metadata: extra.metadata ?? {},
    previous_event_hash: previousEventHash,
    created_at: new Date().toISOString(),
  };
  const event = {
    ...eventBody,
    event_hash: auditEventHash(eventBody),
  };
  auditEvents.push(event);
  return event;
}

export function verifyAuditChain(auditEvents, companyId) {
  const events = auditEvents
    .filter((event) => event.company_id === companyId)
    .sort((a, b) => a.sequence - b.sequence);
  const result = verifyAuditEventChain(events);
  return { company_id: companyId, event_count: events.length, audit_valid: result.valid, errors: result.errors };
}

export function operationalPromotionGate(merged) {
  if (merged.lifecycle !== "operational") {
    return { blocked: false, reasons: [] };
  }
  const reasons = [];
  if (merged.review_state !== "approved") {
    reasons.push("operational lifecycle requires review_state approved");
  }
  if (!Array.isArray(merged.source_refs) || merged.source_refs.length === 0) {
    reasons.push("operational lifecycle requires at least one source_ref");
  }
  return { blocked: reasons.length > 0, reasons };
}

export function linksFromEdgeRecords(records, companyId) {
  return records
    .filter((record) => record.record_type === "edge" && record.workspace_id === companyId)
    .map((edge) => ({
      id: edge.id,
      companyId,
      fromRecordId: edge.from_record_id,
      toRecordId: edge.to_record_id,
      linkType: edge.relation_type,
    }));
}

/**
 * Mirrors server/src/atlas/knowledge-service.ts buildTraverseSubgraph.
 */
export function buildTraverseSubgraph(companyId, recordId, links, maxDepth = DEFAULT_TRAVERSE_MAX_DEPTH) {
  const depth = Math.min(Math.max(1, maxDepth), ABSOLUTE_TRAVERSE_MAX_DEPTH);
  const scopedLinks = links.filter((link) => link.companyId === companyId);

  const visitedNodes = new Set([recordId]);
  const collectedLinks = [];
  let frontier = [recordId];

  for (let hop = 0; hop < depth && frontier.length > 0; hop += 1) {
    const nextFrontier = [];
    for (const nodeId of frontier) {
      for (const link of scopedLinks) {
        if (link.fromRecordId === nodeId) {
          collectedLinks.push({
            id: link.id,
            link_type: link.linkType,
            from_record_id: link.fromRecordId,
            to_record_id: link.toRecordId,
          });
          if (!visitedNodes.has(link.toRecordId)) {
            visitedNodes.add(link.toRecordId);
            nextFrontier.push(link.toRecordId);
          }
        }
        if (link.toRecordId === nodeId) {
          collectedLinks.push({
            id: link.id,
            link_type: link.linkType,
            from_record_id: link.fromRecordId,
            to_record_id: link.toRecordId,
          });
          if (!visitedNodes.has(link.fromRecordId)) {
            visitedNodes.add(link.fromRecordId);
            nextFrontier.push(link.fromRecordId);
          }
        }
      }
    }
    frontier = nextFrontier;
  }

  const outbound = scopedLinks
    .filter((link) => link.fromRecordId === recordId)
    .map((link) => ({ id: link.id, link_type: link.linkType, to_record_id: link.toRecordId }));
  const inbound = scopedLinks
    .filter((link) => link.toRecordId === recordId)
    .map((link) => ({ id: link.id, link_type: link.linkType, from_record_id: link.fromRecordId }));

  return {
    object_id: recordId,
    max_depth: depth,
    nodes: [...visitedNodes],
    links: collectedLinks,
    outbound,
    inbound,
  };
}

export function assertTraverseScopedToCompany(result, recordsById, companyId) {
  for (const nodeId of result.nodes) {
    const record = recordsById.get(nodeId);
    if (!record) {
      throw new Error(`traverse returned unknown node ${nodeId}`);
    }
    if (record.workspace_id !== companyId) {
      throw new Error(`cross-company leak: node ${nodeId} belongs to ${record.workspace_id}, not ${companyId}`);
    }
  }
  return true;
}
