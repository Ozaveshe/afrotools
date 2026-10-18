'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const base = path.resolve(__dirname, '..');
const account = { id: 'owned-synthetic-consent', email: 'owned@example.invalid', user_metadata: { name: 'Owned fixture' } };
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function owner(relative, { profile, lookupStatus = 200, lookupThrows = false, kind = 'profile', authenticated = true, signupStatus = 200, signupProviderError = 'Synthetic signup rejected' } = {}) {
  const requests = [], sends = [];
  let authChecks = 0;
  const sandbox = {
    exports: {}, Buffer, URLSearchParams, AbortController, setTimeout, clearTimeout,
    console: { warn() {}, error() {}, log() {} },
    process: { env: { SUPABASE_AUTH_URL: 'https://synthetic.example.invalid', SUPABASE_ANON_KEY_AUTH: 'synthetic-anon', SUPABASE_AUTH_SERVICE_KEY: 'synthetic-service' } },
    require(name) {
      if (name === './utils/cors') return require('../netlify/functions/utils/cors');
      if (name === './_shared/signup-email-consent') return require('../netlify/functions/_shared/signup-email-consent');
      if (name === './_shared/email-marketing-config') return { getMarketingSupabaseConfig: () => ({ url: 'https://synthetic.example.invalid', serviceKey: 'synthetic-service' }) };
      if (name === './_shared/lifecycle-email') return { sendLifecycleEmail: async (...args) => { sends.push(args); return { ok: true, provider: 'synthetic', providerStatus: 'recorded' }; } };
      if (name === './_shared/rate-limit') return { checkRateLimit: () => true };
      if (name === './_shared/browser-session-auth') return { getUserFromEvent: async () => { authChecks += 1; return { user: authenticated ? account : null }; } };
      throw new Error('Unexpected owner dependency: ' + name);
    },
    async fetch(url, options = {}) {
      const target = new URL(url);
      assert.equal(target.hostname, 'synthetic.example.invalid', 'test never contacts a real provider');
      requests.push({ path: target.pathname, query: target.search, method: options.method || 'GET', body: options.body && JSON.parse(options.body) });
      if (target.pathname === '/auth/v1/signup') return response(signupStatus >= 400 ? { msg: signupProviderError } : { user: account }, signupStatus);
      if (target.pathname === '/rest/v1/profiles' || target.pathname === '/rest/v1/email_leads') {
        if (relative === 'netlify/functions/api-profile.js' && options.method === 'POST') return response([JSON.parse(options.body)]);
        if (options.method === 'PATCH') return response(null, 204);
        if (lookupThrows) throw new Error('Synthetic lookup failure');
        return response(profile === undefined ? [] : [profile], lookupStatus);
      }
      throw new Error('Unexpected provider operation: ' + target.pathname + ':' + kind);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(base, relative), 'utf8'), sandbox, { filename: relative });
  return { handler: sandbox.exports.handler, requests, sends, authChecks: () => authChecks };
}
function signup(body, form = false, extra = {}) {
  return { httpMethod: 'POST', path: '/api/auth/signup', headers: { 'content-type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body: form ? body : JSON.stringify(body), ...extra };
}
const credentials = { email: 'owned@example.invalid', password: 'synthetic-password', name: 'Owned fixture', country: 'NG' };
const metadata = context => context.requests.find(r => r.path === '/auth/v1/signup').body.data;

test('ordinary JSON signup stays unenrolled and forwards only two typed consent flags', async () => {
  const context = owner('netlify/functions/auth-session.js', { profile: { email_digest_enabled: true } });
  const result = await context.handler(signup({ ...credentials, role: 'admin', tier: 'pro', user_metadata: { email_digest_enabled: true } }));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(metadata(context), { name: credentials.name, country: 'NG', tier: 'free', email_digest_enabled: false, email_weekly_enabled: false });
  assert.equal(context.sends.length, 0, 'legacy database true cannot invent request consent');
  assert.equal(context.requests.length, 1, 'unenrolled signup does not look up or patch marketing state');
});

test('independent JSON booleans survive signup without truthiness coercion', async () => {
  for (const digest of [true, false]) for (const weekly of [true, false]) {
    const context = owner('netlify/functions/auth-session.js', { profile: { id: account.id, email_digest_enabled: false } });
    await context.handler(signup({ ...credentials, email_digest_enabled: digest, email_weekly_enabled: weekly }));
    assert.equal(metadata(context).email_digest_enabled, digest);
    assert.equal(metadata(context).email_weekly_enabled, weekly);
    assert.equal(context.sends.length, 0);
  }
});

test('invalid JSON consent and containers fail before the Auth request', async () => {
  for (const value of ['true', 'false', 1, 0, null, [], {}]) for (const field of ['email_digest_enabled', 'email_weekly_enabled']) {
    const context = owner('netlify/functions/auth-session.js');
    const result = await context.handler(signup({ ...credentials, [field]: value }));
    assert.equal(result.statusCode, 400);
    assert.equal(context.requests.length, 0);
    assert.equal(context.sends.length, 0);
  }
  for (const body of [null, [], 'not-an-object', false]) {
    const context = owner('netlify/functions/auth-session.js');
    assert.equal((await context.handler(signup(body))).statusCode, 400);
    assert.equal(context.requests.length, 0);
  }
});

test('raw form duplicates/invalid values are rejected before collapsed parsing, including base64', async () => {
  const ordinary = new URLSearchParams(credentials).toString();
  for (const suffix of ['&email_digest_enabled=true&email_digest_enabled=true', '&email_digest_enabled=true&email%5Fdigest%5Fenabled=false', '&email_weekly_enabled=on', '&email_weekly_enabled=false']) {
    for (const encoded of [false, true]) {
      const context = owner('netlify/functions/auth-session.js');
      const raw = ordinary + suffix;
      const event = signup(encoded ? Buffer.from(raw).toString('base64') : raw, true, { isBase64Encoded: encoded });
      const result = await context.handler(event);
      assert.equal(result.statusCode, 400);
      assert.match(result.headers['Content-Type'], /text\/html/);
      assert.match(result.body, /href="\/auth\/\?mode=signup"/);
      assert.equal(result.multiValueHeaders, undefined);
      assert.equal(context.requests.length, 0);
    }
  }
});

test('native unchecked and checked forms create the same typed metadata contract', async () => {
  const ordinary = new URLSearchParams(credentials).toString();
  for (const [suffix, digest, weekly] of [['', false, false], ['&email_digest_enabled=true', true, false], ['&email_digest_enabled=true&email_weekly_enabled=true', true, true]]) {
    const context = owner('netlify/functions/auth-session.js', { profile: { email_digest_enabled: false } });
    const result = await context.handler(signup(ordinary + suffix, true));
    assert.equal(result.statusCode, 303);
    assert.equal(metadata(context).email_digest_enabled, digest);
    assert.equal(metadata(context).email_weekly_enabled, weekly);
  }
  const multipart = owner('netlify/functions/auth-session.js');
  await multipart.handler({ ...signup(ordinary, true), headers: { 'content-type': 'multipart/form-data; boundary=synthetic' } });
  assert.equal(multipart.requests.length, 0);
});

test('signup marketing welcome requires both request opt-in and a positively true stored profile', async () => {
  for (const settings of [{}, { profile: {} }, { profile: { email_digest_enabled: null } }, { profile: { email_digest_enabled: 'true' } }, { profile: { email_digest_enabled: false } }, { lookupStatus: 503 }, { lookupThrows: true }, { profile: { email_digest_enabled: true, email_welcome_sent_at: '2026-01-01' } }]) {
    const context = owner('netlify/functions/auth-session.js', settings);
    const result = await context.handler(signup({ ...credentials, email_digest_enabled: true }));
    assert.equal(result.statusCode, 200, 'marketing uncertainty does not prevent account response');
    assert.equal(context.sends.length, 0);
    assert.equal(context.requests.some(r => r.method === 'PATCH'), false);
  }
  const context = owner('netlify/functions/auth-session.js', { profile: { id: account.id, email_digest_enabled: true, email_unsubscribe_token: 'synthetic-unsubscribe' } });
  await context.handler(signup({ ...credentials, email_digest_enabled: true }));
  assert.equal(context.sends.length, 1);
  assert.equal(context.sends[0][0], 'signup_welcome');
  assert.equal(context.requests.filter(r => r.method === 'PATCH').length, 1);
});

test('profile lifecycle endpoint fails closed for missing/null/invalid preferences and lookup failures', async () => {
  for (const settings of [{}, { profile: {} }, { profile: { email_digest_enabled: null } }, { profile: { email_digest_enabled: 'true' } }, { profile: { email_digest_enabled: false } }, { lookupStatus: 503 }, { lookupThrows: true }, { profile: { email_digest_enabled: true, email_welcome_sent_at: '2026-01-01' } }]) {
    const context = owner('netlify/functions/send-lifecycle-email.js', settings);
    const result = await context.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ kind: 'signup_welcome', email: account.email, email_digest_enabled: true }) });
    assert.equal(JSON.parse(result.body).emailSent, false);
    assert.equal(context.sends.length, 0);
    assert.equal(context.requests.some(r => r.method === 'PATCH'), false);
  }
});

