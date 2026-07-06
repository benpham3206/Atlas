import { createDb } from "@paperclipai/db";
import { rebuildAtlasAuditChainHashes } from "../src/atlas/knowledge-service.js";

const companyId = process.argv[2] ?? "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
const url =
  process.env.DATABASE_URL?.trim() ??
  "postgresql://paperclip:paperclip@127.0.0.1:54329/paperclip";

const db = createDb(url);
const result = await rebuildAtlasAuditChainHashes(db, companyId);
console.log(JSON.stringify(result, null, 2));
process.exit(result.audit_valid ? 0 : 1);