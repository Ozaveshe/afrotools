const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('builds a coverage-capped and quote-backed biogas payback case', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/biogas-roi/');

  await expect(page.locator('.biogas-evidence-icon svg')).toBeVisible();
  await expect(page.locator('#lpgPricePerKg')).toHaveValue('1250');
  await expect(page.locator('#copyBiogasBtn')).toBeDisabled();
  await expect(page.locator('#downloadBiogasBtn')).toBeDisabled();

  await page.locator('#livestockCount').fill('1');
  await page.locator('#calcBtn').click();

  await expect(page.locator('#results')).toHaveClass(/on/);
  await expect(page.locator('#rBiogas')).toHaveText('0.50m³/day');
  await expect(page.locator('#rMeetsCooking')).toHaveText('67% — 0.50 of 0.75 m³/day');
  await expect(page.locator('#rLPGAvoided')).toHaveText('6.57 kg/month (full need: 9.85 kg)');
  await expect(page.locator('#rCost')).toHaveText(/₦1,468,500 — model default \(\$890\)/);
  await expect(page.locator('#rLPGSaving')).toHaveText(/₦8,212 at ₦1,250\/kg/);
  await expect(page.locator('#rAnnualSaving')).toHaveText(/₦98,540/);
  await expect(page.locator('#rSlurry')).toHaveText(/₦0\.00 — not counted without evidence/);
  await expect(page.locator('#rMaintenance')).toHaveText(/₦0\.00\/year/);
  await expect(page.locator('#rPayback')).toHaveText('14.9 years');
  await expect(page.locator('#rEvidenceStatus')).toHaveText('Model cost or unchecked evidence');
  await expect(page.locator('#rObs')).toContainText('Cooking coverage caps LPG displacement at 6.57 kg/month instead of crediting the full 9.85 kg need.');
  await expect(page.locator('#rObs')).toContainText('Bioslurry contributes zero to payback until a verified monthly value is entered.');

  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools-biogas-roi-result')));
  expect(stored.coveragePct).toBe(66.7);
  expect(stored.avoidedLpgKgMonth).toBe(6.57);
  expect(stored.monthlyLpgSaving).toBeCloseTo(8211.68, 2);
  expect(stored.installedCost).toBe(1468500);
  expect(stored.costBasis).toBe('model default');
  expect(stored.netPaybackYears).toBe(14.9);
  expect(stored.evidenceReady).toBe(false);

  await page.locator('#installedCost').fill('1200000');
  await page.locator('#verifiedSlurryValue').fill('5000');
  await page.locator('#annualMaintenance').fill('60000');
  await page.locator('#evidenceConfirmed').check();
  await page.locator('#calcBtn').click();

  await expect(page.locator('#rCost')).toHaveText(/₦1,200,000 — installer quote/);
  await expect(page.locator('#rPayback')).toHaveText('12.2 years');
  await expect(page.locator('#rEvidenceStatus')).toHaveText('User-checked input set');
  await expect(page.locator('#rEvidenceStatus')).toHaveClass(/ready/);
  await expect(page.locator('#rMeets')).toHaveText('Input basis: User-checked cost inputs');

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools-biogas-roi-result')));
  expect(stored.installedCost).toBe(1200000);
  expect(stored.verifiedSlurryValueMonth).toBe(5000);
  expect(stored.annualMaintenance).toBe(60000);
  expect(stored.annualNetBenefit).toBeCloseTo(98540.15, 2);
  expect(stored.netPaybackYears).toBe(12.2);
  expect(stored.evidenceReady).toBe(true);

  await page.locator('#copyBiogasBtn').click();
  await expect(page.locator('#biogasStatus')).toHaveText('Result copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('Cooking gas coverage: 66.7% (0.5 of 0.75 m3/day)');
  expect(clipboard).toContain('LPG avoided: 6.57 kg/month; full need 9.85 kg/month');
  expect(clipboard).toContain('Installed cost: 1200000 NGN (installer quote)');
  expect(clipboard).toContain('Evidence status: User-checked cost inputs');

  await page.locator('#cookingHours').selectOption('4');
  await expect(page.locator('#rEvidenceStatus')).toHaveText('Inputs changed — recalculate');
  await expect(page.locator('#copyBiogasBtn')).toBeDisabled();
  await expect(page.locator('#biogasStatus')).toHaveText('Inputs changed — calculate again to refresh coverage and payback.');

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
