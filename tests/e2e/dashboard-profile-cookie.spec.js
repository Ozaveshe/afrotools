const { test, expect } = require('@playwright/test');

const TEST_USER = {
  id: 'test-user-1',
  email: 'tester@afrotools.test',
  name: 'Test User',
  country: 'NG',
  tier: 'free',
  createdAt: '2026-01-01T00:00:00.000Z'
};

async function useCookieOnlySession(page, context, baseURL) {
  await context.addCookies([{ name: 'afrotools_test_session', value: 'valid', url: baseURL }]);
  await page.route('**/assets/js/afro-auth.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      (function () {
        function getUser() {
          try { return JSON.parse(localStorage.getItem('afro_auth_v2') || 'null'); }
          catch (_) { return null; }
        }
        window.AfroAuth = {
          onReady: function (callback) { setTimeout(callback, 0); },
          isLoggedIn: function () { return !!getUser(); },
          getUser: getUser,
          getSessionToken: function () { return null; },
          getSupabase: function () { return null; },
          updateProfile: function (changes) {
            localStorage.setItem('afro_auth_v2', JSON.stringify(Object.assign({}, getUser(), changes)));
            return Promise.resolve({ ok: true });
          },
          logout: function () { return Promise.resolve({ ok: true }); }
        };
        window.AfroData = {
          getFavorites: function () { return []; },
          getRecentTools: function () { return []; },
          getAllSaved: function () { return {}; },
          getUsageStats: function () { return { totalUses: 0, toolCounts: {}, categoryCounts: {} }; }
        };
      })();
    `
  }));
  await page.route('**/assets/js/components/tool-registry.min.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.AFRO_TOOLS = [];'
  }));
  await page.route('**/dashboard/dashboard-app.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.DashboardApp = { init: function () {} };'
  }));
  await page.route('**/dashboard/afropoints-lane-account.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.DashboardAfroPointsLane = { refresh: function () {} };'
  }));
  await page.route('**/api/auth/session', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ authenticated: true, user: TEST_USER })
  }));
}

test('cookie-only dashboard session can load and save a profile', async ({ page, context, baseURL }) => {
  await useCookieOnlySession(page, context, baseURL);
  let profile = { id: TEST_USER.id, name: TEST_USER.name, country: 'NG', city: 'Pretoria' };
  const postRequests = [];
  await page.route('**/api/profile', async route => {
    const request = route.request();
    if (request.method() === 'POST') {
      postRequests.push({ headers: await request.allHeaders(), body: request.postDataJSON() });
      profile = Object.assign({}, profile, request.postDataJSON());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, synced: true, profile }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile }) });
  });

  await page.goto('/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn');
  await page.locator('#editProfileBtn').click();
  await expect(page.locator('#editCity')).toHaveValue('Pretoria');
  await page.locator('#editCity').fill('Cape Town');
  await page.locator('#saveProfileBtn').click();
  await expect(page.locator('#toastContainer [role="status"]')).toContainText('Profile saved and synced');
  expect(postRequests).toHaveLength(1);
  expect(postRequests[0].headers.authorization).toBeUndefined();
  expect(postRequests[0].headers.cookie).toContain('afrotools_test_session=valid');
  expect(postRequests[0].body.city).toBe('Cape Town');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn');
  await page.locator('#editProfileBtn').click();
  await expect(page.locator('#editCity')).toHaveValue('Cape Town');
});

test('profile save explains an expired cookie session', async ({ page, context, baseURL }) => {
  await useCookieOnlySession(page, context, baseURL);
  await page.route('**/api/profile', route => route.fulfill({
    status: route.request().method() === 'POST' ? 401 : 200,
    contentType: 'application/json',
    body: route.request().method() === 'POST'
      ? JSON.stringify({ error: 'Unauthorized', synced: false })
      : JSON.stringify({ profile: { id: TEST_USER.id, name: TEST_USER.name, country: 'NG' } })
  }));

  await page.goto('/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn');
  await page.locator('#editProfileBtn').click();
  await page.locator('#saveProfileBtn').click();
  await expect(page.locator('#toastContainer [role="alert"]')).toContainText('Your session has expired. Please sign in again.');
  await expect(page.locator('#profileEditor')).toBeVisible();
});

for (const [width, colorScheme] of [[320, 'light'], [390, 'dark']]) {
  test(`mobile profile editor keeps the active first tab visible at ${width}px in ${colorScheme} mode`, async ({ page, context, baseURL }) => {
    await useCookieOnlySession(page, context, baseURL);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme });
    await page.goto('/dashboard/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn');
    await page.locator('#editProfileBtn').click();
    await expect(page.locator('#profileEditor')).toBeVisible();

    const firstTabVisible = () => page.evaluate(() => {
      const strip = document.querySelector('.editor-tabs').getBoundingClientRect();
      const active = document.querySelector('.editor-tab.active').getBoundingClientRect();
      return active.left >= strip.left && active.right <= strip.right;
    });
    expect(await firstTabVisible()).toBe(true);
    expect(await page.evaluate(() => document.querySelector('.editor-tabs').getBoundingClientRect().right)).toBeLessThanOrEqual(width);

    await page.locator('#securityTab').click();
    await page.locator('#cancelEditBtn').click();
    await page.locator('#editProfileBtn').click();
    await expect(page.locator('.editor-tab[data-tab="personal"]')).toHaveClass(/active/);
    expect(await firstTabVisible()).toBe(true);
  });
}
