"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));

function read(relPath) {
  const file = path.join(ROOT, relPath);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function assertIncludes(html, needle, label, file) {
  assert.ok(html.includes(needle), `${label} missing from ${file}: ${needle}`);
}

const nigeriaPage = read("tools/solar-roi/nigeria/index.html");
for (const [needle, label] of [
  ['<h2 id="compare-sizes-title">Compare system sizes</h2>', "country compare system sizes heading"],
  ['class="solar-size-table-wrap"', "horizontal table wrapper"],
  ['class="solar-size-table"', "comparison table"],
  ['id="systemSizeComparisonStatus" aria-live="polite"', "comparison live caption"],
  ['id="systemSizeComparisonBody"', "comparison table body"],
  ["System size", "system size column"],
  ["Estimated cost", "cost column"],
  ["Monthly generation", "generation column"],
  ["Monthly savings", "savings column"],
  ["Payback", "payback column"],
  ["Panel count", "panel column"],
  ["Roof area", "roof column"],
  ["Battery fit", "battery fit column"],
  ["Best for", "best-for column"],
  ["SYSTEM_SIZE_OPTIONS=[1,2,3,5,10,20]", "comparison size options"],
  ["renderSystemSizeComparison(inputs,kw,batteryOption,maintenancePct,includeFinance)", "comparison render call"],
  ["selectedSystemPanelCount", "engine panel-count output"],
  ["selectedSystemRoofAreaSqm", "engine roof-area output"],
  [".solar-size-table-wrap{max-width:100%;overflow-x:auto", "mobile horizontal scroll wrapper"],
  [".solar-size-table-wrap>.solar-size-table{display:table;width:max-content;min-width:820px", "mobile horizontal scroll table sizing"],
  [".solar-size-table tbody th{position:sticky;left:0", "sticky first column"],
  ["solar-size-badge", "recommended badge"],
]) {
  assertIncludes(nigeriaPage.html, needle, label, nigeriaPage.file);
}

for (const country of Object.values(dataset.countries)) {
  const relPath = `tools/solar-roi/${country.slug}/index.html`;
  const page = read(relPath);
  assertIncludes(page.html, '<h2 id="compare-sizes-title">Compare system sizes</h2>', "country compare system sizes heading", page.file);
  assertIncludes(page.html, 'id="systemSizeComparisonBody"', "country compare system sizes body", page.file);
  assertIncludes(page.html, "Estimated cost", "country comparison cost column", page.file);
  assertIncludes(page.html, "Monthly generation", "country comparison generation column", page.file);
  assertIncludes(page.html, "Battery fit", "country comparison battery-fit column", page.file);
  assertIncludes(page.html, "Best for", "country comparison best-for column", page.file);
}

console.log(`Solar ROI system size comparison checks passed for ${Object.keys(dataset.countries).length} country pages.`);
