const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { EnvValidationError, getEnv, loadEnv } = require('../netlify/functions/_shared/env');
const { withApi } = require('../netlify/functions/_shared/with-api');

const ROOT = path.join(__dirname, '..');
const WRAPPED_FUNCTIONS = [
  'api-forex.js',
  'api-fuel.js',
  'api-transport-fares.js',
  'api-rates.js',
  'api-commodity-prices.js',
  'api-electricity.js',
  'api-telecom.js',
  'api-data-freshness.js',
  'api-fintech-fees.js',
  'api-remittance-quotes.js',
  'api-status.js',
  'api-gateway.js',
  'api-tax.js',
  'api-tax-rates.js',
  'api-vat.js',
  'api-countries.js',
  'api-v1-ai-route.js',
  'api-career.mjs',
  'api-tool-catalog.js',
  'api-fx-rates.js',
];

async function run() {
  assert.strictEqual(getEnv('OPTIONAL', { source: {}, defaultValue: 'fallback' }), 'fallback');
  assert.deepStrictEqual(
    loadEnv({ PORT: { required: true, transform: Number } }, { source: { PORT: '4173' } }),
    { PORT: 4173 }
  );
  assert.throws(
    function () { loadEnv({ TOKEN: { required: true } }, { source: {} }); },
    function (error) {
      return error instanceof EnvValidationError && error.code === 'MISSING_ENVIRONMENT_VARIABLES';
    }
  );

  const expected = { statusCode: 201, body: 'unchanged' };
  const passThrough = withApi(async function () { return expected; }, { name: 'pass-through' });
  assert.strictEqual(await passThrough({ headers: {} }), expected);

  const failing = withApi(async function () { throw new Error('private detail'); }, { name: 'failure-test' });
  const failure = await failing({ headers: {} });
  assert.strictEqual(failure.statusCode, 500);
  assert.deepStrictEqual(JSON.parse(failure.body), {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    docs: 'https://afrotools.com/docs/api',
  });
  assert.ok(!failure.body.includes('private detail'));

  const denied = withApi(async function () { throw new Error('must not run'); }, {
    name: 'auth-test',
    auth: async function () { return { valid: false, status: 403, error: 'Denied', code: 'DENIED' }; },
  });
  const authFailure = await denied({ headers: {} });
  assert.strictEqual(authFailure.statusCode, 403);
  assert.deepStrictEqual(JSON.parse(authFailure.body), {
    error: 'Denied',
    code: 'DENIED',
    docs: 'https://afrotools.com/docs/api',
  });

  const key = '198.51.100.' + Math.floor(Math.random() * 200 + 1);
  const limited = withApi(async function () { return { statusCode: 200, body: 'ok' }; }, {
    name: 'rate-test-' + Date.now(),
    rateLimit: 1,
  });
  assert.strictEqual((await limited({ headers: { 'x-forwarded-for': key } })).statusCode, 200);
  const rateFailure = await limited({ headers: { 'x-forwarded-for': key } });
  assert.strictEqual(rateFailure.statusCode, 429);
  assert.strictEqual(JSON.parse(rateFailure.body).code, 'RATE_LIMIT_EXCEEDED');

  const requestFailure = await failing(new Request('https://afrotools.com/api/test'));
  assert.ok(requestFailure instanceof Response);
  assert.strictEqual(requestFailure.status, 500);
  assert.strictEqual((await requestFailure.json()).code, 'INTERNAL_ERROR');

  assert.strictEqual(WRAPPED_FUNCTIONS.length, 20);
  WRAPPED_FUNCTIONS.forEach(function (file) {
    const source = fs.readFileSync(path.join(ROOT, 'netlify', 'functions', file), 'utf8');
    assert.ok(source.includes('withApi'), file + ' is not enrolled in withApi');
  });

  console.log('with-api tests passed (20 endpoint enrollments)');
}

run().catch(function (error) {
  console.error(error);
  process.exit(1);
});
