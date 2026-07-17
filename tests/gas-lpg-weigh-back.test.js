'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'gas-lpg-cost', 'index.html');
const engineFile = path.join(root, 'engines', 'gas-lpg-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Optional weigh-back check',
  'id="tareWeightKg"',
  'id="filledWeightKg"',
  'Delivered LPG equals filled weight minus tare weight.',
  'id="fillBasisSummary"',
  'id="fillWeightResult"',
  'id="fillVarianceResult"',
  'var hasMeasuredFill =',
  'var deliveredKg = hasMeasuredFill ? filledWeightKg - tareWeightKg : cylinderKg;',
  'var pricePerKg = refillPrice / deliveredKg;',
  'var daysPerCylinder = deliveredKg / dailyKg;',
  'var refillsPerMonth = monthlyKg / deliveredKg;',
  'Measured LPG is ',
  'Ask the dealer to confirm fill weight.',
  'Weight check is incomplete or invalid',
  'Measured fill used',
  'delivered_lpg_kg',
  'fill_variance',
  'Delivered LPG basis:'
].forEach((needle) => assert(html.includes(needle), `Missing LPG weigh-back contract: ${needle}`));

assert(!html.includes('var pricePerKg = refillPrice / cylinderKg;'), 'Price per kg must use measured delivered LPG when weights are valid');
assert(!html.includes('var daysPerCylinder = cylinderKg / dailyKg;'), 'Refill duration must use measured delivered LPG when weights are valid');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 15, 'The existing 15-country LPG selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
assert(structuredData.some((entry) => entry['@type'] === 'WebApplication'), 'LPG WebApplication schema is missing');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected legacy LPG engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-gas-lpg-engine');
assert(formula, 'LPG formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected legacy LPG engine digest must remain unchanged');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'gas-lpg-cost.webp')), 'Canonical Gas / LPG image is missing');

console.log('Gas / LPG verified: optional tare-and-filled weigh-back drives effective price/kg, duration and refill count, underfill and invalid-weight states are explicit, exports retain the basis, protected legacy digest is intact, and the canonical image exists.');
