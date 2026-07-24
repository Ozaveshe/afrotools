const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const trust = require(path.join(repoRoot, 'assets/js/lib/import-duty-data-trust.js'));

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows
    .filter((line) => line.some((value) => String(value || '').trim()))
    .map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] || ''])));
}

function assertClaim(field, shortLabel, label) {
  const claim = trust.claimFor(field);
  assert.strictEqual(claim.shortLabel, shortLabel);
  if (label) assert.strictEqual(claim.label, label);
  return claim;
}

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_CUSTOMS,
  sourceUrl: 'https://customs.example.test/tariff',
  lastChecked: '2026-05-21',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Official', 'Official customs source');

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_TAX_AUTHORITY,
  sourceUrl: 'https://tax.example.test/vat',
  lastChecked: '2026-05-21',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Official', 'Official tax source');

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_PORT_AUTHORITY,
  sourceUrl: 'https://port.example.test/tariff',
  lastChecked: '2026-05-21',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Official', 'Official port source');

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_CUSTOMS,
  sourceUrl: 'https://customs.example.test/tariff',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Estimate', 'Planning estimate');

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_TAX_AUTHORITY,
  lastChecked: '2026-05-21',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Estimate', 'Planning estimate');

assertClaim({
  sourceType: trust.SOURCE_TYPES.MARKET_ESTIMATE,
  confidence: trust.CONFIDENCE.ESTIMATE
}, 'Estimate', 'Market estimate');

assertClaim({
  sourceType: trust.SOURCE_TYPES.USER_INPUT,
  confidence: trust.CONFIDENCE.VERIFIED
}, 'User input', 'User input');

assertClaim({
  sourceType: trust.SOURCE_TYPES.UNKNOWN
}, 'Estimate', 'Planning estimate');

const importFields = trust.importDutyResultFields({
  levyItems: [{ name: 'CISS' }, { name: 'ETLS' }]
});
assertClaim(importFields.fob, 'User input');
assertClaim(importFields.shipping, 'User input');
assert.strictEqual(importFields.duty.confidence, trust.CONFIDENCE.NEEDS_REVIEW);
assert.strictEqual(importFields.vat.confidence, trust.CONFIDENCE.NEEDS_REVIEW);
assert.strictEqual(importFields.fxRate.confidence, trust.CONFIDENCE.NEEDS_REVIEW);
assertClaim(importFields.duty, 'Estimate', 'Planning estimate');
assertClaim(importFields.vat, 'Estimate', 'Planning estimate');
assertClaim(importFields.fxRate, 'Estimate', 'Planning estimate');
assertClaim(importFields.total, 'Estimate');
assert.strictEqual(importFields.levies.length, 2);
assert.strictEqual(importFields.levies[0].confidence, trust.CONFIDENCE.NEEDS_REVIEW);
assertClaim(importFields.levies[0], 'Estimate', 'Planning estimate');

const landedFields = trust.landedCostResultFields({
  levyBreakdown: [{ name: 'Levy preset' }]
});
assertClaim(landedFields.dutyRate, 'User input');
assertClaim(landedFields.duty, 'User input');
assertClaim(landedFields.freight, 'Estimate');
assertClaim(landedFields.broker, 'Estimate');
assert.strictEqual(landedFields.vat.confidence, trust.CONFIDENCE.NEEDS_REVIEW);
assertClaim(landedFields.vat, 'Estimate', 'Planning estimate');
assertClaim(landedFields.total, 'Estimate');

const importDutyPage = read('tools/import-duty/index.html');
const importDutyCarCatalog = read('assets/js/pages/import-duty-car-catalog.js');
const landedCostPage = read('tools/landed-cost/index.html');
const registry = read('assets/js/components/tool-registry.js');
const nigeriaBlog = read('blog/import-duty-nigeria-2026/index.html');
const carMarketCoverage = JSON.parse(read('data/cars/import-duty-car-market-coverage.json'));
const carEstimateCsv = read('data/cars/import-duty-vehicle-estimates.csv');

assert.match(importDutyPage, /data-source-confidence|source-confidence\.js/, 'import duty page exposes source confidence');
assert.match(importDutyPage, /classification|HS code/i, 'import duty page requires classification evidence');
assert.match(importDutyPage, /planning estimate/i, 'import duty page states its planning boundary');
assert(landedCostPage.includes('import-duty-data-trust.js'), 'landed cost page loads trust helper');
assert(landedCostPage.includes('Import costs can change. AfroTools provides planning estimates only.'), 'landed cost page includes disclaimer');

const claimSurfaces = [
  importDutyPage,
  landedCostPage,
  registry,
  nigeriaBlog
].join('\n');
const unsupported = [
  /official cost/i,
  /verified import duty/i,
  /exact duty/i,
  /guaranteed clearing cost/i,
  /real-time customs rate/i,
  /government-approved/i,
  /final payable duty/i,
  /exact rates/i,
  /accurate financial tools/i,
  /Real NCS/i,
  /Rates from NCS/i
];
for (const pattern of unsupported) {
  assert(!pattern.test(claimSurfaces), `unsupported import-duty claim remains: ${pattern}`);
}

assert(!/Sponsored placement opportunity|Partner with AfroTools|List your clearing or shipping service/i.test(importDutyPage), 'import duty page should not show sponsor placeholders');
assert.strictEqual(carMarketCoverage.destinationCountries.length, 10, 'car market coverage should expose 10 priority destination countries');
assert.strictEqual(carMarketCoverage.destinationCountries[0].code, 'NG', 'Nigeria remains the default car import destination');
assert(importDutyCarCatalog.includes('catalog-expansion-wave-1.csv'), 'car selector loads staged expansion catalog rows');
assert(importDutyCarCatalog.includes('import-duty-vehicle-estimates.csv'), 'car selector loads usable estimate overlay rows');
assert(importDutyCarCatalog.includes('Dealer quote needed'), 'new vehicle condition should require a dealer quote instead of reusing used prices');
assert(importDutyCarCatalog.includes('Online market sample'), 'car selector should distinguish online source samples from broad comparable estimates');
assert(importDutyCarCatalog.includes('Comparable estimate'), 'car selector should label broad comparable estimates honestly');
assert(importDutyCarCatalog.includes('/tools/car-import-cost/'), 'car selector deep-links to the full car workspace');

const estimateRows = parseCsv(carEstimateCsv);
assert(estimateRows.length >= 456, 'vehicle estimate overlay should cover the 456 staged catalog rows');
const estimateIds = new Set();
let onlineMarketSampleCount = 0;
for (const row of estimateRows) {
  assert(!estimateIds.has(row.vehicle_id), `duplicate vehicle estimate row: ${row.vehicle_id}`);
  estimateIds.add(row.vehicle_id);
  assert(Number(row.price_median_usd) > 0, 'every vehicle estimate row should have a usable planning median');
  assert(/market_sample|comparable_market_estimate/.test(row.price_source_type), 'every vehicle estimate row should be source typed as an estimate');
  if (/online_market_sample|single_online_market_sample/.test(row.confidence)) {
    onlineMarketSampleCount += 1;
    assert(/^https:\/\/www\.dubicars\.com\//.test(row.price_source_url), 'online market samples should carry a live marketplace source URL');
  }
}
assert(onlineMarketSampleCount >= 200, 'online price refresh should match at least 200 staged rows');

assert(fs.existsSync(path.join(repoRoot, 'audit-results/import-duty-data-quality.md')));
JSON.parse(read('audit-results/import-duty-data-quality.json'));

console.log('import-duty-data-trust: ok');
