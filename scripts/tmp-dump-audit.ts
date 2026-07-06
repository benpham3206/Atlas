import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, asc } from "drizzle-orm";
import { atlasAuditEvents } from "@paperclipai/db/schema";

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
console.log(JSON.stringify(rows, null, 2));
await pool.end();