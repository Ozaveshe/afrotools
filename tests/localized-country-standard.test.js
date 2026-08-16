"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { countryRows, MARKER } = require("../scripts/lib/localized-country-standard");

const ROOT = path.resolve(__dirname, "..");
for (const [script,args] of [["scripts/build-french-product-surface.js",["--check"]],["scripts/build-swahili-product-surface.js",[]]]) {
  const result=spawnSync(process.execPath,[path.join(ROOT,script),...args],{cwd:ROOT,encoding:"utf8"});
  assert.strictEqual(result.status,0,`${script}:\n${result.stdout}\n${result.stderr}`);
}

const rows=countryRows();
assert.strictEqual(rows.length,47,"exact 47-country bilingual indexable denominator");
for(const row of rows){
  for(const locale of ["fr","sw"]){
    const record=row[locale];
    const html=fs.readFileSync(path.join(ROOT,record.ownerFile),"utf8");
    assert.strictEqual((html.match(new RegExp(MARKER,"g"))||[]).length,1,`${record.ownerFile}: one standard block`);
    assert.match(html,/"@type"\s*:\s*"FAQPage"/,`${record.ownerFile}: FAQ schema`);
    assert.match(html,/localized-country-standard__form/,`${record.ownerFile}: country search handoff`);
    assert.match(html,/localized-country-standard__links/,`${record.ownerFile}: discovery links`);
  }
}
const report=require("../reports/localized-non-app-parity.json");
assert.deepStrictEqual(report.byClass["country-hub"].fr,{pass:47,underStandard:0,missing:7},"fr: country contract");
assert.deepStrictEqual(report.byClass["country-hub"].sw,{pass:54,underStandard:0,missing:0},"sw: country contract");
console.log("Localized country standard passed for 47 bilingual indexable pairs; all 54 Swahili country hubs remain covered.");
