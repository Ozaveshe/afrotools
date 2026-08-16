"use strict";

const assert = require("assert");
const fs = require("fs");

const audit = require("../scripts/audit-search-snippets");
const repair = require("../scripts/repair-english-search-snippets");

assert.strictEqual(repair.metadataFor("ghana").title, "Export Documents — Ghana | AfroTools");
assert.strictEqual(repair.metadataFor("cote-d-ivoire").title, "Export Documents — Côte d'Ivoire | AfroTools");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 54, "all 54 English agricultural export-document country pages must stay source-owned");
assert.deepStrictEqual(result.stale, [], "English export-document snippet outputs must match their repair owner");

for (const target of repair.targets()) {
  const metadata = audit.extractMetadata(fs.readFileSync(target.file, "utf8"));
  assert.ok(metadata.title.length <= 65, `${target.file} title must keep the country and task visible`);
  assert.ok(metadata.description.length >= 70 && metadata.description.length <= 180, `${target.file} description must be concise and useful`);
  assert.match(metadata.title, /^Export Documents — /, `${target.file} must lead with the search task`);
  assert.match(metadata.description, /phytosanitary and origin documents/, `${target.file} must describe the checklist scope`);
}

console.log("English search snippet repair tests passed");
