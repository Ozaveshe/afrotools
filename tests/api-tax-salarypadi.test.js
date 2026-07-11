const assert = require('assert');
const nigeria = require('../netlify/functions/_engines/ng-paye.js');

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
const { handler } = require('../netlify/functions/api-tax.js');

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
  delete process.env.SALARYPADI_API_KEY;
  console.log('AfroTools SalaryPadi PAYE input tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
