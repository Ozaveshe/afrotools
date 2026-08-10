"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const contract = JSON.parse(read("data/localization/sw-creator-pricing-final.json"));
const page = read(contract.swahiliFile);
const controller = read("assets/js/pages/creative/sw-creator-pricing-calculator.js");
const workspace = read("assets/js/pages/creative/sw-creator-pricing-workspace.js");

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(read("engines/src/creator-pricing-engine.js"), sandbox);
const engine = sandbox.CreatorPricingEngine;
assert(engine && typeof engine.calculateRate === "function", "shared DOM-free engine loads");

const input = { craft: "photography", specialty: "Wedding", country: "TZ", city: "Dar es Salaam", experience: "established", currency: "TZS" };
const result = engine.calculateRate(input);
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.daily)), { min: 310000, max: 780000, median: 510000 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.hourly)), { min: 40000, max: 100000, median: 65000 });
assert.strictEqual(engine.getBreakdown("photography", result).length, 5);

for (const token of [
  'lang="sw"', 'data-creator-pricing', 'data-manual-quote', 'data-sw-creator-workspace',
  'data-json', 'data-txt', 'data-reset', 'data-quote-calculate', 'data-quote-reset',
  'https://afrotools.com/assets/img/tools/creator-pricing.webp',
  'https://afrotools.com/tools/creator-pricing/',
  '/assets/js/pages/creative/sw-creator-pricing-calculator.js',
  '/assets/js/pages/creative/sw-creator-pricing-workspace.js'
]) assert(page.includes(token), `page contract includes ${token}`);

for (const englishLeak of ["Calculate my rates", "Suggested daily rate", "Download JSON", "Copy summary", "Choose a craft and country"]) {
  assert(!page.includes(englishLeak), `visible page excludes ${englishLeak}`);
}

assert(controller.includes('locale: "sw"'), "JSON report is explicitly Swahili");
assert(controller.includes('new Blob([content]'), "JSON/TXT exports are real blobs");
assert(workspace.includes('new Blob([buildPlan()]'), "workspace TXT is a real blob");
assert(workspace.includes('file.size > 100000'), "local brief import is bounded");
assert(!controller.includes("fetch("), "benchmark controller is local-first");
assert(!workspace.includes("fetch("), "workspace controller is local-first");

const english = read("tools/creator-pricing/index.html");
assert(english.includes('hreflang="sw" href="https://afrotools.com/sw/zana/bei-za-mtayarishi/"'), "English route reciprocates Swahili hreflang");
assert(fs.statSync(path.join(root, contract.artwork.replace(/^\//, ""))).size > 1000, "dedicated artwork resolves");

console.log("Swahili creator-pricing final contracts passed");
