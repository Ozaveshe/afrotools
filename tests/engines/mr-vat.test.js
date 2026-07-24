const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/mr-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Mauritania standard VAT add and extract', () => {
  assert.equal(engine.calculate({ amount: 1000 }).vat, 160);
  assert.equal(engine.calculate({ amount: 1160, mode: 'extract' }).net, 1000);
});

test('Mauritania special treatments fail closed and stay distinct', () => {
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-telephony' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 100, rateKind: 'confirmed-telephony', rateEvidenceConfirmed: true, rateEvidenceType: engine.TELEPHONY_EVIDENCE }).vat, 18);
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-export-zero' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 100, rateKind: 'confirmed-export-zero', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXPORT_EVIDENCE }).treatment, 'zero-rated');
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-article-215-exempt' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.equal(engine.calculate({ amount: 100, rateKind: 'confirmed-article-215-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
});

test('Mauritania API accepts only exact statutory evidence', () => {
  const validate = api._test.validateMauritaniaRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 16, treatment: 'taxable' });
  assert.equal(validate({ customRate: 18 }).ok, false);
  assert.equal(validate({ customRate: 18, rateEvidenceConfirmed: true, rateEvidenceType: engine.TELEPHONY_EVIDENCE }).ok, true);
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXPORT_EVIDENCE }).treatment, 'zero-rated');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: 'generic-export' }).ok, false);
});
