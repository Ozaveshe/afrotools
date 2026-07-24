const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/sc-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Seychelles standard VAT is 15% and reverses at SCR 0.01', () => {
  assert.deepEqual(engine.calculate({ amount: 10000 }), {
    mode: 'add', rateKind: 'standard', treatment: 'taxable-standard', rate: 15,
    net: 10000, vat: 1500, gross: 11500, currency: 'SCR',
    rounding: 'nearest-scr-0.01', sourceAsOf: '2026-07-23'
  });
  const extracted = engine.calculate({ amount: 11500, mode: 'extract' });
  assert.deepEqual({ net: extracted.net, vat: extracted.vat, gross: extracted.gross }, { net: 10000, vat: 1500, gross: 11500 });
});

test('Seychelles special treatments fail closed without exact Schedule evidence', () => {
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'confirmed-zero-rated' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'confirmed-exempt' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'generic-zero' }));
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'standard', rate: 0 }));
});

test('Seychelles zero-rated and exempt treatments remain distinct', () => {
  const zeroRated = engine.calculate({ amount: 1000, rateKind: 'confirmed-zero-rated', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE });
  const exempt = engine.calculate({ amount: 1000, rateKind: 'confirmed-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE });
  assert.deepEqual({ rate: zeroRated.rate, treatment: zeroRated.treatment, vat: zeroRated.vat }, { rate: 0, treatment: 'zero-rated', vat: 0 });
  assert.deepEqual({ rate: exempt.rate, treatment: exempt.treatment, vat: exempt.vat }, { rate: 0, treatment: 'exempt', vat: 0 });
});

test('Seychelles invoice totals standard and evidenced special lines', () => {
  const result = engine.calculateInvoice([
    { quantity: 1, unitPrice: 10000 },
    { quantity: 1, unitPrice: 5000, rateKind: 'confirmed-zero-rated', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }
  ]);
  assert.deepEqual({ net: result.net, vat: result.vat, gross: result.gross }, { net: 15000, vat: 1500, gross: 16500 });
});

test('Seychelles registration screen separates compulsory, voluntary and below-threshold states', () => {
  assert.equal(engine.assessRegistration({ pastTwelveMonths: 2000000 }).status, 'compulsory-threshold-met');
  assert.equal(engine.assessRegistration({ expectedNextTwelveMonths: 2000000 }).status, 'compulsory-threshold-met');
  assert.deepEqual(engine.assessRegistration({ expectedNextSixMonths: 100000 }).voluntaryEligible, true);
  assert.equal(engine.assessRegistration({ pastTwelveMonths: 99999, expectedNextSixMonths: 99999 }).status, 'below-modeled-thresholds');
});

test('Seychelles API gates zero-rated and exempt evidence separately', () => {
  const validate = api._test.validateSeychellesRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 15, treatment: 'taxable-standard' });
  assert.equal(validate({ customRate: 0 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.deepEqual(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }), { ok: true, rate: 0, treatment: 'zero-rated', rateEvidenceType: engine.ZERO_EVIDENCE });
  assert.deepEqual(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }), { ok: true, rate: 0, treatment: 'exempt', rateEvidenceType: engine.EXEMPT_EVIDENCE });
});
