const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/zm-vat.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Zambia engine applies only the fixed 16% standard rate', () => {
  assert.equal(engine.STANDARD_RATE, 16);
  assert.equal(engine.CURRENCY, 'ZMW');
  assert.deepEqual(engine.calculate({ amount: 1000, mode: 'add' }), {
    mode: 'add', rate: 16, currency: 'ZMW', entered: 1000,
    net: 1000, vat: 160, gross: 1160, rounding: 'nearest-ngwee', sourceAsOf: '2026-07-23'
  });
  assert.deepEqual(engine.calculate({ amount: 1160, mode: 'extract' }), {
    mode: 'extract', rate: 16, currency: 'ZMW', entered: 1160,
    net: 1000, vat: 160, gross: 1160, rounding: 'nearest-ngwee', sourceAsOf: '2026-07-23'
  });
  assert.deepEqual(engine.calculate({ amount: 0.01, mode: 'add' }), {
    mode: 'add', rate: 16, currency: 'ZMW', entered: 0.01,
    net: 0.01, vat: 0, gross: 0.01, rounding: 'nearest-ngwee', sourceAsOf: '2026-07-23'
  });
  assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
  assert.throws(() => engine.calculate({ amount: '' }), /required/);
});

test('Zambia API accepts 16% and rejects unsupported treatment drift', () => {
  assert.deepEqual(api.validateZambiaRateRequest({}), { ok: true, rate: 16, treatment: 'standard-rate-only' });
  assert.deepEqual(api.validateZambiaRateRequest({ customRate: 16 }), { ok: true, rate: 16, treatment: 'standard-rate-only' });
  for (const customRate of [0, 10, 20]) {
    const result = api.validateZambiaRateRequest({ customRate });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'STANDARD_RATE_ONLY');
    assert.match(result.error, /exact current statutory and invoice evidence/);
  }
  assert.deepEqual(api.calculateVatResult(1000, 16, 'add', 'ZMW'), {
    operation: 'add', amountExclusive: 1000, vatRate: 16, vatAmount: 160, amountInclusive: 1160, currency: 'ZMW'
  });
});

test('all launched Zambia VAT locales contain crawlable sourced fallback content', () => {
  const files = ['zambia/zm-vat.html', 'fr/zambia/zm-vat.html', 'sw/zambia/kikokotoo-vat/index.html'];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    const toolContent = html.replace(/<ul class="seo-links-list">[\s\S]*?<\/ul>/gi, '');
    assert.match(html, /16 ?%|16 %/);
    assert.match(html, /1(?:\.|,)16/);
    assert.match(html, /ZMW/);
    assert.match(html, /2026/);
    assert.match(html, /zra\.org\.zm\/tax-information/);
    assert.match(html, /VSDC-API-Specification/);
    assert.match(html, /parliament\.gov\.zm\/node\/12767/);
    assert.match(html, /FAQPage/);
    assert.doesNotMatch(toolContent, /Tourist services|Basic foodstuffs|Agricultural inputs|Medical supplies|Educational materials|registration threshold|customRate/i);
  }
});
