const assert = require('assert');
const nigeria = require('../netlify/functions/_engines/ng-paye.js');
const engines = require('../netlify/functions/_engines');

const result = nigeria.calculate({
  grossAnnual: 7200000,
  regime: 'NTA_2026',
  pension: false,
  nhf: false,
  nhis: false,
  pensionAmount: 480000,
  nhfAmount: 120000,
  nhisAmount: 60000,
  annualRent: 2400000,
  mortgageInterest: 100000,
  lifeAssurance: 50000,
});

assert.strictEqual(result.deductions.pension, 480000);
assert.strictEqual(result.deductions.nhf, 120000);
assert.strictEqual(result.deductions.nhis, 60000);
assert.strictEqual(result.deductions.rentRelief, 480000);
assert.strictEqual(result.deductions.mortgageInterest, 100000);
assert.strictEqual(result.deductions.lifeAssurance, 50000);
assert.strictEqual(result.tax.taxableIncome, 5910000);

const exempt = nigeria.calculate({
  grossAnnual: 840000,
  regime: 'NTA_2026',
  pension: false,
  nhf: false,
  nhis: false,
  minimumWageExempt: true,
});
assert.strictEqual(exempt.tax.netTax, 0);

assert.throws(
  () => nigeria.calculate({ grossAnnual: 7200000, pensionAmount: -1 }),
  /pensionAmount must be a non-negative number/,
);

process.env.SALARYPADI_API_KEY = 'afro_live_test_partner_key';
const { handler, normalizeTaxResultForApi } = require('../netlify/functions/api-tax.js');
const taxRates = require('../netlify/functions/api-tax-rates.js');

for (const countryCode of engines.listCountryCodes()) {
  const engine = engines.get(countryCode);
  const raw = engine.calculate({ grossAnnual: 1200000 });
  const originalBands = JSON.parse(JSON.stringify(raw.tax.bands));
  const normalized = normalizeTaxResultForApi(raw, engine.currency);
  assert.ok(Array.isArray(normalized.tax.bands) && normalized.tax.bands.length > 0, `${countryCode} exposes tax bands`);
  for (const band of normalized.tax.bands) {
    assert.ok(typeof band.label === 'string' && band.label.length > 0, `${countryCode} band has a canonical label`);
    assert.ok(Number.isFinite(band.rate), `${countryCode} band has a numeric rate`);
    assert.ok(Number.isFinite(band.amount), `${countryCode} band has a numeric amount`);
    assert.ok(Object.prototype.hasOwnProperty.call(band, 'from'), `${countryCode} keeps legacy from`);
    assert.ok(Object.prototype.hasOwnProperty.call(band, 'to'), `${countryCode} keeps legacy to`);
    assert.ok(Object.prototype.hasOwnProperty.call(band, 'taxInBand'), `${countryCode} keeps legacy taxInBand`);
    assert.strictEqual(band.amount, band.taxInBand, `${countryCode} canonical amount matches engine taxInBand`);
    assert.ok(band.to >= band.from, `${countryCode} band range is ordered`);
  }
  assert.deepStrictEqual(raw.tax.bands, originalBands, `${countryCode} serializer does not mutate engine output`);
}

