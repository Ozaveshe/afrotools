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

function between(value, start, end) {
  const startIndex = value.indexOf(start);
  assert.ok(startIndex >= 0, `Start marker missing: ${start}`);
  const endIndex = value.indexOf(end, startIndex + start.length);
  assert.ok(endIndex >= 0, `End marker missing: ${end}`);
  return value.slice(startIndex, endIndex);
}

const countries = Object.values(dataset.countries);
assert.strictEqual(countries.length, 54, "Solar ROI dataset should contain 54 countries");

const root = read("tools/solar-roi/index.html");
assertIncludes(root.html, 'role="search" aria-label="Search Solar ROI countries"', "root search landmark", root.file);
assertIncludes(root.html, 'id="solarRootCountrySearch"', "root country search input", root.file);
assertIncludes(root.html, 'id="solarRootCountrySelect"', "root country dropdown", root.file);
assertIncludes(root.html, '<optgroup label="Popular countries">', "popular countries optgroup", root.file);
assertIncludes(root.html, '<optgroup label="All countries">', "all countries optgroup", root.file);
assertIncludes(root.html, 'id="solarRootCountryOpen"', "root open country CTA", root.file);
assertIncludes(root.html, 'URLSearchParams(location.search)', "root query persistence", root.file);
assertIncludes(root.html, 'localStorage.setItem(STORAGE_KEY,country.code)', "root local storage persistence", root.file);
assertIncludes(root.html, 'Open "+country.name+" calculator"', "root CTA update", root.file);

const allGroup = between(root.html, '<optgroup label="All countries">', "</optgroup>");
assert.strictEqual((allGroup.match(/<option\b/g) || []).length, 54, "All countries optgroup should contain 54 options");

for (const country of countries) {
  assertIncludes(allGroup, `value="${country.slug}"`, `all-country option for ${country.countryName}`, root.file);
  assertIncludes(allGroup, `data-code="${country.code}"`, `all-country code for ${country.countryName}`, root.file);
  assertIncludes(allGroup, `data-currency="${country.currency}"`, `all-country currency for ${country.countryName}`, root.file);

  const page = read(`tools/solar-roi/${country.slug}/index.html`);
  assertIncludes(page.html, '<label for="solarCountryPageSearch">Selected country</label>', `country picker label for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'id="solarCountryPageSelect"', `country picker select for ${country.countryName}`, page.file);
  assertIncludes(page.html, '<optgroup label="Popular countries">', `popular countries group for ${country.countryName}`, page.file);
  assertIncludes(page.html, '<optgroup label="All countries">', `all countries group for ${country.countryName}`, page.file);
  assertIncludes(page.html, `value="${country.slug}" data-code="${country.code}" data-currency="${country.currency}" selected`, `preselected country option for ${country.countryName}`, page.file);
  assertIncludes(page.html, `selected - ${country.currency}`, `visible selected country status for ${country.countryName}`, page.file);
  assertIncludes(page.html, 'setupCountryPicker("solarCountryPage",DEFAULTS.countrySlug)', `country picker setup for ${country.countryName}`, page.file);
}

console.log(`Solar ROI country selector verified for root plus ${countries.length} country pages.`);
