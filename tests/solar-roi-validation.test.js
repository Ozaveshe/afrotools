"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const engine = require(path.join(ROOT, "assets", "js", "engines", "solar-roi-engine.js"));

function read(rel) {
  const file = path.join(ROOT, rel);
  assert.ok(fs.existsSync(file), `Missing file: ${file}`);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function assertIncludes(text, needle, label, file) {
  assert.ok(text.includes(needle), `${label} missing in ${file}`);
}

const page = read("tools/solar-roi/nigeria/index.html");
const generator = read("scripts/generate-energy-x54.js");

const validationRules = [
  ["monthlyBill", 'Monthly grid bill cannot be negative.', 'min="0"'],
  ["generatorSpend", 'Generator spend cannot be negative.', 'min="0"'],
  ["outageHours", 'Outage hours must be between 0 and 24.', 'max="24"'],
  ["systemKW", 'System size must be positive.', "min:.1"],
  ["panelWatt", 'Panel wattage should be between 250 W and 750 W.', 'min="250" max="750"'],
  ["performanceRatio", 'Performance ratio should be between 0.40 and 0.95.', 'min="0.4" max="0.95"'],
  ["batteryDodPct", 'Battery depth of discharge should be between 50% and 95%.', 'min="50" max="95"'],
  ["loanMonths", 'Finance term should be between 1 and 120 months.', 'max="120"'],
  ["interestPct", 'Finance interest should be between 0% and 80%.', 'max="80"']
];

for (const [id, message, htmlNeedle] of validationRules) {
  assertIncludes(page.html, `id="${id}"`, `${id} field`, page.file);
  assertIncludes(page.html, `${id}Error`, `${id} announced error`, page.file);
  assertIncludes(page.html, message, `${id} validation message`, page.file);
  assertIncludes(page.html, htmlNeedle, `${id} HTML range hint`, page.file);
}

assertIncludes(page.html, 'if(!validateInputs(!!focusFirstInvalid))return;', "blocked invalid calculation", page.file);
assertIncludes(page.html, 'setAttribute("aria-invalid",message?"true":"false")', "invalid fields announced", page.file);
assertIncludes(page.html, 'No payback under these assumptions', "no fake payback wording", page.file);
assertIncludes(page.html, 'panelWatt:panelWatt', "panel wattage passed into engine", page.file);
assertIncludes(page.html, 'batteryDepthPct:batteryDodPct', "DoD passed into engine", page.file);

assertIncludes(generator.html, "fallbackSolarAssumption", "country fallback assumption factory", generator.file);
assertIncludes(generator.html, "dataFallback: true", "missing country fallback marker", generator.file);
assertIncludes(generator.html, "Low-confidence fallback", "fallback confidence warning copy", generator.file);

const noSavings = engine.calculate({
  systemKw: 3,
  avgSunHours: 5,
  monthlyElectricitySpend: 0,
  monthlyGeneratorFuelSpend: 0,
  tariffPerKwh: 0,
  fuelPricePerLitre: 0,
  installCostPerKw: 500000,
  batteryCostTotal: 0,
  annualMaintenance: 0
});

assert(noSavings.firstYearProjectCashflow <= 0, "no-savings case should not have positive annual savings");
assert.strictEqual(noSavings.simplePaybackYears, null, "no-savings case should not produce fake simple payback");
assert.strictEqual(noSavings.discountedPaybackYears, null, "no-savings case should not produce fake discounted payback");

const realisticPanelAndDod = engine.calculate({
  systemKw: 3,
  avgSunHours: 5,
  monthlyElectricitySpend: 50000,
  tariffPerKwh: 100,
  installCostPerKw: 500000,
  dailyLoadKwh: 10,
  backupHours: 4,
  panelWatt: 550,
  batteryDepthPct: 80
});

assert.strictEqual(realisticPanelAndDod.sizing.panelWatt, 550, "engine uses validated panel wattage");
assert.strictEqual(realisticPanelAndDod.sizing.batteryDepth, 0.8, "engine uses validated DoD");

console.log("Solar ROI validation contracts verified");
