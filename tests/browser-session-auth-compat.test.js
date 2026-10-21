'use strict';
const a = require('node:assert/strict');
const { test } = require('node:test');
const { legacyFixture, response, user } = require('./support/profile-provider-fixture');
const AUTH = 'netlify/functions/_shared/browser-session-auth.js';
const MARKET = 'netlify/functions/_shared/market-data.js';
const bearer = { headers: { authorization: 'Bearer synthetic-bearer' } };
const plain = value => JSON.parse(JSON.stringify(value));
function noSession(result) {
  a.deepEqual(plain(result.sessionResponse), { headers: {}, multiValueHeaders: {} });
  a.equal(result.providerUnavailable, undefined);
}

test('legacy default Auth retains valid bearer200 and request contract', async () => {
  const f = legacyFixture(AUTH, async () => response(200, user));
  const result = await f.api.getUserFromEvent(bearer);
  a.deepEqual(plain(result.user), user); noSession(result);
  a.equal(f.requests.length, 1);
  a.deepEqual(plain(f.requests[0]), { path: '/auth/v1/user', method: 'GET', headers: { apikey: 'synthetic-anon', 'Content-Type': 'application/json', Authorization: 'Bearer synthetic-bearer' } });
});
test('legacy default Auth retains invalid bearer401 as signedout', async () => {
  const f = legacyFixture(AUTH, async () => response(401, {}));
  const result = await f.api.getUserFromEvent(bearer);
  a.equal(result.user, null); noSession(result); a.equal(f.requests.length, 1);
});
test('legacy default Auth retains valid session cookie200', async () => {
  const f = legacyFixture(AUTH, async () => response(200, user));
  const result = await f.api.getUserFromEvent({ headers: { cookie: 'afro_session=synthetic-cookie' } });
  a.equal(result.user.id, user.id); noSession(result);
  a.equal(f.requests[0].headers.Authorization, 'Bearer synthetic-cookie');
});
test('legacy default Auth valid refresh retains both secure cookies', async () => {
  const f = legacyFixture(AUTH, async () => response(200, { user, access_token: 'synthetic-rotated', refresh_token: 'synthetic-next', expires_in: 3600 }));
  const result = await f.api.getUserFromEvent({ headers: { cookie: 'afro_refresh=synthetic-refresh' } });
  a.equal(result.user.id, user.id);
  a.deepEqual(plain(result.sessionResponse.multiValueHeaders['Set-Cookie']), ['afro_session=synthetic-rotated; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600', 'afro_refresh=synthetic-next; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000']);
  a.equal(f.requests.length, 1); a.equal(f.requests[0].path, '/auth/v1/token');
  a.deepEqual(JSON.parse(f.requests[0].body), { refresh_token: 'synthetic-refresh' });
});
test('legacy default Auth rejected session can still refresh successfully', async () => {
  const f = legacyFixture(AUTH, async target => target.pathname === '/auth/v1/user' ? response(401, {}) : response(200, { user, access_token: 'synthetic-new-access', refresh_token: 'synthetic-new-refresh', expires_in: 3600 }));
  const result = await f.api.getUserFromEvent({ headers: { cookie: 'afro_session=synthetic-old; afro_refresh=synthetic-refresh' } });
  a.equal(result.user.id, user.id); a.equal(result.sessionResponse.multiValueHeaders['Set-Cookie'].length, 2);
  a.deepEqual(f.requests.map(r => r.path), ['/auth/v1/user', '/auth/v1/token']);
});
test('legacy default Auth rejected refresh remains signedout', async () => {
  const f = legacyFixture(AUTH, async () => response(401, {}));
  const result = await f.api.getUserFromEvent({ headers: { cookie: 'afro_refresh=synthetic-refresh' } });
  a.equal(result.user, null); noSession(result); a.equal(f.requests.length, 1);
});
test('legacy default Auth absent credentials make no provider request', async () => {
  const f = legacyFixture(AUTH, () => { throw Error('Unexpected provider request'); });
  const result = await f.api.getUserFromEvent({ headers: {} });
  a.equal(result.user, null); noSession(result); a.equal(f.requests.length, 0);
});
test('legacy default Auth preserves network exception', async () => {
  const f = legacyFixture(AUTH, async () => { throw new TypeError('synthetic-network-failure'); });
  await a.rejects(f.api.getUserFromEvent(bearer), { name: 'TypeError', message: 'synthetic-network-failure' });
  a.equal(f.requests.length, 1);
});
test('legacy default Auth missing configured key remains null', async () => {
  const f = legacyFixture(AUTH, () => { throw Error('Unexpected provider request'); }, { key: false });
  const result = await f.api.getUserFromEvent(bearer);
  a.equal(result.user, null); noSession(result); a.equal(f.requests.length, 0);
});
test('legacy four-argument sbRequest GET retains JSON and header behavior', async () => {
  const f = legacyFixture(MARKET, async () => response(200, [{ value: 7 }]));
  a.deepEqual(plain(await f.api.sbRequest('GET', 'synthetic_rows?select=value', undefined, { Prefer: 'count=exact' })), [{ value: 7 }]);
  a.deepEqual(plain(f.requests[0].headers), { apikey: 'synthetic-service', Authorization: 'Bearer synthetic-service', 'Content-Type': 'application/json', Prefer: 'count=exact' });
  a.equal(f.requests[0].method, 'GET');
});
test('legacy four-argument sbRequest POST retains body and explicit header override', async () => {
  const f = legacyFixture(MARKET, async () => response(201, [{ value: 7 }]));
  a.deepEqual(plain(await f.api.sbRequest('POST', 'synthetic_rows', { value: 7 }, { Prefer: 'return=representation', apikey: 'synthetic-override' })), [{ value: 7 }]);
  a.equal(f.requests[0].method, 'POST'); a.equal(f.requests[0].headers.apikey, 'synthetic-override');
  a.deepEqual(JSON.parse(f.requests[0].body), { value: 7 });
});
test('legacy four-argument sbRequest204 retains empty-body behavior', async () => {
  const f = legacyFixture(MARKET, async () => ({ status: 204, ok: true, text: async () => '' }));
  a.equal(await f.api.sbRequest('PATCH', 'synthetic_rows', { value: 8 }, { Prefer: 'return=minimal' }), '');
});
test('legacy four-argument sbRequest HTTP504 retains existing JSON behavior', async () => {
  const f = legacyFixture(MARKET, async () => response(504, { error: 'synthetic-upstream' }));
  a.deepEqual(plain(await f.api.sbRequest('GET', 'synthetic_rows', null, {})), { error: 'synthetic-upstream' });
});
test('legacy four-argument sbRequest retains nonJSON text behavior', async () => {
  const f = legacyFixture(MARKET, async () => ({ status: 200, ok: true, text: async () => 'synthetic-non-json' }));
  a.equal(await f.api.sbRequest('GET', 'synthetic_rows', null, {}), 'synthetic-non-json');
});
test('legacy four-argument sbRequest preserves network exception', async () => {
  const f = legacyFixture(MARKET, async () => { throw new TypeError('synthetic-network-failure'); });
  await a.rejects(f.api.sbRequest('GET', 'synthetic_rows', null, {}), { name: 'TypeError', message: 'synthetic-network-failure' });
});
