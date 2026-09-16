const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

for (const locale of ['en', 'fr']) {
  test(`${locale} Eswatini evidence is readable and links to the official payroll workbook`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    const errors = [];
    const submissions = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) submissions.push(request.url()); });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.goto(`${locale === 'fr' ? '/fr' : ''}/eswatini/sz-paye`, { waitUntil: 'domcontentloaded' });
    const scope = page.locator('#eswatini-estimate-scope');
    await expect(scope).toContainText(locale === 'fr' ? '8 200 E' : 'E8,200');
    await expect(page.locator(locale === 'fr' ? '#frPayeGross' : '#grossSalary')).toBeVisible();
    expect(await scope.evaluate(element => {
      const input = document.querySelector('#grossSalary, #frPayeGross');
      return !!input && !!(element.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    if (locale === 'en') {
      await page.locator('#grossSalary').fill('120000');
      await page.locator('.calc-btn').click();
      await expect(page.locator('#resAmount')).toContainText('101,265');
    } else {
      await page.locator('#frPayeGross').fill('10000');
      await page.locator('[data-calculate]').click();
      await expect(page.locator('#frPayeResults')).toBeVisible();
      await expect(page.locator('[data-result-rows]')).toContainText(/8[\s\u202f\u00a0]?438,75/);
    }
    const downloadEvent = page.waitForEvent('download');
    await page.locator(locale === 'fr' ? '[data-fr-finance-export-format="pdf"]' : '#pdfBtn').click();
    const download = await downloadEvent;
    const bytes = fs.readFileSync(await download.path());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
    expect(submissions).toEqual([]);
    if (process.env.ESWATINI_VISUAL_DIR) {
      await scope.screenshot({ path: `${process.env.ESWATINI_VISUAL_DIR}/eswatini-${locale}-scope.png` });
    }
    const panel = page.locator('#sources-verification');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toContainText(locale === 'fr' ? 'supplémentaire de 2 700 E' : 'additional E2,700');
    await expect(panel).toContainText(locale === 'fr' ? 'une partie de l’année' : 'part-year employment');
    const workbook = panel.locator('a[href="https://ers.org.sz/IncomeForms"]');
    await expect(workbook).toBeVisible();
    await workbook.focus();
    await expect(workbook).toBeFocused();
    await expect(panel.locator('a[href*="era.org.sz"]')).toHaveCount(0);
    const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    expect(size.content).toBeLessThanOrEqual(size.width + 1);
    expect(errors).toEqual([]);
    if (process.env.ESWATINI_VISUAL_DIR) {
      await panel.screenshot({ path: `${process.env.ESWATINI_VISUAL_DIR}/eswatini-${locale}-panel.png` });
    }
  });
}
