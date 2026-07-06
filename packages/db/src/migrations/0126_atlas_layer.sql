CREATE TABLE IF NOT EXISTS "atlas_company_config" (
  "company_id" uuid PRIMARY KEY NOT NULL REFERENCES "companies"("id"),
  "governed" text DEFAULT 'true' NOT NULL,
  "policies" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "atlas_knowledge_records" (
  "id" text PRIMARY KEY NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "record_type" text NOT NULL,
  "lifecycle" text DEFAULT 'candidate' NOT NULL,
  "review_state" text DEFAULT 'unreviewed' NOT NULL,
  "visibility" text DEFAULT 'workspace' NOT NULL,
  "title" text,
  "properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "atlas_knowledge_records_company_idx" ON "atlas_knowledge_records" ("company_id");
CREATE INDEX IF NOT EXISTS "atlas_knowledge_records_company_type_idx" ON "atlas_knowledge_records" ("company_id", "record_type");

CREATE TABLE IF NOT EXISTS "atlas_knowledge_links" (
  "id" text PRIMARY KEY NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "from_record_id" text NOT NULL,
  "to_record_id" text NOT NULL,
  "link_type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "atlas_knowledge_links_company_from_idx" ON "atlas_knowledge_links" ("company_id", "from_record_id");

CREATE TABLE IF NOT EXISTS "atlas_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "sequence" integer NOT NULL,
  "actor" text NOT NULL,
  "event_type" text NOT NULL,
  "resource_type" text,
  "resource_id" text,
  "decision" text DEFAULT 'not_applicable' NOT NULL,
  "before_hash" text,
  "after_hash" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "previous_event_hash" text,
  "event_hash" text NOT NULL,
  "activity_log_id" uuid REFERENCES "activity_log"("id"),
  "run_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "atlas_audit_events_company_sequence_idx" ON "atlas_audit_events" ("company_id", "sequence");
CREATE INDEX IF NOT EXISTS "atlas_audit_events_company_created_idx" ON "atlas_audit_events" ("company_id", "created_at");
