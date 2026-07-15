const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('reconciles EV and petrol costs across daily, monthly, and annual periods', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/ev-charging/');
  await expect(page.locator('#copyEVResultBtn')).toBeDisabled();
  await expect(page.locator('#downloadEVResultBtn')).toBeDisabled();
  await page.locator('#calcBtn').click();

  await expect(page.locator('.ev-basis-icon svg')).toBeVisible();
  await expect(page.locator('#rMonthly')).toHaveText('R900');
  await expect(page.locator('#rSaving')).toHaveText('vs Petrol saving: R1,800/mo');
  await expect(page.locator('#rEvKm')).toHaveText('R60');
  await expect(page.locator('#rIceKm')).toHaveText('R180');
  await expect(page.locator('#rEvDay')).toHaveText('R30');
  await expect(page.locator('#rIceDay')).toHaveText('R90');
  await expect(page.locator('#rEvMonth')).toHaveText('R900');
  await expect(page.locator('#rIceMonth')).toHaveText('R2,700');
  await expect(page.locator('#rEvYear')).toHaveText('R10,950');
  await expect(page.locator('#rIceYear')).toHaveText('R32,850');
  await expect(page.locator('#annualSavingLabel')).toHaveText('Annual Fuel Saving');
  await expect(page.locator('#rAnnSaving')).toHaveText('R21,900/year');
  await expect(page.locator('#rCharge')).toHaveText('R154');
  await expect(page.locator('#rTime')).toHaveText('5.4 hours');
  await expect(page.locator('#evCostBasis')).toHaveText('South Africa · dataset 2026-03 · residential tariff R3.50/kWh · petrol R22.50/litre · Level 1/2 Home Charging (7.4kW) changes time only, not the price basis.');
  await expect(page.locator('#rObs')).toContainText('30-day saving: R1,800. 365-day saving: R21,900.');
  await expect(page.locator('#copyEVResultBtn')).toBeEnabled();
  await expect(page.locator('#downloadEVResultBtn')).toBeEnabled();

  await page.locator('#copyEVResultBtn').click();
  await expect(page.locator('#evStatus')).toHaveText('Result copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('EV / petrol daily cost: R30 / R90');
  expect(clipboard).toContain('EV / petrol 30-day cost: R900 / R2,700');
  expect(clipboard).toContain('EV / petrol 365-day cost: R10,950 / R32,850');
  expect(clipboard).toContain('Annual Fuel Saving: R21,900/year');
  expect(clipboard).toContain('dataset 2026-03');

  await page.locator('#chargingLevel').selectOption('fast');
  await expect(page.locator('#copyEVResultBtn')).toBeDisabled();
  await expect(page.locator('#evStatus')).toHaveText('Cost comparison marked stale.');
  await expect(page.locator('#evStatus')).toHaveAttribute('data-state', 'stale');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#rTime')).toHaveText('0.8 hours');
  await expect(page.locator('#rEvMonth')).toHaveText('R900');
  await expect(page.locator('#evCostBasis')).toContainText('DC Fast Charge (50kW) changes time only, not the price basis.');

  await page.locator('#dailyKm').fill('60');
  await expect(page.locator('#copyEVResultBtn')).toBeDisabled();
  await expect(page.locator('#evCostBasis')).toContainText('displayed comparison is stale');

  const storedEVKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /ev|charging|vehicle|trip/i.test(key)));
  expect(storedEVKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
