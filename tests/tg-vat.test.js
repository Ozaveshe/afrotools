const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/tg-vat.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Togo engine applies only the fixed 18% standard rate', () => {
  assert.equal(engine.STANDARD_RATE, 18);
  assert.equal(engine.CURRENCY, 'XOF');
  assert.deepEqual(engine.calculate({ amount: 10000, mode: 'add' }), {
    mode: 'add',
    rate: 18,
    currency: 'XOF',
    entered: 10000,
    net: 10000,
    vat: 1800,
    gross: 11800,
    rounding: 'nearest-franc',
    sourceAsOf: '2026-06-23'
  });
  assert.deepEqual(engine.calculate({ amount: 11800, mode: 'extract' }), {
    mode: 'extract',
    rate: 18,
    currency: 'XOF',
    entered: 11800,
    net: 10000,
    vat: 1800,
    gross: 11800,
    rounding: 'nearest-franc',
    sourceAsOf: '2026-06-23'
  });
  assert.throws(() => engine.calculate({ amount: -1 }), /non-negative/);
  assert.throws(() => engine.calculate({ amount: '' }), /required/);
});

test('Togo API accepts 18% and rejects custom-rate drift', () => {
  assert.deepEqual(api.validateTogoRateRequest({}), {
    ok: true,
    rate: 18,
    treatment: 'standard-rate-only'
  });
  assert.deepEqual(api.validateTogoRateRequest({ customRate: 18 }), {
    ok: true,
    rate: 18,
    treatment: 'standard-rate-only'
  });
  assert.deepEqual(api.validateTogoRateRequest({ customRate: 10 }), {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Togo customRate must remain at the official fixed standard rate of 18%; Article 180 exemptions and other special treatments are outside this API calculation contract.'
  });
  assert.deepEqual(api.validateTogoRateRequest({ customRate: 0 }), {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Togo customRate must remain at the official fixed standard rate of 18%; Article 180 exemptions and other special treatments are outside this API calculation contract.'
  });
  assert.deepEqual(api.calculateVatResult(10000, 18, 'add', 'XOF'), {
    operation: 'add',
    amountExclusive: 10000,
    vatRate: 18,
    vatAmount: 1800,
    amountInclusive: 11800,
    currency: 'XOF'
  });
});

test('all launched Togo VAT locales contain crawlable sourced fallback content', () => {
  const files = [
    'togo/tg-vat.html',
    'fr/togo/calculateur-tva.html',
    'sw/togo/kikokotoo-vat/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /18 ?%|18 %/);
    assert.match(html, /1(?:\.|,)18/);
    assert.match(html, /XOF/);
    assert.match(html, /2026/);
    assert.match(html, /Article 195|article 195|Kifungu cha 195/);
    assert.match(html, /600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/);
    assert.match(html, /628-cahier-fiscal-2026/);
    assert.match(html, /FAQPage/);
    assert.doesNotMatch(html, /10 ?%|taux r.duit|zero-rated exports|basic food|agricultural inputs|medical services|XOF 50M|XOF 60M|customRate|whRate/i);
  }
});
