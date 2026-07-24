const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/so-consumption-tax-status.js');
const api = require('../netlify/functions/api-vat.js')._test;

test('Somalia federal VAT status is explicitly non-calculable', () => {
  const status = engine.getStatus();
  assert.equal(status.nationalVatVerified, false);
  assert.equal(status.calculable, false);
  assert.equal(status.rate, null);
  assert.equal(status.currency, null);
  assert.equal(status.code, 'NO_VERIFIED_NATIONAL_VAT');
  assert.throws(() => engine.calculate({ amount: 1000 }), error => error.code === 'NO_VERIFIED_NATIONAL_VAT');
  assert.deepEqual(api.validateSomaliaRateRequest(), {
    ok: false,
    statusCode: 422,
    code: 'NO_VERIFIED_NATIONAL_VAT',
    error: 'No current nationwide Somalia VAT rate is verified from federal primary sources; API calculation is disabled.'
  });
});

test('Somalia keeps 2026 sales-tax evidence separate from the dated USD turnover table', () => {
  const evidence = engine.getStatus().evidence;
  assert.equal(evidence[0].id, 'fgs-budget-policy-2026');
  assert.equal(evidence[0].liabilityRate, null);
  assert.equal(evidence[0].currency, null);
  assert.equal(evidence[1].id, 'fgs-turnover-tax-policy-2023');
  assert.equal(evidence[1].currency, 'USD');
  assert.equal(evidence[1].liabilityRate, null);
  assert.deepEqual(evidence[1].historicalTable.map(row => row.publishedCharge), ['USD 150 fixed', '1.5% of gross turnover']);
});

test('all Somalia locales contain a complete crawlable no-JS evidence fallback', () => {
  const files = [
    'somalia/so-vat.html',
    'fr/somalia/so-vat.html',
    'sw/somalia/kikokotoo-vat/index.html'
  ];
  for (const file of files) {
    const html = fs.readFileSync(path.resolve(file), 'utf8');
    assert.match(html, /NO_VERIFIED_NATIONAL_VAT/);
    assert.match(html, /2026/);
    assert.match(html, /2023/);
    assert.match(html, /10(?:,| )000/);
    assert.match(html, /1(?:\.|,)5 ?%/);
    assert.match(html, /fiscal-year-2026-budget-policy-framework-paper/);
    assert.match(html, /xeer-nidaamiyaha-canshuurta-gedis-layda-turnover-tax/);
    assert.doesNotMatch(html, /financialministry\.gov\.sd|SRTD|1\.1700|standard 0%|SOS/);
  }
});
