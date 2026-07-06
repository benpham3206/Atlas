#!/usr/bin/env node
const COMPANY = "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";
const API = "http://127.0.0.1:3100/api";
const RUN = process.env.PAPERCLIP_RUN_ID || "5347ec35-3469-4acd-a6e3-64082df55b3e";

const IDS = {
  entity: "atlas_record_8d9c0e04fca8",
  statement: "atlas_record_0d3e4efb1d04",
  source: "atlas_record_ee20894d947b",
  evidence: "atlas_record_325284160888",
  domain: "atlas_record_98f236a63a2f",
};

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Paperclip-Run-Id": RUN },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text}`);
  return json;
}

const statementText =
  "Public Atlas treats hash-chained audit verify (audit_valid true, event_count > 0) as a hard gate before canon promotion.";

// 1) Wire evidence_refs on statement (merge existing properties; drop evidence_exception)
const stmtBefore = await api("GET", `/companies/${COMPANY}/atlas/records/${IDS.statement}`);
const stmtProps = { ...(stmtBefore.properties ?? {}), statement_text: statementText, evidence_refs: [IDS.evidence] };
delete stmtProps.evidence_exception;
await api("PATCH", `/companies/${COMPANY}/atlas/records/${IDS.statement}`, { properties: stmtProps });

// 2) evidence_for graph link
await api("POST", `/companies/${COMPANY}/atlas/links`, {
  from_record_id: IDS.evidence,
  to_record_id: IDS.statement,
  link_type: "evidence_for",
});

// 3) domain contains entity edge record
const edge = await api("POST", `/companies/${COMPANY}/atlas/records`, {
  record_type: "edge",
  title: "ATL-7 domain contains audit verify entity (board pack)",
  lifecycle: "candidate",
  review_state: "unreviewed",
  properties: {
    from_record_id: IDS.domain,
    to_record_id: IDS.entity,
    relation_type: "contains",
  },
  source_refs: [IDS.source],
});

// 4) Editor review: approved (lifecycle stays candidate — Verifier promotes)
const pack = [IDS.source, IDS.evidence, IDS.statement, IDS.entity, IDS.domain, edge.id];
for (const id of pack) {
  const rec = await api("GET", `/companies/${COMPANY}/atlas/records/${id}`);
  await api("PATCH", `/companies/${COMPANY}/atlas/records/${id}`, {
    review_state: "approved",
    source_refs: rec.source_refs?.length ? rec.source_refs : [IDS.source],
  });
}

const verify = await api("GET", `/companies/${COMPANY}/atlas/audit/verify`);
const stmt = await api("GET", `/companies/${COMPANY}/atlas/records/${IDS.statement}`);
console.log(
  JSON.stringify(
    {
      ok: true,
      edge_id: edge.id,
      statement_evidence_refs: stmt.properties?.evidence_refs ?? stmt.evidence_refs,
      editor_reviewed: pack,
      verify,
    },
    null,
    2,
  ),
);