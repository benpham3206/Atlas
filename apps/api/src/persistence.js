import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function loadSnapshot(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  const raw = readFileSync(filePath, "utf8").trim();

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}

export function saveSnapshot(filePath, snapshot) {
  const directory = dirname(filePath);

  if (directory && !existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const temporaryPath = `${filePath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, filePath);
}

export function createFilePersistence(filePath) {
  return {
    filePath,
    load: () => loadSnapshot(filePath),
    save: (snapshot) => saveSnapshot(filePath, snapshot)
  };
}
