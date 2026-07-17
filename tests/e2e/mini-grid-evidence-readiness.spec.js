const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('keeps the protected model result separate from user-confirmed project evidence', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/mini-grid-feasibility/');

  await expect(page.locator('[data-df-form="mini-grid-feasibility"]')).toHaveCount(0);
  await expect(page.locator('#copyScreeningBrief')).toBeDisabled();
  await expect(page.locator('#evidenceLoadSurvey')).toBeDisabled();
  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#households').fill('200');
  await page.locator('#businesses').fill('15');
  await page.locator('#avgKWhHousehold').selectOption('30');
  await page.locator('#avgKWhBusiness').selectOption('100');
  await page.locator('#calcBtn').click();

  await expect(page.locator('.readiness-icon svg')).toBeVisible();
  await expect(page.locator('#rViability')).toHaveText('CHALLENGING');
  await expect(page.locator('#rPayback')).toHaveText('Simple payback: 91.9 years');
  await expect(page.locator('#rSolar')).toHaveText('112.6 kW');
  await expect(page.locator('#rBattery')).toHaveText('1,688.4 kWh');
  await expect(page.locator('#rPeak')).toHaveText('93.8 kW');
  await expect(page.locator('#rGen')).toHaveText('7,500 kWh');
  await expect(page.locator('#rCapexUSD')).toHaveText('$591,281');
  await expect(page.locator('#rPerConn')).toHaveText('$2750');
  await expect(page.locator('#rMonthly')).toHaveText('₦4,950,000');
  await expect(page.locator('#rAnnual')).toHaveText('₦59,400,000');
  await expect(page.locator('#rGrant')).toHaveText('$236,512');
  await expect(page.locator('#rTariffAssumption')).toHaveText('$0.40/kWh');
  await expect(page.locator('#rOpexAssumption')).toHaveText('5% of CAPEX');
  await expect(page.locator('#readinessContext')).toContainText('Protected model: CHALLENGING at 91.9 years simple payback');
  await expect(page.locator('#readinessContext')).toContainText('Nigeria dataset 2026-03');
  await expect(page.locator('#readinessContext')).toContainText('fixed USD 0.40/kWh revenue · 5% of CAPEX annual OPEX');
  await expect(page.locator('#readinessSummary')).toHaveText('0 of 4 evidence gates confirmed. CHALLENGING is only a model result; 4 evidence gaps remain.');
  await expect(page.locator('#evidenceLoadSurvey')).toBeEnabled();
  await expect(page.locator('#copyScreeningBrief')).toBeEnabled();

  await page.locator('#evidenceLoadSurvey').check();
  await page.locator('#evidenceAnchor').check();
  await expect(page.locator('#readinessSummary')).toHaveText('2 of 4 evidence gates confirmed. CHALLENGING is only a model result; 2 evidence gaps remain.');

  await page.locator('#copyScreeningBrief').click();
  await expect(page.locator('#readinessStatus')).toHaveText('Mini-grid screening brief copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('MINI-GRID SCREENING BRIEF');
  expect(clipboard).toContain('Country-energy dataset: 2026-03');
  expect(clipboard).toContain('Fixed sales tariff: USD 0.40/kWh');
  expect(clipboard).toContain('Result: CHALLENGING (model label only)');
  expect(clipboard).toContain('[confirmed] Seasonal load survey');
  expect(clipboard).toContain('[not confirmed] Willingness and ability to pay at USD 0.40/kWh');
  expect(clipboard).toContain('Illustrative 40% grant cap: $236,512 (not eligibility or availability)');
  expect(clipboard).toContain('stay in your browser unless you choose to copy this brief');

  await page.locator('#evidenceWillingness').check();
  await page.locator('#evidenceSite').check();
  await expect(page.locator('#readinessSummary')).toHaveText('4 of 4 screening evidence gates confirmed. This improves readiness but is still not approval or bankability.');
  await expect(page.locator('#readinessSummary')).toHaveAttribute('data-state', 'complete');

  await page.locator('#households').fill('220');
  await expect(page.locator('#copyScreeningBrief')).toBeDisabled();
  await expect(page.locator('#evidenceLoadSurvey')).toBeDisabled();
  await expect(page.locator('#readinessContext')).toHaveText('Community or demand inputs changed, so the previous screening brief is stale.');
  await expect(page.locator('#readinessStatus')).toContainText('Screening brief marked stale');

  await page.locator('#calcBtn').click();
  await expect(page.locator('#copyScreeningBrief')).toBeEnabled();
  await expect(page.locator('#readinessSummary')).toContainText('0 of 4 evidence gates confirmed');

  const storedReadinessKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /mini.*grid|readiness|load.*survey/i.test(key)));
  expect(storedReadinessKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
