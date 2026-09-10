const { test, expect } = require('@playwright/test');

const routes = [
  '/jamb/commerce/1997/', '/jamb/english/2000/', '/jamb/english/2009/', '/jamb/mathematics/1987/'
];

for (const width of [390, 1440]) {
  for (const route of routes) {
    test(`JAMB review page remains usable at ${width}px: ${route}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'This paper is under review' })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + route);
      await expect(page.locator('[data-reviewed-question]')).toHaveCount(0);
      expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(n => JSON.parse(n.textContent)).some(s => s['@type'] === 'Question'))).toBe(false);
      const planner = page.getByRole('link', { name: 'Plan your study week' });
      await expect(planner).toBeVisible();
      await planner.focus();
      await expect(planner).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      if (route === routes[0]) await page.screenshot({ path: testInfo.outputPath(`review-${width}.png`), fullPage: true });
      await planner.press('Enter');
      await expect(page).toHaveURL(/\/tools\/study-planner\/?$/);
      expect(errors).toEqual([]);
    });
  }
}
