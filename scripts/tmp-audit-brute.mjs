import { auditEventHash } from "../packages/ontology-core/src/index.js";

const stored = "c0c87603ac71081cbf2f0b44576139fc8c5c7fa159513883601bd3f541ed7c40";
const recordId = "atlas_record_926c1a214bf0";
const afterHash = auditEventHash({ id: recordId, record_type: "source" });
const companyId = "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";

const bases = [
  {
    id: "a2d0fcbb-7ce4-4a21-b4bc-bf985b19c3da",
    sequence: 3,
    actor: "local-board",
    event_type: "knowledge.record.created",
    resource_type: "atlas_knowledge_record",
    resource_id: recordId,
    decision: "not_applicable",
    before_hash: null,
    after_hash: afterHash,
    metadata: { record_type: "source" },
    previous_event_hash:
      "63743193888c66f5565f17e21e8ba861d2cd13b81f0330ef6c352d2d9b3aed10",
    created_at: "2026-07-02T21:58:53.035Z",
  },
];

for (const base of bases) {
  const variants = [
    ["company_id", { ...base, company_id: companyId }],
    ["workspace_id", { ...base, workspace_id: companyId }],
    ["omit before_hash", { ...base, company_id: companyId, before_hash: undefined }],
    ["meta with _atlas", { ...base, company_id: companyId, metadata: { ...base.metadata, _atlas_audit_created_at: base.created_at } }],
    ["empty meta", { ...base, company_id: companyId, metadata: {} }],
  ];
  for (const [name, body] of variants) {
    const h = auditEventHash(body);
    if (h === stored) console.log("MATCH", name, h);
  }
}
console.log("done, stored", stored);