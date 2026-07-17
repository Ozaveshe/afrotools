const { test, expect } = require('@playwright/test');

const testUser = {
  id: 'auth-bridge-user',
  email: 'bridge@afrotools.test',
  name: 'Bridge User',
  country: 'NG',
  tier: 'free',
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function stubPasswordLogin(page, options) {
  const state = {
    cookieLoginHits: 0,
    bearerBridgeHits: 0,
  };
  const loginResult = options && options.loginResult
    ? options.loginResult
    : { ok: true, user: testUser };
  const loginPending = Boolean(options && options.loginPending);

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }

    if (url.hostname === 'fonts.googleapis.com') {
      await route.fulfill({ contentType: 'text/css; charset=utf-8', body: '' });
      return;
    }

    if (url.hostname === 'fonts.gstatic.com') {
      await route.abort();
      return;
    }

    if (url.hostname === '127.0.0.1' && url.pathname === '/assets/js/afro-auth.js') {
      await route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: `
          (function(window) {
            var token = null;
            window.AfroAuth = {
              onReady: function(callback) { setTimeout(callback, 0); },
              getSessionToken: function() { return token; },
              login: async function() {
                var calls = Number(localStorage.getItem('__authDirectLoginCalls') || '0') + 1;
                localStorage.setItem('__authDirectLoginCalls', String(calls));
                if (${JSON.stringify(loginPending)}) return new Promise(function() {});
                var result = ${JSON.stringify(loginResult)};
                if (result.ok) {
                  token = 'verified-browser-token';
                  localStorage.setItem('afro_session_v3', token);
                  localStorage.setItem('afro_auth_v2', JSON.stringify(result.user));
                  window.dispatchEvent(new CustomEvent('afro-auth-change', {
                    detail: { user: result.user, authenticated: true }
                  }));
                }
                return result;
              },
              logout: function() { return Promise.resolve({ ok: true }); }
            };
          })(window);
        `,
      });
      return;
    }

    if (url.hostname === '127.0.0.1' && url.pathname === '/api/auth/login') {
      state.cookieLoginHits += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ error: 'duplicate password grant' }),
      });
      return;
    }

    if (url.hostname === '127.0.0.1' && url.pathname === '/api/auth/session') {
      const authHeader = route.request().headers().authorization || '';
      if (authHeader === 'Bearer verified-browser-token') {
        state.bearerBridgeHits += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({ authenticated: true, bridged: true, user: testUser }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ authenticated: false, user: null }),
      });
      return;
    }

    await route.continue();
  });

  return state;
}

test('password sign-in bridges the verified browser token without a second password grant', async ({ page }) => {
  const state = await stubPasswordLogin(page);
  await page.goto('/auth/?mode=login&next=/terms/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._cookiePatched)).toBe(true);

  await page.locator('#loginEmail').fill('bridge@afrotools.test');
  await page.locator('#loginPassword').fill('password123');
  await page.locator('#loginForm').getByRole('button', { name: /^sign in$/i }).click();

  await expect(page).toHaveURL(/\/terms\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('__authDirectLoginCalls'))).toBe('1');
  expect(state.cookieLoginHits).toBe(0);
  expect(state.bearerBridgeHits).toBe(1);
});

test('password sign-in turns provider database timeouts into a retryable status message', async ({ page }) => {
  const state = await stubPasswordLogin(page, {
    loginResult: { ok: false, error: 'Database error querying schema' },
  });
  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._cookiePatched)).toBe(true);

  await page.locator('#loginEmail').fill('bridge@afrotools.test');
  await page.locator('#loginPassword').fill('password123');
  await page.locator('#loginForm').getByRole('button', { name: /^sign in$/i }).click();

  await expect(page.locator('#authStatus')).toHaveText(
    'Sign-in service is temporarily unavailable. Please wait a moment and try again.'
  );
  expect(state.cookieLoginHits).toBe(0);
  expect(state.bearerBridgeHits).toBe(0);
});

test('password sign-in stops waiting when the provider request never settles', async ({ page }) => {
  const state = await stubPasswordLogin(page, { loginPending: true });
  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.AfroAuth && window.AfroAuth._cookiePatched)).toBe(true);

  await page.locator('#loginEmail').fill('bridge@afrotools.test');
  await page.locator('#loginPassword').fill('password123');
  const submit = page.locator('#loginForm').getByRole('button', { name: /^sign in$/i });
  await submit.click();

  await expect(page.locator('#authStatus')).toHaveText(
    'Sign-in service is temporarily unavailable. Please wait a moment and try again.',
    { timeout: 15000 }
  );
  await expect(submit).toBeEnabled();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('__authDirectLoginCalls'))).toBe('1');
  expect(state.cookieLoginHits).toBe(0);
  expect(state.bearerBridgeHits).toBe(0);
});
