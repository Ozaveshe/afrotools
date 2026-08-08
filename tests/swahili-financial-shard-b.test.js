'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-financial-shard-b-manifest.json');
const RECEIPT = path.join(ROOT, 'reports/swahili-financial-shard-b-candidate-receipt.json');
const ARTWORK = path.join(ROOT, 'reports/swahili-financial-shard-b-missing-artwork.json');

const EXPECTED_IDS = [
  'lr-paye', 'ly-paye', 'ma-paye', 'mg-paye', 'microfinance-calc',
  'mortgage-affordability', 'mortgage-calculator', 'mr-paye', 'mz-paye', 'na-paye',
  'ng-cgt', 'ng-cit', 'ng-land-use', 'ng-paye', 'ng-pension', 'ng-wht',
  'paye-calculator', 'payslip-generator', 'pension-proj', 'pension-projection',
  'property-roi', 'property-transfer-cost', 'rent-vs-buy', 'retirement-planner',
  'route-fares', 'salary-compare', 'salary-intelligence', 'sars-efiling', 'sd-paye',
  'side-hustle-tax', 'sl-paye', 'so-paye', 'ss-paye', 'st-paye', 'staff-cost',
  'startup-valuation', 'student-loan', 'tg-paye', 'tn-paye', 'transfer-pricing',
  'za-cgt', 'za-dividend-tax', 'za-gepf', 'za-paye', 'za-transfer-duty', 'za-uif',
];

const ACCEPTED_IDS = [
  'lr-paye', 'microfinance-calc', 'mortgage-affordability', 'mortgage-calculator',
  'mr-paye', 'payslip-generator', 'property-roi', 'property-transfer-cost', 'rent-vs-buy',
  'retirement-planner', 'route-fares', 'salary-compare', 'so-paye', 'ss-paye',
  'st-paye', 'staff-cost', 'startup-valuation', 'student-loan', 'tg-paye',
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('shard B is the exact non-overlapping 46-row slice', () => {
  const manifest = readJson(MANIFEST);
  assert.equal(manifest.baseSha, '6edacda8437e1fa9b9e5a512138cbdd3169e38be');
  assert.deepEqual(manifest.derivation.positions, [47, 92]);
  assert.equal(manifest.derivation.totalUnacceptedFinancialRows, 92);
  assert.equal(manifest.derivation.shardACount, 46);
  assert.equal(manifest.derivation.shardBCount, 46);
  assert.deepEqual(manifest.derivation.overlapWithShardA, []);
  assert.equal(manifest.derivation.shardALastEnglishId, 'loan-compare');
  assert.deepEqual(manifest.rows.map((row) => row.position), Array.from({ length: 46 }, (_, index) => index + 47));
  assert.deepEqual(manifest.rows.map((row) => row.englishId), EXPECTED_IDS);
});

test('acceptance is fail-closed per English ID and every accepted check has concrete proof', () => {
  const receipt = readJson(RECEIPT);
  assert.equal(receipt.denominator, 46);
  assert.equal(receipt.accepted, 19);
  assert.equal(receipt.blocked, 27);
  assert.equal(receipt.coordinatorOwnedFilesEdited, false);
  assert.deepEqual(receipt.rows.filter((row) => row.status === 'accepted').map((row) => row.englishId), ACCEPTED_IDS);

  for (const row of receipt.rows) {
    if (row.status === 'blocked') {
      assert.ok(row.blocker, `${row.englishId} must carry an exact blocker`);
      assert.equal(row.proof, null);
      continue;
    }
    assert.ok(row.swahiliFile && fs.existsSync(path.join(ROOT, row.swahiliFile)), `${row.englishId} route missing`);
    assert.ok(row.sourceOwner.length > 0, `${row.englishId} source owner missing`);
    assert.ok(Object.values(row.proof.checks).every(Boolean), `${row.englishId} has a failed static check`);
    for (const proofFile of row.proof.existingOracleAndWorkflowSuites) {
      assert.ok(fs.existsSync(path.join(ROOT, proofFile)), `${row.englishId} proof missing: ${proofFile}`);
    }
  }
});

test('missing-artwork queue is explicit and limited to the blocked SARS eFiling row', () => {
  const queue = readJson(ARTWORK);
  assert.equal(queue.missingCount, 1);
  assert.deepEqual(queue.rows, [{
    englishId: 'sars-efiling',
    expectedArtwork: 'assets/img/tools/sars-efiling.webp',
    status: 'missing',
  }]);
});

test('localized microfinance labels preserve shared engine enum values', () => {
  const html = fs.readFileSync(path.join(ROOT, 'sw/zana/microfinance-riba-tambarare-dhidi-ya-salio/index.html'), 'utf8');
  assert.match(html, /<option value="annual">Kwa mwaka<\/option>/);
  assert.match(html, /<option value="monthly" selected>Kwa mwezi<\/option>/);
  assert.doesNotMatch(html, /value="kila (?:mwaka|mwezi)"/);
});
