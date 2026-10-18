'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');

function browser(suppliedAuth) {
  const signupCalls = [], fetchCalls = [], stored = new Map();
  const user = { id: 'owned-sdk-fixture', email: 'owned@example.invalid', user_metadata: { name: 'Owned SDK' } };
  const storage = { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, String(value)), removeItem: key => stored.delete(key) };
  const window = {
    location: { search: '', hash: '', pathname: '/auth/', origin: 'http://127.0.0.1' },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, requestIdleCallback() {},
    supabase: { createClient: () => ({ auth: { async signUp(payload) { signupCalls.push(payload); return { data: { user, session: null }, error: null }; } } }) },
  };
  if (suppliedAuth) window.AfroAuth = suppliedAuth;
  const context = vm.createContext({ window, navigator: { onLine: true }, localStorage: storage,
    document: { readyState: 'loading', addEventListener() {}, createElement() { throw new Error('Unexpected SDK injection'); } },
    CustomEvent: class { constructor(type, details) { this.type = type; this.detail = details.detail; } },
    console, setTimeout, clearTimeout,
    fetch: async (url, options = {}) => {
      assert.equal(String(url).startsWith('/api/'), true, 'no external request in VM fixture');
      fetchCalls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ authenticated: true, user }) };
    },
  });
  return { window, context, signupCalls, fetchCalls };
}
function load(context, relative) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), 'utf8'), context, { filename: relative });
}
const signupOwners = ['assets/js/afro-auth.js', 'assets/js/supabase-auth.js'];
const plain = value => JSON.parse(JSON.stringify(value));

test('both maintained SDK owners preserve four-argument signup and default new consent off', async () => {
  for (const relative of signupOwners) {
    const context = browser();
    load(context.context, relative);
    const result = await context.window.AfroAuth.signup('OWNED@example.invalid', 'Owned SDK', 'synthetic-password', 'NG');
    assert.equal(result.ok, true);
    assert.equal(context.signupCalls.length, 1);
    assert.deepEqual(plain(context.signupCalls[0]), { email: 'owned@example.invalid', password: 'synthetic-password', options: { data: { name: 'Owned SDK', country: 'NG', tier: 'free', email_digest_enabled: false, email_weekly_enabled: false } } });
  }
});

test('both SDK owners forward independent boolean choices and ignore inherited/authority fields', async () => {
  for (const relative of signupOwners) {
    for (const digest of [false, true]) for (const weekly of [false, true]) {
      const context = browser();
      load(context.context, relative);
      await context.window.AfroAuth.signup('owned@example.invalid', 'Owned SDK', 'synthetic-password', 'NG', { email_digest_enabled: digest, email_weekly_enabled: weekly, role: 'admin', tier: 'pro' });
      const data = plain(context.signupCalls[0].options.data);
      assert.equal(data.email_digest_enabled, digest);
      assert.equal(data.email_weekly_enabled, weekly);
      assert.equal(data.tier, 'free');
      assert.equal(Object.hasOwn(data, 'role'), false);
    }
    const context = browser();
    load(context.context, relative);
    await context.window.AfroAuth.signup('owned@example.invalid', 'Owned SDK', 'synthetic-password', '', Object.create({ email_digest_enabled: true, email_weekly_enabled: true }));
    assert.equal(context.signupCalls[0].options.data.email_digest_enabled, false);
    assert.equal(context.signupCalls[0].options.data.email_weekly_enabled, false);
  }
});

test('invalid SDK preference types and accessors fail before provider signup or session writes', async () => {
  for (const relative of signupOwners) {
    for (const value of ['true', 'false', null, 1, [], {}]) for (const field of ['email_digest_enabled', 'email_weekly_enabled']) {
      const context = browser();
      load(context.context, relative);
      const result = await context.window.AfroAuth.signup('owned@example.invalid', 'Owned SDK', 'synthetic-password', '', { [field]: value });
      assert.equal(result.ok, false);
      assert.equal(context.signupCalls.length, 0);
      assert.equal(context.window.AfroAuth.isLoggedIn(), false);
    }
    const context = browser();
    load(context.context, relative);
    const choices = { get email_digest_enabled() { throw new Error('Consent getter must never run'); } };
    assert.equal((await context.window.AfroAuth.signup('owned@example.invalid', '', 'synthetic-password', '', choices)).ok, false);
    assert.equal(context.signupCalls.length, 0);
  }
});

test('cookie bridge forwards the fifth argument unchanged and still synchronizes the session', async () => {
  const calls = [];
  const context = browser({ signup: async (...args) => { calls.push(args); return { ok: true, user: { id: 'owned-sdk-fixture' } }; }, getSessionToken: () => 'owned-synthetic-token', logout() {} });
  load(context.context, 'assets/js/auth-cookie-upgrade.js');
  await new Promise(resolve => setImmediate(resolve));
  context.fetchCalls.length = 0;
  const choices = { email_digest_enabled: false, email_weekly_enabled: true };
  assert.equal((await context.window.AfroAuth.signup('owned@example.invalid', 'Owned', 'synthetic-password', 'NG', choices)).ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].length, 5);
  assert.equal(calls[0][4], choices);
  assert.equal(context.fetchCalls.filter(c => c.url === '/api/auth/session').length, 1);
  assert.equal(context.fetchCalls.some(c => c.url === '/api/email/lifecycle'), false);
});

test('bridge marketing request requires an own strict true choice and successful signup', async () => {
  for (const choices of [undefined, {}, { email_digest_enabled: false }, { email_digest_enabled: 'true' }, Object.create({ email_digest_enabled: true })]) {
    const context = browser({ signup: async () => ({ ok: true }), getSessionToken: () => null, logout() {} });
    load(context.context, 'assets/js/auth-cookie-upgrade.js');
    await context.window.AfroAuth.signup('owned@example.invalid', 'Owned', 'synthetic-password', 'NG', choices);
    assert.equal(context.fetchCalls.some(c => c.url === '/api/email/lifecycle'), false);
  }
  for (const success of [false, true]) {
    const context = browser({ signup: async () => ({ ok: success }), getSessionToken: () => null, logout() {} });
    load(context.context, 'assets/js/auth-cookie-upgrade.js');
    await context.window.AfroAuth.signup('owned@example.invalid', 'Owned', 'synthetic-password', 'NG', { email_digest_enabled: true });
    const sent = context.fetchCalls.filter(c => c.url === '/api/email/lifecycle');
    assert.equal(sent.length, success ? 1 : 0);
    if (success) assert.deepEqual(JSON.parse(sent[0].options.body), { kind: 'signup_welcome', email: 'owned@example.invalid', name: 'Owned', country: 'NG' });
  }
});
