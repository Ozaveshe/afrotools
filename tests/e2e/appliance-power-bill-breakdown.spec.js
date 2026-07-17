const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('allocates the rounded household bill across appliance rows and keeps the result current', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/appliance-power/');

  await expect(page.locator('[data-df-form="appliance-power"]')).toHaveCount(0);
  await expect(page.locator('#copyBillBreakdown')).toBeDisabled();
  await expect(page.locator('#appList .app-row')).toHaveCount(5);

  await page.locator('#calcBtn').click();

  await expect(page.locator('.bill-breakdown-icon svg')).toBeVisible();
  await expect(page.locator('#rBill')).toHaveText('₦9,996');
  await expect(page.locator('#rMonthlyKwh')).toHaveText('147 kWh');
  await expect(page.locator('#rStandby')).toHaveText('₦204');
  await expect(page.locator('#billBreakdownContext')).toContainText('Nigeria · dataset 2026-03');
  await expect(page.locator('#billBreakdownContext')).toContainText('residential tariff ₦68.00/kWh');
  await expect(page.locator('#billBreakdownContext')).toContainText('household total ₦9,996 for 147 kWh');
  await expect(page.locator('#billBreakdownContext')).toContainText('Largest modeled consumer: Fridge (200L)');

  const rows = page.locator('#billBreakdownBody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Fridge (200L)');
  await expect(rows.nth(0)).toContainText('86.4 kWh');
  await expect(rows.nth(0)).toContainText('58.7%');
  await expect(rows.nth(0)).toContainText('₦5,863');
  await expect(rows.nth(1)).toContainText('Ceiling Fan');
  await expect(rows.nth(1)).toContainText('₦2,443');
  await expect(rows.nth(2)).toContainText('32" LED TV');
  await expect(rows.nth(2)).toContainText('₦726');
  await expect(rows.nth(3)).toContainText('LED Bulb (9W)');
  await expect(rows.nth(3)).toContainText('₦658');
  await expect(rows.nth(4)).toContainText('Smartphone Charger');
  await expect(rows.nth(4)).toContainText('₦306');

  const allocatedTotal = await rows.locator('.bill-breakdown-cost').allTextContents();
  const allocatedNumber = allocatedTotal.reduce((sum, value) => sum + Number(value.replace(/[^0-9.-]/g, '')), 0);
  expect(allocatedNumber).toBe(9996);
  await expect(page.locator('#billBreakdownNote')).toContainText('add back to the displayed total');
  await expect(page.locator('#billBreakdownNote')).toContainText('not a meter reading');
  await expect(page.locator('#copyBillBreakdown')).toBeEnabled();

  await page.locator('#copyBillBreakdown').click();
  await expect(page.locator('#billBreakdownStatus')).toHaveText('Appliance bill breakdown copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('APPLIANCE BILL BREAKDOWN');
  expect(clipboard).toContain('Residential tariff: ₦68.00/kWh');
  expect(clipboard).toContain('Household total: ₦9,996 for 147 kWh');
  expect(clipboard).toContain('1. Fridge (200L) | 86.4 kWh | 58.7% | ₦5,863');
  expect(clipboard).toContain('Standby upper-bound estimate: ₦204/month (assumes 24 standby hours/day)');
  expect(clipboard).toContain('stay in your browser unless you choose to copy');

  await page.locator('#appList .app-row').first().locator('input[aria-label="W"]').fill('10');
  await expect(page.locator('#copyBillBreakdown')).toBeDisabled();
  await expect(page.locator('#billBreakdownContext')).toHaveText('Your appliance or country inputs changed, so the previous bill allocation is stale.');
  await expect(page.locator('#billBreakdownStatus')).toContainText('Breakdown marked stale');
  await expect(page.locator('#billBreakdownBody tr')).toHaveCount(1);

  await page.locator('#calcBtn').click();
  await expect(page.locator('#copyBillBreakdown')).toBeEnabled();
  await expect(page.locator('#billBreakdownBody tr')).toHaveCount(5);

  const storedApplianceKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /appliance.*power|bill.*breakdown/i.test(key)));
  expect(storedApplianceKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
