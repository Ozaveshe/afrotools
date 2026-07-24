const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/ga-vat.js');
const vatApi = require('../../netlify/functions/api-vat.js');

test('Gabon standard calculation applies Article 220 floor rounding', () => {
  assert.deepEqual(engine.calculate({ amount: 10999, mode: 'add' }), {
    mode: 'add', rateKind: 'standard', rate: 18, net: 10999, taxableBase: 10000,
    vat: 1800, gross: 12799, sourceAsOf: '2025-12-30', rounding: 'taxable-base-down-to-xaf-1000'
  });
});

test('Gabon extraction reverses Article 220 invoice arithmetic', () => {
  const result = engine.calculate({ amount: 12799, mode: 'extract' });
  assert.equal(result.net, 10999); assert.equal(result.taxableBase, 10000); assert.equal(result.vat, 1800);
});

test('Gabon reduced and zero treatments fail closed without exact evidence', () => {
  for (const rateKind of ['article-221-ten-confirmed', 'article-221-five-confirmed', 'article-221-zero-confirmed']) {
    assert.throws(() => engine.calculate({ amount: 10000, rateKind }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  }
  assert.equal(engine.calculate({ amount: 10000, rateKind: 'article-221-five-confirmed', rateEvidenceConfirmed: true, rateEvidenceType: engine.EVIDENCE.five }).vat, 500);
});

test('Gabon API accepts only exact statutory evidence and uses Article 220', () => {
  const validate = vatApi._test.validateGabonRateRequest;
  assert.equal(validate({ customRate: 10 }).ok, false);
  assert.equal(validate({ customRate: 10, rateEvidenceConfirmed: true, rateEvidenceType: 'finance-law-2026-article-221-ten-percent-listed-supply' }).ok, true);
  assert.equal(validate({ customRate: 12, rateEvidenceConfirmed: true, rateEvidenceType: 'finance-law-2026-article-221-ten-percent-listed-supply' }).ok, false);
  assert.deepEqual(vatApi._test.calculateGabonVatResult(10999, 18, 'add'), {
    operation: 'add', amountExclusive: 10999, taxableBase: 10000, vatRate: 18, vatAmount: 1800,
    amountInclusive: 12799, currency: 'XAF', rounding: 'taxable-base-down-to-xaf-1000'
  });
});