test('eligible profile welcomes retain their kind, unsubscribe information and sent marker', async () => {
  for (const kind of ['signup_welcome', 'founding_user_welcome']) {
    const context = owner('netlify/functions/send-lifecycle-email.js', { profile: { id: account.id, name: 'Owned fixture', email_digest_enabled: true, email_unsubscribe_token: 'synthetic-unsubscribe' } });
    const result = await context.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ kind, email: account.email }) });
    assert.equal(JSON.parse(result.body).emailSent, true);
    assert.equal(context.sends.length, 1);
    assert.equal(context.sends[0][0], kind);
    assert.match(context.sends[0][1].unsubscribeUrl, /synthetic-unsubscribe/);
    assert.equal(context.requests.filter(r => r.method === 'PATCH').length, 1);
  }
});

test('separate explicit PDF-lead stream keeps its own record and existing opt-out protection', async () => {
  for (const flag of [true, false]) {
    const context = owner('netlify/functions/send-lifecycle-email.js', { kind: 'lead', profile: { id: 'owned-lead', opt_in_digest: flag, email_unsubscribe_token: 'synthetic-lead-token' } });
    await context.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ kind: 'pdf_lead_welcome', email: account.email }) });
    assert.equal(context.sends.length, flag ? 1 : 0);
    assert.equal(context.requests.every(r => r.path === '/rest/v1/email_leads'), true);
  }
});

