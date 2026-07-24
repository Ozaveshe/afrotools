'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/afrorates-verified');

const root = path.resolve(__dirname, '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data', 'rates', 'latest.json'), 'utf8'));
const now = '2026-07-24T12:00:00.000Z';

test('AfroRates exposes only the six rows with complete official evidence', () => {
  const rows = engine.selectVerified(snapshot, { maxAgeDays: 45, now });
  assert.deepEqual(rows.map((row) => row.code).sort(), ['CI', 'KE', 'MA', 'NG', 'SN', 'ZA']);
  assert.deepEqual(engine.coverage(snapshot, { maxAgeDays: 45, now }), {
    candidate_count: 15,
    verified_policy_count: 6,
    withheld_policy_count: 9,
    partial: true,
  });
  assert.ok(rows.every((row) => row.annual_inflation && /^\d{4}$/.test(row.annual_inflation.year)));
});

test('unowned rate capabilities remain unavailable in the committed snapshot', () => {
  assert.equal(snapshot.countries.filter((row) => row.next_mpc || row.next_mpc_date).length, 0);
  assert.equal(snapshot.countries.filter((row) => row.tbill_91d || row.tbill_182d || row.tbill_364d || row.bond_10y).length, 0);
});

test('future verification, decision and dataset dates fail closed', () => {
  const base = structuredClone(snapshot);
  const verifiedCode = base._verification.verified_codes[0];
  const row = base.countries.find((candidate) => candidate.code === verifiedCode);

  row.policy_rate_verified_at = '2026-07-25T12:00:00.000Z';
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), false);

  row.policy_rate_verified_at = '2026-07-24T12:04:00.000Z';
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), true, 'bounded five-minute clock skew is accepted');

  row.policy_rate_source_date = '2026-07-25';
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), false);

  const futureDataset = structuredClone(snapshot);
  futureDataset.timestamp = '2026-07-25T12:00:00.000Z';
  assert.deepEqual(engine.selectVerified(futureDataset, { now }), []);
});

test('unknown and non-HTTPS source hosts never pass as official', () => {
  assert.equal(engine.isOfficialUrl('https://www.centralbank.go.ke/example'), true);
  assert.equal(engine.isOfficialUrl('http://www.centralbank.go.ke/example'), false);
  assert.equal(engine.isOfficialUrl('https://centralbank.go.ke.example.com/rate'), false);
});

test('all launched AfroRates pages avoid unsupported live and continent-wide claims', () => {
  const pages = [
    'tools/afrorates/index.html',
    'fr/tools/afrotaux/index.html',
    'sw/zana/viwango-benki/index.html',
  ];
  pages.forEach((relative) => {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(html, /(?:across|for|pour les) 54 (?:countries|pays)|nchi 54|données en direct|kwa wakati halisi/i, relative);
    assert.match(html, /data\/rates\/latest\.json|api\/rates/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="sw"/);
  });
});
