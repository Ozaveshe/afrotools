const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('separates current backup operation from the gross avoidable-loss payback case', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/outage-cost/');

  await expect(page.locator('.oc-recommendation-icon svg')).toBeVisible();
  await expect(page.locator('#totalCost')).toHaveText(/NGN\s+352,303/);
  await expect(page.locator('#backupCost')).toHaveText(/NGN\s+108,000/);
  await expect(page.locator('#breakEvenBudget')).toHaveText(/NGN\s+912,410/);
  await expect(page.locator('#avoidableFormula')).toContainText(/NGN\s+198,350 residual loss/);
  await expect(page.locator('#avoidableFormula')).toContainText(/NGN\s+29,753 related recovery/);
  await expect(page.locator('#avoidableResult')).toHaveText(/NGN\s+228,103 per incident/);
  await expect(page.locator('#recommendationText')).toContainText('Current backup running cost and its recovery markup are excluded from that saving.');
  await expect(page.locator('#recommendationText')).toContainText('gross payback of 1.3 month(s) only if it eliminates all modeled residual losses.');
  await expect(page.locator('#recommendationText')).toContainText('Financing, maintenance, replacement energy, taxes, and coverage gaps can lengthen it.');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afro_outage_cost_last')));
  expect(stored.avoidableBase).toBeCloseTo(198350, 2);
  expect(stored.avoidableRecovery).toBeCloseTo(29752.5, 2);
  expect(stored.avoidableIncidentLoss).toBeCloseTo(228102.5, 2);
  expect(stored.breakEvenBudget).toBeCloseTo(912410, 2);
  expect(stored.paybackMonths).toBeCloseTo(1200000 / 912410, 6);

  await page.locator('#copyBtn').click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toMatch(/Gross avoidable loss per incident: NGN\s+228,103/);
  expect(clipboard).toMatch(/Gross avoidable loss per month: NGN\s+912,410/);
  expect(clipboard).toContain('Payback boundary: before financing, maintenance, replacement energy, taxes, and coverage gaps.');

  await page.locator('#recoveryBufferPct').fill('0');
  await expect(page.locator('#breakEvenBudget')).toHaveText(/NGN\s+793,400/);
  await expect(page.locator('#avoidableResult')).toHaveText(/NGN\s+198,350 per incident/);

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
