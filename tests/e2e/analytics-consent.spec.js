const { test, expect } = require('@playwright/test');

function dataLayerCommands(page) {
  return page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)));
}

test('GA4 remains absent until explicit consent and supports later consent changes', async ({ browser }) => {
  const context = await browser.newContext();
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
  await expect.poll(() => googleTagLoads).toBe(0);

  let commands = await dataLayerCommands(page);
  expect(commands).toEqual([]);

  await page.getByRole('button', { name: 'Reject analytics' }).click();
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
  await expect.poll(() => googleTagLoads).toBe(0);
  expect(await dataLayerCommands(page)).toEqual([]);

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
