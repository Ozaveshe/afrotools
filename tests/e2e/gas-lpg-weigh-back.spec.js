const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('uses measured delivered LPG for refill economics and flags underfill', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/gas-lpg-cost/');

  await expect(page.locator('.lpg-fill-icon svg')).toBeVisible();
  await expect(page.locator('#fillBasisSummary')).toHaveText('Rated 12.5 kg capacity is being used. Add tare and filled scale weights to verify delivered LPG.');
  await expect(page.locator('#fillWeightResult')).toHaveText('Rated 12.5 kg fallback');
  await expect(page.locator('#fillVarianceResult')).toHaveText('Not measured');
  await expect(page.locator('#dailyCost')).toHaveText(/NGN\s+475\.20/);
  await expect(page.locator('#monthlyCost')).toHaveText(/NGN\s+14,256/);
  await expect(page.locator('#pricePerKg')).toHaveText(/NGN\s+1,200 per kg/);
  await expect(page.locator('#refillForecast')).toHaveText('32 days');

  await page.locator('#tareWeightKg').fill('6.2');
  await expect(page.locator('#lpgStatus')).toHaveText('Check both scale weights');
  await expect(page.locator('#fillVarianceResult')).toContainText('Enter both weights');
  await page.locator('#filledWeightKg').fill('17.8');

  await expect(page.locator('#lpgStatus')).toHaveText('Measured fill used');
  await expect(page.locator('#fillBasisSummary')).toHaveText('Measured fill used: 11.6 kg LPG from 17.8 kg filled minus 6.2 kg tare.');
  await expect(page.locator('#fillWeightResult')).toHaveText('11.6 kg measured LPG (92.8% of 12.5 kg rating)');
  await expect(page.locator('#fillVarianceResult')).toHaveText('0.9 kg below rated (7.2% shortfall)');
  await expect(page.locator('#pricePerKg')).toHaveText(/NGN\s+1,293 per kg/);
  await expect(page.locator('#dailyCost')).toHaveText(/NGN\s+512\.07/);
  await expect(page.locator('#monthlyCost')).toHaveText(/NGN\s+15,362/);
  await expect(page.locator('#refillForecast')).toHaveText('29 days');
  await expect(page.locator('#refillsMonth')).toHaveText('1.02 refills/month');
  await expect(page.locator('#durationResult')).toHaveText('About 29.3 days per measured 11.6 kg fill');
  await expect(page.locator('#priceCheck')).toContainText('Measured LPG is 7.2% below the rated cylinder capacity. Ask the dealer to confirm fill weight.');

  await page.locator('#copyBtn').click();
  await expect(page.locator('#copyBtn')).toHaveText('Copied');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('Delivered LPG basis: 11.6 kg (measured)');
  expect(clipboard).toContain('Fill variance: 0.9 kg below rated (7.2% shortfall)');
  expect(clipboard).toContain('Price per kg: NGN');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afro_lpg_cost_last')));
  expect(stored.tareWeightKg).toBe(6.2);
  expect(stored.filledWeightKg).toBe(17.8);
  expect(stored.deliveredKg).toBeCloseTo(11.6, 6);
  expect(stored.fillBasis).toBe('measured');

  await page.locator('#country').selectOption('KE');
  await expect(page.locator('#tareWeightKg')).toHaveValue('');
  await expect(page.locator('#filledWeightKg')).toHaveValue('');
  await expect(page.locator('#fillBasisSummary')).toHaveText('Rated 13 kg capacity is being used. Add tare and filled scale weights to verify delivered LPG.');

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
