"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const file = path.join(ROOT, "tools", "generator-fuel", "index.html");
const html = fs.readFileSync(file, "utf8");

function includes(needle, label) {
  assert.ok(html.includes(needle), `${label} missing: ${needle}`);
}

includes('id="gfFuelPrice"', "editable fuel price");
includes('aria-describedby="gfFuelPriceBasisText gfFuelPriceError"', "fuel-price accessible description");
includes('id="gfFuelPriceBasisText"', "fuel price basis status");
includes('id="gfFuelPriceReset"', "bundled-price reset");
includes('fuel_price_per_litre', "CSV fuel-price evidence");
includes('fuel_price_basis', "CSV price-basis evidence");
includes('energy_dataset_reviewed', "CSV dataset freshness evidence");
includes('this.dataset.priceBasis="user"', "user-price state");
includes('syncFuelPrice();', "bundled-price synchronization");
includes('Enter a fuel price above zero.', "fuel-price validation");
includes('Which fuel price should I enter?', "generator-specific FAQ");
assert.ok(!html.includes("Enter your appliances, usage and tariff"), "Generic appliance copy should not describe the generator calculator");

const faqBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]))
  .filter((value) => value["@type"] === "FAQPage");
assert.strictEqual(faqBlocks.length, 1, "Expected one FAQPage schema block");
assert.strictEqual(faqBlocks[0].mainEntity.length, 3, "Expected three generator-specific FAQ entries");

for (const field of ['power_factor', 'load_percent', 'litres_per_kwh', 'daily_kwh', 'weekly_budget_with_buffer']) {
  includes("'" + field + "'", "CSV operating assumption");
}
for (const enginePath of ['engines/src/generator-fuel-engine.js', 'engines/generator-fuel-engine.js']) {
  const context = { window: {}, ENERGY_DATA: { countries: { NG: {
    name: 'Nigeria', currencySymbol: 'NGN', fuel: { diesel: 1000 }, electricityTariff: { residential: 100 }
  } } } };
  require('node:vm').runInNewContext(fs.readFileSync(path.join(ROOT, enginePath), 'utf8'), context);
  const engine = context.window.AfroTools.GeneratorFuelEngine;
  const input = { genKVA: 10, dailyHours: 8, fuelType: 'diesel' };
  assert.equal(engine.calculate(input, 'NG').dailyCost, 'NGN17,920');
  const half = engine.calculate({ ...input, loadPercent: 50 }, 'NG');
  assert.equal(half.dailyCost, 'NGN8,960');
  assert.equal(half.operatingModel.dailyKwh, 32);
  assert.equal(half.operatingModel.dailyLitres, 8.96);
  assert.equal(half.operatingModel.powerFactor, 0.8);
  assert.equal(half.operatingModel.litresPerKwh, 0.28);
  assert.ok(engine.calculate({ ...input, loadPercent: 105 }, 'NG').error);
}

console.log("Generator Fuel root pump-price override contract verified.");
