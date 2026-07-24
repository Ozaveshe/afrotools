const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const routes = [
  { name: 'en', lang: 'en', path: '/tools/import-duty/', button: 'Calculate landed cost', uiTotal: '1,568.55', uiNgn: /2,509,680/ },
  { name: 'fr', lang: 'fr', path: '/fr/tools/droits-douane/', button: 'Calculer le coût rendu', uiTotal: '1\u202f568,55', uiNgn: /2\u202f509\u202f680/ },
  { name: 'sw', lang: 'sw', path: '/sw/zana/ushuru-forodha/', button: 'Kokotoa gharama iliyofika', uiTotal: '1,568.55', uiNgn: /2,509,680/ }
];

for (const route of routes) {
  test(`${route.name} import-duty VIP parity`, async ({ page }) => {
    const errors = []; const nonGet = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await page.locator('#itemName').fill('Laptops');
    await page.locator('#hsCode').fill('847130');
    await page.locator('#fob').fill('1000');
    await page.locator('#freight').fill('100');
    await page.locator('#insurance').fill('20');
    await page.locator('#dutyRate').selectOption('20');
    await page.locator('#otherImportCharges').fill('50');
    await page.locator('#portCharges').fill('30');
    await page.locator('#clearingFee').fill('40');
    await page.locator('#fxRate').fill('1600');
    await page.locator('#classificationConfirmed').check();
    await page.locator('#quoteConfirmed').check();
    await page.getByRole('button', { name: route.button }).click();
    await expect(page.locator('#importDutyResult')).toContainText(route.uiTotal);
    await expect(page.locator('#importDutyResult')).toContainText(route.uiNgn);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#pdfImportDuty').click();
    const download = await downloadPromise; const saved = await download.path();
    const parsed = await pdfParse(fs.readFileSync(saved));
    expect(parsed.text).toContain('Nigeria');
    expect(parsed.text).toContain('1568.55');
    expect(parsed.text).toContain('847130');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /import|duty|shipment/i.test(key)))).toEqual([]);
    expect(nonGet).toEqual([]); expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/import-duty-${route.name}-375-dark.png`, fullPage: true });
  });
}

test('import-duty widget 320 dark parity', async ({ page }) => {
  const errors = []; const nonGet = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/widgets/iframe/ecommerce-import-duty.html', { waitUntil: 'networkidle' });
  await page.locator('#aw-fob').fill('1000');
  await page.locator('#aw-freight').fill('120');
  await page.locator('#aw-rate').selectOption('20');
  await page.locator('#aw-other').fill('50');
  await page.locator('#aw-port').fill('70');
  await page.getByRole('button', { name: 'Calculate planning total' }).click();
  await expect(page.locator('#aw-result')).toContainText('1,568.55');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /import|duty|shipment/i.test(key)))).toEqual([]);
  expect(nonGet).toEqual([]); expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/import-duty-widget-320-dark.png', fullPage: true });
});
