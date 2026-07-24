const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/sl-gst.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Sierra Leone GST standard add and extract use 15% in SLE', () => {
  assert.deepEqual(engine.calculate({ amount: 1000, currency: 'SLE' }), {
    mode: 'add', rateKind: 'standard', treatment: 'taxable-standard', rate: 15,
    net: 1000, gst: 150, gross: 1150, currency: 'SLE', rounding: 'nearest-sle-0.01', sourceAsOf: '2026-07-23'
  });
  assert.equal(engine.calculate({ amount: 1150, mode: 'extract', currency: 'SLE' }).net, 1000);
});

test('Sierra Leone GST rejects stale SLL in engine and API validation', () => {
  assert.throws(() => engine.calculate({ amount: 1000, currency: 'SLL' }), error => error.code === 'STALE_CURRENCY');
  assert.equal(api.validateSierraLeoneRateRequest({ currency: 'SLL' }).code, 'STALE_CURRENCY');
  assert.equal(api.validateSierraLeoneRateRequest({ currency: 'SLE' }).ok, true);
});

test('Sierra Leone zero and exempt paths require the exact different Schedules', () => {
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'confirmed-zero-rated' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 1000, rateKind: 'confirmed-zero-rated', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).treatment, 'zero-rated');
  assert.equal(engine.calculate({ amount: 1000, rateKind: 'confirmed-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
  assert.equal(api.validateSierraLeoneRateRequest({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).treatment, 'zero-rated');
});

test('Sierra Leone four-month test preserves exact threshold-third semantics', () => {
  assert.equal(engine.FOUR_MONTH_THRESHOLD, 500000 / 3);
  assert.equal(engine.assessRegistration({ pastFourMonths: 166666.66 }).compulsory, false);
  assert.equal(engine.assessRegistration({ pastFourMonths: 500000 / 3 }).compulsory, true);
  assert.equal(engine.assessRegistration({ pastFourMonths: 166666.67 }).compulsory, true);
});

test('Sierra Leone below-threshold voluntary path is never automatic approval', () => {
  const result = engine.assessRegistration({ pastTwelveMonths: 1000 });
  assert.equal(result.compulsory, false);
  assert.equal(result.voluntaryApplicationPossible, true);
  assert.equal(result.commissionerDecisionRequired, true);
  assert.equal(result.status, 'below-compulsory-voluntary-application-possible');
});
