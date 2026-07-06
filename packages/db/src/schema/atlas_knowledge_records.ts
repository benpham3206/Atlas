import { pgTable, text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const atlasKnowledgeRecords = pgTable(
  "atlas_knowledge_records",
  {
    id: text("id").primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    recordType: text("record_type").notNull(),
    lifecycle: text("lifecycle").notNull().default("candidate"),
    reviewState: text("review_state").notNull().default("unreviewed"),
    visibility: text("visibility").notNull().default("workspace"),
    title: text("title"),
    properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
    sourceRefs: jsonb("source_refs").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("atlas_knowledge_records_company_idx").on(table.companyId),
    companyTypeIdx: index("atlas_knowledge_records_company_type_idx").on(table.companyId, table.recordType),
  }),
);

export const atlasKnowledgeLinks = pgTable(
  "atlas_knowledge_links",
  {
    id: text("id").primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    fromRecordId: text("from_record_id").notNull(),
    toRecordId: text("to_record_id").notNull(),
    linkType: text("link_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyFromIdx: index("atlas_knowledge_links_company_from_idx").on(table.companyId, table.fromRecordId),
  }),
);

export const atlasCompanyConfig = pgTable("atlas_company_config", {
  companyId: uuid("company_id").primaryKey().references(() => companies.id),
  governed: text("governed").notNull().default("true"),
  policies: jsonb("policies").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
