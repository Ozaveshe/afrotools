const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/na-vat.js');
const api = require('../../netlify/functions/api-vat.js');

test('Namibia standard VAT is 15% and reverses exactly', () => {
  assert.equal(engine.calculate({ amount: 1000 }).vat, 150);
  const extracted = engine.calculate({ amount: 1150, mode: 'extract' });
  assert.deepEqual({ net: extracted.net, vat: extracted.vat, gross: extracted.gross }, { net: 1000, vat: 150, gross: 1150 });
});

test('Namibia special treatments fail closed without exact evidence', () => {
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'custom-zero' }));
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-schedule-iii-zero' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
  assert.throws(() => engine.calculate({ amount: 100, rateKind: 'confirmed-schedule-iv-exempt' }), error => error.code === 'RATE_EVIDENCE_REQUIRED');
});

test('Namibia exact Schedule evidence distinguishes zero-rated and exempt', () => {
  const zero = engine.calculate({ amount: 100, rateKind: 'confirmed-schedule-iii-zero', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE });
  const exempt = engine.calculate({ amount: 100, rateKind: 'confirmed-schedule-iv-exempt', rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE });
  assert.deepEqual({ vat: zero.vat, treatment: zero.treatment }, { vat: 0, treatment: 'zero-rated' });
  assert.deepEqual({ vat: exempt.vat, treatment: exempt.treatment }, { vat: 0, treatment: 'exempt' });
});

test('Namibia invoice totals standard and evidenced lines once', () => {
  const invoice = engine.calculateInvoice([
    { description: 'standard', quantity: 1, unitPrice: 1000 },
    { description: 'Schedule III', quantity: 1, unitPrice: 500, rateKind: 'confirmed-schedule-iii-zero', rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }
  ]);
  assert.deepEqual({ net: invoice.net, vat: invoice.vat, gross: invoice.gross }, { net: 1500, vat: 150, gross: 1650 });
});

test('Namibia API rejects arbitrary custom rates and preserves statutory treatment', () => {
  const validate = api._test.validateNamibiaRateRequest;
  assert.deepEqual(validate({}), { ok: true, rate: 15, treatment: 'taxable' });
  assert.equal(validate({ customRate: 12 }).ok, false);
  assert.equal(validate({ customRate: 0 }).code, 'RATE_EVIDENCE_REQUIRED');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).treatment, 'zero-rated');
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: engine.EXEMPT_EVIDENCE }).treatment, 'exempt');
});
