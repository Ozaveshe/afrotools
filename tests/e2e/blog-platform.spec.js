const { test, expect } = require('@playwright/test');

const ROUTES = [
  '/blog/car-import-cost-ghana-guide/',
  '/blog/ghana-motor-insurance-claim-checklist-2026/',
  '/blog/kenya-land-transfer-documents-stamp-duty-checklist/',
  '/blog/whatsapp-payment-reminder-message-templates/',
  '/blog/uganda-payslip-deductions-explained/',
  '/blog/ghana-passport-renewal-documents-checklist/',
  '/blog/kenya-solar-battery-sizing-guide/'
];

for (const route of ROUTES) {
  test(`shared blog reading tools work at 375px on ${route}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.reading-progress')).toHaveAttribute('role', 'progressbar');
    await expect(page.locator('.article-utility-bar')).toBeVisible();
    await expect(page.locator('.article-toc')).toBeVisible();
    await expect(page.locator('.article-toc a').first()).toHaveAttribute('href', /^#.+/);

    const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(pageOverflows).toBe(false);
    expect(pageErrors).toEqual([]);
  });
}
