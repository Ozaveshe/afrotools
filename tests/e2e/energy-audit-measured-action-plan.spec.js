const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('turns the protected household audit into a measurable 30-day action plan', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/energy-audit/');

  await expect(page.locator('[data-df-form="energy-audit"]')).toHaveCount(0);
  await expect(page.locator('#copyAuditPlan')).toBeDisabled();
  await expect(page.locator('.audit-plan-icon svg')).toBeVisible();

  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#monthlyBill').fill('35000');
  await page.locator('#homeSizeSqm').fill('120');
  await page.locator('#occupants').fill('4');
  await page.locator('#acUnits').selectOption('2');
  await page.locator('#lightingType').selectOption('mix');
  await page.locator('#waterHeater').selectOption('electric');
  await page.locator('#calcBtn').click();

  await expect(page.locator('#rScore')).toHaveText('0/100');
  await expect(page.locator('#rRating')).toContainText('Very Inefficient');
  await expect(page.locator('#rUsage')).toHaveText('515 kWh');
  await expect(page.locator('#rBench')).toHaveText('120 kWh');
  await expect(page.locator('#rPct')).toHaveText('50%');
  await expect(page.locator('#rMSaving')).toHaveText('₦17,500');
  await expect(page.locator('#auditPlanContext')).toContainText('Nigeria · dataset 2026-03');
  await expect(page.locator('#auditPlanContext')).toContainText('residential tariff ₦68/kWh');
  await expect(page.locator('#auditPlanContext')).toContainText('no individual appliances were measured');

  const steps = page.locator('#auditPlanList .audit-plan-step');
  await expect(steps).toHaveCount(5);
  await expect(steps.nth(0).locator('strong')).toContainText('Set AC');
  await expect(steps.nth(0)).toContainText('Up to ₦5,250/month · ₦63,000/year');
  await expect(steps.nth(0)).toContainText('seven-day test at 24–26°C');
  await expect(steps.nth(1).locator('strong')).toContainText('Replace all bulbs with LED');
  await expect(steps.nth(1)).toContainText('Up to ₦3,500/month');
  await expect(steps.nth(2).locator('strong')).toContainText('Install ceiling fans');
  await expect(steps.nth(2)).toContainText('Up to ₦2,800/month');
  await expect(steps.nth(3).locator('strong')).toContainText('Unplug standby devices');
  await expect(steps.nth(3)).toContainText('Up to ₦1,750/month');
  await expect(steps.nth(4).locator('strong')).toContainText('Install solar water heater');
  await expect(steps.nth(4)).toContainText('Up to ₦7,000/month');
  await expect(page.locator('#auditPlanNote')).toContainText('not additive');
  await expect(page.locator('#auditPlanNote')).toContainText('caps the combined savings estimate at 50%');
  await expect(page.locator('#copyAuditPlan')).toBeEnabled();

  await page.locator('#copyAuditPlan').click();
  await expect(page.locator('#auditPlanStatus')).toHaveText('Measured action plan copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('30-DAY MEASURED SAVINGS PLAN');
  expect(clipboard).toContain('Residential tariff used: ₦68/kWh');
  expect(clipboard).toContain('1. Set AC to 24–26°C');
  expect(clipboard).toContain('per-action estimates overlap and are not additive');
  expect(clipboard).toContain('no individual appliances were measured');
  expect(clipboard).toContain('copied only at your request');

  await page.locator('#monthlyBill').fill('36000');
  await expect(page.locator('#copyAuditPlan')).toBeDisabled();
  await expect(page.locator('#auditPlanContext')).toHaveText('Your inputs changed, so the previous plan is stale.');
  await expect(page.locator('#auditPlanStatus')).toContainText('Plan marked stale');
  await expect(page.locator('#auditPlanList .audit-plan-step')).toHaveCount(1);

  await page.locator('#calcBtn').click();
  await expect(page.locator('#copyAuditPlan')).toBeEnabled();
  await expect(page.locator('#auditPlanList .audit-plan-step')).toHaveCount(5);

  const storedAuditKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /energy.*audit|audit.*plan|monthly.*bill/i.test(key)));
  expect(storedAuditKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
