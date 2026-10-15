"use strict";

const assert = require("assert");
const fs = require("fs");

const audit = require("../scripts/audit-search-snippets");
const repair = require("../scripts/repair-english-country-directory-search-snippets");
const { metadata: socialMetadata } = require("../scripts/audit-social-metadata");

const sample = '<html lang="en"><head><title>Draft</title><meta name="description" content="Draft"><meta property="og:title" content="Draft"><meta property="og:description" content="Draft"><meta name="twitter:card" content="summary"><meta name="twitter:image" content="/existing.png"></head><body><button>Existing action</button></body></html>';
const sampleMetadata = { title: 'Côte d’Ivoire & "fees" | AfroTools', description: 'Confirm "fees" & costs of $& before action.', schemaName: 'Fee planning' };
const repairedSample = repair.apply(sample, sampleMetadata);
const sampleTags = socialMetadata(repairedSample);
assert.strictEqual(sampleTags["twitter:title"], sampleMetadata.title);
assert.strictEqual(sampleTags["twitter:description"], sampleMetadata.description);
assert.strictEqual(sampleTags["twitter:card"], "summary");
assert.strictEqual(sampleTags["twitter:image"], "/existing.png");
assert.strictEqual(repairedSample.slice(repairedSample.indexOf("<body>")), sample.slice(sample.indexOf("<body>")));
assert.strictEqual(repair.apply(repairedSample, sampleMetadata), repairedSample, "missing-card repair must be idempotent");
assert.strictEqual((repairedSample.match(/name="twitter:title"/g) || []).length, 1);
assert.strictEqual((repairedSample.match(/name="twitter:description"/g) || []).length, 1);

assert.strictEqual(repair.countryName("cote-d-ivoire"), "Côte d’Ivoire");
assert.strictEqual(repair.countryName("republic-of-congo"), "Congo - Brazzaville");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 160, "the five English country-directory families must remain explicitly governed");
assert.deepStrictEqual(result.stale, [], "English country-directory snippets must match their repair owner");

for (const target of repair.targets()) {
  const html = fs.readFileSync(target.file, "utf8");
  const metadata = audit.extractMetadata(html);
  const tags = socialMetadata(html);
  assert.strictEqual(tags["twitter:title"], metadata.title, target.file + " Twitter title must follow its maintained snippet");
  if (target.family !== "africa-conflict") assert.strictEqual(tags["twitter:description"], metadata.description, target.file + " Twitter description must follow its maintained snippet");
  assert.ok(metadata.title.length >= 30 && metadata.title.length <= 65, target.file + " title must remain descriptive and scannable");
  assert.doesNotMatch(metadata.title, /2026|Complete Directory|Market Rates by Skill|Timeline, Actors/i, target.file + " must not retain an unsupported or truncation-prone title claim");
  if (target.family !== "africa-conflict") {
    assert.ok(metadata.description.length >= 70 && metadata.description.length <= 180, target.file + " description must fit the useful snippet range");
    assert.match(metadata.description, /verify|confirm|planning/i, target.file + " must expose a verification boundary");
  }
}

console.log("English country-directory search snippet repair tests passed: 160 pages governed");
