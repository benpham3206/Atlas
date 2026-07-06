import { describe, expect, it } from "vitest";
import {
  atlasAuditEvents,
  atlasCompanyConfig,
  atlasKnowledgeLinks,
  atlasKnowledgeRecords,
} from "@paperclipai/db";
import { atlasKnowledgeService } from "../src/atlas/knowledge-service.ts";

const companyId = "0929ce91-b5bc-44b3-8ac2-9000f9a1eba9";

type FakeState = {
  configs: unknown[];
  records: unknown[];
  links: unknown[];
  audits: Array<{ sequence: number; eventHash: string } & Record<string, unknown>>;
};

function sequenceConflict() {
  const error = new Error("duplicate key value violates unique constraint atlas_audit_events_company_sequence_idx") as Error & {
    code: string;
    constraint: string;
  };
  error.code = "23505";
  error.constraint = "atlas_audit_events_company_sequence_idx";
  return error;
}

function cloneState(state: FakeState): FakeState {
  return {
    configs: [...state.configs],
    records: [...state.records],
    links: [...state.links],
    audits: [...state.audits],
  };
}

function makeFakeDb(options: { failAuditInserts?: number } = {}) {
  const state: FakeState = {
    configs: [{ companyId, governed: "true", policies: {} }],
    records: [],
    links: [],
    audits: [],
  };
  let auditFailuresRemaining = options.failAuditInserts ?? 0;
  let transactionCount = 0;

  function makeClient(target: FakeState): any {
    return {
      select() {
        return {
          from(table: unknown) {
            return {
              where() {
                return this;
              },
              orderBy() {
                return this;
              },
              limit() {
                if (table === atlasCompanyConfig) {
                  return Promise.resolve(target.configs.slice(0, 1));
                }
                if (table === atlasAuditEvents) {
                  return Promise.resolve(
                    [...target.audits]
                      .sort((left, right) => right.sequence - left.sequence)
                      .slice(0, 1),
                  );
                }
                return Promise.resolve([]);
              },
            };
          },
        };
      },
      insert(table: unknown) {
        return {
          values(value: Record<string, unknown>) {
            const insertRow = () => {
              if (table === atlasKnowledgeRecords) {
                target.records.push(value);
              } else if (table === atlasKnowledgeLinks) {
                target.links.push(value);
              } else if (table === atlasAuditEvents) {
                if (auditFailuresRemaining > 0) {
                  auditFailuresRemaining -= 1;
                  throw sequenceConflict();
                }
                target.audits.push(value as FakeState["audits"][number]);
              } else if (table === atlasCompanyConfig) {
                target.configs.push(value);
              }
              return value;
            };
            return {
              returning() {
                return Promise.resolve([insertRow()]);
              },
              then(resolve: (value: unknown) => void, reject: (error: unknown) => void) {
                try {
                  resolve(insertRow());
                } catch (error) {
                  reject(error);
                }
              },
            };
          },
        };
      },
      update() {
        return {
          set() {
            return {
              where() {
                return {
                  returning() {
                    return Promise.resolve([]);
                  },
                };
              },
            };
          },
        };
      },
      async transaction(callback: (tx: unknown) => Promise<unknown>) {
        transactionCount += 1;
        const staged = cloneState(state);
        const result = await callback(makeClient(staged));
        state.configs = staged.configs;
        state.records = staged.records;
        state.links = staged.links;
        state.audits = staged.audits;
        return result;
      },
      state,
      get transactionCount() {
        return transactionCount;
      },
    };
  }

  return makeClient(state);
}

describe("atlasKnowledgeService atomic audit mutations", () => {
  it("rolls back a record insert when audit append fails", async () => {
    const db = makeFakeDb({ failAuditInserts: 2 });
    const service = atlasKnowledgeService(db);

    await expect(
      service.createRecord(
        companyId,
        {
          record_type: "source",
          title: "Rollback proof",
          properties: {
            source_type: "url",
            citation: "fixture://rollback",
            summary: "audit failure should roll back the mutation",
          },
          source_refs: ["fixture://rollback"],
        },
        { type: "user", actorId: "local-board" },
      ),
    ).rejects.toMatchObject({ status: 409, code: "audit_sequence_conflict" });

    expect(db.transactionCount).toBe(2);
    expect(db.state.records).toHaveLength(0);
    expect(db.state.audits).toHaveLength(0);
  });

  it("retries once on audit sequence unique conflicts and commits mutation plus audit together", async () => {
    const db = makeFakeDb({ failAuditInserts: 1 });
    const service = atlasKnowledgeService(db);

    const record = await service.createRecord(
      companyId,
      {
        record_type: "source",
        title: "Retry proof",
        properties: {
          source_type: "url",
          citation: "fixture://retry",
          summary: "retry should commit one record and one audit event",
        },
        source_refs: ["fixture://retry"],
      },
      { type: "user", actorId: "local-board" },
    );

    expect(record.title).toBe("Retry proof");
    expect(db.transactionCount).toBe(2);
    expect(db.state.records).toHaveLength(1);
    expect(db.state.audits).toHaveLength(1);
    expect(db.state.audits[0].resourceId).toBe(record.id);
  });
});
