const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/mu-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Mauritius standard VAT add and extract', () => {
  assert.equal(engine.calculate({ amount: 1000 }).vat, 150);
  assert.equal(engine.calculate({ amount: 1150, mode: 'extract' }).net, 1000);
});

test('Mauritius zero-rated and exempt treatments fail closed and remain distinct', () => {
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-fifth-schedule-zero' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 100, rateKind: 'confirmed-fifth-schedule-zero', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).treatment, 'zero-rated');
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-first-schedule-exempt' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 100, rateKind: 'confirmed-first-schedule-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
});

test('Mauritius API requires exact schedule evidence', () => {
  const validate = api._test.validateMauritiusRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 15, treatment: 'taxable' });
  assert.equal(validate({ customRate: 0 }).ok, false);
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).treatment, 'zero-rated');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: 'tourist-services' }).ok, false);
});
