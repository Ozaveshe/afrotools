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

console.log("Generator Fuel root pump-price override contract verified.");
