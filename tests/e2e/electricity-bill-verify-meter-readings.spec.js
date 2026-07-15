const fs = require('fs');
const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('reconciles bill usage with meter readings without silently storing financial data', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/tools/electricity-bill-verify/');

  await expect(page.locator('#opening-reading')).toHaveValue('12000');
  await expect(page.locator('#closing-reading')).toHaveValue('12140');
  await expect(page.locator('#reading-output')).toContainText('12,140 - 12,000 = 140 kWh');
  await expect(page.locator('#expected-bill')).toContainText('34,723');
  expect(await page.evaluate(() => localStorage.getItem('electricityBillVerifyLastResult'))).toBeNull();

  await page.locator('#closing-reading').fill('12120');
  await expect(page.locator('#reading-output')).toContainText('billed usage is 20 kWh above meter movement');
  await expect(page.locator('#expected-bill')).toContainText('29,993');
  await expect(page.locator('#charge-status')).toHaveText('Possible overcharge');
  await expect(page.locator('#meter-risk')).toContainText('billed usage differs materially');
  await expect(page.locator('#checklist-output')).toContainText('Billed usage exceeds meter movement by 20 kWh');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-csv').click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const csv = fs.readFileSync(downloadPath, 'utf8');
  expect(csv).toContain('"Billed consumption kWh","140"');
  expect(csv).toContain('"Opening meter reading","12000"');
  expect(csv).toContain('"Closing meter reading","12120"');
  expect(csv).toContain('"Verified usage kWh","120"');
  expect(csv).toContain('"Reading variance kWh","20"');
  expect(csv).toContain('"Privacy rule","No silent storage; no account, meter, phone, or payment identifiers collected"');
  expect(await page.evaluate(() => localStorage.getItem('electricityBillVerifyLastResult'))).toBeNull();

  await page.locator('#closing-reading').fill('11900');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#closing-reading')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#closing-reading')).toBeFocused();
  await expect(page.locator('#bill-form-error')).toContainText('Closing reading must be equal to or greater than opening reading');

  await page.locator('#opening-reading').fill('');
  await page.locator('#closing-reading').fill('');
  await expect(page.locator('#reading-output')).toContainText('billed consumption is being used as the fallback');
  await expect(page.locator('#expected-bill')).toContainText('34,723');

  await page.locator('#period-end').fill('2026-03-31');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#period-end')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#period-end')).toBeFocused();
  await expect(page.locator('#bill-form-error')).toContainText('Billing period end must be on or after the start date');

  await page.locator('#reset-defaults').click();
  await expect(page.locator('#opening-reading')).toHaveValue('12000');
  await expect(page.locator('#closing-reading')).toHaveValue('12140');
  await expect(page.locator('#bill-form-error')).toBeEmpty();

  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
