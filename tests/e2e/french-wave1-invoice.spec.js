const { test, expect } = require('@playwright/test');

test.describe('French Wave 1 invoice generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/tools/generateur-factures/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('fits a 390px viewport and uses French preview labels', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
    await expect(page.locator('#previewTplTitle')).toHaveText('FACTURE');
    await expect(page.locator('#previewStatus')).toHaveText('Brouillon');
  });

  test('keeps entered HTML inert in the preview', async ({ page }) => {
    await page.fill('#companyName', '<img src=x onerror=window.__invoiceXss=1>');
    await page.fill('#clientName', '<svg onload=window.__invoiceXss=1>');
    await page.waitForTimeout(400);
    await expect.poll(() => page.evaluate(() => window.__invoiceXss || 0)).toBe(0);
    await expect(page.locator('#pCompany')).toContainText('<img');
  });

  test('downloads a PDF without an email or account gate', async ({ page }) => {
    await page.fill('#companyName', 'Entreprise Test');
    await page.fill('#clientName', 'Client Test');
    await page.fill('.li-desc', 'Conseil');
    await page.fill('.li-qty', '2');
    await page.fill('.li-price', '15000');
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btnPDF');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^facture-.*\.pdf$/);
    await expect(page.locator('email-gate-modal')).toHaveCount(0);
  });
});
