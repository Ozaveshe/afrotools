"use strict";

const assert = require("assert");
const fs = require("fs");

const audit = require("../scripts/audit-search-snippets");
const repair = require("../scripts/repair-english-insurance-search-snippets");

assert.strictEqual(repair.metadataFor("car-insurance", "ghana").title, "Car Insurance Planner — Ghana | AfroTools");
assert.strictEqual(repair.metadataFor("workers-comp", "central-african-republic").title, "Workers' Comp Worksheet — Central African Republic | AfroTools");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 216, "four 54-country English insurance families must remain explicitly governed");
assert.deepStrictEqual(result.stale, [], "English insurance snippets must match their source owner");

for (const target of repair.targets()) {
  const metadata = audit.extractMetadata(fs.readFileSync(target.file, "utf8"));
  assert.ok(metadata.title.length <= 65, target.file + " title must keep task and country visible");
  assert.ok(metadata.description.length >= 70 && metadata.description.length <= 180, target.file + " description must fit the useful snippet range");
  assert.match(metadata.description, /Use your own inputs for /, target.file + " must state the user-input boundary");
}

console.log("English insurance search snippet repair tests passed");
