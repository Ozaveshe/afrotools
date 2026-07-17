const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('compares LiFePO4 and lead-acid using the same protected sizing inputs', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/battery-sizing/');

  await expect(page.locator('[data-df-form="battery-sizing"]')).toHaveCount(0);
  await expect(page.locator('#copyChemComparison')).toBeDisabled();
  await expect(page.locator('.chem-compare-icon svg')).toBeVisible();

  await page.locator('#loadWatts').fill('1000');
  await page.locator('#backupHours').fill('8');
  await page.locator('#batteryType').selectOption('lithium');
  await page.locator('#systemVoltage').selectOption('24');
  await page.locator('#calcBtn').click();

  await expect(page.locator('#rAh')).toHaveText('438 Ah');
  await expect(page.locator('#rTotal')).toHaveText('10.5 kWh');
  await expect(page.locator('#rConfig')).toContainText('2S × 2P (4 batteries)');
  await expect(page.locator('#rInverter')).toHaveText('1.5 kVA');
  await expect(page.locator('#rTotalCost')).toHaveText('$1,470');

  await expect(page.locator('#lithiumCard')).toHaveClass(/is-selected/);
  await expect(page.locator('#lithiumSelected')).toHaveText('Selected result');
  await expect(page.locator('#lithiumCapacity')).toHaveText('10.5 kWh / 438 Ah');
  await expect(page.locator('#lithiumConfig')).toContainText('2S × 2P (4 batteries)');
  await expect(page.locator('#lithiumDod')).toHaveText('85%');
  await expect(page.locator('#lithiumCycles')).toHaveText('3,000 cycles (about 8 years)');
  await expect(page.locator('#lithiumBatteryCost')).toHaveText('$1,200');
  await expect(page.locator('#lithiumTotalCost')).toHaveText('$1,470');
  await expect(page.locator('#lithiumLocalCost')).toHaveText('₦2,425,500');

  await expect(page.locator('#leadCard')).not.toHaveClass(/is-selected/);
  await expect(page.locator('#leadCapacity')).toHaveText('17.8 kWh / 742 Ah');
  await expect(page.locator('#leadConfig')).toContainText('2S × 2P (4 batteries)');
  await expect(page.locator('#leadDod')).toHaveText('50%');
  await expect(page.locator('#leadCycles')).toHaveText('500 cycles (about 1 year)');
  await expect(page.locator('#leadBatteryCost')).toHaveText('$400');
  await expect(page.locator('#leadTotalCost')).toHaveText('$670');
  await expect(page.locator('#leadLocalCost')).toHaveText('₦1,105,500');
  await expect(page.locator('#chemDecision')).toContainText('7.3 kWh less nameplate capacity');
  await expect(page.locator('#chemDecision')).toContainText('6x the modeled cycles');
  await expect(page.locator('#chemDecision')).toContainText('costs $800 more upfront');
  await expect(page.locator('#copyChemComparison')).toBeEnabled();

  await page.locator('#batteryType').selectOption('lead');
  await expect(page.locator('#copyChemComparison')).toBeDisabled();
  await expect(page.locator('#chemContext')).toContainText('Inputs changed. Recalculate');
  await expect(page.locator('#chemStatus')).toContainText('stale comparison cannot be copied');
  await expect(page.locator('#lithiumCapacity')).toHaveText('—');

  await page.locator('#calcBtn').click();
  await expect(page.locator('#rTotal')).toHaveText('17.8 kWh');
  await expect(page.locator('#rType')).toHaveText('Lead-Acid (AGM/Gel)');
  await expect(page.locator('#leadCard')).toHaveClass(/is-selected/);
  await expect(page.locator('#leadSelected')).toHaveText('Selected result');

  await page.locator('#copyChemComparison').click();
  await expect(page.locator('#chemStatus')).toHaveText('Battery chemistry comparison copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('AfroTools Battery Chemistry Comparison');
  expect(clipboard).toContain('Load: 1000 W');
  expect(clipboard).toContain('LiFePO4');
  expect(clipboard).toContain('Lead-acid AGM/Gel');
  expect(clipboard).toContain('Selected main result: Lead-acid AGM/Gel');
  expect(clipboard).toContain('Privacy: this comparison is not stored automatically.');

  const storedSizingKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /battery|sizing|chemistry|comparison/i.test(key)));
  expect(storedSizingKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
