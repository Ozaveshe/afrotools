"use strict";

const assert = require("assert");
const fs = require("fs");

const repair = require("../scripts/repair-english-workforce-search-snippets");

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 164, "two agriculture hubs, 108 agriculture country pages and 54 employee-cost pages must stay explicit");
assert.deepStrictEqual(result.stale, [], "English workforce snippet outputs must match their repair contract");

for (const target of repair.targets()) {
  const html = fs.readFileSync(target.file, "utf8");
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || "";
  const descriptionTag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0] || "";
  const description = descriptionTag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || "";
  assert.ok(title.length <= 65, target.file + " title must fit the search review guardrail");
  assert.ok(description.length >= 70 && description.length <= 180, target.file + " description must fit the useful snippet range");
  assert.match(description, /verify/i, target.file + " description must retain a verification boundary");
  if (target.family === "vaccination-schedule") {
    assert.doesNotMatch(description, /local vaccine prices|government campaign dates/i, target.file + " must not imply unverified live local data");
  }
}

console.log("English workforce search snippet repair tests passed");