(async () => {
  const response = await handler({
    httpMethod: 'POST',
    path: '/api/v1/tax/paye',
    headers: {
      'x-api-key': 'afro_live_test_partner_key',
      origin: 'https://salarypadi.com',
    },
    queryStringParameters: {},
    body: JSON.stringify({
      country: 'NG',
      grossAnnual: 7200000,
      regime: 'NTA_2026',
      pension: false,
      nhf: false,
      nhis: false,
      pensionAmount: 480000,
      nhfAmount: 120000,
      nhisAmount: 60000,
      annualRent: 2400000,
      mortgageInterest: 100000,
      lifeAssurance: 50000,
    }),
  });
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.headers['Access-Control-Allow-Origin'], 'https://salarypadi.com');
  assert.strictEqual(response.headers['X-RateLimit-Limit'], '10000');
  assert.strictEqual(response.headers['X-RateLimit-Scope'], 'service:salarypadi');
  const body = JSON.parse(response.body);
  assert.strictEqual(body.tax.taxableIncome, 5910000);
  assert.strictEqual(body._meta.sandbox, false);
  assert.strictEqual(
    body._meta.dataPolicy,
    'calculated from versioned AfroTools country tax rules; salary inputs and results are not intentionally retained',
  );
  assert.strictEqual(body._meta.docs, 'https://afrotools.com/docs/api/tax');
  assert.ok(body.tax.bands.every(band => (
    typeof band.label === 'string' &&
    Number.isFinite(band.rate) &&
    Number.isFinite(band.amount)
  )), 'Production PAYE bands expose the canonical label/rate/amount contract');
  assert.ok(body.tax.bands.every(band => (
    Object.prototype.hasOwnProperty.call(band, 'from') &&
    Object.prototype.hasOwnProperty.call(band, 'to') &&
    Object.prototype.hasOwnProperty.call(band, 'taxInBand')
  )), 'Production PAYE bands retain the legacy range fields for v1 compatibility');

  const countryRouteResponse = await handler({
    httpMethod: 'GET',
    path: '/api/v1/tax/nigeria/paye',
    headers: {
      'x-api-key': 'afro_live_test_partner_key',
      origin: 'https://salarypadi.com',
    },
    queryStringParameters: { grossAnnual: '1200000' },
  });
  assert.strictEqual(countryRouteResponse.statusCode, 200, countryRouteResponse.body);
  const countryRouteBody = JSON.parse(countryRouteResponse.body);
  assert.strictEqual(countryRouteBody._meta.sandbox, false);
  assert.strictEqual(
    countryRouteBody._meta.dataPolicy,
    'calculated from versioned AfroTools country tax rules; salary inputs and results are not intentionally retained',
  );
  assert.strictEqual(countryRouteBody._meta.docs, 'https://afrotools.com/docs/api/tax');
  assert.ok(countryRouteBody.tax.bands.every(band => (
    typeof band.label === 'string' &&
    Number.isFinite(band.rate) &&
    Number.isFinite(band.amount)
  )), 'Production country PAYE route follows the canonical band contract');

  const ratesResponse = await taxRates.handler({
    httpMethod: 'GET',
    path: '/api/v1/tax/rates',
    headers: {
      'x-api-key': 'afro_live_test_partner_key',
      origin: 'https://salarypadi.com',
    },
    queryStringParameters: { country: 'NG', type: 'paye' },
  });
  assert.strictEqual(ratesResponse.statusCode, 200, ratesResponse.body);
  assert.strictEqual(ratesResponse.headers['X-RateLimit-Scope'], 'service:salarypadi');
  const ratesBody = JSON.parse(ratesResponse.body);
  assert.strictEqual(ratesBody.sandbox, false);
  assert.strictEqual(ratesBody.data_policy, 'versioned AfroTools country tax reference data');
  assert.ok(ratesBody.paye && !ratesBody.vat, 'PAYE-only rate response keeps the requested filter');

  const ratesListResponse = await taxRates.handler({
    httpMethod: 'GET',
    path: '/api/v1/tax/rates',
    headers: {
      'x-api-key': 'afro_live_test_partner_key',
      origin: 'https://salarypadi.com',
    },
    queryStringParameters: {},
  });
  assert.strictEqual(ratesListResponse.statusCode, 200, ratesListResponse.body);
  const ratesListBody = JSON.parse(ratesListResponse.body);
  assert.strictEqual(ratesListBody.sandbox, false);
  assert.strictEqual(ratesListBody.data_policy, 'versioned AfroTools country tax reference data');
  assert.ok(Array.isArray(ratesListBody.countries) && ratesListBody.countries.length === 54);
  delete process.env.SALARYPADI_API_KEY;
  console.log('AfroTools SalaryPadi PAYE input tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
