const { test, expect } = require('@playwright/test');

const baseURL = process.env.LOCALIZED_PARITY_BASE_URL || 'http://127.0.0.1:43310';

for (const config of [
  { locale: 'fr', route: '/fr/blog/', minimum: 28, query: 'cv' },
  { locale: 'sw', route: '/sw/blogu/', minimum: 12, query: 'visa' }
]) {
  test(`${config.locale} blog hub is discoverable, responsive and interactive`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}${config.route}`, { waitUntil: 'networkidle' });
    await expect(page.locator('afro-navbar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    const totalCards = await page.locator('[data-blog-card]').count();
    expect(totalCards).toBeGreaterThanOrEqual(config.minimum);
    const logo = page.locator('afro-navbar').locator('a').first();
    await expect(logo).toBeVisible();
    const hamburger = page.locator('afro-navbar').locator('button').filter({ hasText: /menu/i }).first();
    if (await hamburger.count()) await expect(hamburger).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.locator('#blogSearch').fill(config.query);
    await expect(page.locator('[data-blog-card]:visible').first()).toBeVisible();
    expect(await page.locator('[data-blog-card]:visible').count()).toBeLessThan(totalCards);
    await page.locator('#blogReset').click();
    await expect(page.locator('[data-blog-card]:visible')).toHaveCount(totalCards);
    expect(errors).toEqual([]);
  });
}

test('blog hubs remain bounded at effective 200 percent', async ({ page }) => {
  for (const route of ['/fr/blog/', '/sw/blogu/']) {
    await page.setViewportSize({ width: 750, height: 900 });
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html{zoom:2}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
});
