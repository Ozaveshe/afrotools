const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/import-duty/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#importStatus')).toContainText('Ready');
  page.__runtimeErrors = errors;
});

test('calculates an auditable estimate, advanced costs, scenario and PDF', async ({ page }) => {
  await page.selectOption('#destination', 'KE');
  await page.selectOption('#origin', 'JP');
  await page.selectOption('#sourceCurrency', 'USD');
  await page.fill('#purchaseValue', '5000');
  await page.fill('#freight', '500');
  await page.fill('#insurance', '50');
  await page.selectOption('#dutyRate', '25');
  await page.check('#classificationConfirmed');
  await page.locator('#advancedAssumptions').evaluate((node) => { node.open = true; });
  await page.fill('#clearingAgent', '1000');
  await page.click('button[type="submit"]');

  await expect(page.locator('#importResult')).toBeVisible();
  await expect(page.locator('#importResult')).toContainText('Estimated landed cost');
  await expect(page.locator('#importResult')).toContainText('Import declaration fee');
  await expect(page.locator('#importResult')).toContainText('Railway development levy');
  await expect(page.locator('#importResult')).toContainText('verified 15 Aug 2026');
  await expect(page.locator('#importResult')).toContainText('Kenya Revenue Authority');
  await expect(page.locator('#importResult')).toContainText('fawazahmed snapshot');
  await expect(page.locator('#importResult')).toContainText('stale');
  await expect(page.locator('#importResult')).toContainText('FX snapshot is outside its maintenance window');
  await expect(page.locator('#importResult')).toContainText('Clearing agent');
  await expect(page.getByRole('region', { name: 'Import landed-cost result' })).toBeVisible();

  await page.fill('#scenarioPurchase', '6000');
  await page.fill('#scenarioFreight', '450');
  await page.click('#compareScenario');
  await expect(page.locator('#scenarioResult')).toContainText('Scenario B');

  const download = page.waitForEvent('download');
  await page.click('#pdfImport');
  const file = await download;
  expect(file.suggestedFilename()).toBe('afrotools-import-landed-cost-estimate.pdf');
  const pdf = await pdfParse(fs.readFileSync(await file.path()));
  expect(pdf.text).toContain('Import & Landed Cost Estimate');
  expect(pdf.text).toContain('Customs authority: Kenya Revenue Authority');
  expect(pdf.text).toContain('FX reference: fawazahmed');
  expect(pdf.text).toContain('Official source: Miscellaneous Fees and Levies Act');
  expect(pdf.text).toContain('Planning estimate only');
  expect(page.__runtimeErrors).toEqual([]);
});

test('mobile layout, labels and unsupported vehicle handoff remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator('label[for="destination"]')).toBeVisible();
  await expect(page.locator('label[for="purchaseValue"]')).toBeVisible();
  const missingLabels = await page.locator('#importLandedCostForm').evaluate((form) => Array.from(form.querySelectorAll('input, select')).filter((control) => {
    const explicit = control.id && form.querySelector('label[for="' + control.id + '"]');
    return !explicit && !control.closest('label') && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  }).map((control) => control.id || control.type));
  expect(missingLabels).toEqual([]);
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  await page.selectOption('#dutyRate', '20');
  const calculateButton = page.getByRole('button', { name: 'Calculate landed cost' });
  await calculateButton.focus();
  await expect(calculateButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Import landed-cost result' })).toBeVisible();
  await page.selectOption('#goodsType', 'vehicle');
  await expect(page.locator('#importResult')).toContainText('dedicated car-import calculator');
  await expect(page.locator('#importResult a')).toHaveAttribute('href', '/tools/car-import-cost/');
  expect(page.__runtimeErrors).toEqual([]);
});

test('unsupported and stale states fail visibly', async ({ page }) => {
  await page.selectOption('#destination', 'unsupported');
  await page.click('button[type="submit"]');
  await expect(page.locator('#importResult')).toContainText('not supported here');

  await page.route('**/data/trade/import-rules.json', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.markets.NG.lastVerified = '2020-01-01';
    await route.fulfill({ response, json: body });
  });
  await page.route('**/data/forex/latest.json', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.timestamp = '2020-01-01T00:00:00.000Z';
    await route.fulfill({ response, json: body });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#importStatus')).toContainText('Ready');
  await page.selectOption('#dutyRate', '20');
  await page.click('button[type="submit"]');
  await expect(page.locator('#importResult')).toContainText('outside its maintenance window');
  await expect(page.locator('#importResult')).toContainText('FX snapshot is outside its maintenance window');
  expect(page.__runtimeErrors).toEqual([]);
});
