const { test, expect } = require('@playwright/test');

const ROUTES = [
  '/blog/nigeria-birth-certificate-registration-checklist/',
  '/blog/professional-receipt-template-nigeria/',
  '/blog/flat-rate-vs-reducing-balance-loan-nigeria/',
  '/blog/generator-size-for-home-nigeria/',
  '/blog/roofing-sheets-quantity-nigeria/',
  '/blog/fertilizer-bags-per-acre-nigeria/',
  '/blog/last-mile-delivery-cost-per-package-nigeria/',
  '/blog/volumetric-weight-calculator-africa/',
  '/blog/ghana-wedding-budget-checklist/',
  '/blog/kenya-birth-certificate-application-checklist/'
];

for (const route of ROUTES) {
  test(`priority article is usable at 375px on ${route}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response && response.ok()).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.article-body')).toBeVisible();
    await expect(page.locator('.article-cta .btn')).toBeVisible();
    await expect(page.locator('.article-utility-bar')).toBeVisible();
    await expect(page.locator('.article-toc a').first()).toHaveAttribute('href', /^#.+/);
    await expect(page.locator('.faq-item')).toHaveCount(5);

    const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(pageOverflows).toBe(false);
    expect(pageErrors).toEqual([]);
  });
}
