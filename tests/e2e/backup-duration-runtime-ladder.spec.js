const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

test('compares full, reduced, critical, and emergency loads with the protected runtime engine', async ({ page, context }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/tools/backup-duration/');

  await expect(page.locator('[data-df-form="backup-duration"]')).toHaveCount(0);
  await expect(page.locator('#copyRuntimePlan')).toBeDisabled();
  await page.locator('#batteryKWh').fill('5.12');
  await page.locator('#batteryAh').fill('999');
  await page.locator('#systemVoltage').selectOption('24');
  await page.locator('#loadWatts').fill('800');
  await page.locator('#batteryType').selectOption('lithium');
  await page.locator('#calcBtn').click();

  await expect(page.locator('.runtime-ladder-icon svg')).toBeVisible();
  await expect(page.locator('#rHours')).toHaveText('4.9 hours');
  await expect(page.locator('#rCritical')).toHaveText('Critical loads only: 12.2 hours (critical only)');
  await expect(page.locator('#rUsable')).toHaveText('4.35 kWh');
  await expect(page.locator('#rTotal')).toHaveText('5.12 kWh');
  await expect(page.locator('#rAh')).toHaveText('213 Ah');
  await expect(page.locator('#rDOD')).toHaveText('85%');
  await expect(page.locator('#runtimeLadderContext')).toContainText('LiFePO4 (Lithium) · 5.12 kWh total · 4.35 kWh usable · 85% DoD');
  await expect(page.locator('#runtimeLadderContext')).toContainText('fixed 90% inverter efficiency · 800W baseline');

  const rows = page.locator('#runtimeLadderBody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('All entered loads');
  await expect(rows.nth(0)).toContainText('800W');
  await expect(rows.nth(0)).toContainText('4.9 hours');
  await expect(rows.nth(1)).toContainText('Shed 25% of load');
  await expect(rows.nth(1)).toContainText('600W');
  await expect(rows.nth(1)).toContainText('6.5 hours');
  await expect(rows.nth(1)).toContainText('+1.6 h');
  await expect(rows.nth(2)).toContainText('Half-load plan');
  await expect(rows.nth(2)).toContainText('400W');
  await expect(rows.nth(2)).toContainText('9.8 hours');
  await expect(rows.nth(2)).toContainText('+4.9 h');
  await expect(rows.nth(3)).toContainText('Critical-load target');
  await expect(rows.nth(3)).toContainText('320W');
  await expect(rows.nth(3)).toContainText('12.2 hours');
  await expect(rows.nth(3)).toContainText('+7.3 h');
  await expect(rows.nth(4)).toContainText('Emergency essentials');
  await expect(rows.nth(4)).toContainText('200W');
  await expect(rows.nth(4)).toContainText('19.6 hours');
  await expect(rows.nth(4)).toContainText('+14.7 h');
  await expect(page.locator('#runtimeLadderNote')).toContainText('does not identify which appliances to switch off');
  await expect(page.locator('#copyRuntimePlan')).toBeEnabled();

  await page.locator('#copyRuntimePlan').click();
  await expect(page.locator('#runtimeLadderStatus')).toHaveText('Outage runtime plan copied.');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('LOAD-SHEDDING RUNTIME PLAN');
  expect(clipboard).toContain('Battery input used: 5.12 kWh entered');
  expect(clipboard).toContain('Inverter efficiency assumption: 90%');
  expect(clipboard).toContain('4. Critical-load target | 320W | 12.2 hours | +7.3 hours vs full load');
  expect(clipboard).toContain('Not modeled: startup surge, inverter idle draw, battery age');
  expect(clipboard).toContain('stay in your browser unless you choose to copy this plan');

  await page.locator('#loadWatts').fill('600');
  await expect(page.locator('#copyRuntimePlan')).toBeDisabled();
  await expect(page.locator('#runtimeLadderContext')).toHaveText('Battery or load inputs changed, so the previous runtime ladder is stale.');
  await expect(page.locator('#runtimeLadderStatus')).toContainText('Runtime plan marked stale');
  await expect(page.locator('#runtimeLadderBody tr')).toHaveCount(1);

  await page.locator('#calcBtn').click();
  await expect(page.locator('#copyRuntimePlan')).toBeEnabled();
  await expect(page.locator('#runtimeLadderBody tr')).toHaveCount(5);
  await expect(page.locator('#rHours')).toHaveText('6.5 hours');

  const storedRuntimeKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /backup.*duration|runtime.*plan|battery.*load/i.test(key)));
  expect(storedRuntimeKeys).toEqual([]);
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(runtimeErrors).toEqual([]);
});
