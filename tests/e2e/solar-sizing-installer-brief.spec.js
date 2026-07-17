const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('builds one copyable installer brief from the real appliance calculation', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/solar-sizing/');

  await expect(page.locator('.appliance-row')).toHaveCount(5);
  await expect(page.locator('[data-df-form="solar-sizing"]')).toHaveCount(0);
  await expect(page.locator('#copyInstallerBrief')).toBeDisabled();
  await expect(page.locator('#installerBriefOutput')).toContainText('Calculate the system size');
  await expect(page.locator('.solar-brief-icon svg')).toBeVisible();

  await page.locator('#calcBtn').click();
  await expect(page.locator('#rPanels')).toHaveText('1 kW');
  await expect(page.locator('#rBattery')).toHaveText('Battery: 6.2 kWh');
  await expect(page.locator('#rInvSpec')).toHaveText('0.5 kVA');
  await expect(page.locator('#rTotal')).toHaveText('$1,938');
  await expect(page.locator('#copyInstallerBrief')).toBeEnabled();

  const initialBrief = page.locator('#installerBriefOutput');
  await expect(initialBrief).toContainText('Country: Nigeria (NG)');
  await expect(initialBrief).toContainText('Country-energy dataset month: 2026-03');
  await expect(initialBrief).toContainText('Peak-sun assumption: 5.5 hours/day');
  await expect(initialBrief).toContainText('Connected load: 311W');
  await expect(initialBrief).toContainText('Daily energy: 4.08 kWh');
  await expect(initialBrief).toContainText('Recommended battery bank: 6.2 kWh / 161 Ah (48V)');
  await expect(initialBrief).toContainText('Fridge (200L): 120 W aggregate x 24 h/day = 2880 Wh/day');
  await expect(initialBrief).toContainText('Cost model uses USD 300/kW panels');
  await expect(initialBrief).toContainText('not stored automatically');

  const watts = page.locator('.appliance-row').first().locator('input[aria-label="Watts"]');
  await watts.fill('18');
  await watts.press('Tab');
  await expect(page.locator('#copyInstallerBrief')).toBeDisabled();
  await expect(page.locator('#installerBriefOutput')).toContainText('Inputs changed. Recalculate');
  await expect(page.locator('#installerBriefStatus')).toContainText('previous brief is stale');

  await page.locator('#calcBtn').click();
  await expect(page.locator('#installerBriefOutput')).toContainText('Connected load: 347W');
  await expect(page.locator('#installerBriefOutput')).toContainText('Daily energy: 4.29 kWh');

  await page.locator('#countrySelect').selectOption('KE');
  await expect(page.locator('#copyInstallerBrief')).toBeDisabled();
  await page.locator('#calcBtn').click();
  await expect(page.locator('#rPanels')).toHaveText('1.1 kW');
  await expect(page.locator('#installerBriefOutput')).toContainText('Country: Kenya (KE)');
  await expect(page.locator('#installerBriefOutput')).toContainText('Peak-sun assumption: 5 hours/day');

  await page.locator('#copyInstallerBrief').click();
  await expect(page.locator('#installerBriefStatus')).toHaveText('Calculated installer brief copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('AfroTools Solar Sizing Installer Brief');
  expect(clipboard).toContain('Country: Kenya (KE)');
  expect(clipboard).toContain('Connected load: 347W');

  const storedSizingKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /solar|sizing|appliance|brief/i.test(key)));
  expect(storedSizingKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
