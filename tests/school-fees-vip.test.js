const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/school-fees/school-fees-engine.js');

test('calculates a disclosed annual reserve and payment rhythm', () => {
  const result = engine.calculate({
    school: 'Example School',
    currency: 'ngn',
    tuition: 1_200_000,
    extras: 240_000,
    monthlySupport: 200_000,
    rhythm: 3
  });
  assert.equal(result.ok, true);
  assert.equal(result.annual, 1_440_000);
  assert.equal(result.monthlyReserve, 120_000);
  assert.equal(result.paymentChunk, 480_000);
  assert.equal(result.ratio, 0.6);
  assert.equal(result.band, 'stretch');
});

test('does not silently coerce invalid, negative, non-finite or empty totals', () => {
  assert.equal(engine.calculate({ currency: 'NG', tuition: 1, extras: 0, monthlySupport: 1, rhythm: 3 }).ok, false);
  assert.equal(engine.calculate({ currency: 'NGN', tuition: '1e999', extras: 0, monthlySupport: 1, rhythm: 3 }).ok, false);
  assert.equal(engine.calculate({ currency: 'NGN', tuition: -1, extras: 0, monthlySupport: 1, rhythm: 3 }).ok, false);
  assert.equal(engine.calculate({ currency: 'NGN', tuition: 0, extras: 0, monthlySupport: 1, rhythm: 3 }).ok, false);
});

test('reports a missing support input without inventing affordability', () => {
  const result = engine.calculate({ currency: 'KES', tuition: 120_000, extras: 0, monthlySupport: 0, rhythm: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.ratio, null);
  assert.equal(result.band, 'unknown');
  assert.match(engine.buildText(result), /Planning estimate only/);
});

test('distinguishes publication, proof links, and verified review states', () => {
  assert.equal(engine.trustState({}).label, 'Published community record');
  assert.equal(engine.trustState({ proof_url: 'https://school.example/fees' }).label, 'Published with proof link');
  assert.equal(engine.trustState({ verification_state: 'verified', review_status: 'approved' }).label, 'Verified and reviewed');
  assert.equal(engine.safeProofUrl('http://school.example/fees'), '');
  assert.equal(engine.safeProofUrl('javascript:alert(1)'), '');
});

test('does not treat non-annual fee periods as annual amounts', () => {
  const annual = engine.normalizeRow({ annual_tuition: 100, extras_total: 20, fee_period: 'Annual', currency_code: 'GHS' });
  const term = engine.normalizeRow({ annual_tuition: 100, extras_total: 20, fee_period: 'Term', currency_code: 'GHS' });
  assert.equal(annual.total, 120);
  assert.equal(annual.isAnnual, true);
  assert.equal(term.isAnnual, false);
});
