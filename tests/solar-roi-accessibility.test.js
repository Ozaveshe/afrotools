"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));

function read(file) {
  assert.ok(fs.existsSync(file), `Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function assertIncludes(html, needle, label, file) {
  assert.ok(html.includes(needle), `${label} missing in ${file}`);
}

function contrastRatio(fg, bg) {
  const lum = hex => {
    const clean = hex.replace("#", "");
    const rgb = [0, 2, 4].map(i => parseInt(clean.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const a = lum(fg);
  const b = lum(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function buttonNames(html, file, options = {}) {
  const buttons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)];
  if (!options.optional) {
    assert.ok(buttons.length > 0, `No buttons found in ${file}`);
  }
  for (const button of buttons) {
    const name = stripTags(button[1]);
    assert.ok(name.length > 1, `Button has no accessible text in ${file}: ${button[0]}`);
    assert.ok(/[A-Za-z0-9]/.test(name), `Button text is not meaningful in ${file}: ${button[0]}`);
  }
}

function fieldContract(html, id, file) {
  assert.ok(new RegExp(`<label\\b[^>]*for="${id}"`, "i").test(html), `label for ${id} missing in ${file}`);
  assertIncludes(html, `id="${id}Help"`, `helper text for ${id}`, file);
  assertIncludes(html, `id="${id}Error"`, `error text for ${id}`, file);
  assertIncludes(html, `aria-describedby="${id}Help ${id}Error"`, `aria-describedby for ${id}`, file);
  assertIncludes(html, `aria-errormessage="${id}Error"`, `aria-errormessage for ${id}`, file);
}

const rootFile = path.join(ROOT, "tools", "solar-roi", "index.html");
const rootHtml = read(rootFile);

assertIncludes(rootHtml, 'role="search" aria-label="Search Solar ROI countries"', "root search landmark", rootFile);
assertIncludes(rootHtml, '<label for="solarRootCountrySearch">Search or select country</label>', "root search label", rootFile);
assertIncludes(rootHtml, 'id="solarRootCountrySelect"', "root country dropdown", rootFile);
assertIncludes(rootHtml, 'id="solarRootCountryOpen"', "root open country CTA", rootFile);
assertIncludes(rootHtml, 'aria-describedby="solarRootCountryHelp solarRootCountryStatus"', "root picker helper/status association", rootFile);
assertIncludes(rootHtml, 'id="solarCountrySearchStatus" aria-live="polite"', "root search live status", rootFile);
assertIncludes(rootHtml, 'aria-hidden="true"', "decorative country flags hidden from link names", rootFile);
buttonNames(rootHtml, rootFile, { optional: true });

const countryFieldIds = [
  "monthlyBill",
  "generatorSpend",
  "outageHours",
  "systemKW",
  "batteryOption",
  "financeEnabled",
  "tariffPerKwh",
  "fuelPrice",
  "solarYield",
  "performanceRatio",
  "panelWatt",
  "batteryDodPct",
  "installCostPerKw",
  "batteryCost",
  "maintenancePct",
  "depositPct",
  "interestPct",
  "loanMonths",
  "sourceNote"
];

for (const country of Object.values(dataset.countries)) {
  const file = path.join(ROOT, "tools", "solar-roi", country.slug, "index.html");
  const html = read(file);

  assertIncludes(html, '<a class="solar-skip-link" href="#calculator-title">Skip to solar calculator</a>', "skip link", file);
  assertIncludes(html, 'id="calcErrorSummary" role="alert" aria-live="assertive"', "assertive error summary", file);
  assertIncludes(html, 'role="status" aria-live="polite" aria-atomic="true"', "polite result status", file);
  assertIncludes(html, 'id="chartTextEquivalent"', "chart text equivalent", file);
  assertIncludes(html, 'aria-live="polite" aria-atomic="false" aria-labelledby="results-title"', "results live region", file);
  assertIncludes(html, 'setAttribute("aria-invalid"', "field invalid state setter", file);
  assertIncludes(html, 'setAttribute("aria-label",accessible||main)', "result value accessible label setter", file);
  assertIncludes(html, "moneyAccessible", "currency values exposed for screen readers", file);
  assertIncludes(html, 'aria-controls="advancedAssumptionsBody"', "advanced assumptions summary controls panel", file);
  assertIncludes(html, 'aria-describedby="reportExportStatus"', "report buttons status association", file);
  assertIncludes(html, 'aria-describedby="shareStatus"', "share buttons status association", file);
  assertIncludes(html, 'aria-describedby="quoteCtaStatus"', "quote CTA buttons status association", file);
  assertIncludes(html, 'aria-describedby="installerChecklistStatus"', "installer checklist buttons status association", file);
  assert.strictEqual((html.match(/class="solar-card-label"/g) || []).length, 8, `Expected 8 result card labels in ${file}`);
  assert.strictEqual((html.match(/class="solar-result-card" role="group"/g) || []).length, 8, `Expected 8 labelled result groups in ${file}`);
  assert.ok(!html.includes("alert("), `Consumer-facing alerts should not be used in ${file}`);
  assert.ok(!html.includes("#6b7688"), `Weak muted contrast token should not appear in ${file}`);

  for (const id of countryFieldIds) {
    fieldContract(html, id, file);
  }

  buttonNames(html, file);
}

const contrastPairs = [
  ["#667386", "#ffffff"],
  ["#586579", "#f8fafc"],
  ["#596577", "#f8fbf7"],
  ["#445165", "#ffffff"],
  ["#9f1d1d", "#ffffff"],
  ["#b7c3d7", "#131d2e"],
  ["#9be3cf", "#131d2e"],
  ["#142018", "#f4b23e"]
];

for (const [fg, bg] of contrastPairs) {
  assert.ok(contrastRatio(fg, bg) >= 4.5, `${fg} on ${bg} should pass WCAG AA normal-text contrast`);
}

console.log(`Solar ROI accessibility contracts verified: ${Object.keys(dataset.countries).length} country pages plus root`);
