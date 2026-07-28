const { test, expect } = require('@playwright/test');

test.describe('French Wave 1 Senegal payroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/senegal/calculateur-salaire-net');
    await page.waitForLoadState('domcontentloaded');
  });

  test('uses capped IPRES and the 43% top IRPP band', async ({ page }) => {
    await page.fill('#grossSalary', '30000000');
    await page.click('.calc-btn');
    const result = await page.evaluate(() => window.RESULT);
    expect(result.ipres).toBe(290304);
    expect(result.bandBreakdown.at(-1).rate).toBe(0.43);
    expect(result.css).toBe(0);
    await expect(page.locator('#resContent')).not.toContainText('CSS');
  });

  test('does not expose salary-sharing AI or an email PDF gate', async ({ page }) => {
    await expect(page.locator('[onclick="getAI()"]')).toHaveCount(0);
    await expect(page.locator('#pdfEmail, #pdfModal')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Propulsé par Claude');
  });

  test('fits a small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });
});
