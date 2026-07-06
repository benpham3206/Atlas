import { pgTable, text, timestamp, jsonb, index, uuid, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { activityLog } from "./activity_log.js";

export const atlasAuditEvents = pgTable(
  "atlas_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    sequence: integer("sequence").notNull(),
    actor: text("actor").notNull(),
    eventType: text("event_type").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    decision: text("decision").notNull().default("not_applicable"),
    beforeHash: text("before_hash"),
    afterHash: text("after_hash"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    previousEventHash: text("previous_event_hash"),
    eventHash: text("event_hash").notNull(),
    activityLogId: uuid("activity_log_id").references(() => activityLog.id),
    runId: uuid("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companySequenceIdx: uniqueIndex("atlas_audit_events_company_sequence_idx").on(table.companyId, table.sequence),
    companyCreatedIdx: index("atlas_audit_events_company_created_idx").on(table.companyId, table.createdAt),
  }),
);
