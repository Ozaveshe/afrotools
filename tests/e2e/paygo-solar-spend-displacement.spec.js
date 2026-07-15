const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('reconciles PayGo savings with displaced and residual current energy spend', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/paygo-solar/');

  await expect(page.locator('.pg-displacement-icon svg')).toBeVisible();
  await expect(page.locator('#dailyLoad')).toHaveText('1.65 kWh/day');
  await expect(page.locator('#energyCoverage')).toHaveText('73%');
  await expect(page.locator('#totalPaid')).toHaveText(/NGN\s+222,235/);
  await expect(page.locator('#monthlyAffordability')).toHaveText(/NGN\s+13,618/);
  await expect(page.locator('#monthlyAffordabilityNote')).toContainText(/76% of current spend; includes NGN\s+5,400 residual/);
  await expect(page.locator('#termSavings')).toHaveText(/NGN\s+80,165/);
  await expect(page.locator('#paybackEstimate')).toHaveText('5.7 months');
  await expect(page.locator('#paybackNote')).toContainText(/NGN\s+25,000 deposit \/ NGN\s+4,382 monthly saving/);
  await expect(page.locator('#displacedResult')).toContainText(/NGN\s+12,600 per month; NGN\s+302,400 over term/);
  await expect(page.locator('#residualResult')).toHaveText(/NGN\s+129,600 over term/);
  await expect(page.locator('#recommendation')).toContainText('Size warning: this kit does not cover the selected critical load target.');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools-paygo-solar-result')));
  expect(stored.spendReplacementPct).toBe(70);
  expect(stored.displacedSpendMonthly).toBeCloseTo(12600, 2);
  expect(stored.residualSpendMonthly).toBeCloseTo(5400, 2);
  expect(stored.combinedMonthlyCost).toBeCloseTo(13618.13, 2);
  expect(stored.combinedTermCost).toBeCloseTo(351835, 2);
  expect(stored.termSavings).toBeCloseTo(80165, 2);
  expect(stored.paybackMonths).toBe(5.7);

  await page.locator('#copyResult').click();
  await expect(page.locator('#pgStatus')).toHaveText('Report copied');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toMatch(/Current spend replaced: 70% = NGN\s+12,600 per month/);
  expect(clipboard).toMatch(/Residual current spend: NGN\s+5,400 per month/);
  expect(clipboard).toMatch(/Combined monthly energy cost: NGN\s+13,618/);
  expect(clipboard).toMatch(/Combined energy cost over term: NGN\s+351,835/);

  await page.locator('#spendReplacementPct').fill('90');
  await expect(page.locator('#riskFlags')).toContainText("Evidence risk: the entered 90% spend replacement is higher than the kit's 73% energy coverage.");
  await expect(page.locator('#monthlyAffordability')).toHaveText(/NGN\s+10,018/);
  await expect(page.locator('#termSavings')).toHaveText(/NGN\s+166,565/);

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
