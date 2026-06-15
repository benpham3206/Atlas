import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export function verifyMigrations(options = {}) {
  const root = options.root ?? new URL("..", import.meta.url).pathname;
  const migrationsDir = options.migrationsDir ?? join(root, "infra", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const errors = [];
  const tableNames = new Map();

  if (files.length === 0) {
    errors.push("No SQL migration files found");
  }

  files.forEach((file, index) => {
    const expectedPrefix = String(index + 1).padStart(4, "0");

    if (!file.startsWith(`${expectedPrefix}_`)) {
      errors.push(`${file} should start with ${expectedPrefix}_`);
    }

    if (!/^\d{4}_[a-z0-9_]+\.sql$/.test(file)) {
      errors.push(`${file} must use the format 0001_descriptive_name.sql`);
    }

    const path = join(migrationsDir, file);
    const sql = readFileSync(path, "utf8").trim();

    if (!sql) {
      errors.push(`${file} is empty`);
      return;
    }

    if (!sql.endsWith(";")) {
      errors.push(`${file} must end with a semicolon`);
    }

    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      const tableMatch = statement.match(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\b/i);

      if (tableMatch) {
        const tableName = tableMatch[1].toLowerCase();
        const previousFile = tableNames.get(tableName);

        if (previousFile) {
          errors.push(`${file} creates duplicate table ${tableName}; first created in ${previousFile}`);
        } else {
          tableNames.set(tableName, file);
        }
      }
    }
  });

  return {
    ok: errors.length === 0,
    files,
    errors
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyMigrations();

  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }

  console.log(`Verified ${result.files.length} migration files`);
}
