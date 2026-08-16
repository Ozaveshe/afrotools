"use strict";

const assert = require("assert");
const fs = require("fs");

const audit = require("../scripts/audit-search-snippets");
const repair = require("../scripts/repair-english-country-directory-search-snippets");

assert.strictEqual(repair.countryName("cote-d-ivoire"), "Côte d’Ivoire");
assert.strictEqual(repair.countryName("republic-of-congo"), "Congo - Brazzaville");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 160, "the five English country-directory families must remain explicitly governed");
assert.deepStrictEqual(result.stale, [], "English country-directory snippets must match their repair owner");

for (const target of repair.targets()) {
  const metadata = audit.extractMetadata(fs.readFileSync(target.file, "utf8"));
  assert.ok(metadata.title.length >= 30 && metadata.title.length <= 65, target.file + " title must remain descriptive and scannable");
  assert.doesNotMatch(metadata.title, /2026|Complete Directory|Market Rates by Skill|Timeline, Actors/i, target.file + " must not retain an unsupported or truncation-prone title claim");
  if (target.family !== "africa-conflict") {
    assert.ok(metadata.description.length >= 70 && metadata.description.length <= 180, target.file + " description must fit the useful snippet range");
    assert.match(metadata.description, /verify|confirm|planning/i, target.file + " must expose a verification boundary");
  }
}

console.log("English country-directory search snippet repair tests passed: 160 pages governed");
