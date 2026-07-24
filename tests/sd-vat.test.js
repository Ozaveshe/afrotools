const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/sd-vat.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Sudan engine applies only the fixed 17% standard rate', () => {
  assert.equal(engine.STANDARD_RATE, 17);
  assert.equal(engine.CURRENCY, 'SDG');
  assert.deepEqual(engine.calculate({ amount: 1000, mode: 'add' }), {
    mode: 'add',
    rate: 17,
    currency: 'SDG',
    entered: 1000,
    net: 1000,
    vat: 170,
    gross: 1170,
    rounding: 'nearest-cent',
    sourceAsOf: '2026-03-28'
  });
  assert.deepEqual(engine.calculate({ amount: 1170, mode: 'extract' }), {
    mode: 'extract',
    rate: 17,
    currency: 'SDG',
    entered: 1170,
    net: 1000,
    vat: 170,
    gross: 1170,
    rounding: 'nearest-cent',
    sourceAsOf: '2026-03-28'
  });
  assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
});

test('Sudan API accepts 17% and rejects custom-rate drift', () => {
  assert.deepEqual(api.validateSudanRateRequest({}), {
    ok: true,
    rate: 17,
    treatment: 'standard-rate-only'
  });
  assert.deepEqual(api.validateSudanRateRequest({ customRate: 17 }), {
    ok: true,
    rate: 17,
    treatment: 'standard-rate-only'
  });
  assert.deepEqual(api.validateSudanRateRequest({ customRate: 0 }), {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Sudan customRate must remain at the official fixed standard rate of 17%; special treatments are outside this API calculation contract.'
  });
  assert.deepEqual(api.calculateVatResult(1000, 17, 'add', 'SDG'), {
    operation: 'add',
    amountExclusive: 1000,
    vatRate: 17,
    vatAmount: 170,
    amountInclusive: 1170,
    currency: 'SDG'
  });
});

test('all launched Sudan VAT locales contain crawlable sourced fallback content', () => {
  const files = [
    'sudan/sd-vat.html',
    'fr/sudan/sd-vat.html',
    'sw/sudan/kikokotoo-vat/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /17 ?%/);
    assert.match(html, /1(?:\.|,)17/);
    assert.match(html, /SDG/);
    assert.match(html, /2026/);
    assert.match(html, /tax\.gov\.sd\/en\/newsen\//);
    assert.match(html, /tax\.gov\.sd\/en\/value-added-tax-vat\//);
    assert.match(html, /tax\.gov\.sd\/en\/tax-laws\//);
    assert.match(html, /FAQPage/);
    assert.doesNotMatch(html, /financialministry\.gov\.sd|SRTD|SDG 100K|customRate|whRate|zero-rated exports|basic food/i);
  }
});
