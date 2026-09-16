const { test, expect } = require('@playwright/test');
const fs = require('fs');
test('French references preserve basis, scope, manual inputs and native CSV context', async ({ page }) => {
  await page.goto('/fr/tools/salaire-minimum/');
  await page.locator('#actualPay').fill('2000');
  await page.locator('#hoursWeek').fill('35');
  await page.locator('#referenceCountry').selectOption('ZA');
  await expect(page.locator('#referenceRate')).toHaveText('30,23 ZAR par heure');
  await expect(page.locator('#referenceOfficial')).toHaveAttribute('href', /54075rg11941gon7083.pdf$/);
  await page.locator('#referenceSector').selectOption('epwp');
  await expect(page.locator('#referenceRate')).toHaveText('16,62 ZAR par heure');
  await page.locator('#referenceUse').click();
  await expect(page.locator('#minWage')).toHaveValue('16.62');
  await expect(page.locator('#minPeriod')).toHaveValue('hourly');
  await expect(page.locator('#actualPay')).toHaveValue('2000');
  await expect(page.locator('#hoursWeek')).toHaveValue('35');
  await expect(page.locator('#sourceDate')).toHaveValue('');
  await expect(page.locator('#minWage')).toBeFocused();
  const minimum = await page.locator('#breakdownRows tr').first().locator('td').nth(1).innerText();
  expect(Number(minimum.replace(/[^\d]/g, ''))).toBe(2521); // 16.62 * 35 * 52 / 12 = 2520.7
  await page.locator('#referenceSearch').fill('Afrique du Sud');
  await expect(page.locator('#referenceRows tr')).toHaveCount(1);
  const wait = page.waitForEvent('download'); await page.locator('#referenceCSV').click();
  const download = await wait; const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"30.23","par heure"');
  expect(csv).toContain('16 septembre 2026'); expect(csv).toContain('54075rg11941gon7083.pdf');
  expect(csv).not.toContain('2000');
  await page.locator('#referenceCountry').selectOption('NG');
  await expect(page.locator('#referenceSource')).toContainText('actualité et champ d’application non vérifiés');
  await expect(page.locator('#referenceOfficial')).toBeHidden();
  await page.locator('#referenceReset').click();
  await expect(page.locator('#referenceDetail')).toBeHidden();
  await expect(page.locator('#actualPay')).toHaveValue('2000');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('#referenceCountry').selectOption('ZA');
    await page.locator('#referenceSector').selectOption('epwp');
    await page.locator('#referenceUse').click();
    await expect(page.locator('#minWage')).toHaveValue('16.62');
  }
});
test('French reference controls work at mobile widths in light and dark', async ({ page }) => {
  await page.goto('/fr/tools/salaire-minimum/');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
    await page.locator('#referenceCountry').selectOption('ZA');
    await page.locator('#referenceCompare').selectOption('NG');
    await expect(page.locator('#referenceComparison')).toContainText('NGN');
    await page.locator('#referenceSector').selectOption('epwp');
    await page.locator('#referenceUse').click();
    await expect(page.locator('#minWage')).toBeFocused();
    const violations = await page.evaluate(async () => (await axe.run(document.getElementById('wage-reference'))).violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id:v.id, nodes:v.nodes.map(n=>n.target) })));
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
