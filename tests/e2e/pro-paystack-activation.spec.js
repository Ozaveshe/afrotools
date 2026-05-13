const { test, expect } = require('@playwright/test');
const { _private } = require('../../netlify/functions/paystack-webhook');

function makeSupabaseMock() {
  const writes = [];
  return {
    writes,
    from(table) {
      return {
        upsert(payload, options) {
          writes.push({ table, payload, options });
          return Promise.resolve({ error: null });
        }
      };
    }
  };
}

async function stubSupabaseSdk(page) {
  await page.route('https://www.googletagmanager.com/**', async route => {
    await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
  });
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', async route => {
    await route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: `
        window.supabase = {
          createClient: function() {
            return {
              auth: {
                getSession: function() { return Promise.resolve({ data: { session: null } }); },
                getUser: function() { return Promise.resolve({ data: { user: null } }); },
                onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; },
                signOut: function() { return Promise.resolve({}); }
              },
              from: function() {
                return {
                  select: function() { return this; },
                  eq: function() { return this; },
                  single: function() { return Promise.resolve({ data: null, error: null }); }
                };
              }
            };
          }
        };
      `
    });
  });
}

function seedAuth(payload) {
  localStorage.setItem('afro_auth_v2', JSON.stringify(payload.user));
  localStorage.setItem('afro_session_v3', payload.token);
}

test('Paystack charge.success activates the same profile ProGate reads', async ({ page }) => {
  const supabase = makeSupabaseMock();
  const now = new Date('2026-05-13T00:00:00.000Z');
  const payload = {
    event: 'charge.success',
    data: {
      reference: 'AT_PRO_TEST_001',
      customer: {
        email: 'Paid.User@AfroTools.test',
        customer_code: 'CUS_paid_user'
      },
      metadata: {
        user_id: 'paid-user-id',
        plan_type: 'monthly'
      },
      subscription: {
        subscription_code: 'SUB_paid_user'
      }
    }
  };

  const result = await _private.handlePaystackEvent(payload, supabase, now);
  expect(result.action).toBe('activated');
  expect(supabase.writes).toHaveLength(1);
  expect(supabase.writes[0]).toMatchObject({
    table: 'profiles',
    options: { onConflict: 'id' }
  });

  const profile = supabase.writes[0].payload;
  expect(profile).toMatchObject({
    id: 'paid-user-id',
    email: 'paid.user@afrotools.test',
    tier: 'pro',
    subscription_tier: 'pro',
    paystack_customer_id: 'CUS_paid_user',
    paystack_subscription_code: 'SUB_paid_user'
  });
  expect(new Date(profile.subscription_expires_at).getTime()).toBeGreaterThan(now.getTime());

  await stubSupabaseSdk(page);
  await page.route('**/api/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ profile })
    });
  });
  await page.addInitScript(seedAuth, {
    user: {
      id: profile.id,
      email: profile.email,
      name: 'Paid User',
      tier: 'free'
    },
    token: 'paid-token'
  });

  await page.goto('/pro/', { waitUntil: 'domcontentloaded' });
  const status = await page.evaluate(async () => {
    const result = await window.AfroProGate.getStatus({ fresh: true });
    return {
      isPro: result.isPro,
      tier: result.profile && result.profile.subscription_tier
    };
  });
  expect(status).toEqual({ isPro: true, tier: 'pro' });
});
