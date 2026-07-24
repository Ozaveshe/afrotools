const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/st-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Sao Tome standard VAT is 15% and reverses at STN 0.01', () => {
  assert.deepEqual(engine.calculate({ amount: 1000 }), {
    mode: 'add', rateKind: 'standard', treatment: 'taxable-standard', rate: 15,
    net: 1000, vat: 150, gross: 1150, currency: 'STN', rounding: 'nearest-stn-0.01', sourceAsOf: '2026-07-23'
  });
  const extracted = engine.calculate({ amount: 1150, mode: 'extract' });
  assert.deepEqual({ net: extracted.net, vat: extracted.vat, gross: extracted.gross }, { net: 1000, vat: 150, gross: 1150 });
});

test('Sao Tome reduced treatment fails closed without exact Annex I evidence', () => {
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'confirmed-annex-1-reduced' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'generic-exempt' }));
  assert.throws(() => engine.calculate({ amount: 1000, rateKind: 'standard', rate: 16 }));
});

test('Sao Tome exact Annex I evidence enables only 7.5%', () => {
  const result = engine.calculate({ amount: 1000, rateKind: 'confirmed-annex-1-reduced', rateEvidenceConfirmed: true, rateEvidenceType: engine.REDUCED_EVIDENCE });
  assert.deepEqual({ rate: result.rate, vat: result.vat, gross: result.gross, treatment: result.treatment }, { rate: 7.5, vat: 75, gross: 1075, treatment: 'taxable-reduced' });
});

test('Sao Tome invoice totals standard and evidenced Annex I lines', () => {
  const result = engine.calculateInvoice([{ quantity: 1, unitPrice: 1000 }, { quantity: 1, unitPrice: 500, rateKind: 'confirmed-annex-1-reduced', rateEvidenceConfirmed: true, rateEvidenceType: engine.REDUCED_EVIDENCE }]);
  assert.deepEqual({ net: result.net, vat: result.vat, gross: result.gross }, { net: 1500, vat: 187.5, gross: 1687.5 });
});

test('Sao Tome API blocks 16%, zero and unsupported classifications', () => {
  const validate = api._test.validateSaoTomeRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 15, treatment: 'taxable-standard' });
  assert.equal(validate({ customRate: 16 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.equal(validate({ customRate: 0 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.equal(validate({ customRate: 7.5 }).ok, false);
  assert.deepEqual(validate({ customRate: 7.5, rateEvidenceConfirmed: true, rateEvidenceType: engine.REDUCED_EVIDENCE }), { ok: true, rate: 7.5, treatment: 'taxable-reduced' });
});
