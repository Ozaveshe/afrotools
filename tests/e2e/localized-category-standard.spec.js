const { test, expect } = require('@playwright/test');
const baseURL = process.env.LOCALIZED_PARITY_BASE_URL || 'http://127.0.0.1:4173';
const routes = [
  '/fr/agriculture/', '/fr/document-pdf/', '/fr/energy/', '/fr/ingenierie/', '/fr/health/', '/fr/salary-tax/', '/fr/trade/', '/fr/transport/',
  '/sw/kilimo/', '/sw/hati-na-pdf/', '/sw/nishati-na-huduma/', '/sw/ujenzi-na-uhandisi/', '/sw/afya/', '/sw/mshahara-na-kodi/', '/sw/biashara-ya-nje/', '/sw/usafiri-na-magari/'
];

test('representative localized category hubs retain mobile navigation and discovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ERR_BLOCKED_BY_RESPONSE\.NotSameSite/.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.localized-category-standard')).toBeVisible();
    await expect(page.locator('#localizedCategorySearch')).toBeVisible();
    await expect(page.locator('afro-navbar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route).toBe(true);
    expect(errors, route).toEqual([]);
  }
});

test('localized category method remains bounded at effective 200 percent', async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 900 });
  for (const route of ['/fr/ingenierie/', '/sw/nishati-na-huduma/']) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html{zoom:2}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route).toBe(true);
  }
});
