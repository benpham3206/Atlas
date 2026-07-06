#!/usr/bin/env node
/**
 * ATL-7: seed one narrow proof-closed domain on the Paperclip company trunk.
 * Creates candidate records, attaches evidence, promotes to operational via lifecycle gate.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID ?? "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
const API = (process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const RUN_ID = process.env.PAPERCLIP_RUN_ID ?? "1fa0572f-9f9f-4705-94a7-f21321ac2a3b";

async function api(method, path, body) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Paperclip-Run-Id": RUN_ID,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function createRecord(payload) {
  return api("POST", `/companies/${COMPANY_ID}/atlas/records`, payload);
}

async function patchRecord(id, payload) {
  return api("PATCH", `/companies/${COMPANY_ID}/atlas/records/${id}`, payload);
}

async function createLink(payload) {
  return api("POST", `/companies/${COMPANY_ID}/atlas/links`, payload);
}

async function main() {
  const domainSlug = "atl7-proof-closed-lifecycle";

  const source = await createRecord({
    record_type: "source",
    title: "ATL-7 audit integration brick",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      source_type: "document",
      citation: "docs/bricks/2026-06-30-audit-activity-integration.md",
    },
    source_refs: [],
  });

  const entity = await createRecord({
    record_type: "node",
    title: "Atlas audit verify endpoint",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      node_kind: "object",
      label: "GET /companies/:id/atlas/audit/verify",
    },
    source_refs: [source.id],
  });

  const domain = await createRecord({
    record_type: "domain",
    title: "ATL-7 proof-closed flagship slice",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      name: domainSlug,
      description: "Narrow domain proving record → evidence → review → canon → audit chain.",
      focus_area: "public atlas proof closure",
    },
    source_refs: [source.id],
  });

  const statementText =
    "Public Atlas treats hash-chained audit verify (audit_valid true, event_count > 0) as a hard gate before canon promotion.";

  const statement = await createRecord({
    record_type: "statement",
    title: "Audit verify gate",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      statement_text: statementText,
      evidence_exception: "ATL-7: evidence record follows",
    },
    source_refs: [source.id],
  });

  const evidence = await createRecord({
    record_type: "evidence",
    title: "ATL-7 audit verify citation",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      statement_id: statement.id,
      source_id: source.id,
      evidence_kind: "requirement",
    },
    source_refs: [source.id],
  });

  await patchRecord(statement.id, {
    properties: {
      statement_text: statementText,
      evidence_refs: [evidence.id],
    },
  });

  const edge = await createRecord({
    record_type: "edge",
    title: "ATL-7 domain contains audit verify entity",
    lifecycle: "candidate",
    review_state: "unreviewed",
    properties: {
      from_record_id: domain.id,
      to_record_id: entity.id,
      relation_type: "contains",
    },
    source_refs: [source.id],
  });

  await createLink({
    from_record_id: evidence.id,
    to_record_id: statement.id,
    link_type: "evidence_for",
  });

  const promote = async (id, sourceRefs) => {
    await patchRecord(id, {
      review_state: "approved",
      lifecycle: "operational",
      source_refs: sourceRefs,
    });
  };

  await promote(source.id, [source.id]);
  await promote(evidence.id, [source.id]);
  await promote(statement.id, [source.id]);
  await promote(entity.id, [source.id]);
  await promote(domain.id, [source.id]);
  await promote(edge.id, [source.id]);

  const verify = await api("GET", `/companies/${COMPANY_ID}/atlas/audit/verify`);
  const records = await api("GET", `/companies/${COMPANY_ID}/atlas/records`);

  const packIds = new Set([
    source.id,
    entity.id,
    domain.id,
    statement.id,
    evidence.id,
    edge.id,
  ]);
  const packRecords = records.filter((r) => packIds.has(r.id));

  const fixturePath = join(ROOT, "tests/fixtures/atl-7-proof-closed-domain.json");
  const fixture = {
    domain_slug: domainSlug,
    company_id: COMPANY_ID,
    issue: "ATL-7",
    records: packRecords.map((r) => ({
      id: r.id,
      record_type: r.record_type,
      workspace_id: r.workspace_id,
      lifecycle: r.lifecycle,
      review_state: r.review_state,
      visibility: r.visibility,
      title: r.title,
      source_refs: r.source_refs,
      created_at: r.created_at,
      updated_at: r.updated_at,
      reviewed_by: "knowledge_editor",
      reviewed_at: r.updated_at,
      ...r.properties,
    })),
  };
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);

  const evidenceDir = join(ROOT, "docs/evidence");
  mkdirSync(evidenceDir, { recursive: true });
  const walkthrough = join(evidenceDir, "ATL-7-proof-closed-walkthrough.md");
  const md = `# ATL-7 proof-closed domain walkthrough

**Issue:** ATL-7 — Seed first proof-closed knowledge domain end-to-end  
**Company:** \`${COMPANY_ID}\`  
**Domain:** ${domainSlug}  
**Run:** \`${RUN_ID}\`

## Narrow domain

One flagship slice: **audit verify** as the entity, one governed **statement**, one **source** brick, one **evidence** link, domain **contains** entity.

## Trace: record → evidence → review → canon → audit

| Step | Action | Record id | Lifecycle / review |
|------|--------|-----------|-------------------|
| 1 | Create source (candidate) | \`${source.id}\` | candidate / unreviewed |
| 2 | Create entity node (candidate) | \`${entity.id}\` | candidate / unreviewed |
| 3 | Create domain (candidate) | \`${domain.id}\` | candidate / unreviewed |
| 4 | Create statement (candidate) | \`${statement.id}\` | candidate / unreviewed |
| 5 | Create evidence (candidate) | \`${evidence.id}\` | candidate / unreviewed |
| 6 | Link evidence → statement | \`evidence_for\` | graph edge |
| 7 | Patch statement \`evidence_refs\` | \`${statement.id}\` | ties statement to evidence |
| 8 | Promote source → **canon** | \`${source.id}\` | operational / approved |
| 9 | Promote evidence + statement + entity + domain + edge | see ids above | operational / approved (gate: approved + source_refs) |
| 10 | Audit verify | company chain | audit_valid=${verify.audit_valid}, event_count=${verify.event_count} |

## Lifecycle gate (no unevidenced canon)

Promotion to \`lifecycle: operational\` was rejected unless \`review_state: approved\` and non-empty \`source_refs\` (see \`server/src/atlas/knowledge-service.ts\` \`patchRecord\`). Statements require \`evidence_refs\` or \`evidence_exception\` at create time (\`packages/atlas-ontology\`).

## Verification commands

\`\`\`bash
curl -sS "${API}/api/companies/${COMPANY_ID}/atlas/audit/verify"
npm run validate:records -- tests/fixtures/atl-7-proof-closed-domain.json
\`\`\`

## Fixture export

Exported pack: \`tests/fixtures/atl-7-proof-closed-domain.json\` (${packRecords.length} records).

## Audit snapshot (this run)

\`\`\`json
${JSON.stringify(verify, null, 2)}
\`\`\`
`;
  writeFileSync(walkthrough, md);

  console.log(
    JSON.stringify(
      {
        ok: true,
        domain_slug: domainSlug,
        ids: {
          source: source.id,
          entity: entity.id,
          domain: domain.id,
          statement: statement.id,
          evidence: evidence.id,
          edge: edge.id,
        },
        verify,
        fixture: fixturePath,
        walkthrough,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});