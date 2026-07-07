import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderStickPage } from "../src/render.js";
import { defaultStickRecordsPath, orderStickRecordsSummitFirst, readStickRecords } from "../src/stick.js";

function loadSeedRecords() {
  return JSON.parse(readFileSync(defaultStickRecordsPath(), "utf8")).records;
}

function renderedNodeOrder(html) {
  return [...html.matchAll(/id="node-([^"]+)"/g)].map((match) => match[1]);
}

function renderSeedHtml() {
  const seedResult = readStickRecords();
  assert.equal(seedResult.ok, true, JSON.stringify(seedResult.error));
  const orderResult = orderStickRecordsSummitFirst(seedResult.data.records);
  assert.equal(orderResult.ok, true, JSON.stringify(orderResult.error));
  return renderStickPage({
    ok: true,
    data: {
      ...seedResult.data,
      records: orderResult.data
    },
    error: null
  });
}

test("stick page renders summit-first topological order", () => {
  const html = renderSeedHtml();
  const order = renderedNodeOrder(html);
  const indexById = new Map(order.map((id, index) => [id, index]));

  for (const record of loadSeedRecords()) {
    for (const dependencyId of record.depends_on ?? []) {
      assert.ok(
        indexById.get(record.id) < indexById.get(dependencyId),
        `${record.id} must render above dependency ${dependencyId}`
      );
    }
  }
});

test("stick page renders all records with one card anchor per record", () => {
  const records = loadSeedRecords();
  const html = renderSeedHtml();
  const order = renderedNodeOrder(html);

  assert.equal(order.length, records.length);
  assert.equal(new Set(order).size, records.length);
  for (const record of records) {
    assert.match(html, new RegExp(`>${record.name}<`));
    assert.equal(order.filter((id) => id === record.id).length, 1);
  }
});

test("stick page renders a friendly error when the seed file is missing", () => {
  const missingPath = join(process.cwd(), "test", "missing-stick-records.json");
  const result = readStickRecords({ recordsPath: missingPath });
  const html = renderStickPage(result);

  assert.match(html, /Stick data unavailable/);
  assert.match(html, /missing_file/);
  assert.match(html, /The server is still running/);
});
