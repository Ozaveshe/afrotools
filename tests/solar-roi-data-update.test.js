"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));

function read(relPath) {
  const file = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(file), `Missing file: ${file}`);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function assertIncludes(html, needle, label, file) {
  assert.ok(html.includes(needle), `${label} missing in ${file}: ${needle}`);
}

const countries = Object.values(dataset.countries);
assert.strictEqual(countries.length, 54, "Solar ROI dataset should contain 54 countries");

const nigeria = read("tools/solar-roi/nigeria/index.html");
for (const [needle, label] of [
  ['id="data-update-panel"', "data update panel"],
  ["Suggest updated tariff", "tariff update action"],
  ["Suggest updated fuel price", "fuel price update action"],
  ["Suggest install cost correction", "install cost update action"],
  ["Suggest source link", "source link update action"],
  ['id="dataUpdateField"', "field selector"],
  ['id="dataUpdateCurrent"', "current value field"],
  ['id="dataUpdateSuggested"', "suggested value field"],
  ['id="dataUpdateSourceUrl"', "source URL field"],
  ['id="dataUpdateNote"', "user note field"],
  ['id="dataUpdateStatus" aria-live="polite"', "announced data update status"],
  ["DATA_UPDATE_STORAGE_KEY", "data update local storage key"],
  ["buildDataUpdateSuggestion", "structured data update builder"],
  ["country:DEFAULTS.countryName", "stored country"],
  ["field:field", "stored field"],
  ["currentValue:val(\"dataUpdateCurrent\")", "stored current value"],
  ["suggestedValue:val(\"dataUpdateSuggested\").trim()", "stored suggested value"],
  ["sourceUrl:val(\"dataUpdateSourceUrl\").trim()", "stored source URL"],
  ["userNote:val(\"dataUpdateNote\").trim()", "stored user note"],
  ["timestamp:timestamp", "stored timestamp"],
  ["mailto:hello@afrotools.com", "email handoff"],
]) {
  assertIncludes(nigeria.html, needle, label, nigeria.file);
}

for (const country of countries) {
  const page = read(`tools/solar-roi/${country.slug}/index.html`);
  assertIncludes(page.html, 'id="data-update-panel"', `data update panel for ${country.countryName}`, page.file);
  assertIncludes(page.html, `value="${country.code}"`, `data update country code for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'data-update-field="electricityTariff"', `tariff update button for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'data-update-field="fuelPrice"', `fuel update button for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'data-update-field="installCostPerKw"', `install update button for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'data-update-field="sourceLink"', `source link update button for ${country.countryName}`, page.file);
  assertIncludes(page.html, "storeDataUpdateSuggestion", `local storage function for ${country.countryName}`, page.file);
}

console.log(`Solar ROI data update workflow verified for ${countries.length} country pages.`);
