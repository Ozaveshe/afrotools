'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'ev-charging', 'index.html');
const engineFile = path.join(root, 'engines', 'ev-charging-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Comparable cost basis',
  'id="evCostBasis"',
  '17 kWh/100km',
  '8 litres/100km',
  '30 driving days',
  '365 driving days',
  'charging type changes modeled time only',
  'public fast-charger fees',
  'Full-charge cost includes the protected model\'s 10% energy buffer.',
  'id="annualSavingLabel"',
  'id="copyEVResultBtn"',
  'id="downloadEVResultBtn"',
  'function comparableCosts(input,country)',
  'function invalidateEVResult()',
  'petrolMonthly:petrolDaily*30',
  'petrolAnnual:petrolDaily*365',
  'Reconciled Calculation Notes',
  'Cost comparison marked stale.',
  'Dataset 2026-03. Not live pricing.',
  'dated residential electricity tariff'
].forEach((needle) => assert(html.includes(needle), `Missing EV comparable-ledger contract: ${needle}`));

assert(!html.includes('r.annualCost.replace'), 'The broken petrol daily-cost derivation must not remain');
assert(!html.includes('real local tariff data'), 'The dated dataset must not be presented as real-time tariff data');
assert(!html.includes('accurate cost comparison'), 'The planning result must not claim unqualified accuracy');
assert(!html.includes('Reviewed 2026. Prices move often.'), 'The result must show the exact dataset month instead of a vague review year');
assert(!html.includes('localStorage'), 'Vehicle and trip inputs must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 14, 'The existing 14-country EV selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const webApp = structuredData.find((entry) => entry['@type'] === 'WebApplication');
assert(webApp, 'EV WebApplication schema is missing');
assert(webApp.description.includes('reconciled daily, 30-day, and 365-day ledger'), 'EV schema must describe the comparable-period improvement');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'EV Charging engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
assert.strictEqual(digest, 'c54c3145b9421c7300a77934f894b5916d20d101b855c8731a91b2b0a320e0df', 'EV Charging engine must remain unchanged during the page-level reconciliation');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'ev-charging.webp')), 'Canonical EV Charging image is missing');

console.log('EV Charging verified: reconciled daily/30-day/365-day ledger, corrected petrol daily cost, dated tariff/fuel and charging-price scope, stale export guard, unchanged engine, privacy boundary, and canonical image.');
