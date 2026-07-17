'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'prepaid-meter', 'index.html');
const html = fs.readFileSync(file, 'utf8');

[
  '/data/energy/country-energy-index.js?v=5083c43c',
  'id="pmCountry"',
  'id="pmAccountClass"',
  'id="pmSpend"',
  'id="pmTariff"',
  'id="pmPercentDeductions"',
  'id="pmFixedDeductions"',
  'id="pmDailyKwh"',
  'id="pmActualUnits"',
  'id="pmExpectedUnits"',
  'id="pmVariance"',
  'id="pmEffectiveCost"',
  'id="pmDaysSupply"',
  'id="pmCsv"',
  'tariffBasis',
  'datasetReviewed',
  'regulatorContext',
  'varianceActualMinusExpected',
  'No token, meter, phone, or payment identifiers collected.',
  'Never paste a 20-digit token, meter number, phone number, or payment reference here',
  "CG: '/tools/prepaid-meter/republic-of-congo/'",
  "CV: '/tools/prepaid-meter/cape-verde/'",
  "ST: '/tools/prepaid-meter/sao-tome/'"
].forEach((needle) => assert(html.includes(needle), `Missing Prepaid Meter root contract: ${needle}`));

assert(!html.includes('data-df-form="prepaid-meter"'), 'Generic shared estimator must not control the Prepaid Meter root');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'Generic upgrade runtime must not load on the Prepaid Meter root');
assert(!html.includes('Enter your appliances, usage and tariff'), 'Generic appliance sizing copy must not remain');
assert(!/name="(?:token|meterNumber|phone|paymentReference)"/.test(html), 'Sensitive token, meter, phone, or payment identifiers must not be collected');

[
  ['pmCountry', 'pmCountryHelp'],
  ['pmAccountClass', 'pmAccountClassHelp'],
  ['pmSpend', 'pmSpendHelp'],
  ['pmTariff', 'pmTariffHelp pmTariffBasisText'],
  ['pmPercentDeductions', 'pmPercentHelp'],
  ['pmFixedDeductions', 'pmFixedHelp'],
  ['pmDailyKwh', 'pmDailyHelp'],
  ['pmActualUnits', 'pmActualHelp']
].forEach(([field, description]) => {
  assert(html.includes(`id="${field}"`), `Missing field ${field}`);
  assert(html.includes(`aria-describedby="${description}"`), `Missing helper association for ${field}`);
});
assert(html.includes("input.setAttribute('aria-errormessage', 'pmFormError')"), 'Invalid input must reference the visible error alert');

const countryLinks = [...html.matchAll(/href="\/tools\/prepaid-meter\/[^"/]+\/" class="en-country-card"/g)];
assert.strictEqual(countryLinks.length, 54, 'Prepaid Meter root must keep all 54 country guides');

const jsonScripts = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((match) => JSON.parse(match[1]));
const faqPages = jsonScripts.filter((value) => value['@type'] === 'FAQPage');
assert.strictEqual(faqPages.length, 1, 'Expected exactly one FAQPage schema block');
assert.deepStrictEqual(
  faqPages[0].mainEntity.map((entry) => entry.name),
  [
    'Why did my prepaid electricity units drop?',
    'Is this a prepaid electricity token generator?',
    'What evidence should I save for a prepaid vending complaint?'
  ],
  'FAQ schema must match the visible prepaid receipt guidance'
);

assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'prepaid-meter.webp')), 'Canonical Prepaid Meter image is missing');

console.log('Prepaid Meter root verified: 54 country routes, receipt reconciliation, days-of-supply output, privacy boundary, provenance export, and prepaid-specific FAQ.');
