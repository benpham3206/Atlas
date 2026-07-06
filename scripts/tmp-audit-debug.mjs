import pg from "pg";
import { auditEventHash } from "@atlas/atlas-ontology";

const companyId = process.argv[2] ?? "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
const conn = process.env.DATABASE_URL ?? "postgresql://127.0.0.1:54329/paperclip";
const client = new pg.Client({ connectionString: conn });
await client.connect();
const { rows } = await client.query(
  "SELECT * FROM atlas_audit_events WHERE company_id=$1 ORDER BY sequence LIMIT 2",
  [companyId],
);

for (const row of rows) {
  const rawMeta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const storedCreated = rawMeta._atlas_audit_created_at;
  const createdFromRow = new Date(row.created_at).toISOString();
  const { _atlas_audit_created_at, ...metadata } = rawMeta;
  const verifyPath = {
    id: row.id,
    company_id: row.company_id,
    sequence: row.sequence,
    actor: row.actor,
    event_type: row.event_type,
    resource_type: row.resource_type ?? null,
    resource_id: row.resource_id ?? null,
    decision: row.decision,
    before_hash: row.before_hash ?? null,
    after_hash: row.after_hash ?? null,
    metadata,
    previous_event_hash: row.previous_event_hash ?? null,
    created_at: typeof storedCreated === "string" ? storedCreated : createdFromRow,
  };
  const withMetaInHash = {
    ...verifyPath,
    metadata: rawMeta,
    created_at: createdFromRow,
  };
  const noCompany = { ...verifyPath };
  delete noCompany.company_id;
  console.log(
    JSON.stringify(
      {
        seq: row.sequence,
        stored: row.event_hash,
        expVerify: auditEventHash(verifyPath),
        expMetaInHash: auditEventHash(withMetaInHash),
        expNoCompany: auditEventHash(noCompany),
        storedCreated,
        createdFromRow,
        metaKeys: Object.keys(rawMeta),
      },
      null,
      2,
    ),
  );
}
await client.end();