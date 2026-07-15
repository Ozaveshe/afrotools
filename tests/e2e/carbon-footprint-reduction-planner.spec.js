const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('turns the fixed-factor footprint into one measurable dominant-source target', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/tools/carbon-footprint-energy/');
  await expect(page.locator('[data-df-form="carbon-footprint-energy"]')).toHaveCount(0);
  await expect(page.locator('#reductionSource')).toBeDisabled();
  await expect(page.locator('#reductionPct')).toBeDisabled();

  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#gridKWh').fill('200');
  await page.locator('#genLitres').fill('40');
  await page.locator('#lpgKg').fill('12.5');
  await page.locator('#woodKg').fill('0');
  await page.locator('#calcBtn').click();

  await expect(page.locator('.carbon-plan-icon svg')).toBeVisible();
  await expect(page.locator('#rTotal')).toHaveText('241 kg');
  await expect(page.locator('#rRating')).toHaveText('Rating: High');
  await expect(page.locator('#rAnnual')).toHaveText('2,892 kg');
  await expect(page.locator('#rOffset')).toHaveText('$43 (₦70,950)');
  await expect(page.locator('#carbonMethodContext')).toHaveText('Nigeria selected · country changes offset-cost currency only · fixed factors apply to every country · energy dataset 2026-03.');
  await expect(page.locator('#reductionSource')).toHaveValue('generator');
  await expect(page.locator('#reductionSource option').first()).toHaveText('Generator diesel — largest source');
  await expect(page.locator('#planActivityCut')).toHaveText('10 litres/month');
  await expect(page.locator('#planAvoidedMonthly')).toHaveText('27 kg/month');
  await expect(page.locator('#planRevisedMonthly')).toHaveText('214 kg/month');
  await expect(page.locator('#planAvoidedAnnual')).toHaveText('324 kg/year');
  await expect(page.locator('#carbonPlanStatus')).toContainText('reduces this fixed-factor total by about 11%');
  await expect(page.locator('#carbonPlanStatus')).toContainText('fuel receipts or a fuel log');

  await page.locator('#reductionPct').selectOption('50');
  await expect(page.locator('#planActivityCut')).toHaveText('20 litres/month');
  await expect(page.locator('#planAvoidedMonthly')).toHaveText('54 kg/month');
  await expect(page.locator('#planRevisedMonthly')).toHaveText('187 kg/month');
  await expect(page.locator('#planAvoidedAnnual')).toHaveText('648 kg/year');

  await page.locator('#reductionSource').selectOption('grid');
  await page.locator('#reductionPct').selectOption('25');
  await expect(page.locator('#planActivityCut')).toHaveText('50 kWh/month');
  await expect(page.locator('#planAvoidedMonthly')).toHaveText('24 kg/month');
  await expect(page.locator('#planRevisedMonthly')).toHaveText('217 kg/month');
  await expect(page.locator('#planAvoidedAnnual')).toHaveText('288 kg/year');
  await expect(page.locator('#carbonPlanStatus')).toContainText('recent meter or bill kWh');

  await page.locator('#countrySelect').selectOption('ZA');
  await expect(page.locator('#reductionSource')).toBeDisabled();
  await expect(page.locator('#reductionPct')).toBeDisabled();
  await expect(page.locator('#carbonMethodContext')).toHaveText('Energy inputs changed, so the previous reduction target is stale. Recalculate before using it.');
  await expect(page.locator('#carbonPlanStatus')).toHaveAttribute('data-state', 'stale');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#rTotal')).toHaveText('241 kg');
  await expect(page.locator('#rOffset')).toHaveText('$43 (R796)');
  await expect(page.locator('#carbonMethodContext')).toContainText('South Africa selected');

  const storedCarbonKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /carbon|footprint|reduction/i.test(key)));
  expect(storedCarbonKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
