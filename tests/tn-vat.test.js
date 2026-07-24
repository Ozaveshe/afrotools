const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/tn-vat.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Tunisia engine applies only the fixed 19% general rate', () => {
  assert.equal(engine.STANDARD_RATE, 19);
  assert.equal(engine.CURRENCY, 'TND');
  assert.deepEqual(engine.calculate({ amount: 1000, mode: 'add' }), {
    mode: 'add',
    rate: 19,
    currency: 'TND',
    entered: 1000,
    net: 1000,
    vat: 190,
    gross: 1190,
    rounding: 'nearest-millime',
    sourceAsOf: '2026-07-23'
  });
  assert.deepEqual(engine.calculate({ amount: 1190, mode: 'extract' }), {
    mode: 'extract',
    rate: 19,
    currency: 'TND',
    entered: 1190,
    net: 1000,
    vat: 190,
    gross: 1190,
    rounding: 'nearest-millime',
    sourceAsOf: '2026-07-23'
  });
  assert.deepEqual(engine.calculate({ amount: 1.234, mode: 'add' }), {
    mode: 'add',
    rate: 19,
    currency: 'TND',
    entered: 1.234,
    net: 1.234,
    vat: 0.234,
    gross: 1.468,
    rounding: 'nearest-millime',
    sourceAsOf: '2026-07-23'
  });
  assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
});

test('Tunisia API accepts 19% and rejects reduced or custom-rate drift', () => {
  assert.deepEqual(api.validateTunisiaRateRequest({}), {
    ok: true,
    rate: 19,
    treatment: 'general-rate-only'
  });
  assert.deepEqual(api.validateTunisiaRateRequest({ customRate: 19 }), {
    ok: true,
    rate: 19,
    treatment: 'general-rate-only'
  });
  for (const customRate of [13, 7, 0]) {
    assert.deepEqual(api.validateTunisiaRateRequest({ customRate }), {
      ok: false,
      statusCode: 400,
      code: 'GENERAL_RATE_ONLY',
      error: 'Tunisia customRate must remain at the official general rate of 19%; reduced rates and other special treatments require current transaction-specific Ministry or tax-administration verification.'
    });
  }
  assert.deepEqual(api.calculateVatResult(1000, 19, 'add', 'TND'), {
    operation: 'add',
    amountExclusive: 1000,
    vatRate: 19,
    vatAmount: 190,
    amountInclusive: 1190,
    currency: 'TND'
  });
});

test('all launched Tunisia VAT locales contain crawlable sourced fallback content', () => {
  const files = [
    'tunisia/tn-vat.html',
    'fr/tunisie/calculateur-tva.html',
    'sw/tunisia/kikokotoo-vat/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /19 ?%|19 %/);
    assert.match(html, /1(?:\.|,)19/);
    assert.match(html, /TND/);
    assert.match(html, /2026/);
    assert.match(html, /finances\.gov\.tn\/ar\/lmht-amwt/);
    assert.match(html, /loi-des-finances-pour-lannee-2026-ar/);
    assert.match(html, /CODE%20TVA%202017%20FR\.pdf/);
    assert.match(html, /FAQPage/);
    assert.doesNotMatch(html, /\b13 ?%|\b7 ?%(?!20)|zero-rated exports|agricultural inputs|medical services|educational services|TND 100K|TND 50K|customRate|whRate/i);
  }
});
