const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("../assets/js/lib/car-import-cost-engine.js");

const root = path.join(__dirname, "..");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const core = readJson("data/trade/car-import-cost-core.json");
const nigeria = readJson("data/trade/car-import-cost-ng.json");
const data = Engine.mergeData(core, [nigeria], { NGN: 1535.5 });

assert.equal(nigeria.ageRules.basis, "manufactureYear");
assert.equal(nigeria.ageRules.maxYearsExclusive, 13);
assert.ok(nigeria.sourceNotes.some((source) => source.url === "https://tip.nsw.gov.ng/trade-information/importing-motor-vehicles"));
assert.ok(nigeria.sourceNotes.some((source) => source.url === "https://tip.nsw.gov.ng/trade-information/prohibited-items"));

function ageWarning(year, asOfDate, firstRegistrationMonth = 12) {
  const result = Engine.calculate({
    countryCode: "NG",
    make: "Toyota",
    model: "Camry",
    year,
    asOfDate,
    firstRegistrationMonth,
    purchasePriceUsd: 5000,
    engineCc: 2400,
  }, data);
  return result.warnings.find((warning) => warning.code === "age-ineligible");
}

assert.equal(ageWarning(2014, "2026-09-27T00:00:00Z"), undefined, "12-year-old manufacture year stays below the stricter prohibition gate");
assert.equal(ageWarning(2011, "2023-09-27T00:00:00Z"), undefined, "a supplied calculation date overrides the data build date");
assert.match(ageWarning(2011, "2024-09-27T00:00:00Z", 12).message, /above 12 years/, "13-year-old manufacture year is flagged even when first registration was in December");
assert.match(ageWarning(2012, "2026-09-27T00:00:00Z").message, /official pages conflict/, "14-year-old manufacture year requires verification under conflicting official pages");
assert.ok(ageWarning(2005, "2026-09-27T00:00:00Z"), "2005 Camry is outside the portal's stated import age limit");

console.log("car-import-cost-age-rule.test.js passed");
