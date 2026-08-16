"use strict";

const assert = require("assert");
const fs = require("fs");

const repair = require("../scripts/repair-english-legal-search-snippets");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 108, "both 54-country legal families must stay explicit");
assert.deepStrictEqual(result.stale, [], "English legal snippet outputs must match their repair contract");

for (const target of repair.targets()) {
  const html = fs.readFileSync(target.file, "utf8");
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || "";
  const descriptionTag = html.match(/<meta\b[^>]*name=[\"']description[\"'][^>]*>/i)?.[0] || "";
  const description = descriptionTag.match(/\bcontent=([\"'])([\s\S]*?)\1/i)?.[2] || "";
  assert.ok(title.length <= 65, target.file + " title must fit the review guardrail");
  assert.ok(description.length >= 70 && description.length <= 180, target.file + " description must fit the useful snippet range");
  assert.match(title, /^(?:Employment Contract|Tenancy Agreement) — /, target.file + " title must lead with the user task");
  assert.match(description, /^Draft an? /, target.file + " description must state the user action");
  assert.match(description, /review it under local law before signing\.$/, target.file + " description must retain the legal review boundary");
}

console.log("English legal search snippet repair tests passed");
