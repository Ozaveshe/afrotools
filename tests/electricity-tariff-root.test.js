const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'electricity-tariff', 'index.html');
const html = fs.readFileSync(file, 'utf8');

[
  '/data/energy/country-energy-index.js?v=5083c43c',
  'id="etCountry"',
  'id="etAccountClass"',
  'id="etTariff"',
  'id="etVat"',
  'id="etBilled"',
  'id="etDefaultsReset"',
  'id="etCsv"',
  'tariffBasis',
  'vatBasis',
  'datasetReviewed',
  'regulatorContext',
  'user-entered bill or notice rate',
  "CG: '/tools/electricity-tariff/republic-of-congo/'",
  "CV: '/tools/electricity-tariff/cape-verde/'",
  "ST: '/tools/electricity-tariff/sao-tome/'",
  'Planning estimate only',
  'Which electricity tariff should I enter?',
  'Why can my electricity bill differ from this estimate?',
  'Can I use this estimate in a billing dispute?'
].forEach((needle) => assert(html.includes(needle), `Missing Electricity Tariff root contract: ${needle}`));

assert(!html.includes('data-df-form="electricity-tariff"'), 'Generic shared estimator must not control the Electricity Tariff root');
assert(!html.includes('Enter your appliances, usage and tariff'), 'Generic appliance sizing copy must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'Generic upgrade runtime must not be loaded on this root');

[
  ['etCountry', 'etCountryHelp'],
  ['etAccountClass', 'etAccountClassHelp'],
  ['etKwh', 'etKwhHelp'],
  ['etTariff', 'etTariffUnit etTariffBasisText'],
  ['etFixed', 'etFixedHelp'],
  ['etVat', 'etVatHelp etTariffBasisText'],
  ['etBilled', 'etBilledHelp']
].forEach(([field, description]) => {
  assert(html.includes(`id="${field}"`), `Missing field ${field}`);
  assert(html.includes(`aria-describedby="${description}"`), `Missing helper association for ${field}`);
});
assert(html.includes("input.setAttribute('aria-errormessage', 'etFormError')"), 'Invalid input must reference the visible error alert');

const countryLinks = [...html.matchAll(/href="\/tools\/electricity-tariff\/[^"/]+\/" class="en-country-card"/g)];
assert.strictEqual(countryLinks.length, 54, 'Electricity Tariff root must keep all 54 country guides');

const jsonScripts = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((match) => JSON.parse(match[1]));
const faqPages = jsonScripts.filter((value) => value['@type'] === 'FAQPage');
assert.strictEqual(faqPages.length, 1, 'Expected exactly one FAQPage schema block');
assert.strictEqual(faqPages[0].mainEntity.length, 3, 'Expected three tariff-specific FAQ entries');
assert.deepStrictEqual(
  faqPages[0].mainEntity.map((entry) => entry.name),
  [
    'Which electricity tariff should I enter?',
    'Why can my electricity bill differ from this estimate?',
    'Can I use this estimate in a billing dispute?'
  ],
  'FAQ schema questions must match the visible tariff guidance'
);

console.log('Electricity Tariff root contract verified: 54 country routes, bill reconciliation inputs, provenance export, and tariff-specific FAQ.');
