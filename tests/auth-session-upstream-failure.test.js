const assert = require('assert');

process.env.URL = 'https://afrotools.com';
process.env.SUPABASE_ANON_KEY_AUTH = 'anon-test-key';

let fetchCalls = 0;
global.fetch = async function () {
  fetchCalls += 1;
  return {
    status: 504,
    async json() {
      return {
        error_code: 'request_timeout',
        msg: 'Database error querying schema',
      };
    },
  };
};

const { handler } = require('../netlify/functions/auth-session');

async function main() {
  const response = await handler({
    httpMethod: 'POST',
    path: '/api/auth/login',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'outage@afrotools.test', password: 'password123' }),
  });

  assert.strictEqual(fetchCalls, 1, 'one login submission should issue one Supabase password grant');
  assert.strictEqual(response.statusCode, 503, 'upstream outages should remain service-unavailable errors');
  const body = JSON.parse(response.body);
  assert.strictEqual(body.ok, false);
  assert.strictEqual(
    body.error,
    'Sign-in service is temporarily unavailable. Please wait a moment and try again.'
  );
  assert.strictEqual(response.multiValueHeaders, undefined, 'failed login must not set session cookies');
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
