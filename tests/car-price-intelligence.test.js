const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ImportEngine = require("../assets/js/lib/car-import-cost-engine.js");
const Price = require("../assets/js/lib/car-price-intelligence.js");

const root = path.join(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function loadImportData() {
  const core = readJson("data/trade/car-import-cost-core.json");
  const packs = ["ng", "ke", "gh", "ug", "zm", "tz"].map((code) => readJson(`data/trade/car-import-cost-${code}.json`));
  return ImportEngine.mergeData(core, packs, {
    NGN: 1535.5,
    KES: 129.45,
    GHS: 14.89,
    UGX: 3720,
    ZMW: 27.5,
    TZS: 2650
  });
}

const data = readJson("data/cars/price-intelligence.json");
const importData = loadImportData();

assert.strictEqual(Object.keys(data.countries).length, 6, "six launch countries");
assert.ok(data.vehicles.length >= 20, "seed vehicle coverage");

const cases = [
  ["Nigeria Toyota Camry 2005", { country: "nigeria", make: "toyota", model: "camry", year: 2005 }, "too-risky"],
  ["Kenya Toyota Axio 2018", { country: "kenya", make: "toyota", model: "axio", year: 2018 }, "buy-local"],
  ["Ghana Honda CR-V 2016", { country: "ghana", make: "honda", model: "cr-v", year: 2016 }, "borderline"],
  ["Uganda Mazda Demio 2017", { country: "uganda", make: "mazda", model: "demio", year: 2017 }, "buy-local"],
  ["Zambia Hilux 2015", { country: "zambia", make: "toyota", model: "hilux", year: 2015 }, "buy-local"],
  ["Tanzania Noah 2014", { country: "tanzania", make: "toyota", model: "noah", year: 2014 }, "buy-local"],
  ["Tanzania Mercedes G-Wagon 2022", { country: "tanzania", make: "mercedes-benz", model: "g-wagon", year: 2022, sourceMarket: "uae" }, "buy-local"]
];

for (const [label, input, expectedStatus] of cases) {
  const ctx = Price.buildVehicleContext(data, importData, input);
  assert.ok(ctx, `${label}: context built`);
  assert.ok(ctx.sourcePrice.min > 0 && ctx.sourcePrice.median > 0 && ctx.sourcePrice.max > 0, `${label}: source layer`);
  assert.ok(ctx.landed.best > 0 && ctx.landed.normal > 0 && ctx.landed.painful > 0, `${label}: landed layer`);
  assert.ok(ctx.localPrice.min > 0 && ctx.localPrice.median > 0 && ctx.localPrice.max > 0, `${label}: local layer`);
  assert.strictEqual(ctx.recommendation.status, expectedStatus, `${label}: recommendation`);
  assert.ok(["eligible", "risky", "ineligible"].includes(ctx.eligibilityStatus), `${label}: eligibility`);
  assert.ok(ctx.calculatorUrl.includes("/tools/car-import-cost/"), `${label}: calculator link`);
  assert.ok(ctx.calculatorUrl.includes("make="), `${label}: prefilled make`);
  assert.ok(ctx.sourceComparison.length >= 2, `${label}: source comparison`);
  assert.strictEqual(ctx.aiContext.tool, "car-price-intelligence", `${label}: AI tool`);
  assert.ok(ctx.aiContext.landedCost.normal > 0, `${label}: AI landed payload`);
}

const stale = Price.isStale("2025-01-01", data.generatedAt, data.staleAfterDays);
assert.strictEqual(stale, true, "stale label detects old price packs");

const filtered = Price.filterVehicles(data, { country: "kenya", make: "toyota", body: "sedan" });
assert.ok(filtered.every((vehicle) => vehicle.makeSlug === "toyota" && vehicle.body === "sedan"), "filter behavior");

const localFallback = Price.getLocalPrice(data, Price.findVehicle(data, { make: "kia", model: "sportage", year: 2017 }), "zambia");
assert.strictEqual(localFallback.sourceType, "modelled-market-sample", "fallback local sample labelled");

console.log("car-price-intelligence.test.js passed");
