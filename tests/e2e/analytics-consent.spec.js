const { test, expect } = require('@playwright/test');

function dataLayerCommands(page) {
  return page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)));
}

test('GA4 uses denied-by-default Consent Mode and supports explicit consent changes', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  let googleTagLoads = 0;

  await page.route('https://www.googletagmanager.com/**', async (route) => {
    googleTagLoads += 1;
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.__fakeGoogleTagLoaded = true;' });
  });
  await page.route('https://www.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));

  await page.goto('/cookies/?email=private@example.com#choice', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#afro-cookie-consent')).toHaveAttribute('aria-label', 'Cookie consent');
  await expect(page.getByRole('button', { name: 'Accept analytics' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reject analytics' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => googleTagLoads).toBe(1);

  let commands = await dataLayerCommands(page);
  const initialDefault = commands.find((row) => row[0] === 'consent' && row[1] === 'default');
  const initialConfig = commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391');
  expect(initialDefault[2]).toMatchObject({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  expect(initialConfig).toHaveLength(1);
  expect(JSON.stringify(initialConfig)).not.toContain('private@example.com');

  await page.getByRole('button', { name: 'Reject analytics' }).click();
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
  await expect.poll(() => googleTagLoads).toBe(1);
  commands = await dataLayerCommands(page);
  expect(commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391')).toHaveLength(1);
  expect(await page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(false);

  await page.getByRole('button', { name: 'Manage analytics choice' }).click();
  await expect(page.locator('#afro-cookie-consent')).toContainText('Current choice: analytics cookies rejected.');
  await page.getByRole('button', { name: 'Accept analytics' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('accepted');
  await expect.poll(() => googleTagLoads).toBe(1);

  commands = await dataLayerCommands(page);
  const updates = commands.filter((row) => row[0] === 'consent' && row[1] === 'update');
  expect(updates.at(-1)[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied' });
  const acceptedConfig = commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391');
  expect(acceptedConfig).toHaveLength(1);
  const sanitizedLocation = new URL(acceptedConfig[0][2].page_location);
  expect(sanitizedLocation.origin).toBe(new URL(page.url()).origin);
  expect(sanitizedLocation.pathname).toBe('/cookies/');
  expect(sanitizedLocation.search).toBe('');
  expect(sanitizedLocation.hash).toBe('');
  expect(JSON.stringify(acceptedConfig)).not.toContain('private@example.com');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await expect.poll(() => googleTagLoads).toBe(2);
  commands = await dataLayerCommands(page);
  expect(commands.find((row) => row[0] === 'consent' && row[1] === 'default')[2].analytics_storage).toBe('granted');
  expect(commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391')).toHaveLength(1);

  await context.close();
});

test('delayed core bundle cannot create a competing legacy consent banner', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.__fakeGoogleTagLoaded = true;'
  }));
  await page.route('https://www.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));

  await page.goto('/nigeria/ng-salary-tax', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Accept analytics' })).toBeVisible();
  await expect.poll(() => page.locator('script[src*="/assets/js/bundles/core."]').count()).toBeGreaterThan(0);
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Reject analytics' })).toHaveCount(1);
});

test('successful password sign-in emits a metadata-only login event before redirecting', async ({ page }) => {
  const analyticsCalls = [];
  await page.exposeFunction('captureAuthAnalytics', (eventName, params) => {
    analyticsCalls.push({ eventName, params });
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'accepted');
    window._afroAuthLoaded = true;
    window.AfroAuth = {
      login: async () => ({ ok: true }),
    };
  });
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.__fakeGoogleTagLoaded = true;'
  }));
  await page.route('https://www.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));

  await page.goto('/auth/?mode=login&next=/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('function');
  await page.evaluate(() => {
    const original = window.gtag;
    window.gtag = function auditedGtag(command, name, params) {
      if (command === 'event') {
        const serializable = {};
        Object.keys(params || {}).forEach((key) => {
          if (typeof params[key] !== 'function') serializable[key] = params[key];
        });
        window.captureAuthAnalytics(name, serializable);
      }
      return original.apply(this, arguments);
    };
  });

  await page.locator('#loginEmail').fill('synthetic@example.test');
  await page.locator('#loginPassword').fill('synthetic-password');
  await page.locator('#loginForm .auth-submit').click();

  await expect.poll(() => analyticsCalls.find((call) => call.eventName === 'login')).toBeTruthy();
  const login = analyticsCalls.find((call) => call.eventName === 'login');
  expect(login.params).toMatchObject({ method: 'password', event_timeout: 800 });
  expect(JSON.stringify(login)).not.toContain('synthetic@example.test');
  await page.waitForURL('**/dashboard/', { timeout: 3000 });
});

test('French Agriculture theme storage changes only after an explicit selection', async ({ page }) => {
  const configuredOrigin = new URL(
    process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
  ).origin;
  const offOriginRequests = [];
  await page.addInitScript(() => {
    window.__THEME_STORAGE_AUDIT__ = [];
    ['setItem', 'removeItem'].forEach((method) => {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function auditedThemeStorage(...args) {
        if (String(args[0]) === 'aft_theme') {
          window.__THEME_STORAGE_AUDIT__.push({
            method,
            value: method === 'setItem' ? String(args[1]) : null,
          });
        }
        return original.apply(this, args);
      };
    });
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === configuredOrigin) {
      await route.continue();
      return;
    }
    if (url.hostname === 'www.googletagmanager.com') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.__fakeGoogleTagLoaded = true;' });
      return;
    }
    if (url.hostname === 'www.google-analytics.com' || url.hostname.endsWith('.google-analytics.com')) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    offOriginRequests.push({
      method: request.method(),
      url: request.url(),
      query: url.search,
      hash: url.hash,
      body: request.postData() || '',
      headers: await request.allHeaders(),
    });
    await route.abort('blockedbyclient');
  });

  await page.goto('/fr/tools/calculateur-engrais/', { waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools?.darkMode))).toBe(true);
  expect(await page.evaluate(() => window.__THEME_STORAGE_AUDIT__)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('aft_theme'))).toBeNull();
  expect(await page.evaluate(() => {
    const command = (window.dataLayer || []).map((entry) => Array.from(entry))
      .find((entry) => entry[0] === 'consent' && entry[1] === 'default');
    return command && command[2].analytics_storage;
  })).toBe('denied');
  expect(offOriginRequests).toEqual([]);

  expect(await page.evaluate(() => {
    window.AfroTools.darkMode.set('dark');
    return {
      stored: localStorage.getItem('aft_theme'),
      theme: document.documentElement.dataset.theme,
      audit: window.__THEME_STORAGE_AUDIT__.slice(),
    };
  })).toEqual({
    stored: 'dark',
    theme: 'dark',
    audit: [{ method: 'setItem', value: 'dark' }],
  });

  expect(await page.evaluate(() => {
    window.AfroTools.darkMode.set('auto');
    return {
      stored: localStorage.getItem('aft_theme'),
      choice: document.documentElement.dataset.themeChoice,
      audit: window.__THEME_STORAGE_AUDIT__.slice(),
    };
  })).toEqual({
    stored: null,
    choice: 'auto',
    audit: [
      { method: 'setItem', value: 'dark' },
      { method: 'removeItem', value: null },
    ],
  });
});
