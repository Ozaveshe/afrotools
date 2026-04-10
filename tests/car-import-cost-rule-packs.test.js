const assert = require("assert");
const fs = require("fs");
const path = require("path");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
}

const core = readJson("data/trade/car-import-cost-core.json");
const expectedCountries = ["NG", "KE", "GH", "UG", "ZM", "TZ"];

assert.strictEqual(core.baseCurrency, "USD");
assert.deepStrictEqual(Object.keys(core.countryPackFiles).sort(), expectedCountries.slice().sort());
assert.ok(core.sourceMarkets.japan, "Japan source market");
assert.ok(core.sourceMarkets.uae, "UAE source market");
assert.ok(core.sourceMarkets.uk, "UK source market");
assert.ok(core.sourceMarkets["south-africa"], "South Africa source market");
assert.ok(core.sourceMarkets["local-dealer"], "Local dealer comparator");

for (const countryCode of expectedCountries) {
  const pack = readJson(core.countryPackFiles[countryCode].replace(/^\//, ""));
  assert.strictEqual(pack.countryCode, countryCode, `${countryCode} country code`);
  assert.ok(pack.countryName, `${countryCode} name`);
  assert.ok(pack.currency, `${countryCode} currency`);
  assert.ok(pack.effectiveFrom, `${countryCode} effective date`);
  assert.ok(pack.valuationMethod, `${countryCode} valuation method`);
  assert.ok(pack.customsBasisRules && pack.customsBasisRules.basis, `${countryCode} customs basis`);
  assert.ok(Array.isArray(pack.taxComponents) && pack.taxComponents.length > 0, `${countryCode} tax components`);
  assert.ok(Array.isArray(pack.registrationComponents) && pack.registrationComponents.length > 0, `${countryCode} registration components`);
  assert.ok(Array.isArray(pack.sourceNotes) && pack.sourceNotes.length > 0, `${countryCode} source notes`);
  assert.ok(Array.isArray(pack.disclaimers) && pack.disclaimers.length > 0, `${countryCode} disclaimers`);
  assert.ok(Array.isArray(pack.documents) && pack.documents.length > 0, `${countryCode} documents`);

  const ids = new Set();
  for (const component of pack.taxComponents.concat(pack.registrationComponents, pack.optionalComponents || [])) {
    assert.ok(component.id, `${countryCode} component id`);
    assert.ok(!ids.has(component.id), `${countryCode} duplicate component ${component.id}`);
    ids.add(component.id);
    assert.ok(component.label, `${countryCode} component label`);
    assert.ok(component.type, `${countryCode} component type`);
    if (component.type === "percentage") assert.ok(Number.isFinite(component.rateOrFormula), `${component.id} rate`);
  }

  for (const source of pack.sourceNotes) {
    assert.ok(/^https:\/\//.test(source.url), `${countryCode} source url`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(source.lastVerified), `${countryCode} source date`);
    assert.ok(source.confidence, `${countryCode} source confidence`);
  }
}

const kenya = readJson("data/trade/car-import-cost-ke.json");
assert.strictEqual(kenya.ageRules.maxYearsExclusive, 8, "Kenya age rule");
assert.strictEqual(kenya.steeringRules.required, "right", "Kenya steering rule");
assert.ok(kenya.taxComponents.find((item) => item.id === "ke-idf" && item.rateOrFormula === 0.035), "Kenya IDF");
assert.ok(kenya.taxComponents.find((item) => item.id === "ke-rdl" && item.rateOrFormula === 0.02), "Kenya RDL");

const nigeria = readJson("data/trade/car-import-cost-ng.json");
assert.strictEqual(nigeria.ageRules.maxYears, 12, "Nigeria age rule");
assert.ok(nigeria.taxComponents.find((item) => item.id === "ng-fob-implementation-2025" && item.enabled === false), "Nigeria configurable 4% FOB component");

const tanzania = readJson("data/trade/car-import-cost-tz.json");
assert.ok(tanzania.registrationComponents.find((item) => item.id === "tz-motor-licence-fee"), "Tanzania licence fee");
assert.ok(tanzania.taxComponents.find((item) => item.id === "tz-age-excise"), "Tanzania age excise");

console.log("car-import-cost-rule-packs.test.js passed");
