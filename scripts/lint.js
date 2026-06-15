import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const INCLUDED_DIRS = [".github", "apps", "docs", "infra", "packages", "scripts", "tests"];
const TEXT_EXTENSIONS = new Set([".js", ".json", ".md", ".sql", ".yml"]);

const errors = [];

for (const file of listFiles(ROOT)) {
  const relativePath = relative(ROOT, file);

  if (relativePath.includes("node_modules/")) {
    continue;
  }

  const extension = file.slice(file.lastIndexOf("."));

  if (!TEXT_EXTENSIONS.has(extension)) {
    continue;
  }

  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    if (/[ \t]$/.test(line)) {
      errors.push(`${relativePath}:${index + 1} has trailing whitespace`);
    }
  });

  if (extension === ".js") {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8"
    });

    if (result.status !== 0) {
      errors.push(`${relativePath} failed syntax check:\n${result.stderr.trim()}`);
    }
  }

  if (extension === ".json") {
    try {
      JSON.parse(text);
    } catch (error) {
      errors.push(`${relativePath} is invalid JSON: ${error.message}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Lint passed");

function listFiles(root) {
  const files = [];

  for (const dir of INCLUDED_DIRS) {
    const absoluteDir = join(root, dir);

    try {
      visit(absoluteDir, files);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return files;
}

function visit(path, files) {
  const stat = statSync(path);

  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      visit(join(path, entry), files);
    }
    return;
  }

  if (stat.isFile()) {
    files.push(path);
  }
}
