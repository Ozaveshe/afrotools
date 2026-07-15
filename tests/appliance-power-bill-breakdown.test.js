'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'appliance-power', 'index.html');
const engineFile = path.join(root, 'engines', 'appliance-power-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Appliance-by-appliance bill breakdown',
  'id="billBreakdownContext"',
  'id="billBreakdownBody"',
  'id="copyBillBreakdown"',
  'id="billBreakdownStatus"',
  'function allocatedRows(result)',
  'function breakdownText(result,country,breakdown)',
  'function renderBreakdown(result,countryCode)',
  'function invalidateBreakdown()',
  'the rounded household bill is allocated in proportion',
  'row rounding is reconciled to the displayed total',
  'Standby Upper-Bound / Month',
  'assumes 24 standby hours/day',
  'nameplate estimate, not a meter reading',
  'stay in your browser unless you choose to copy',
  'Breakdown marked stale. Recalculate to refresh the allocated costs.',
  'Appliance bill breakdown copied.'
].forEach((needle) => assert(html.includes(needle), `Missing appliance-bill-breakdown contract: ${needle}`));

assert(!html.includes('data-df-form="appliance-power"'), 'The disconnected generic appliance-power form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Appliance Power root');
assert(!html.includes('name="currency"'), 'A second generic currency selector must not remain');
assert(!html.includes('name="days"'), 'A disconnected days-per-month input must not remain');
assert(!html.includes('name="tariff"'), 'A second generic tariff input must not remain');
assert(!html.includes('built for all 54 African countries'), 'The app must not overstate the countries shown in its selector');
assert(!html.includes('Calculate exactly how much'), 'The app must not describe a nameplate estimate as exact measurement');
assert(!html.includes('localStorage'), 'Appliance entries and bill breakdowns must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 13, 'The existing 13-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Appliance Power FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'How are the per-appliance monthly costs calculated?',
    'Does the wattage field show actual appliance consumption?',
    'How does the calculator treat standby power?'
  ],
  'FAQ schema must match the appliance-bill-breakdown guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Appliance Power engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
assert.strictEqual(digest, 'c015ece3011629dcf6d816c86a782854c2b6c59cfaa945fbfb5ba7a587a21f2b', 'Appliance Power engine must remain unchanged during this UI improvement');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'appliance-power.webp')), 'Canonical Appliance Power image is missing');

console.log('Appliance Power verified: reconciled per-appliance bill allocation, tariff context, standby upper-bound labeling, stale-result guard, unchanged engine, privacy boundary, and canonical image.');
