const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 375, height: 812 } });
for (const route of ['/pro/', '/pricing/']) {
  test(`${route} subscription prices agree with rendered billing options`, async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (request) => {
      const url = new URL(request.request().url());
      return url.origin === new URL(baseURL).origin ? request.continue() : request.abort();
    });
    await page.goto(route);
    const schema = JSON.parse(await page.locator('script[data-registry-schema="pro-subscription"]').textContent());
    expect(schema.mainEntity['@type']).toBe('WebApplication');
    expect(schema.mainEntity.offers.map((offer) => offer.price)).toEqual(['5.00', '30.00']);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    if (route === '/pricing/') {
      await expect(page.locator('#proPrice')).toContainText('$5');
      await page.locator('#billingToggle').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#billingToggle')).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator('#proPrice')).toContainText('$30');
      await expect(page.locator('#proPriceSub')).toContainText('50%');
      await page.keyboard.press('Space');
      await expect(page.locator('#proPrice')).toContainText('$5');
    } else {
      await expect(page.locator('[data-registry-plan="product:annual"][data-registry-field="title"]').first()).toHaveText('$30');
      await expect(page.locator('#btn-monthly')).toBeVisible();
      await expect(page.locator('#btn-annual')).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
