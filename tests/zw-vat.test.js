const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/zw-vat.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Zimbabwe engine applies fixed 15.5% and preserves ZWG or USD', () => {
  assert.equal(engine.STANDARD_RATE, 15.5);
  assert.deepEqual(engine.ALLOWED_CURRENCIES, ['ZWG', 'USD']);
  assert.deepEqual(engine.calculate({ amount: 1000, mode: 'add', currency: 'ZWG' }), {
    mode: 'add', rate: 15.5, currency: 'ZWG', entered: 1000,
    net: 1000, vat: 155, gross: 1155, rounding: 'nearest-cent', sourceAsOf: '2026-07-23'
  });
  assert.deepEqual(engine.calculate({ amount: 1155, mode: 'extract', currency: 'USD' }), {
    mode: 'extract', rate: 15.5, currency: 'USD', entered: 1155,
    net: 1000, vat: 155, gross: 1155, rounding: 'nearest-cent', sourceAsOf: '2026-07-23'
  });
  assert.throws(() => engine.calculate({ amount: 1, currency: 'ZWL' }), /ZWG or USD/);
  assert.throws(() => engine.calculate({ amount: -1, currency: 'ZWG' }), /non-negative/);
  assert.throws(() => engine.calculate({ amount: '', currency: 'ZWG' }), /required/);
});

test('Zimbabwe API accepts only 15.5% and ZWG or USD', () => {
  assert.deepEqual(api.validateZimbabweRateRequest({}), {
    ok: true, rate: 15.5, treatment: 'standard-rate-only', currency: 'ZWG'
  });
  assert.deepEqual(api.validateZimbabweRateRequest({ customRate: 15.5, currency: 'usd' }), {
    ok: true, rate: 15.5, treatment: 'standard-rate-only', currency: 'USD'
  });
  assert.equal(api.validateZimbabweRateRequest({ customRate: 0, currency: 'ZWG' }).code, 'STANDARD_RATE_ONLY');
  assert.equal(api.validateZimbabweRateRequest({ currency: 'ZWL' }).code, 'STALE_CURRENCY');
  assert.equal(api.validateZimbabweRateRequest({ currency: 'EUR' }).code, 'UNSUPPORTED_CURRENCY');
  assert.deepEqual(api.calculateVatResult(1000, 15.5, 'add', 'USD'), {
    operation: 'add', amountExclusive: 1000, vatRate: 15.5, vatAmount: 155, amountInclusive: 1155, currency: 'USD'
  });
});

test('all launched Zimbabwe VAT locales contain crawlable current fallback content', () => {
  for (const file of ['zimbabwe/zw-vat.html', 'fr/zimbabwe/zw-vat.html', 'sw/zimbabwe/kikokotoo-vat/index.html']) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /15(?:\.|,)5 ?%|15(?:\.|,)5 %/);
    assert.match(html, /1(?:\.|,)155/);
    assert.match(html, /ZWG/);
    assert.match(html, /USD/);
    assert.match(html, /4441%3Apublic-notice-07-of-2026/);
    assert.match(html, /act\/2025\/7/);
    assert.match(html, /PRESS_STATEMENT_ON_ZiG_CURRENCY_CODE/);
    assert.match(html, /FAQPage/);
    assert.match(html, /Report calculation error|Signaler une erreur de calcul|Ripoti hitilafu ya hesabu/);
    assert.doesNotMatch(html, /Zero-rated exports|tourism.{0,20}zero|basic food|medical supplies|agricultural inputs|customRate/i);
  }
});
