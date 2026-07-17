'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pageFile = path.join(root, 'tools', 'solar-vs-generator', 'index.html');
const html = fs.readFileSync(pageFile, 'utf8');

[
  '/data/energy/country-energy-index.js?v=5083c43c',
  'id="market-profile"',
  'id="market-profile-help"',
  'id="market-profile-status" role="status" aria-live="polite"',
  'id="market-profile-guide"',
  'bundled Energy dataset reviewed 2026-03',
  'bundled market planning default',
  'user-entered receipt or quote',
  'user-entered bill or tariff',
  'retained value after manual currency change',
  'The existing fuel and grid numbers were retained, not converted',
  "['Fuel price basis', input.fuelPriceBasis]",
  "['Grid cost basis', input.gridCostBasis]",
  "['Bundled market dataset reviewed', input.datasetReviewed]",
  "['Regulator context', input.regulatorContext]",
  'Replace the defaults with current receipts and bills.'
].forEach((needle) => assert(html.includes(needle), `Missing market-profile contract: ${needle}`));

const marketSelect = html.match(/<select id="market-profile"[\s\S]*?<\/select>/);
assert(marketSelect, 'Market profile select is missing');
const marketCodes = [...marketSelect[0].matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
const expectedCodes = ['NG', 'KE', 'GH', 'ZA', 'EG', 'TZ', 'UG', 'CI', 'CM', 'SN', 'MA', 'TN', 'AO', 'RW', 'ET', 'custom'];
assert.deepStrictEqual(marketCodes, expectedCodes, 'Market profiles must stay aligned with the 15 country routes plus custom mode');

const routes = {
  NG: 'nigeria',
  KE: 'kenya',
  GH: 'ghana',
  ZA: 'south-africa',
  EG: 'egypt',
  TZ: 'tanzania',
  UG: 'uganda',
  CI: 'cote-divoire',
  CM: 'cameroon',
  SN: 'senegal',
  MA: 'morocco',
  TN: 'tunisia',
  AO: 'angola',
  RW: 'rwanda',
  ET: 'ethiopia'
};

Object.entries(routes).forEach(([code, slug]) => {
  const route = `/tools/solar-vs-generator/${slug}/`;
  assert(html.includes(`${code}: '${route}'`), `Missing ${code} guide route`);
  assert(fs.existsSync(path.join(root, 'tools', 'solar-vs-generator', slug, 'index.html')), `Missing local country guide: ${route}`);
});

const requiredCurrencies = ['NGN', 'KES', 'GHS', 'ZAR', 'EGP', 'TZS', 'UGX', 'XOF', 'XAF', 'MAD', 'TND', 'AOA', 'RWF', 'ETB'];
requiredCurrencies.forEach((currency) => assert(html.includes(`<option value="${currency}"`), `Missing market currency ${currency}`));

assert(
  html.indexOf('/data/energy/country-energy-index.js?v=5083c43c') < html.indexOf("const energyDataset = window.ENERGY_DATA"),
  'Energy dataset must load before the market-profile runtime'
);
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'solar-vs-generator.webp')), 'Canonical Solar vs Generator image is missing');

console.log('Solar vs Generator market profiles verified: 15 country presets, custom-price warning, source provenance, routes, and canonical image.');
