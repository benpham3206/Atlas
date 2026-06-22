export const atlasPackage = Object.freeze({
  name: "ontology-core",
  version: "0.0.0",
  description: "Shared Atlas types and runtime helpers."
});

export const BASE_RECORD_LIFECYCLES = Object.freeze([
  "candidate",
  "operational",
  "superseded",
  "archived"
]);

export const BASE_RECORD_REVIEW_STATES = Object.freeze([
  "unreviewed",
  "in_review",
  "approved",
  "rejected"
]);

export const BASE_RECORD_VISIBILITIES = Object.freeze([
  "private",
  "workspace",
  "public"
]);

export const BASE_RECORD_SCHEMA = Object.freeze({
  type: "object",
  required: [
    "id",
    "record_type",
    "workspace_id",
    "lifecycle",
    "review_state",
    "visibility",
    "source_refs",
    "created_at",
    "updated_at"
  ],
  additionalProperties: true,
  properties: {
    id: { type: "string" },
    record_type: { type: "string" },
    workspace_id: { type: "string" },
    title: { type: "string" },
    lifecycle: { type: "string", enum: BASE_RECORD_LIFECYCLES },
    review_state: { type: "string", enum: BASE_RECORD_REVIEW_STATES },
    visibility: { type: "string", enum: BASE_RECORD_VISIBILITIES },
    source_refs: { type: "array", items: { type: "string" } },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    created_by: { type: "string" },
    reviewed_at: { type: "string" },
    reviewed_by: { type: "string" },
    supersedes_record_id: { type: "string" },
    superseded_by_record_id: { type: "string" }
  }
});

