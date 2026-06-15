import { readFile } from "node:fs/promises";
import { validateRecordSet } from "../packages/ontology-core/src/index.js";

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: node scripts/validate-records.js <fixture.json> [...]");
  process.exit(1);
}

const allErrors = [];
let count = 0;

for (const file of files) {
  let parsed;

  try {
    parsed = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    allErrors.push(`${file}: ${error.message}`);
    continue;
  }

  const records = Array.isArray(parsed) ? parsed : parsed.records;
  const result = validateRecordSet(records);

  if (Array.isArray(records)) {
    count += records.length;
  }

  allErrors.push(...result.errors.map((error) => `${file}: ${error}`));
}

if (allErrors.length > 0) {
  console.error(allErrors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${count} records`);