test('profile preference non-booleans reject before Auth lookup or any profile mutation', async () => {
  for (const value of [null, 'true', 'false', '', 0, 1, [], {}, [true], { value: true }]) {
    for (const field of ['email_digest_enabled', 'email_weekly_enabled']) {
      const other = field === 'email_digest_enabled' ? 'email_weekly_enabled' : 'email_digest_enabled';
      const context = owner('netlify/functions/api-profile.js');
      const result = await context.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ name: 'Owned preference edit', [other]: true, [field]: value }) });
      assert.equal(result.statusCode, 400);
      assert.equal(JSON.parse(result.body).synced, false);
      assert.equal(context.authChecks(), 0, 'invalid consent stops before Auth can fetch');
      assert.equal(context.requests.length, 0);
      assert.equal(context.sends.length, 0);
    }
  }
});

test('profile boolean choices stay typed, absence stays omitted and identity remains user-scoped', async () => {
  for (const choices of [{}, { email_digest_enabled: false }, { email_weekly_enabled: false }, { email_digest_enabled: true, email_weekly_enabled: false }, { email_digest_enabled: false, email_weekly_enabled: true }]) {
    const context = owner('netlify/functions/api-profile.js');
    const result = await context.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ id: 'another-user', role: 'admin', name: 'Owned preference edit', ...choices }) });
    assert.equal(result.statusCode, 200);
    assert.equal(JSON.parse(result.body).synced, true);
    assert.equal(context.authChecks(), 1);
    assert.equal(context.requests.length, 1);
    assert.deepEqual(context.requests[0].body, { name: 'Owned preference edit', ...choices, id: account.id });
  }
  const denied = owner('netlify/functions/api-profile.js', { authenticated: false });
  assert.equal((await denied.handler({ httpMethod: 'POST', headers: {}, body: '{"email_digest_enabled":true}' })).statusCode, 401);
  assert.equal(denied.requests.length, 0, 'valid preferences do not bypass authorization');
});

