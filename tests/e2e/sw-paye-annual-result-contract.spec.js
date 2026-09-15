const { test, expect } = require('@playwright/test');

const countries = ['angola', 'burkina-faso', 'cote-divoire', 'chad', 'seychelles', 'guinea', 'gabon', 'ethiopia', 'niger', 'mauritius', 'mali', 'malawi'];

for (const country of countries) {
  test(`${country}: annual salary results remain finite and match monthly totals`, async ({ page }) => {
    await page.goto(`/sw/${country}/kikokotoo-kodi-mshahara/`);
    await page.locator('#grossSalary').fill('1500000');
    await page.locator('button[onclick="calculate()"]').first().click();
    const result = await page.evaluate(() => ({
      gross: RESULT.gross,
      tax: RESULT.monthlyPAYE ?? RESULT.monthlyITS,
      net: RESULT.netMonthly,
      annualGross: RESULT.annualGross,
      annualTax: RESULT.annualTax,
      annualNet: RESULT.annualNet,
      sector: RESULT.sector,
      selectedSector: typeof SECTOR === 'undefined' ? null : SECTOR
    }));
    expect(result.annualGross).toBeCloseTo(result.gross * 12, 2);
    expect(result.annualTax).toBeCloseTo(result.tax * 12, 2);
    expect(result.annualNet).toBeCloseTo(result.net * 12, 2);
    if (result.selectedSector !== null) expect(result.sector).toBe(result.selectedSector);
    const annual = page.locator('button[onclick*="setPeriod(\'annual\'"]');
    if (await annual.count()) {
      await annual.click();
      await expect(page.locator('#resContent')).not.toContainText(/NaN|undefined|Infinity/);
      await expect(page.locator('#resContent')).toContainText('Mshahara');
    }
  });
}
