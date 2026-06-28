export type AtlasServiceName = "atlas-api" | "atlas-web";

export type AtlasHealthStatus = {
  status: "ok";
  service: AtlasServiceName;
  timestamp?: string;
};

export type AtlasPackageMetadata = {
  name: "ontology-core";
  version: string;
  description: string;
};

export type BaseRecordLifecycle = "candidate" | "operational" | "superseded" | "archived";

export type BaseRecordReviewState = "unreviewed" | "in_review" | "approved" | "rejected";

export type BaseRecordVisibility = "private" | "workspace" | "public";

export type BaseRecord = {
  id: string;
  record_type: string;
  workspace_id: string;
  lifecycle: BaseRecordLifecycle;
  review_state: BaseRecordReviewState;
  visibility: BaseRecordVisibility;
  source_refs: string[];
  created_at: string;
  updated_at: string;
  title?: string;
  created_by?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  supersedes_record_id?: string;
  superseded_by_record_id?: string;
  [key: string]: unknown;
};

export type RecordType =
  | "domain"
  | "node"
  | "edge"
  | "statement"
  | "source"
  | "evidence"
  | "context"
  | "skill"
  | "task"
  | "assessment"
  | "project"
  | "artifact"
  | "decision"
  | "risk"
  | "carbon_copy"
  | "permission"
  | "agent"
  | "action"
  | "overlay"
  | "version";

export type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  items?: JsonSchema;
  additionalProperties?: boolean;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type RecordTypeSpec = {
  record_type: RecordType;
  schema: JsonSchema;
  references: readonly {
    field: string;
    many?: boolean;
  }[];
  rules: readonly string[];
};

export declare const atlasPackage: AtlasPackageMetadata;

export declare const BASE_RECORD_LIFECYCLES: readonly BaseRecordLifecycle[];

export declare const BASE_RECORD_REVIEW_STATES: readonly BaseRecordReviewState[];

export declare const BASE_RECORD_VISIBILITIES: readonly BaseRecordVisibility[];

export declare const BASE_RECORD_SCHEMA: JsonSchema;

export declare const RECORD_TYPE_SPECS: Readonly<Record<RecordType, RecordTypeSpec>>;

export type AuditEvent = {
  id: string;
  sequence: number;
  workspace_id: string;
  actor: string;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  decision: "allow" | "deny" | "not_applicable";
  before_hash: string | null;
  after_hash: string | null;
  metadata: Record<string, unknown>;
  previous_event_hash: string | null;
  event_hash: string;
  created_at: string;
};

export declare function canonicalJson(value: unknown): string;

export declare function sha256Hex(input: string): string;

export declare function auditEventHash(event: Record<string, unknown>): string;

export declare function verifyAuditEventChain(events: unknown): ValidationResult;

export declare function createHealthStatus(
  service: AtlasServiceName,
  timestamp?: string
): AtlasHealthStatus;

export declare function validateBaseRecord(record: unknown): ValidationResult;

export declare function validateRecord(record: unknown): ValidationResult;

export declare function validateRecordSet(records: unknown): ValidationResult;

export declare function validateObjectProperties(
  schema: JsonSchema,
  properties: Record<string, unknown>
): ValidationResult;