export const RECORD_TYPE_SPECS = Object.freeze({
  domain: recordSpec("domain", ["name", "description", "focus_area"], {
    name: { type: "string" },
    description: { type: "string" },
    focus_area: { type: "string" }
  }),
  node: recordSpec("node", ["node_kind", "label"], {
    node_kind: { type: "string", enum: ["capability", "object", "state"] },
    label: { type: "string" }
  }),
  edge: recordSpec("edge", ["from_record_id", "to_record_id", "relation_type"], {
    from_record_id: { type: "string" },
    to_record_id: { type: "string" },
    relation_type: { type: "string" }
  }, {
    references: [
      { field: "from_record_id" },
      { field: "to_record_id" }
    ]
  }),
  statement: recordSpec("statement", ["statement_text"], {
    statement_text: { type: "string" },
    evidence_refs: { type: "array", items: { type: "string" } },
    evidence_exception: { type: "string" }
  }, {
    rules: ["statementEvidence"]
  }),
  source: recordSpec("source", ["source_type", "citation"], {
    source_type: { type: "string", enum: ["document", "url", "user_input", "system"] },
    citation: { type: "string" }
  }),
  evidence: recordSpec("evidence", ["statement_id", "source_id", "evidence_kind"], {
    statement_id: { type: "string" },
    source_id: { type: "string" },
    evidence_kind: { type: "string" }
  }, {
    references: [
      { field: "statement_id" },
      { field: "source_id" }
    ]
  }),
  context: recordSpec("context", ["scope", "assumptions"], {
    scope: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } }
  }),
  skill: recordSpec("skill", ["name", "prerequisites", "assessment_criteria"], {
    name: { type: "string" },
    prerequisites: { type: "array", items: { type: "string" } },
    assessment_criteria: { type: "array", items: { type: "string" } }
  }, {
    references: [{ field: "prerequisites", many: true }]
  }),
  task: recordSpec("task", ["objective", "status", "acceptance_criteria"], {
    objective: { type: "string" },
    status: { type: "string", enum: ["todo", "blocked", "in_progress", "done"] },
    acceptance_criteria: { type: "array", items: { type: "string" } },
    blocked_by: { type: "array", items: { type: "string" } },
    actionable: { type: "boolean" }
  }, {
    references: [{ field: "blocked_by", many: true }],
    rules: ["taskAcceptanceCriteria", "taskActionability"]
  }),
  assessment: recordSpec("assessment", ["rubric", "pass_condition"], {
    rubric: { type: "array", items: { type: "string" } },
    pass_condition: { type: "string" }
  }),
  project: recordSpec("project", ["goal", "constraints", "milestone_ids"], {
    goal: { type: "string" },
    constraints: { type: "array", items: { type: "string" } },
    milestone_ids: { type: "array", items: { type: "string" } }
  }, {
    references: [{ field: "milestone_ids", many: true }]
  }),
  artifact: recordSpec("artifact", ["artifact_type", "uri", "status"], {
    artifact_type: { type: "string", enum: ["file", "url", "generated"] },
    uri: { type: "string" },
    status: { type: "string", enum: ["draft", "accepted", "rejected"] }
  }),
  decision: recordSpec("decision", ["decision", "rationale", "tradeoffs"], {
    decision: { type: "string" },
    rationale: { type: "string" },
    tradeoffs: { type: "array", items: { type: "string" } }
  }),
  risk: recordSpec("risk", ["severity", "mitigation", "owner"], {
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    mitigation: { type: "string" },
    owner: { type: "string" }
  }),
  carbon_copy: recordSpec("carbon_copy", ["subject_ref", "consent_state", "default_visibility"], {
    subject_ref: { type: "string" },
    consent_state: { type: "string", enum: ["granted", "revoked", "unknown"] },
    default_visibility: { type: "string", enum: BASE_RECORD_VISIBILITIES }
  }),
  permission: recordSpec("permission", ["subject", "action", "resource", "scope"], {
    subject: { type: "string" },
    action: { type: "string" },
    resource: { type: "string" },
    scope: { type: "string" }
  }),
  agent: recordSpec("agent", ["allowed_tools", "scope"], {
    allowed_tools: { type: "array", items: { type: "string" } },
    scope: { type: "string" }
  }),
  action: recordSpec("action", ["target_record_type", "input_schema"], {
    target_record_type: { type: "string" },
    input_schema: { type: "object" }
  }),
  overlay: recordSpec("overlay", ["base_record_id", "overlay_workspace_id", "overlay_visibility"], {
    base_record_id: { type: "string" },
    overlay_workspace_id: { type: "string" },
    overlay_visibility: { type: "string", enum: BASE_RECORD_VISIBILITIES }
  }, {
    references: [{ field: "base_record_id" }],
    rules: ["overlayVisibility"]
  }),
  version: recordSpec("version", ["previous_record_id", "current_record_id", "change_summary"], {
    previous_record_id: { type: "string" },
    current_record_id: { type: "string" },
    change_summary: { type: "string" }
  }, {
    references: [{ field: "previous_record_id" }]
  })
});

export function createHealthStatus(service, timestamp) {
  const status = {
    status: "ok",
    service
  };

  if (timestamp) {
    status.timestamp = timestamp;
  }

  return status;
}

