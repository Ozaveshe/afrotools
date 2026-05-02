const { test, expect } = require('@playwright/test');

async function stubSupabaseOAuth(page) {
  await page.route('https://www.googletagmanager.com/**', async (route) => {
    await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
  });

  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: `
        window.__oauthCalls = window.__oauthCalls || [];
        window.supabase = {
          createClient: function() {
            return {
              auth: {
                signInWithOAuth: function(config) {
                  window.__oauthCalls.push({
                    provider: config.provider,
                    redirectTo: config.options && config.options.redirectTo
                  });
                  return Promise.resolve({ data: {} });
                },
                resetPasswordForEmail: function() { return Promise.resolve({ data: {} }); },
                getSession: function() { return Promise.resolve({ data: { session: null } }); },
                onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; }
              }
            };
          }
        };
      `,
    });
  });
}

test('auth page Google and GitHub buttons start Supabase OAuth with dashboard callback', async ({ page }) => {
  await stubSupabaseOAuth(page);
  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'commit' });

  await page.getByRole('button', { name: /^google$/i }).click();
  await expect.poll(() => page.evaluate(() => (window.__oauthCalls || []).length)).toBe(1);

  await page.getByRole('button', { name: /^github$/i }).click();
  await expect.poll(() => page.evaluate(() => (window.__oauthCalls || []).length)).toBe(2);

  const calls = await page.evaluate(() => window.__oauthCalls);
  expect(calls.map((call) => call.provider)).toEqual(['google', 'github']);
  for (const call of calls) {
    expect(call.redirectTo).toContain('/dashboard/?auth=callback');
  }
});
