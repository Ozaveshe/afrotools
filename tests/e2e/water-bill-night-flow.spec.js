const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('turns a measured night-flow test into a tier-aware leak ceiling', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/water-bill/');

  await expect(page.locator('.wb-night-icon svg')).toBeVisible();
  await expect(page.locator('#consumption-output')).toHaveText('24 m3');
  await expect(page.locator('#expected-bill')).toHaveText(/NGN\s+7,504/);
  await expect(page.locator('#night-flow-status')).toHaveText('Add both optional test readings to quantify meter movement.');
  await expect(page.locator('#night-delta-output')).toHaveText('Not entered');
  await expect(page.locator('#night-flow-output')).toHaveText('Not entered');
  await expect(page.locator('#night-loss-output')).toHaveText('Not entered');
  await expect(page.locator('#night-cost-output')).toHaveText('Not entered');

  await page.locator('#night-start-reading').fill('1264.000');
  await expect(page.locator('#usage-status')).toHaveText('Night test issue');
  await expect(page.locator('#night-flow-status')).toHaveText('The test is incomplete. Enter both start and end readings, or clear both.');
  await expect(page.locator('#night-delta-output')).toHaveText('Incomplete');

  await page.locator('#night-end-reading').fill('1263.999');
  await expect(page.locator('#night-flow-status')).toHaveText('End reading is below start reading. Check for meter rollover or data-entry error.');
  await expect(page.locator('#priority-output')).toHaveText('Correct the night-flow readings');
  await expect(page.locator('#night-cost-output')).toHaveText('Not projected');

  await page.locator('#night-end-reading').fill('1264.003');
  await expect(page.locator('#usage-status')).toHaveText('Leak check needed');
  await expect(page.locator('#night-flow-status')).toHaveText('Meter moved 3 L in 30 minutes. The 30-day projection is a diagnostic ceiling, not a confirmed leak bill.');
  await expect(page.locator('#night-delta-output')).toHaveText('3 L / 30 min');
  await expect(page.locator('#night-flow-output')).toHaveText('6 L/hour');
  await expect(page.locator('#night-loss-output')).toHaveText('4.32 m3/month');
  await expect(page.locator('#night-cost-output')).toHaveText(/NGN\s+1,022\/month/);
  await expect(page.locator('#next-summary')).toContainText('Measured night flow is present.');
  await expect(page.locator('#checklist-output')).toContainText('Measured night flow continued with all outlets closed.');

  await page.locator('#copy-result').click();
  await expect(page.locator('#share-note')).toHaveText('Result copied to clipboard.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('Night-flow test: 3 L in 30 min = 6 L/hour');
  expect(clipboard).toContain('Night-flow 30-day loss ceiling: 4.32 m3');
  expect(clipboard).toMatch(/Night-flow variable bill impact: NGN\s+1,022\/month/);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('waterBillLastResult')));
  expect(stored.input.nightStartReading).toBe(1264);
  expect(stored.input.nightEndReading).toBe(1264.003);
  expect(stored.nightFlow.movementLitres).toBeCloseTo(3, 6);
  expect(stored.nightFlow.monthlyLossM3).toBeCloseTo(4.32, 6);
  expect(stored.nightFlow.variableBillImpact).toBeCloseTo(1021.68, 2);

  await page.locator('#night-end-reading').fill('1264.000');
  await expect(page.locator('#night-flow-status')).toHaveText('No movement was measured over 30 minutes. Repeat the test if usage remains unusual.');
  await expect(page.locator('#night-loss-output')).toHaveText('0 m3/month');
  await expect(page.locator('#night-cost-output')).toHaveText(/NGN\s+0\.00\/month/);

  await page.locator('#reset-defaults').click();
  await expect(page.locator('#night-start-reading')).toHaveValue('');
  await expect(page.locator('#night-end-reading')).toHaveValue('');
  await expect(page.locator('#night-delta-output')).toHaveText('Not entered');

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
