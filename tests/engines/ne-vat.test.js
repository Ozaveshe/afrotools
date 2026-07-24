const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/ne-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Niger standard VAT is 19% and reverses exactly', () => {
  assert.equal(engine.calculate({ amount: 10000 }).vat, 1900);
  const extracted = engine.calculate({ amount: 11900, mode: 'extract' });
  assert.deepEqual({ net: extracted.net, vat: extracted.vat, gross: extracted.gross }, { net: 10000, vat: 1900, gross: 11900 });
});

test('Niger special treatments fail closed without exact evidence', () => {
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: 'generic-zero' }));
  for (const kind of ['confirmed-reduced-ten', 'confirmed-reduced-five', 'confirmed-article-322-exempt']) {
    assert.throws(() => engine.calculate({ amount: 10000, rateKind: kind }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  }
});

test('Niger exact evidence supports distinct 10%, 5% and exempt treatments', () => {
  const ten = engine.calculate({ amount: 10000, rateKind: 'confirmed-reduced-ten', rateEvidenceConfirmed: true, rateEvidenceType: engine.TEN_EVIDENCE });
  const five = engine.calculate({ amount: 10000, rateKind: 'confirmed-reduced-five', rateEvidenceConfirmed: true, rateEvidenceType: engine.FIVE_EVIDENCE });
  const exempt = engine.calculate({ amount: 10000, rateKind: 'confirmed-article-322-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE });
  assert.deepEqual({ vat: ten.vat, treatment: ten.treatment }, { vat: 1000, treatment: 'taxable-reduced' });
  assert.deepEqual({ vat: five.vat, treatment: five.treatment }, { vat: 500, treatment: 'taxable-reduced' });
  assert.deepEqual({ vat: exempt.vat, treatment: exempt.treatment }, { vat: 0, treatment: 'exempt' });
});

test('Niger invoice totals standard and evidenced 5% lines once', () => {
  const invoice = engine.calculateInvoice([{ quantity: 1, unitPrice: 10000 }, { quantity: 1, unitPrice: 5000, rateKind: 'confirmed-reduced-five', rateEvidenceConfirmed: true, rateEvidenceType: engine.FIVE_EVIDENCE }]);
  assert.deepEqual({ net: invoice.net, vat: invoice.vat, gross: invoice.gross }, { net: 15000, vat: 2150, gross: 17150 });
});

test('Niger API rejects arbitrary and generic zero rates', () => {
  const validate = api._test.validateNigerRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 19, treatment: 'taxable-standard' });
  assert.equal(validate({ customRate: 7 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.equal(validate({ customRate: 0 }).ok, false);
  assert.equal(validate({ customRate: 10, rateEvidenceConfirmed: true, rateEvidenceType: engine.TEN_EVIDENCE }).treatment, 'taxable-reduced');
  assert.equal(validate({ customRate: 5, rateEvidenceConfirmed: true, rateEvidenceType: engine.FIVE_EVIDENCE }).rate, 5);
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
});