test('native signup input/consent errors render safe retry HTML with the correct status and no cookies', async () => {
  const ordinary = new URLSearchParams(credentials).toString();
  for (const raw of ['email=owned%40example.invalid', ordinary + '&email_digest_enabled=true&email_digest_enabled=false', ordinary + '&email_weekly_enabled=on']) {
    const context = owner('netlify/functions/auth-session.js');
    const result = await context.handler(signup(raw + '&next=%2Fauth%2F%3Fprivate%3Downed-private-query', true, { headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html,application/xhtml+xml' } }));
    assert.equal(result.statusCode, 400);
    assert.equal(result.headers['Content-Type'], 'text/html; charset=utf-8');
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.equal(result.headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(result.headers['Referrer-Policy'], 'no-referrer');
    assert.equal(result.headers['Content-Security-Policy'], "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    assert.match(result.body, /<html lang="en">/);
    assert.match(result.body, /<main><h1>We could not create your account<\/h1>/);
    assert.match(result.body, /<a href="\/auth\/\?mode=signup">Try creating your account again<\/a>/);
    assert.doesNotMatch(result.body, /owned|synthetic-password|example\.invalid|<script|onerror=/i);
    assert.equal(result.multiValueHeaders, undefined);
    assert.equal(result.headers.Location, undefined);
    assert.equal(context.requests.length, 0);
    assert.equal(context.sends.length, 0);
  }
});

test('native provider errors never reveal account existence, PII or provider HTML; JSON and login stay compatible', async () => {
  const html = [];
  for (const providerError of ['User already registered: owned@example.invalid', 'Invalid account owned@example.invalid', '<script>owned-private-provider</script>']) {
    const context = owner('netlify/functions/auth-session.js', { signupStatus: 400, signupProviderError: providerError });
    const result = await context.handler(signup(new URLSearchParams({ ...credentials, next: '/owned-private-return' }).toString(), true));
    assert.equal(result.statusCode, 400);
    assert.equal(result.multiValueHeaders, undefined);
    assert.equal(context.sends.length, 0);
    assert.doesNotMatch(result.body, /owned|already registered|invalid account|<script|synthetic-password/i);
    html.push(result.body);
  }
  assert.equal(new Set(html).size, 1, 'same safe form error regardless of provider account detail');
  for (const status of [429, 503]) {
    const context = owner('netlify/functions/auth-session.js', { signupStatus: status, signupProviderError: 'owned-private-provider' });
    const result = await context.handler(signup(new URLSearchParams(credentials).toString(), true));
    assert.equal(result.statusCode, status);
    assert.match(result.body, /temporarily unavailable/);
    assert.equal(result.multiValueHeaders, undefined);
  }
  const json = owner('netlify/functions/auth-session.js', { signupStatus: 400, signupProviderError: 'Synthetic JSON error' });
  const jsonResult = await json.handler(signup(credentials));
  assert.equal(jsonResult.statusCode, 400);
  assert.equal(JSON.parse(jsonResult.body).error, 'Synthetic JSON error');
  const login = owner('netlify/functions/auth-session.js');
  const loginResult = await login.handler({ ...signup('email=owned%40example.invalid', true), path: '/api/auth/login' });
  assert.equal(loginResult.statusCode, 303);
  assert.match(loginResult.headers.Location, /^\/auth\/\?mode=login&error=/);
  assert.equal(login.requests.length, 0);
});
