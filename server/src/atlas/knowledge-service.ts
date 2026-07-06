import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  atlasAuditEvents,
  atlasCompanyConfig,
  atlasKnowledgeLinks,
  atlasKnowledgeRecords,
} from "@paperclipai/db";
import {
  auditEventHash,
  validateRecord,
  verifyAuditEventChain,
} from "@atlas/atlas-ontology";
import { toAtlasRecord } from "./workspace.js";

export const DEFAULT_TRAVERSE_MAX_DEPTH = 2;
export const ABSOLUTE_TRAVERSE_MAX_DEPTH = 10;

export type AtlasKnowledgeLinkRow = {
  id: string;
  companyId: string;
  fromRecordId: string;
  toRecordId: string;
  linkType: string;
};

export function buildTraverseSubgraph(
  companyId: string,
  recordId: string,
  links: AtlasKnowledgeLinkRow[],
  maxDepth = DEFAULT_TRAVERSE_MAX_DEPTH,
) {
  const depth = Math.min(Math.max(1, maxDepth), ABSOLUTE_TRAVERSE_MAX_DEPTH);
  const scopedLinks = links.filter((link) => link.companyId === companyId);

  const visitedNodes = new Set<string>([recordId]);
  const collectedLinks: Array<{
    id: string;
    link_type: string;
    from_record_id: string;
    to_record_id: string;
  }> = [];
  let frontier = [recordId];

  for (let hop = 0; hop < depth && frontier.length > 0; hop += 1) {
    const nextFrontier: string[] = [];
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
    .map((link) => ({
      id: link.id,
      link_type: link.linkType,
      to_record_id: link.toRecordId,
    }));
  const inbound = scopedLinks
    .filter((link) => link.toRecordId === recordId)
    .map((link) => ({
      id: link.id,
      link_type: link.linkType,
      from_record_id: link.fromRecordId,
    }));

  return {
    object_id: recordId,
    max_depth: depth,
    nodes: [...visitedNodes],
    links: collectedLinks,
    outbound,
    inbound,
  };
}

export class AtlasPolicyError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function nextRecordId(): string {
  return `atlas_record_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function actorLabel(actor: { type: string; actorId?: string; agentId?: string | null }) {
  if (actor.type === "agent") {
    return actor.agentId ?? actor.actorId ?? "agent";
  }
  return actor.actorId ?? actor.type;
}

type AtlasAuditEventRow = typeof atlasAuditEvents.$inferSelect;

const ATLAS_AUDIT_CREATED_AT_META = "_atlas_audit_created_at";
const ATLAS_AUDIT_SEQUENCE_CONSTRAINT = "atlas_audit_events_company_sequence_idx";

/** Metadata + created_at used when hashing; storage-only keys are stripped. */
export function auditEventHashBodyFromRow(row: AtlasAuditEventRow, previousEventHash: string | null) {
  const rawMetadata = (row.metadata ?? {}) as Record<string, unknown>;
  const storedCreatedAt =
    typeof rawMetadata[ATLAS_AUDIT_CREATED_AT_META] === "string"
      ? (rawMetadata[ATLAS_AUDIT_CREATED_AT_META] as string)
      : row.createdAt.toISOString();
  const { [ATLAS_AUDIT_CREATED_AT_META]: _ignored, ...metadataForHash } = rawMetadata;
  return {
    id: row.id,
    company_id: row.companyId,
    sequence: row.sequence,
    actor: row.actor,
    event_type: row.eventType,
    resource_type: row.resourceType ?? null,
    resource_id: row.resourceId ?? null,
    decision: row.decision ?? "not_applicable",
    before_hash: row.beforeHash ?? null,
    after_hash: row.afterHash ?? null,
    metadata: metadataForHash,
    previous_event_hash: previousEventHash,
    created_at: storedCreatedAt,
  };
}

/** Event shape passed to verifyAuditEventChain (includes stored event_hash). */
export function auditChainEventFromRow(row: AtlasAuditEventRow) {
  const body = auditEventHashBodyFromRow(row, row.previousEventHash ?? null);
  return {
    ...body,
    event_hash: row.eventHash,
  };
}

/** Recompute event_hash + previous_event_hash for a company chain (dogfood repair). */
export async function rebuildAtlasAuditChainHashes(db: Db, companyId: string) {
  const rows = await db
    .select()
    .from(atlasAuditEvents)
    .where(eq(atlasAuditEvents.companyId, companyId))
    .orderBy(atlasAuditEvents.sequence);

  let previousHash: string | null = null;
  let updated = 0;

  for (const row of rows) {
    const rawMetadata = (row.metadata ?? {}) as Record<string, unknown>;
    const createdAtIso =
      typeof rawMetadata[ATLAS_AUDIT_CREATED_AT_META] === "string"
        ? (rawMetadata[ATLAS_AUDIT_CREATED_AT_META] as string)
        : row.createdAt.toISOString();
    const { [ATLAS_AUDIT_CREATED_AT_META]: _ignored, ...metaForHash } = rawMetadata;
    const metadataStored = { ...metaForHash, [ATLAS_AUDIT_CREATED_AT_META]: createdAtIso };
    const eventForHash = auditEventHashBodyFromRow(
      { ...row, metadata: metadataStored },
      previousHash,
    );
    const eventHash = auditEventHash(eventForHash);
    const needsUpdate =
      eventHash !== row.eventHash ||
      previousHash !== (row.previousEventHash ?? null) ||
      metadataStored[ATLAS_AUDIT_CREATED_AT_META] !== rawMetadata[ATLAS_AUDIT_CREATED_AT_META];

    if (needsUpdate) {
      await db
        .update(atlasAuditEvents)
        .set({
          eventHash,
          previousEventHash: previousHash,
          metadata: metadataStored,
        })
        .where(eq(atlasAuditEvents.id, row.id));
      updated += 1;
    }

    previousHash = eventHash;
  }

  const rebuilt = await db
    .select()
    .from(atlasAuditEvents)
    .where(eq(atlasAuditEvents.companyId, companyId))
    .orderBy(atlasAuditEvents.sequence);
  const verifyResult = verifyAuditEventChain(rebuilt.map(auditChainEventFromRow));

  return {
    company_id: companyId,
    event_count: rows.length,
    updated,
    audit_valid: verifyResult.valid,
    errors: verifyResult.errors,
  };
}

function isAuditSequenceUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    const maybe = current as { code?: string; constraint?: string; message?: string; cause?: unknown };
    const matchesSequenceConstraint =
      maybe.constraint === ATLAS_AUDIT_SEQUENCE_CONSTRAINT ||
      (typeof maybe.message === "string" && maybe.message.includes(ATLAS_AUDIT_SEQUENCE_CONSTRAINT));
    if (maybe.code === "23505" && matchesSequenceConstraint) {
      return true;
    }
    current = maybe.cause;
  }
  return false;
}

function auditSequenceConflictPayload(error: unknown) {
  return {
    component: "atlas.knowledge-service.audit",
    root_cause: error instanceof Error ? error.message : "audit sequence unique constraint conflict",
    failure_type: "unique_constraint_violation",
  };
}

async function runAtomicAuditMutation<T>(
  db: Db,
  mutation: (tx: Db) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await db.transaction(async (tx) => mutation(tx as unknown as Db));
    } catch (error) {
      if (isAuditSequenceUniqueViolation(error) && attempt === 0) {
        continue;
      }
      if (isAuditSequenceUniqueViolation(error)) {
        throw new AtlasPolicyError(
          409,
          "audit_sequence_conflict",
          JSON.stringify(auditSequenceConflictPayload(error)),
        );
      }
      throw error;
    }
  }
  throw new AtlasPolicyError(
    409,
    "audit_sequence_conflict",
    JSON.stringify({
      component: "atlas.knowledge-service.audit",
      root_cause: "audit sequence unique constraint retry exhausted",
      failure_type: "unique_constraint_violation",
    }),
  );
}

export function atlasKnowledgeService(db: Db) {
  return {
    async ensureCompanyConfig(companyId: string) {
      const existing = await db
        .select()
        .from(atlasCompanyConfig)
        .where(eq(atlasCompanyConfig.companyId, companyId))
        .limit(1);
      if (existing[0]) {
        return existing[0];
      }
      const [row] = await db
        .insert(atlasCompanyConfig)
        .values({ companyId, governed: "true", policies: {} })
        .returning();
      return row;
    },

    async listRecords(companyId: string, filters: { recordType?: string } = {}) {
      const conditions = [eq(atlasKnowledgeRecords.companyId, companyId)];
      if (filters.recordType) {
        conditions.push(eq(atlasKnowledgeRecords.recordType, filters.recordType));
      }
      const rows = await db
        .select()
        .from(atlasKnowledgeRecords)
        .where(and(...conditions))
        .orderBy(desc(atlasKnowledgeRecords.updatedAt));
      return rows.map(toAtlasRecord);
    },

    async getRecord(companyId: string, recordId: string) {
      const [row] = await db
        .select()
        .from(atlasKnowledgeRecords)
        .where(and(eq(atlasKnowledgeRecords.companyId, companyId), eq(atlasKnowledgeRecords.id, recordId)))
        .limit(1);
      return row ? toAtlasRecord(row) : null;
    },

    async searchRecords(companyId: string, query: string, recordType?: string) {
      const pattern = `%${query.trim()}%`;
      const conditions = [
        eq(atlasKnowledgeRecords.companyId, companyId),
        or(
          ilike(atlasKnowledgeRecords.title, pattern),
          ilike(atlasKnowledgeRecords.id, pattern),
          sql`${atlasKnowledgeRecords.properties}::text ILIKE ${pattern}`,
        ),
      ];
      if (recordType) {
        conditions.push(eq(atlasKnowledgeRecords.recordType, recordType));
      }
      const rows = await db
        .select()
        .from(atlasKnowledgeRecords)
        .where(and(...conditions))
        .orderBy(desc(atlasKnowledgeRecords.updatedAt))
        .limit(100);
      return rows.map(toAtlasRecord);
    },

    async createRecord(
      companyId: string,
      input: {
        record_type: string;
        lifecycle?: string;
        review_state?: string;
        visibility?: string;
        title?: string;
        properties?: Record<string, unknown>;
        source_refs?: string[];
      },
      actor: { type: string; actorId?: string; agentId?: string | null },
    ) {
      await this.assertWriteAllowed(companyId, actor);
      const id = nextRecordId();
      const now = new Date();
      const nowIso = now.toISOString();
      const properties = input.properties ?? {};
      const candidate = {
        id,
        workspace_id: companyId,
        record_type: input.record_type,
        lifecycle: input.lifecycle ?? "candidate",
        review_state: input.review_state ?? "unreviewed",
        visibility: input.visibility ?? "workspace",
        title: input.title,
        source_refs: input.source_refs ?? [],
        created_at: nowIso,
        updated_at: nowIso,
        properties,
        ...properties,
      };
      const validation = validateRecord(candidate);
      if (!validation.valid) {
        throw new AtlasPolicyError(400, "record_invalid", validation.errors.join("; "));
      }
      return runAtomicAuditMutation(db, async (tx) => {
        const [row] = await tx
          .insert(atlasKnowledgeRecords)
          .values({
            id,
            companyId,
            recordType: candidate.record_type,
            lifecycle: candidate.lifecycle,
            reviewState: candidate.review_state,
            visibility: candidate.visibility,
            title: candidate.title ?? null,
            properties,
            sourceRefs: candidate.source_refs,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        await appendAuditEvent(tx, {
          companyId,
          actor: actorLabel(actor),
          eventType: "knowledge.record.created",
          resourceType: "atlas_knowledge_record",
          resourceId: id,
          afterHash: auditEventHash({ id, record_type: candidate.record_type }),
          metadata: { record_type: candidate.record_type },
        });
        return toAtlasRecord(row);
      });
    },

    async patchRecord(
      companyId: string,
      recordId: string,
      patch: {
        lifecycle?: string;
        review_state?: string;
        visibility?: string;
        title?: string;
        properties?: Record<string, unknown>;
        source_refs?: string[];
      },
      actor: { type: string; actorId?: string; agentId?: string | null },
    ) {
      await this.assertWriteAllowed(companyId, actor);
      const [existing] = await db
        .select()
        .from(atlasKnowledgeRecords)
        .where(and(eq(atlasKnowledgeRecords.companyId, companyId), eq(atlasKnowledgeRecords.id, recordId)))
        .limit(1);
      if (!existing) {
        throw new AtlasPolicyError(404, "record_not_found", `Record ${recordId} not found`);
      }
      const existingProps = (existing.properties ?? {}) as Record<string, unknown>;
      const properties = {
        ...existingProps,
        ...(patch.properties ?? {}),
      };
      const now = new Date();
      const nowIso = now.toISOString();
      const reviewState = patch.review_state ?? existing.reviewState;
      const lifecycle = patch.lifecycle ?? existing.lifecycle;
      const sourceRefs = patch.source_refs ?? (existing.sourceRefs as string[]);
      const reviewedBy =
        reviewState === "approved"
          ? typeof existingProps.reviewed_by === "string" && reviewState === existing.reviewState
            ? existingProps.reviewed_by
            : actorLabel(actor)
          : undefined;
      const reviewedAt =
        reviewState === "approved"
          ? typeof existingProps.reviewed_at === "string" && reviewState === existing.reviewState
            ? existingProps.reviewed_at
            : nowIso
          : undefined;
      const candidate = {
        id: existing.id,
        workspace_id: companyId,
        record_type: existing.recordType,
        lifecycle,
        review_state: reviewState,
        visibility: patch.visibility ?? existing.visibility,
        title: patch.title ?? existing.title ?? undefined,
        source_refs: sourceRefs,
        created_at: existing.createdAt.toISOString(),
        updated_at: nowIso,
        properties,
        ...properties,
        ...(reviewState === "approved" && reviewedBy && reviewedAt
          ? { reviewed_by: reviewedBy, reviewed_at: reviewedAt }
          : {}),
      };
      delete (candidate as Record<string, unknown>).created_at;
      delete (candidate as Record<string, unknown>).updated_at;
      (candidate as Record<string, unknown>).created_at = existing.createdAt.toISOString();
      (candidate as Record<string, unknown>).updated_at = nowIso;
      if (candidate.lifecycle === "operational") {
        if (candidate.review_state !== "approved") {
          throw new AtlasPolicyError(
            403,
            "lifecycle_gate",
            "operational lifecycle requires review_state approved",
          );
        }
        if (!Array.isArray(candidate.source_refs) || candidate.source_refs.length === 0) {
          throw new AtlasPolicyError(
            403,
            "lifecycle_gate",
            "operational lifecycle requires at least one source_ref",
          );
        }
      }
      const validation = validateRecord(candidate);
      if (!validation.valid) {
        throw new AtlasPolicyError(400, "record_invalid", validation.errors.join("; "));
      }
      return runAtomicAuditMutation(db, async (tx) => {
        const [row] = await tx
          .update(atlasKnowledgeRecords)
          .set({
            lifecycle: candidate.lifecycle,
            reviewState: candidate.review_state,
            visibility: candidate.visibility,
            title: candidate.title ?? null,
            properties,
            sourceRefs: candidate.source_refs,
            updatedAt: now,
          })
          .where(and(eq(atlasKnowledgeRecords.companyId, companyId), eq(atlasKnowledgeRecords.id, recordId)))
          .returning();
        await appendAuditEvent(tx, {
          companyId,
          actor: actorLabel(actor),
          eventType: "knowledge.record.updated",
          resourceType: "atlas_knowledge_record",
          resourceId: recordId,
          beforeHash: auditEventHash({ id: existing.id, lifecycle: existing.lifecycle }),
          afterHash: auditEventHash({ id: recordId, lifecycle: candidate.lifecycle }),
          metadata: { lifecycle: candidate.lifecycle },
        });
        return toAtlasRecord(row);
      });
    },

    async createLink(
      companyId: string,
      input: { from_record_id: string; to_record_id: string; link_type: string },
      actor: { type: string; actorId?: string; agentId?: string | null },
    ) {
      await this.assertWriteAllowed(companyId, actor);
      const id = `atlas_link_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
      await runAtomicAuditMutation(db, async (tx) => {
        await tx.insert(atlasKnowledgeLinks).values({
          id,
          companyId,
          fromRecordId: input.from_record_id,
          toRecordId: input.to_record_id,
          linkType: input.link_type,
        });
        await appendAuditEvent(tx, {
          companyId,
          actor: actorLabel(actor),
          eventType: "knowledge.link.created",
          resourceType: "atlas_knowledge_link",
          resourceId: id,
          metadata: input,
        });
      });
      return { id, ...input, workspace_id: companyId };
    },

    async traverseGraph(companyId: string, recordId: string, maxDepth = DEFAULT_TRAVERSE_MAX_DEPTH) {
      const existing = await this.getRecord(companyId, recordId);
      if (!existing) {
        throw new AtlasPolicyError(404, "record_not_found", `Record ${recordId} not found`);
      }

      const rows = await db
        .select()
        .from(atlasKnowledgeLinks)
        .where(eq(atlasKnowledgeLinks.companyId, companyId));

      return buildTraverseSubgraph(
        companyId,
        recordId,
        rows.map((row) => ({
          id: row.id,
          companyId: row.companyId,
          fromRecordId: row.fromRecordId,
          toRecordId: row.toRecordId,
          linkType: row.linkType,
        })),
        maxDepth,
      );
    },

    async getOverview(companyId: string) {
      const rows = await db
        .select({
          recordType: atlasKnowledgeRecords.recordType,
          count: sql<number>`count(*)::int`,
        })
        .from(atlasKnowledgeRecords)
        .where(eq(atlasKnowledgeRecords.companyId, companyId))
        .groupBy(atlasKnowledgeRecords.recordType);
      const config = await this.ensureCompanyConfig(companyId);
      return {
        workspace_id: companyId,
        governed: config.governed === "true",
        record_counts: Object.fromEntries(rows.map((r) => [r.recordType, r.count])),
        policies: config.policies,
      };
    },

    async assertWriteAllowed(companyId: string, actor: { type: string }) {
      const config = await this.ensureCompanyConfig(companyId);
      if (config.governed !== "true") {
        return;
      }
      if (actor.type === "board" || actor.type === "user") {
        return;
      }
      if (actor.type === "agent") {
        return;
      }
      throw new AtlasPolicyError(403, "write_denied", "Actor cannot mutate governed knowledge records");
    },

    async verifyAuditChain(companyId: string) {
      const rows = await db
        .select()
        .from(atlasAuditEvents)
        .where(eq(atlasAuditEvents.companyId, companyId))
        .orderBy(atlasAuditEvents.sequence);
      const events = rows.map((row) => auditChainEventFromRow(row));
      const result = verifyAuditEventChain(events);
      return {
        company_id: companyId,
        event_count: events.length,
        audit_valid: result.valid,
        errors: result.errors,
      };
    },

    async listAuditEvents(companyId: string, limit = 50) {
      const rows = await db
        .select()
        .from(atlasAuditEvents)
        .where(eq(atlasAuditEvents.companyId, companyId))
        .orderBy(desc(atlasAuditEvents.sequence))
        .limit(limit);
      return rows.map((row) => ({
        id: row.id,
        sequence: row.sequence,
        actor: row.actor,
        event_type: row.eventType,
        resource_type: row.resourceType,
        resource_id: row.resourceId,
        decision: row.decision,
        event_hash: row.eventHash,
        previous_event_hash: row.previousEventHash,
        created_at: row.createdAt.toISOString(),
      }));
    },
  };
}

