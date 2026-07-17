const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('uses farm hectares when requested and clearly separates a known pump rating', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/diesel-vs-solar-farm/');

  await expect(page.locator('[data-df-form="diesel-vs-solar-farm"]')).toHaveCount(0);
  await expect(page.locator('#pumpKW')).toHaveValue('0');
  await expect(page.locator('#pumpBasisHint')).toContainText('0.5 kW per hectare, minimum 1 kW');
  await expect(page.locator('#copyPumpBrief')).toBeDisabled();

  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#farmHa').fill('5');
  await page.locator('#dailyPumpHrs').fill('6');
  await page.locator('#calcBtn').click();

  await expect(page.locator('.pump-basis-icon svg')).toBeVisible();
  await expect(page.locator('#rPumpKW')).toHaveText('2.5kW');
  await expect(page.locator('#rPumpBasis')).toHaveText('Farm-size estimate');
  await expect(page.locator('#rSolarKW')).toHaveText('4 kW array');
  await expect(page.locator('#rDieselAnnual')).toHaveText('₦1,839,600');
  await expect(page.locator('#rDiesel10yr')).toHaveText('₦22,900,200');
  await expect(page.locator('#rSolarCapex')).toHaveText('₦5,238,750');
  await expect(page.locator('#rSolar10yr')).toHaveText('₦6,024,560');
  await expect(page.locator('#rSavings')).toHaveText('₦16,875,640');
  await expect(page.locator('#rPaybackRow')).toHaveText('2.4 years');
  await expect(page.locator('#rCO2')).toHaveText('4,108 kg');
  await expect(page.locator('#pumpBasisContext')).toContainText('Farm-size estimate: 5 ha × 0.5 kW/ha');
  await expect(page.locator('#pumpBasisContext')).toContainText('produced 2.5kW');
  await expect(page.locator('#pumpBasisContext')).toContainText('Nigeria dataset 2026-03');
  await expect(page.locator('#pumpBasisChecks li')).toHaveCount(3);
  await expect(page.locator('#pumpBasisChecks')).toContainText('₦1,200/L diesel');
  await expect(page.locator('#pumpBasisChecks')).toContainText('total dynamic head');
  await expect(page.locator('#copyPumpBrief')).toBeEnabled();

  await page.locator('#copyPumpBrief').click();
  await expect(page.locator('#pumpBasisStatus')).toHaveText('Pump quote brief copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('FARM PUMP QUOTE BRIEF');
  expect(clipboard).toContain('Country-energy dataset: 2026-03');
  expect(clipboard).toContain('Sizing basis: Farm-size estimate: 5 ha × 0.5 kW/ha');
  expect(clipboard).toContain('Pump size used: 2.5kW');
  expect(clipboard).toContain('Modeled solar array: 4 kW array');
  expect(clipboard).toContain('Confirm static head, dynamic head, pipe length/diameter');
  expect(clipboard).toContain('stay in your browser unless you choose to copy this brief');

  await page.locator('#pumpKW').selectOption('3');
  await expect(page.locator('#pumpBasisHint')).toContainText('selected rating drives the calculation');
  await expect(page.locator('#copyPumpBrief')).toBeDisabled();
  await expect(page.locator('#pumpBasisContext')).toHaveText('Farm, pump, schedule, or country inputs changed, so the previous quote brief is stale.');
  await expect(page.locator('#pumpBasisStatus')).toContainText('Pump quote brief marked stale');

  await page.locator('#calcBtn').click();
  await expect(page.locator('#rPumpKW')).toHaveText('3kW');
  await expect(page.locator('#rPumpBasis')).toHaveText('Known pump rating');
  await expect(page.locator('#rSolarKW')).toHaveText('4.5 kW array');
  await expect(page.locator('#rSavings')).toHaveText('₦20,649,240');
  await expect(page.locator('#pumpBasisContext')).toContainText('Known pump rating: 3 kW selected; 5 ha is context only');

  const storedPumpKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /farm.*pump|pump.*brief|diesel.*solar/i.test(key)));
  expect(storedPumpKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
