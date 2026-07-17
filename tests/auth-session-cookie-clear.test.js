const assert = require('assert');

process.env.URL = 'https://afrotools.com';
delete process.env.SUPABASE_ANON_KEY_AUTH;

const { handler } = require('../netlify/functions/auth-session');

async function main() {
  const response = await handler({
    httpMethod: 'POST',
    path: '/api/auth/logout',
    headers: {},
    body: ''
  });

  assert.strictEqual(response.statusCode, 200);
  assert(response.multiValueHeaders, 'logout response should use multiValueHeaders');

  const cookies = response.multiValueHeaders['Set-Cookie'] || [];
  assert.strictEqual(cookies.length, 4, 'production logout should clear host and domain cookies');

  for (const name of ['afro_session', 'afro_refresh']) {
    const scoped = cookies.filter(function(cookie) {
      return cookie.indexOf(name + '=') === 0;
    });
    assert.strictEqual(scoped.length, 2, name + ' should have host and domain clear headers');
    assert(scoped.some(function(cookie) { return cookie.indexOf('Domain=.afrotools.com') === -1; }), name + ' should clear host-only cookie');
    assert(scoped.some(function(cookie) { return cookie.indexOf('Domain=.afrotools.com') !== -1; }), name + ' should clear domain cookie');
    assert(scoped.every(function(cookie) { return cookie.indexOf('Max-Age=0') !== -1; }), name + ' should expire immediately');
    assert(scoped.every(function(cookie) { return cookie.indexOf('Expires=Thu, 01 Jan 1970 00:00:00 GMT') !== -1; }), name + ' should include legacy expiry');
  }
}

main().catch(function(error) {
  console.error(error);
  process.exit(1);
});
