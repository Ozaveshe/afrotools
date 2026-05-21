const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const trust = require(path.join(repoRoot, 'assets/js/lib/import-duty-data-trust.js'));

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
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
}, 'Needs verification');

assertClaim({
  sourceType: trust.SOURCE_TYPES.OFFICIAL_TAX_AUTHORITY,
  lastChecked: '2026-05-21',
  confidence: trust.CONFIDENCE.VERIFIED
}, 'Needs verification');

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
}, 'Needs verification', 'Needs verification');

const importFields = trust.importDutyResultFields({
  levyItems: [{ name: 'CISS' }, { name: 'ETLS' }]
});
assertClaim(importFields.fob, 'User input');
assertClaim(importFields.shipping, 'User input');
assertClaim(importFields.duty, 'Needs verification');
assertClaim(importFields.vat, 'Needs verification');
assertClaim(importFields.fxRate, 'Needs verification');
assertClaim(importFields.total, 'Estimate');
assert.strictEqual(importFields.levies.length, 2);
assertClaim(importFields.levies[0], 'Needs verification');

const landedFields = trust.landedCostResultFields({
  levyBreakdown: [{ name: 'Levy preset' }]
});
assertClaim(landedFields.dutyRate, 'User input');
assertClaim(landedFields.duty, 'User input');
assertClaim(landedFields.freight, 'Estimate');
assertClaim(landedFields.broker, 'Estimate');
assertClaim(landedFields.vat, 'Needs verification');
assertClaim(landedFields.total, 'Estimate');

const importDutyPage = read('tools/import-duty/index.html');
const landedCostPage = read('tools/landed-cost/index.html');
const vehiclePage = read('tools/vehicle-import-duty/index.html');
const registry = read('assets/js/components/tool-registry.js');
const nigeriaBlog = read('blog/import-duty-nigeria-2026/index.html');

for (const [name, html] of [
  ['import duty', importDutyPage],
  ['landed cost', landedCostPage]
]) {
  assert(html.includes('import-duty-data-trust.js'), `${name} page loads trust helper`);
  assert(html.includes('Import costs can change. AfroTools provides planning estimates only.'), `${name} page includes disclaimer`);
}

const claimSurfaces = [
  importDutyPage,
  landedCostPage,
  vehiclePage,
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

assert(fs.existsSync(path.join(repoRoot, 'audit-results/import-duty-data-quality.md')));
JSON.parse(read('audit-results/import-duty-data-quality.json'));

console.log('import-duty-data-trust: ok');