export async function appendAuditEvent(
  db: Db,
  input: {
    companyId: string;
    actor: string;
    eventType: string;
    resourceType?: string;
    resourceId?: string;
    decision?: string;
    beforeHash?: string;
    afterHash?: string;
    metadata?: Record<string, unknown>;
    activityLogId?: string | null;
    runId?: string | null;
  },
) {
  const [last] = await db
    .select({ sequence: atlasAuditEvents.sequence, eventHash: atlasAuditEvents.eventHash })
    .from(atlasAuditEvents)
    .where(eq(atlasAuditEvents.companyId, input.companyId))
    .orderBy(desc(atlasAuditEvents.sequence))
    .limit(1);
  const sequence = (last?.sequence ?? 0) + 1;
  const previousEventHash = last?.eventHash ?? null;
  const id = randomUUID();
  const metadataForHash = input.metadata ?? {};
  const createdAtIso = new Date().toISOString();
  const createdAt = new Date(createdAtIso);
  const metadataStored = { ...metadataForHash, [ATLAS_AUDIT_CREATED_AT_META]: createdAtIso };
  const eventBody = {
    id,
    company_id: input.companyId,
    sequence,
    actor: input.actor,
    event_type: input.eventType,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    decision: input.decision ?? "not_applicable",
    before_hash: input.beforeHash ?? null,
    after_hash: input.afterHash ?? null,
    metadata: metadataForHash,
    previous_event_hash: previousEventHash,
    created_at: createdAtIso,
  };
  const eventHash = auditEventHash(eventBody);
  const [row] = await db
    .insert(atlasAuditEvents)
    .values({
      id,
      companyId: input.companyId,
      sequence,
      actor: input.actor,
      eventType: input.eventType,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      decision: input.decision ?? "not_applicable",
      beforeHash: input.beforeHash ?? null,
      afterHash: input.afterHash ?? null,
      metadata: metadataStored,
      previousEventHash,
      eventHash,
      createdAt,
      activityLogId: input.activityLogId ?? null,
      runId: input.runId ?? null,
    })
    .returning();
  return row;
}
