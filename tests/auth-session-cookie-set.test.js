const assert = require('assert');

process.env.URL = 'https://afrotools.com';
process.env.SUPABASE_ANON_KEY_AUTH = 'anon-test-key';

global.fetch = async function(url, options) {
  assert(String(url).indexOf('/auth/v1/token?grant_type=password') !== -1, 'login should call Supabase password token endpoint');
  assert.strictEqual(options.method, 'POST');
  return {
    status: 200,
    async json() {
      return {
        access_token: 'access-token-test',
        refresh_token: 'refresh-token-test',
        expires_in: 3600,
        user: {
          id: 'cookie-set-user',
          email: 'cookie-set@afrotools.test',
          created_at: '2026-01-01T00:00:00.000Z',
          user_metadata: { name: 'Cookie Set', country: 'NG' }
        }
      };
    }
  };
};

const { handler } = require('../netlify/functions/auth-session');

async function main() {
  const response = await handler({
    httpMethod: 'POST',
    path: '/api/auth/login',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'cookie-set@afrotools.test', password: 'password123' })
  });

  assert.strictEqual(response.statusCode, 200);
  assert(response.multiValueHeaders, 'login response should use multiValueHeaders');

  const cookies = response.multiValueHeaders['Set-Cookie'] || [];
  assert.strictEqual(cookies.length, 4, 'production login should prune host-only cookies and set domain cookies');

  for (const name of ['afro_session', 'afro_refresh']) {
    const scoped = cookies.filter(function(cookie) {
      return cookie.indexOf(name + '=') === 0;
    });
    assert.strictEqual(scoped.length, 2, name + ' should have one host clear and one domain set header');
    assert(scoped.some(function(cookie) {
      return cookie.indexOf('Domain=.afrotools.com') === -1 && cookie.indexOf('Max-Age=0') !== -1;
    }), name + ' should clear any old host-only cookie');
    assert(scoped.some(function(cookie) {
      return cookie.indexOf('Domain=.afrotools.com') !== -1 && cookie.indexOf('Max-Age=0') === -1;
    }), name + ' should set the production domain cookie');
  }
}

main().catch(function(error) {
  console.error(error);
  process.exit(1);
});
