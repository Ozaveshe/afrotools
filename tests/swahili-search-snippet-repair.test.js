"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const audit = require("../scripts/audit-search-snippets");
const repair = require("../scripts/repair-swahili-search-snippets");

assert.strictEqual(repair.metadataFor("kenya", "kikokotoo-kodi-mshahara").title, "Kodi ya Mshahara — Kenya | AfroTools");
assert.strictEqual(repair.metadataFor("dr-congo", "kikokotoo-gharama-ya-mfanyakazi").title, "Gharama ya Mfanyakazi — Kongo-Kinshasa | AfroTools");

const result = repair.run({ write: false });
assert.ok(result.targets >= 49, "the five Swahili country-employment families must remain explicitly governed");
assert.deepStrictEqual(result.stale, [], "Swahili country-employment snippets must match their source owner");

for (const target of repair.targets()) {
  const html = fs.readFileSync(target.file, "utf8");
  const metadata = audit.extractMetadata(html);
  assert.match(html, /<html\b[^>]*lang="sw"/i, target.file + " must remain Swahili");
  assert.ok(metadata.title.length <= 65, target.file + " title must retain the task and country before truncation");
  assert.match(metadata.title, /— .+ \| AfroTools$/, target.file + " title must separate task and country");
}

const SEARCH_DESCRIPTION_FILES = [
  "sw/diaspora/index.html",
  "sw/tafuta/index.html",
  "sw/zana/bajeti-ya-shamba/index.html",
  "sw/zana/bima-ya-mazao/index.html",
  "sw/zana/faida-ya-kilimo/index.html",
  "sw/zana/gharama-za-mavazi-ya-kimila/index.html",
  "sw/zana/kalenda-ya-kupanda-mazao/index.html",
  "sw/zana/kigeuzi-cha-ukubwa-wa-shamba/index.html",
  "sw/zana/kikokotoo-cha-ushirika/index.html",
  "sw/zana/kikokotoo-kahawa/index.html",
  "sw/zana/kikokotoo-mbolea-rahisi/index.html",
  "sw/zana/kikokotoo-trekta/index.html",
  "sw/zana/kubadilisha-format-ya-picha/index.html",
  "sw/zana/matumizi-ya-umeme-ya-vifaa/index.html",
  "sw/zana/mavuno-ya-mazao/index.html",
  "sw/zana/mpangilio-wa-mzunguko-wa-mazao/index.html",
  "sw/zana/ph-ya-udongo/index.html",
  "sw/zana/resize-ya-mtayarishi/index.html"
];

for (const relativeFile of SEARCH_DESCRIPTION_FILES) {
  const file = path.join(__dirname, "..", relativeFile);
  const metadata = audit.extractMetadata(fs.readFileSync(file, "utf8"));
  assert.ok(metadata.description.length >= 70, relativeFile + " must explain the task or verification boundary in its search snippet");
  assert.ok(metadata.description.length <= 180, relativeFile + " search description must remain scannable");
}

console.log("Swahili search snippet repair tests passed: employment titles and 18 thin descriptions governed");
