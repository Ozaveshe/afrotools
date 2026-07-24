const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = [
  { name: 'en', path: '/nigeria/ng-vat', add: 'Calculate Nigeria VAT' },
  { name: 'fr', path: '/fr/nigeria/ng-vat', add: 'Calculer la TVA Nigeria' },
  { name: 'sw', path: '/sw/nigeria/kikokotoo-vat/', add: 'Kokotoa VAT ya Nigeria' }
];

for (const route of routes) {
  test(`${route.name} Nigeria VAT VIP parity`, async ({ page }) => {
    const errors = []; const nonGet = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.name);
    expect(await page.evaluate(() => window.NGVatApp.getResult().gross)).toBe(107500);
    await page.locator('#ngvAmount').fill('1000');
    expect(await page.evaluate(() => window.NGVatApp.getResult())).toMatchObject({ net: 1000, vat: 75, gross: 1075 });
    await page.locator('[data-mode="extract"]').click();
    await page.locator('#ngvAmount').fill('1075');
    expect(await page.evaluate(() => window.NGVatApp.getResult())).toMatchObject({ net: 1000, vat: 75, gross: 1075 });
    await page.locator('[data-rate-kind="scenario"]').click();
    await page.locator('#ngvCustomRate').fill('12');
    await page.locator('[data-mode="add"]').click();
    await page.locator('#ngvAmount').fill('1000');
    await expect(page.locator('#ngvRateUsed')).toHaveText('12%');
    expect(await page.evaluate(() => window.NGVatApp.getResult())).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="zero"]').click();
    await expect(page.locator('#ngvVat')).toContainText('0');
    await page.locator('[data-rate-kind="standard"]').click();
    await page.locator('#ngvInvoiceQty').fill('2');
    await page.locator('#ngvInvoiceUnit').fill('500');
    await page.locator('#ngvInvoiceForm').evaluate(form => form.requestSubmit());
    await expect(page.locator('#ngvInvoiceVat')).toContainText('75');
    await page.locator('#ngvClassification').selectOption('medical-products-services');
    await expect(page.locator('#ngvClassificationResult')).toContainText('187');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#ngvPdf').click();
    const download = await downloadPromise; const saved = await download.path();
    const parsed = await pdfParse(fs.readFileSync(saved));
    expect(parsed.text).toContain('Nigeria'); expect(parsed.text).toContain('1000.00'); expect(parsed.text).toContain('75.00');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /ngv|vat/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]); expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/nigeria-vat-${route.name}-375-dark.png`, fullPage: true });
  });
}

test('Nigeria VAT widget 320 dark parity', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/widgets/iframe/financial-nigeria-vat.html?theme=dark', { waitUntil: 'networkidle' });
  await page.locator('#awNgAmount').fill('1000');
  await expect(page.locator('#awNgVat')).toContainText('75');
  await expect(page.locator('#awNgGross')).toContainText('1,075');
  await page.locator('[data-mode="extract"]').click(); await page.locator('#awNgAmount').fill('1075');
  await expect(page.locator('#awNgNet')).toContainText('1,000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/nigeria-vat-widget-320-dark.png', fullPage: true });
});
