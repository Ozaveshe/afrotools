'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ENTITLED_TIERS, resolveProfileEntitlement } = require('../netlify/functions/_shared/entitlements');
const source = fs.readFileSync(require.resolve('../assets/js/pro-gate.js'), 'utf8');

function fixture(profile, options = {}) {
  let now = Date.parse('2026-10-07T00:00:00Z');
  let user = { id: 'synthetic-pro', tier: 'pro' };
  let calls = 0;
  const values = new Map();
  class Clock extends Date { static now() { return now; } }
  const context = {
    Date: Clock, console, location: { pathname: '/pro/apps/payroll/', search: '', hash: '' },
    document: { readyState: 'loading', addEventListener() {}, querySelector() { return options.tool ? { content: options.tool } : null; } },
    localStorage: { setItem(k, v) { values.set(k, v); }, removeItem(k) { values.delete(k); } },
    addEventListener() {},
    AfroAuth: {
      getUser: () => user, getSessionToken: () => options.cookieOnly ? null : 'synthetic-token', onReady: f => f(),
      getSupabase: () => options.supabase || null
    },
    fetch: async (url, request) => {
      calls++;
      if (options.cookieOnly) {
        assert.equal(request.credentials, 'same-origin');
        assert.equal(request.headers.Authorization, undefined);
      }
      if (options.outage) throw new Error('Synthetic offline profile');
      return { ok: true, json: async () => ({ profile: typeof profile === 'function' ? profile(user) : profile }) };
    }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return { gate: context.AfroProGate, setUser: u => { user = u; }, advance: ms => { now += ms; }, calls: () => calls, values };
}

test('browser agrees with server for supported subscription tiers and expiry boundaries', async () => {
  for (const tier of ENTITLED_TIERS) {
    for (const expiry of [null, '2099-01-01', '2000-01-01', '2026-10-07T00:00:00Z', 'invalid']) {
      const profile = { id: 'synthetic-pro', subscription_tier: tier, subscription_expires_at: expiry };
      assert.equal((await fixture(profile).gate.getStatus()).isPro,
        resolveProfileEntitlement(profile, '2026-10-07T00:00:00Z').isPro, tier + '/' + expiry);
    }
  }
});

test('missing or unavailable profiles cannot promote cached local Pro', async () => {
  for (const f of [fixture(null), fixture(null, { outage: true })]) {
    const status = await f.gate.getStatus();
    assert.equal(status.isPro, false);
    assert.equal(status.reason, 'profile-unavailable');
    assert.equal(status.profile, null);
  }
});

test('fresh Supabase profile remains available when the profile endpoint fails', async () => {
  const profile = { id: 'synthetic-pro', subscription_tier: 'pro', subscription_expires_at: '2099-01-01' };
  const query = { select() { return this; }, eq(key, id) { assert.equal(id, profile.id); return this; }, single: async () => ({ data: profile }) };
  const f = fixture(null, { outage: true, supabase: { from(table) { assert.equal(table, 'profiles'); return query; } } });
  assert.equal((await f.gate.getStatus()).isPro, true);
});

test('cookie-only session verifies its profile without requiring a browser bearer token', async () => {
  const f = fixture({ id: 'synthetic-pro', subscription_tier: 'pro', subscription_expires_at: '2099-01-01' }, { cookieOnly: true });
  assert.equal((await f.gate.getStatus()).isPro, true);
  assert.equal(f.calls(), 1);
});

test('cache stays reusable only for the same account and unexpired profile', async () => {
  const f = fixture(user => ({ id: user.id, subscription_tier: user.id === 'synthetic-pro' ? 'pro' : 'free', subscription_expires_at: '2099-01-01' }));
  assert.equal((await f.gate.getStatus()).isPro, true);
  assert.equal((await f.gate.getStatus()).isPro, true);
  assert.equal(f.calls(), 1);
  f.setUser({ id: 'synthetic-free', tier: 'free' });
  assert.equal((await f.gate.getStatus()).isPro, false);
  assert.equal(f.calls(), 2);
  f.setUser(null);
  assert.equal((await f.gate.getStatus()).reason, 'signed-out');
});

test('entitlement expires during the two-minute cache window', async () => {
  const f = fixture({ id: 'synthetic-pro', subscription_tier: 'pro', subscription_expires_at: '2026-10-07T00:00:01Z' });
  assert.equal((await f.gate.getStatus()).isPro, true);
  f.advance(1001);
  assert.equal((await f.gate.getStatus()).isPro, false);
});

test('fresh check rejects outage after an earlier successful profile lookup', async () => {
  let profile = { id: 'synthetic-pro', subscription_tier: 'pro' };
  const f = fixture(() => profile);
  assert.equal((await f.gate.getStatus()).isPro, true);
  profile = null;
  assert.equal((await f.gate.getStatus({ fresh: true })).isPro, false);
});

test('public education and health primary PDF exports remain guest reachable', async () => {
  for (const tool of ['gpa-calculator', 'blood-pressure-tracker']) {
    const f = fixture(null, { tool });
    assert.equal(f.gate._isFreeForever(tool), true);
    assert.equal(await f.gate.gatePdfExport(), true);
    assert.equal(f.calls(), 0);
  }
});
