'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const {
  EXPECTED_FREE_APP_COUNT,
  STATE_LABELS,
  buildReport
} = require('../scripts/build-french-free-app-parity-inventory');

const report = buildReport();
const acceptanceRegistry = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'audits', 'french-free-app-acceptance.json'), 'utf8')
);
const acceptedEvidenceCount = acceptanceRegistry.entries.filter((entry) => entry.status === 'accepted').length;

assert.strictEqual(
  report.totals.englishFreeApps,
  EXPECTED_FREE_APP_COUNT,
  'the free English denominator must remain exactly 1,257'
);
assert.strictEqual(report.rows.length, EXPECTED_FREE_APP_COUNT, 'every free English app needs one ledger row');
assert.strictEqual(new Set(report.rows.map((row) => row.englishId)).size, EXPECTED_FREE_APP_COUNT, 'English IDs must be unique');
assert.strictEqual(new Set(report.rows.map((row) => row.englishRoute)).size, EXPECTED_FREE_APP_COUNT, 'English routes must be unique');
assert.strictEqual(report.totals.excludedPaidRows, 1, 'only /pro/ is excluded from the canonical directory');
assert.strictEqual(report.totals.accepted, acceptedEvidenceCount, 'accepted total must come from the evidence registry');
assert.strictEqual(
  report.rows.filter((row) => row.accepted).length,
  acceptedEvidenceCount,
  'accepted total must equal the number of evidenced rows'
);

const stateTotal = Object.keys(STATE_LABELS)
  .reduce((total, state) => total + report.totals[state], 0);
assert.strictEqual(stateTotal, EXPECTED_FREE_APP_COUNT, 'classification states must reconcile to the denominator');
assert.strictEqual(
  report.categories.reduce((total, category) => total + category.englishFreeApps, 0),
  EXPECTED_FREE_APP_COUNT,
  'category totals must reconcile to exactly 1,257'
);
assert(report.categories.every((category) => {
  const subtotal = Object.keys(STATE_LABELS)
    .reduce((total, state) => total + category[state], 0);
  return subtotal === category.englishFreeApps;
}), 'every category must reconcile internally');

for (const row of report.rows) {
  if (row.state === 'missing') {
    assert.strictEqual(row.primaryFrenchRoute, null, `${row.englishId}: missing rows cannot name a French owner`);
    assert.strictEqual(row.candidates.length, 0, `${row.englishId}: missing rows cannot contain candidates`);
    continue;
  }
  assert(row.primaryFrenchRoute && row.primaryFrenchRoute.startsWith('/fr'), `${row.englishId}: mapped route must be French`);
  assert(row.primaryFrenchFile && fs.existsSync(path.join(ROOT, row.primaryFrenchFile)), `${row.englishId}: mapped file must exist`);
  assert(row.candidates.length > 0, `${row.englishId}: mapped row needs evidence`);
}

for (const row of report.rows.filter((item) => (
  item.state === 'english-iframe'
  || item.state === 'bridge-handoff'
  || item.state === 'alias-utility'
  || item.state === 'missing'
))) {
  assert.strictEqual(row.accepted, false, `${row.englishId}: wrappers, handoffs, aliases and gaps can never be accepted`);
}

for (const row of report.rows.filter((item) => item.accepted)) {
  assert.strictEqual(row.state, 'native-candidate', `${row.englishId}: accepted owner must be native`);
  assert(row.acceptanceEvidence, `${row.englishId}: accepted row needs evidence`);
  assert.strictEqual(row.acceptanceEvidence.englishId, row.englishId, `${row.englishId}: evidence ID`);
  assert.strictEqual(
    row.primaryFrenchRoute,
    row.acceptanceEvidence.frenchRoute.replace(/\/$/, ''),
    `${row.englishId}: evidence route must match primary owner`
  );
  assert(fs.existsSync(path.join(ROOT, row.acceptanceEvidence.receipt)), `${row.englishId}: receipt must exist`);
}

const cropAngola = report.rows.find((row) => row.englishId === 'crop-yield-angola');
assert(cropAngola, 'crop-yield-angola must be in the denominator');
assert.strictEqual(
  cropAngola.primaryFrenchRoute,
  '/fr/agriculture/crop-yield/angola',
  'runtime iframe ownership must correct the stale Algeria mapping'
);
assert.strictEqual(cropAngola.state, 'native-candidate', 'the country page must remain a native French owner');

const pro = report.rows.find((row) => row.englishRoute === '/pro');
assert.strictEqual(pro, undefined, 'paid /pro/ must stay outside the free-app denominator');

console.log(
  `French free-app parity inventory verified: ${report.rows.length} rows, `
  + `${report.totals.definiteBuildGaps} definite build gaps, ${report.totals.accepted} accepted.`
);
