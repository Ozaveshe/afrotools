'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools', 'electricity-tariff', 'index.html'), 'utf8');

for (const value of [
  'Electricity Cost &amp; Prepaid Units', 'id="electricityCountry"', 'id="electricityProvider"',
  'id="electricityTariff"', 'id="electricityAmount"', 'Money → prepaid units', 'Units → bill',
  '/engines/electricity-cost-engine.js', '/assets/js/pages/electricity-cost-prepaid-units.js',
  'Automatic at release', 'Custom-rate only', 'Immediate tariff examples'
]) assert(html.includes(value), `Missing canonical electricity contract: ${value}`);

assert(html.includes('<link rel="canonical" href="https://afrotools.com/tools/electricity-tariff/">'));
assert(!html.includes('/data/energy/country-energy-index.js'));
assert(!html.includes('all 54 African countries'));
assert(!/href="\/tools\/electricity-tariff\/[^"?]+\/"/.test(html));

console.log('Canonical Electricity Cost & Prepaid Units root contract verified.');
