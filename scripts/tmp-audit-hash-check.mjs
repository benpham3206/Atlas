import { auditEventHash } from "../packages/ontology-core/src/index.js";

const recordId = "atlas_record_926c1a214bf0";
const afterHash = auditEventHash({ id: recordId, record_type: "source" });
const stored = "c0c87603ac71081cbf2f0b44576139fc8c5c7fa159513883601bd3f541ed7c40";

const variants = [
  {
    name: "with company_id + after_hash",
    body: {
      id: "a2d0fcbb-7ce4-4a21-b4bc-bf985b19c3da",
      company_id: "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9",
      sequence: 3,
      actor: "local-board",
      event_type: "knowledge.record.created",
      resource_type: "atlas_knowledge_record",
      resource_id: recordId,
      decision: "not_applicable",
      before_hash: null,
      after_hash: afterHash,
      metadata: {},
      previous_event_hash:
        "63743193888c66f5565f17e21e8ba861d2cd13b81f0330ef6c352d2d9b3aed10",
      created_at: "2026-07-02T21:58:53.035Z",
    },
  },
  {
    name: "no company_id",
    body: {
      id: "a2d0fcbb-7ce4-4a21-b4bc-bf985b19c3da",
      sequence: 3,
      actor: "local-board",
      event_type: "knowledge.record.created",
      resource_type: "atlas_knowledge_record",
      resource_id: recordId,
      decision: "not_applicable",
      before_hash: null,
      after_hash: afterHash,
      metadata: {},
      previous_event_hash:
        "63743193888c66f5565f17e21e8ba861d2cd13b81f0330ef6c352d2d9b3aed10",
      created_at: "2026-07-02T21:58:53.035Z",
    },
  },
  {
    name: "omit null optional fields",
    body: {
      id: "a2d0fcbb-7ce4-4a21-b4bc-bf985b19c3da",
      company_id: "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9",
      sequence: 3,
      actor: "local-board",
      event_type: "knowledge.record.created",
      resource_type: "atlas_knowledge_record",
      resource_id: recordId,
      decision: "not_applicable",
      after_hash: afterHash,
      metadata: {},
      previous_event_hash:
        "63743193888c66f5565f17e21e8ba861d2cd13b81f0330ef6c352d2d9b3aed10",
      created_at: "2026-07-02T21:58:53.035Z",
    },
  },
];

for (const v of variants) {
  const h = auditEventHash(v.body);
  console.log(v.name, h, h === stored ? "MATCH" : "");
}