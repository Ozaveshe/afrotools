'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const toolDir = path.join(root, 'tools', 'electricity-bill-verify');
const file = path.join(toolDir, 'index.html');
const html = fs.readFileSync(file, 'utf8');

[
  'id="opening-reading"',
  'name="openingReading"',
  'id="closing-reading"',
  'name="closingReading"',
  'Billed consumption (kWh)',
  'id="reading-output"',
  'id="bill-form-error"',
  'Meter-reading evidence:',
  'Results are not stored automatically',
  'never an account number, meter number, phone number, or payment reference',
  'verifiedKwh',
  'readingVariance',
  'readingAnomaly',
  'usageBasis',
  'opening and closing meter readings',
  'billed consumption fallback',
  'Billed consumption kWh',
  'Verified usage kWh',
  'Reading variance kWh',
  'No silent storage; no account, meter, phone, or payment identifiers collected',
  'Closing reading must be equal to or greater than opening reading.',
  'Enter both opening and closing readings, or leave both blank to use billed consumption.'
].forEach((needle) => assert(html.includes(needle), `Missing meter-reading verifier contract: ${needle}`));

assert(!html.includes('localStorage.setItem'), 'Bill data must not be silently stored in localStorage');
assert(!html.includes('electricityBillVerifyLastResult'), 'Legacy bill-result storage key must be removed');
assert(!/name="(?:accountNumber|meterNumber|phone|paymentReference)"/.test(html), 'The verifier must not collect direct billing identifiers');

[
  ['opening-reading', 'opening-reading-help'],
  ['closing-reading', 'closing-reading-help'],
  ['kwh', 'kwh-help']
].forEach(([field, helper]) => {
  assert(html.includes(`id="${field}"`), `Missing field ${field}`);
  assert(html.includes(`aria-describedby="${helper}"`), `Missing helper association for ${field}`);
});
assert(html.includes("field.setAttribute('aria-errormessage', 'bill-form-error')"), 'Invalid reading must reference the visible error alert');

const countryGuides = fs.readdirSync(toolDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
assert.strictEqual(countryGuides.length, 15, 'All 15 existing country bill-verifier guides must remain available');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'electricity-bill-verify.webp')), 'Canonical Electricity Bill Verifier image is missing');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match, index) => {
  acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' });
  assert(match[1].trim(), `Inline script ${index + 1} must not be empty`);
});

console.log('Electricity Bill Verifier verified: meter-reading reconciliation, validation, privacy boundary, deliberate exports, 15 country guides, and canonical image.');
