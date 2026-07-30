'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json'),
  'utf8'
));
const acceptance = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'audits', 'swahili-free-app-acceptance.json'),
  'utf8'
));
const acceptedEvidenceCount = acceptance.entries.filter((entry) => entry.status === 'accepted').length;

assert.strictEqual(report.totals.canonicalPublishedEnglishRows, 1258);
assert.strictEqual(report.totals.excludedPaidRows, 1);
assert.strictEqual(report.totals.englishFreeApps, 1257);
assert.strictEqual(report.rows.length, 1257);
assert.strictEqual(report.categories.length, 32);
assert.strictEqual(report.totals.accepted, acceptedEvidenceCount);
assert.strictEqual(report.totals.remainingUnaccepted, 1257 - acceptedEvidenceCount);
assert.strictEqual(report.rows.filter((row) => row.accepted).length, acceptedEvidenceCount);
assert.ok(report.rows.filter((row) => row.accepted).every((row) => row.acceptanceEvidence));
assert.ok(report.rows.filter((row) => !row.accepted).every((row) => row.acceptanceEvidence === null));

const rowIds = new Set(report.rows.map((row) => row.englishId));
assert.strictEqual(rowIds.size, report.rows.length, 'English app IDs must be unique.');

const categoryTotal = report.categories.reduce((sum, category) => sum + category.englishFreeApps, 0);
assert.strictEqual(categoryTotal, report.totals.englishFreeApps);

const stateKeys = Object.keys(report.scope.stateDefinitions);
const stateTotal = stateKeys.reduce((sum, state) => sum + report.totals[state], 0);
assert.strictEqual(stateTotal, report.totals.englishFreeApps);
assert.ok(report.rows.every((row) => stateKeys.includes(row.state)));

const kenyaPaye = report.rows.find((row) => row.englishId === 'ke-paye');
assert.ok(kenyaPaye, 'Kenya PAYE must remain in the exact denominator.');
assert.strictEqual(
  kenyaPaye.primarySwahiliRoute,
  '/sw/kenya/kikokotoo-kodi-mshahara',
  'Coverage-owned app route must outrank stale registry hub mappings.'
);
assert.strictEqual(kenyaPaye.accepted, true);

console.log(
  `Swahili free-app parity inventory contract passed: 1,257 rows, ${acceptedEvidenceCount} accepted.`
);
