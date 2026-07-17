const { test, expect } = require('@playwright/test');

const unavailableMessage = 'Sign-in service is temporarily unavailable. Please wait a moment and try again.';

async function stubOAuthDependencies(page, healthStatus) {
  const state = { healthHits: 0 };

  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    contentType: 'application/javascript; charset=utf-8',
    body: '',
  }));
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({
    contentType: 'text/css; charset=utf-8',
    body: '',
  }));
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/api/auth/health', async (route) => {
    state.healthHits += 1;
    await route.fulfill({
      status: healthStatus,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(healthStatus === 200 ? { ok: true } : { ok: false, error: unavailableMessage }),
    });
  });
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', (route) => route.fulfill({
    contentType: 'application/javascript; charset=utf-8',
    body: `
      window.supabase = {
        createClient: function() {
          return {
            auth: {
              signInWithOAuth: function(config) {
                sessionStorage.setItem('__oauthCall', JSON.stringify({
                  provider: config.provider,
                  redirectTo: config.options && config.options.redirectTo,
                  skipBrowserRedirect: config.options && config.options.skipBrowserRedirect
                }));
                return Promise.resolve({
                  data: { url: '/auth/?oauth-started=' + encodeURIComponent(config.provider) },
                  error: null
                });
              },
              resetPasswordForEmail: function() { return Promise.resolve({ data: {}, error: null }); },
              getSession: function() { return Promise.resolve({ data: { session: null } }); },
              onAuthStateChange: function() {
                return { data: { subscription: { unsubscribe: function() {} } } };
              }
            }
          };
        }
      };
    `,
  }));

  return state;
}

for (const provider of ['google', 'github']) {
  test(`auth page starts guarded ${provider} OAuth with the dashboard callback`, async ({ page }) => {
    const state = await stubOAuthDependencies(page, 200);
    await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._oauthGuarded)).toBe(true);

    await page.getByRole('button', { name: new RegExp(`^${provider}$`, 'i') }).click();
    await page.waitForURL(new RegExp(`oauth-started=${provider}`));

    const call = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__oauthCall') || 'null'));
    expect(call.provider).toBe(provider);
    expect(call.redirectTo).toContain('/dashboard/?auth=callback');
    expect(call.skipBrowserRedirect).toBe(true);
    expect(state.healthHits).toBe(1);
  });
}

test('auth page keeps users on AfroTools when OAuth health is unavailable', async ({ page }) => {
  const state = await stubOAuthDependencies(page, 503);
  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._oauthGuarded)).toBe(true);

  const google = page.getByRole('button', { name: /^google$/i });
  await google.click();

  await expect(page.locator('#authStatus')).toHaveText(unavailableMessage);
  await expect(google).toBeEnabled();
  await expect(google).toHaveText('Google');
  expect(await page.evaluate(() => sessionStorage.getItem('__oauthCall'))).toBeNull();
  expect(state.healthHits).toBe(1);
  await expect(page).toHaveURL(/\/auth\/\?mode=login/);
});

test('homepage auth modal restores Google sign-in instead of navigating to a raw timeout page', async ({ page }) => {
  const state = await stubOAuthDependencies(page, 503);
  await page.addInitScript(() => localStorage.setItem('afro_session_v3', 'oauth-modal-test-hint'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(
    window.AfroAuth && window.AfroAuth.openModal && window.AfroAuth._oauthGuarded
  )), { timeout: 15000 }).toBe(true);

  await page.evaluate(() => window.AfroAuth.openModal('login'));
  const modal = page.locator('#afroAuthModal');
  await expect(modal).toHaveClass(/open/);
  const google = modal.getByRole('button', { name: /continue with google/i });
  await google.click();

  await expect(modal.locator('#amError')).toHaveText(unavailableMessage);
  await expect(google).toBeEnabled();
  await expect(google).toHaveAccessibleName(/continue with google/i);
  expect(await page.evaluate(() => sessionStorage.getItem('__oauthCall'))).toBeNull();
  expect(state.healthHits).toBe(1);
  await expect(page).toHaveURL(/\/$/);
});