export function validateBaseRecord(record) {
  if (!isPlainObject(record)) {
    return {
      valid: false,
      errors: ["record must be an object"]
    };
  }

  const errors = [
    ...validateObjectProperties(BASE_RECORD_SCHEMA, record).errors
  ];

  for (const field of ["id", "record_type", "workspace_id"]) {
    errors.push(...validateNonEmptyString(`record.${field}`, record[field]));
  }

  for (const field of ["title", "created_by", "reviewed_by", "supersedes_record_id", "superseded_by_record_id"]) {
    if (Object.hasOwn(record, field)) {
      errors.push(...validateNonEmptyString(`record.${field}`, record[field]));
    }
  }

  if (typeof record.created_at === "string" && !isIsoTimestamp(record.created_at)) {
    errors.push("record.created_at must be an ISO timestamp");
  }

  if (typeof record.updated_at === "string" && !isIsoTimestamp(record.updated_at)) {
    errors.push("record.updated_at must be an ISO timestamp");
  }

  if (
    isIsoTimestamp(record.created_at) &&
    isIsoTimestamp(record.updated_at) &&
    Date.parse(record.updated_at) < Date.parse(record.created_at)
  ) {
    errors.push("record.updated_at must be at or after created_at");
  }

  if (Array.isArray(record.source_refs)) {
    const seenSourceRefs = new Set();

    record.source_refs.forEach((sourceRef, index) => {
      errors.push(...validateNonEmptyString(`record.source_refs[${index}]`, sourceRef));

      if (typeof sourceRef === "string" && sourceRef.trim() !== "") {
        if (seenSourceRefs.has(sourceRef)) {
          errors.push(`record.source_refs[${index}] duplicates ${sourceRef}`);
        }
        seenSourceRefs.add(sourceRef);
      }
    });
  }

  if (record.lifecycle === "operational" && record.review_state !== "approved") {
    errors.push("operational records must have review_state approved");
  }

  if (record.lifecycle === "operational" && Array.isArray(record.source_refs) && record.source_refs.length === 0) {
    errors.push("operational records must have at least one source_ref");
  }

  if (record.review_state === "approved") {
    if (!Object.hasOwn(record, "reviewed_by")) {
      errors.push("record.reviewed_by is required when review_state is approved");
    }

    if (!Object.hasOwn(record, "reviewed_at")) {
      errors.push("record.reviewed_at is required when review_state is approved");
    }
  }

  if (typeof record.reviewed_at === "string" && !isIsoTimestamp(record.reviewed_at)) {
    errors.push("record.reviewed_at must be an ISO timestamp");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRecord(record) {
  if (!isPlainObject(record)) {
    return {
      valid: false,
      errors: ["record must be an object"]
    };
  }

  const spec = RECORD_TYPE_SPECS[record.record_type];

  if (!spec) {
    return {
      valid: false,
      errors: [`record.record_type ${record.record_type} is not registered`]
    };
  }

  const errors = [
    ...validateBaseRecord(record).errors,
    ...validateObjectProperties(spec.schema, record).errors.map((error) => error.replace("properties.", `${record.record_type}.`)),
    ...validateSpecRules(record, spec)
  ];

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateRecordSet(records) {
  if (!Array.isArray(records)) {
    return {
      valid: false,
      errors: ["records must be an array"]
    };
  }

  const ids = new Set();
  const errors = [];

  for (const record of records) {
    if (!isPlainObject(record)) {
      errors.push("record must be an object");
      continue;
    }

    if (typeof record.id === "string") {
      if (ids.has(record.id)) {
        errors.push(`${record.id}: duplicate record id`);
      }
      ids.add(record.id);
    }
  }

  for (const record of records) {
    const prefix = isPlainObject(record) && typeof record.id === "string" ? `${record.id}: ` : "";
    const result = validateRecord(record);

    errors.push(...result.errors.map((error) => `${prefix}${error}`));

    if (isPlainObject(record)) {
      const spec = RECORD_TYPE_SPECS[record.record_type];
      if (spec) {
        errors.push(...validateReferences(record, spec, ids).map((error) => `${prefix}${error}`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateObjectProperties(schema, properties) {
  const errors = [];

  if (!isPlainObject(schema)) {
    return {
      valid: false,
      errors: ["schema must be an object"]
    };
  }

  if (schema.type !== "object") {
    errors.push("schema.type must be object");
  }

  if (!isPlainObject(properties)) {
    errors.push("properties must be an object");
  }

  const propertySchema = isPlainObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const value = isPlainObject(properties) ? properties : {};

  for (const name of required) {
    if (!Object.hasOwn(value, name)) {
      errors.push(`properties.${name} is required`);
    }
  }

  if (schema.additionalProperties === false) {
    for (const name of Object.keys(value)) {
      if (!Object.hasOwn(propertySchema, name)) {
        errors.push(`properties.${name} is not allowed`);
      }
    }
  }

  for (const [name, definition] of Object.entries(propertySchema)) {
    if (!Object.hasOwn(value, name)) {
      continue;
    }

    errors.push(...validateValue(`properties.${name}`, value[name], definition));
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function recordSpec(recordType, required, properties, options = {}) {
  return Object.freeze({
    record_type: recordType,
    schema: Object.freeze({
      type: "object",
      required,
      additionalProperties: true,
      properties
    }),
    references: Object.freeze(options.references ?? []),
    rules: Object.freeze(options.rules ?? [])
  });
}

function validateSpecRules(record, spec) {
  const errors = [];

  for (const rule of spec.rules) {
    switch (rule) {
      case "statementEvidence":
        if (!hasNonEmptyArray(record.evidence_refs) && !isNonEmptyString(record.evidence_exception)) {
          errors.push("statement records require evidence_refs or evidence_exception");
        }
        break;
      case "taskAcceptanceCriteria":
        if (Array.isArray(record.acceptance_criteria)) {
          record.acceptance_criteria.forEach((criterion, index) => {
            if (typeof criterion === "string" && !isMeasurableCriterion(criterion)) {
              errors.push(`task.acceptance_criteria[${index}] must be measurable`);
            }
          });
        }
        break;
      case "taskActionability":
        if (
          record.actionable === true &&
          (record.lifecycle !== "operational" || record.review_state !== "approved")
        ) {
          errors.push("task records can be actionable only when lifecycle is operational and review_state is approved");
        }
        break;
      case "overlayVisibility":
        if (record.overlay_visibility === "private" && record.visibility === "public") {
          errors.push("private overlays cannot have public visibility");
        }
        break;
      default:
        errors.push(`unknown validation rule ${rule}`);
    }
  }

  return errors;
}

function validateReferences(record, spec, ids) {
  const errors = [];

  for (const reference of spec.references) {
    const value = record[reference.field];

    if (reference.many) {
      if (!Array.isArray(value)) {
        continue;
      }

      value.forEach((item, index) => {
        if (typeof item === "string" && item !== "" && !ids.has(item)) {
          errors.push(`${reference.field}[${index}] references missing record ${item}`);
        }
      });
      continue;
    }

    if (typeof value === "string" && value !== "" && !ids.has(value)) {
      errors.push(`${reference.field} references missing record ${value}`);
    }
  }

  return errors;
}

function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => isNonEmptyString(item));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isMeasurableCriterion(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return /\d/.test(value) || /\b(all|at least|under|over|within|equals|less than|greater than)\b/i.test(value);
}

function validateNonEmptyString(path, value) {
  if (typeof value !== "string") {
    return [];
  }

  if (value.trim() === "") {
    return [`${path} must be a non-empty string`];
  }

  return [];
}

function isIsoTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateValue(path, value, definition) {
  if (!isPlainObject(definition)) {
    return [`${path} schema must be an object`];
  }

  const errors = [];

  if (definition.enum && !definition.enum.includes(value)) {
    errors.push(`${path} must be one of: ${definition.enum.join(", ")}`);
  }

  if (definition.type && !matchesJsonType(value, definition.type)) {
    errors.push(`${path} must be ${definition.type}`);
  }

  if (definition.type === "string" && typeof value === "string" && definition.minLength !== undefined) {
    if (value.length < definition.minLength) {
      errors.push(`${path} must be at least ${definition.minLength} characters`);
    }
  }

  if (definition.type === "array" && definition.items && Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...validateValue(`${path}[${index}]`, item, definition.items));
    });
  }

  return errors;
}

function matchesJsonType(value, type) {
  switch (type) {
    case "array":
      return Array.isArray(value);
    case "boolean":
      return typeof value === "boolean";
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "object":
      return isPlainObject(value);
    case "string":
      return typeof value === "string";
    case "null":
      return value === null;
    default:
      return false;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
