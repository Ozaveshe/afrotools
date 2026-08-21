'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildReport } = require('../scripts/build-french-free-app-parity-inventory');
const {
  buildAcceptance,
  validateCatalog
} = require('../scripts/build-french-free-app-acceptance');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'audits', 'french-free-app-category-acceptance.json'), 'utf8')
);
const report = buildReport();

validateCatalog(report, catalog);
const acceptance = buildAcceptance(report, catalog);

assert.strictEqual(acceptance.totals.acceptedApps, 1255);
assert.strictEqual(acceptance.totals.acceptedCategories, 32);
assert.strictEqual(acceptance.totals.archivedApps, 0);
assert.strictEqual(acceptance.entries.length, 1255);
assert.strictEqual(new Set(acceptance.entries.map((entry) => entry.englishId)).size, 1255);
assert.strictEqual(new Set(acceptance.entries.map((entry) => entry.categoryKey)).size, 32);
assert(acceptance.entries.every((entry) => entry.status === 'accepted'));
assert(acceptance.entries.every((entry) => entry.frenchRoute.startsWith('/fr')));
assert(acceptance.entries.every((entry) => entry.evidenceKey === entry.categoryKey));
assert.deepStrictEqual(
  acceptance.entries.map((entry) => entry.englishId),
  report.rows.map((row) => row.englishId),
  'acceptance registry must preserve the exact inventory denominator and order'
);
assert.deepStrictEqual(
  acceptance.entries.map((entry) => entry.frenchRoute),
  report.rows.map((row) => row.primaryFrenchRoute),
  'acceptance registry must use each inventory row primary owner'
);

for (const category of report.categories) {
  const accepted = acceptance.entries.filter((entry) => entry.categoryKey === category.categoryKey);
  assert.strictEqual(
    accepted.length,
    category.englishFreeApps,
    `${category.category}: acceptance count must match the inventory denominator`
  );
}

console.log('French free-app acceptance registry verified: 32 categories, 1,255 native owners.');
