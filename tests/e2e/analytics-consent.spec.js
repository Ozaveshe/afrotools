const { test, expect } = require('@playwright/test');

function dataLayerCommands(page) {
  return page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)));
}

test('GA4 stays measurable with denied storage and supports explicit consent changes', async ({ browser }) => {
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
  expect(initialConfig[0][2].page_location).toBe('http://127.0.0.1:4173/cookies/');
  expect(JSON.stringify(initialConfig)).not.toContain('private@example.com');

  await page.getByRole('button', { name: 'Reject analytics' }).click();
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');

  await page.getByRole('button', { name: 'Manage analytics choice' }).click();
  await expect(page.locator('#afro-cookie-consent')).toContainText('Current choice: analytics cookies rejected.');
  await page.getByRole('button', { name: 'Accept analytics' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('accepted');

  commands = await dataLayerCommands(page);
  const updates = commands.filter((row) => row[0] === 'consent' && row[1] === 'update');
  expect(updates.at(-1)[2]).toMatchObject({ analytics_storage: 'granted', ad_storage: 'denied' });
  expect(commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391')).toHaveLength(1);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await expect.poll(() => googleTagLoads).toBe(2);
  commands = await dataLayerCommands(page);
  expect(commands.find((row) => row[0] === 'consent' && row[1] === 'default')[2].analytics_storage).toBe('granted');
  expect(commands.filter((row) => row[0] === 'config' && row[1] === 'G-D859CGF391')).toHaveLength(1);

  await context.close();
});
