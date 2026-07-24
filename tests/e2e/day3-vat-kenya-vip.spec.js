const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = [
  { name: 'en', path: '/kenya/ke-vat', calculate: 'Calculate Kenya VAT' },
  { name: 'fr', path: '/fr/kenya/ke-vat', calculate: 'Calculer la TVA Kenya' },
  { name: 'sw', path: '/sw/kenya/kikokotoo-vat/', calculate: 'Kokotoa VAT ya Kenya' }
];

for (const route of routes) {
  test(`${route.name} Kenya VAT VIP parity`, async ({ page }) => {
    const errors = []; const nonGet = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.name);
    await expect(page.getByRole('button', { name: route.calculate })).toBeVisible();
    expect(await page.evaluate(() => window.KEVatApp.getResult().gross)).toBe(116000);
    await page.locator('#kevAmount').fill('1000');
    expect(await page.evaluate(() => window.KEVatApp.getResult())).toMatchObject({ net: 1000, vat: 160, gross: 1160 });
    await page.locator('[data-mode="extract"]').click(); await page.locator('#kevAmount').fill('1160');
    expect(await page.evaluate(() => window.KEVatApp.getResult())).toMatchObject({ net: 1000, vat: 160, gross: 1160 });
    await page.locator('[data-rate-kind="scenario"]').click(); await page.locator('#kevCustomRate').fill('12'); await page.locator('[data-mode="add"]').click(); await page.locator('#kevAmount').fill('1000');
    expect(await page.evaluate(() => window.KEVatApp.getResult())).toMatchObject({ rate: 12, vat: 120, gross: 1120 });
    await page.locator('[data-rate-kind="zero"]').click(); await expect(page.locator('#kevVat')).toContainText('0');
    await page.locator('[data-rate-kind="standard"]').click(); await page.locator('#kevInvoiceQty').fill('2'); await page.locator('#kevInvoiceUnit').fill('500'); await page.locator('#kevInvoiceForm').evaluate(form => form.requestSubmit());
    await expect(page.locator('#kevInvoiceVat')).toContainText('160');
    await page.locator('#kevClassification').selectOption('confirmed-zero'); await expect(page.locator('#kevClassificationResult')).toContainText('Second Schedule');
    await page.locator('#kevAmount').fill('1000');
    const downloadPromise = page.waitForEvent('download'); await page.locator('#kevPdf').click();
    const download = await downloadPromise; const parsed = await pdfParse(fs.readFileSync(await download.path()));
    expect(parsed.text).toContain('Kenya'); expect(parsed.text).toContain('1000.00'); expect(parsed.text).toContain('160.00');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /kev|vat/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]); expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/kenya-vat-${route.name}-375-dark.png`, fullPage: true });
  });
}

test('Kenya VAT widget 320 dark parity', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 640 }); await page.goto('/widgets/iframe/financial-kenya-vat.html?theme=dark', { waitUntil: 'networkidle' });
  await page.locator('#awKeAmount').fill('1000'); await expect(page.locator('[data-ref="vat"]')).toContainText('160'); await expect(page.locator('[data-ref="total"]')).toContainText('1,160');
  await page.locator('[data-m="extract"]').click(); await page.locator('#awKeAmount').fill('1160'); await expect(page.locator('[data-ref="net"]')).toContainText('1,000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0); expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/kenya-vat-widget-320-dark.png', fullPage: true });
});
