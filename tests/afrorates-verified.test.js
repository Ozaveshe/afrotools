'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/afrorates-verified');

const root = path.resolve(__dirname, '..');
// Retain the reviewed thirteen-row case independently of changing live fallbacks.
const snapshot = require('./fixtures/afrorates-evidence-2026-09-08.json');
const committed = JSON.parse(fs.readFileSync(path.join(root, 'data', 'rates', 'latest.json'), 'utf8'));
const now = snapshot.timestamp;

test('AfroRates exposes only the thirteen verified rows in the fixed evidence fixture', () => {
  const rows = engine.selectVerified(snapshot, { maxAgeDays: 45, now });
  assert.deepEqual(rows.map((row) => row.code).sort(), ['BW', 'CI', 'EG', 'ET', 'GH', 'KE', 'MA', 'MU', 'NG', 'SN', 'TZ', 'UG', 'ZA']);
  assert.deepEqual(engine.coverage(snapshot, { maxAgeDays: 45, now }), {
    candidate_count: 15,
    verified_policy_count: 13,
    withheld_policy_count: 2,
    partial: true,
  });
  assert.ok(rows.every((row) => row.annual_inflation && /^\d{4}$/.test(row.annual_inflation.year)));
});

test('committed rates expose exactly the declared verified subset', () => {
  const rows = engine.selectVerified(committed, { maxAgeDays: 45, now: committed.timestamp });
  assert.deepEqual(rows.map((row) => row.code).sort(), committed._verification.verified_codes.slice().sort());
  assert.equal(rows.length, committed._verification.verified_count);
  assert.equal(engine.coverage(committed, { now: committed.timestamp }).partial, committed._verification.partial);
});

test('a verification label cannot replace complete official evidence', () => {
  const valid = snapshot.countries.find((row) => row.code === 'NG');
  assert.equal(engine.isVerifiedPolicyRow(valid, snapshot, { now }), true);
  for (const field of ['policy_rate', 'policy_rate_source_url', 'policy_rate_source_date', 'policy_rate_verified_at']) {
    const incomplete = { ...valid };
    delete incomplete[field];
    assert.equal(engine.isVerifiedPolicyRow(incomplete, snapshot, { now }), false, field);
  }
  const unlisted = structuredClone(snapshot);
  unlisted._verification.verified_codes = [];
  assert.equal(engine.isVerifiedPolicyRow(valid, unlisted, { now }), false);
  const stale = { ...valid, policy_rate_verified_at: '2026-01-01T00:00:00Z' };
  assert.equal(engine.isVerifiedPolicyRow(stale, snapshot, { now }), false);
});

test('unowned rate capabilities remain unavailable in the committed snapshot', () => {
  assert.equal(committed.countries.filter((row) => row.next_mpc || row.next_mpc_date).length, 0);
  assert.equal(committed.countries.filter((row) => row.tbill_91d || row.tbill_182d || row.tbill_364d || row.bond_10y).length, 0);
});

test('future verification, decision and dataset dates fail closed', () => {
  const base = structuredClone(snapshot);
  const verifiedCode = base._verification.verified_codes[0];
  const row = base.countries.find((candidate) => candidate.code === verifiedCode);
  const nowMs = new Date(now).getTime();
  const future = new Date(nowMs + 24 * 60 * 60 * 1000);
  const boundedSkew = new Date(nowMs + 4 * 60 * 1000);
  const futureDate = future.toISOString().slice(0, 10);

  row.policy_rate_verified_at = future.toISOString();
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), false);

  row.policy_rate_verified_at = boundedSkew.toISOString();
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), true, 'bounded five-minute clock skew is accepted');

  row.policy_rate_source_date = futureDate;
  assert.equal(engine.isVerifiedPolicyRow(row, base, { now }), false);

  const futureDataset = structuredClone(snapshot);
  futureDataset.timestamp = future.toISOString();
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
