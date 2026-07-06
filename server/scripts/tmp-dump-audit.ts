import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { atlasAuditEvents } from "@paperclipai/db/schema";
import { auditEventHash } from "@paperclipai/ontology-core";

const pool = new pg.Pool({
  connectionString: "postgresql://paperclip:paperclip@127.0.0.1:54329/paperclip",
});
const db = drizzle(pool);
const companyId = "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
const rows = await db
  .select()
  .from(atlasAuditEvents)
  .where(eq(atlasAuditEvents.companyId, companyId))
  .orderBy(asc(atlasAuditEvents.sequence));

for (const row of rows) {
  const eventBody = {
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
    metadata: row.metadata ?? {},
    previous_event_hash: row.previousEventHash ?? null,
    created_at: row.createdAt.toISOString(),
  };
  const expected = auditEventHash(eventBody);
  console.log(
    JSON.stringify({
      seq: row.sequence,
      stored: row.eventHash,
      expected,
      match: expected === row.eventHash,
      created_at: eventBody.created_at,
      after_hash: row.afterHash,
    }),
  );
}
await pool.end();