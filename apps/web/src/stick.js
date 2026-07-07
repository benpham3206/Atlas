import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveRepoRoot } from "./read-local-mcp-session.js";

const COMPONENT = "stick_page";

function structuredStickError(failureType, rootCause, cause) {
  return {
    component: COMPONENT,
    failure_type: failureType,
    root_cause: rootCause,
    ...(cause?.message ? { message: cause.message } : {})
  };
}

export function defaultStickRecordsPath(repoRoot = resolveRepoRoot()) {
  return join(repoRoot, "outputs", "seeds", "rebuild-stick-to-euv.records.json");
}

export function readStickRecords(options = {}) {
  const recordsPath = options.recordsPath ?? defaultStickRecordsPath(options.repoRoot);

  try {
    const raw = readFileSync(recordsPath, "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data.records)) {
      return {
        ok: false,
        data: null,
        error: structuredStickError(
          "invalid_shape",
          "records must be an array in rebuild-stick-to-euv.records.json"
        )
      };
    }

    return {
      ok: true,
      data: { ...data, source_path: recordsPath },
      error: null
    };
  } catch (error) {
    const failureType =
      error?.code === "ENOENT"
        ? "missing_file"
        : error instanceof SyntaxError
          ? "invalid_json"
          : "read_file_error";
    const rootCause =
      failureType === "missing_file"
        ? `Stick seed file not found at ${recordsPath}`
        : failureType === "invalid_json"
          ? `Stick seed file is not valid JSON at ${recordsPath}`
          : `Stick seed file could not be read at ${recordsPath}`;

    return {
      ok: false,
      data: null,
      error: structuredStickError(failureType, rootCause, error)
    };
  }
}

export function orderStickRecordsSummitFirst(records) {
  try {
    const byId = new Map(records.map((record) => [record.id, record]));
    const state = new Map();
    const orderedDependenciesFirst = [];

    function visit(record, stack = []) {
      const currentState = state.get(record.id);
      if (currentState === "done") {
        return null;
      }
      if (currentState === "visiting") {
        return structuredStickError(
          "cycle_detected",
          `Dependency cycle detected: ${[...stack, record.id].join(" -> ")}`
        );
      }

      state.set(record.id, "visiting");
      const dependencies = Array.isArray(record.depends_on) ? record.depends_on : [];
      for (const dependencyId of dependencies) {
        const dependency = byId.get(dependencyId);
        if (!dependency) {
          return structuredStickError(
            "missing_dependency",
            `Record ${record.id} depends on missing record ${dependencyId}`
          );
        }

        const dependencyError = visit(dependency, [...stack, record.id]);
        if (dependencyError) {
          return dependencyError;
        }
      }

      state.set(record.id, "done");
      orderedDependenciesFirst.push(record);
      return null;
    }

    for (const record of records) {
      if (!record?.id) {
        return {
          ok: false,
          data: null,
          error: structuredStickError("invalid_record", "Every stick record must have an id")
        };
      }

      const error = visit(record);
      if (error) {
        return { ok: false, data: null, error };
      }
    }

    return {
      ok: true,
      data: orderedDependenciesFirst.reverse(),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: structuredStickError("topology_error", "Stick dependency order could not be computed", error)
    };
  }
}
