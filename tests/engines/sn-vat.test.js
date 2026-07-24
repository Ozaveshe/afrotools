const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/sn-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Senegal standard VAT is 18% and reverses at whole XOF', () => {
  assert.deepEqual(engine.calculate({ amount: 10000 }), {
    mode: 'add', rateKind: 'standard', treatment: 'taxable-standard', rate: 18,
    net: 10000, vat: 1800, gross: 11800, currency: 'XOF',
    rounding: 'nearest-xof-1', sourceAsOf: '2026-07-23'
  });
  const extracted = engine.calculate({ amount: 11800, mode: 'extract' });
  assert.deepEqual({ net: extracted.net, vat: extracted.vat, gross: extracted.gross }, { net: 10000, vat: 1800, gross: 11800 });
});

test('Senegal reduced treatment fails closed without exact Article 369 evidence', () => {
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: 'confirmed-approved-tourist-service' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: 'generic-tourism' }));
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: 'standard', rate: 10 }));
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: 'standard', rate: 0 }));
});

test('Senegal exact Article 369 evidence enables only 10%', () => {
  const result = engine.calculate({
    amount: 10000,
    rateKind: 'confirmed-approved-tourist-service',
    rateEvidenceConfirmed: true,
    rateEvidenceType: engine.REDUCED_EVIDENCE
  });
  assert.deepEqual({ rate: result.rate, vat: result.vat, gross: result.gross, treatment: result.treatment }, { rate: 10, vat: 1000, gross: 11000, treatment: 'taxable-reduced' });
});

test('Senegal invoice totals standard and evidenced tourist-service lines', () => {
  const result = engine.calculateInvoice([
    { quantity: 1, unitPrice: 10000 },
    { quantity: 1, unitPrice: 5000, rateKind: 'confirmed-approved-tourist-service', rateEvidenceConfirmed: true, rateEvidenceType: engine.REDUCED_EVIDENCE }
  ]);
  assert.deepEqual({ net: result.net, vat: result.vat, gross: result.gross }, { net: 15000, vat: 2300, gross: 17300 });
});

test('Senegal API allows standard and gates every custom rate', () => {
  const validate = api._test.validateSenegalRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 18, treatment: 'taxable-standard' });
  assert.deepEqual(validate({ customRate: 18 }), { ok: true, rate: 18, treatment: 'taxable-standard' });
  assert.equal(validate({ customRate: 10 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.equal(validate({ customRate: 0 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.deepEqual(validate({ customRate: 10, rateEvidenceConfirmed: true, rateEvidenceType: engine.REDUCED_EVIDENCE }), {
    ok: true, rate: 10, treatment: 'taxable-reduced', rateEvidenceType: engine.REDUCED_EVIDENCE
  });
});
