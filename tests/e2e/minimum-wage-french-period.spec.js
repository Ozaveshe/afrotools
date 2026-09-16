const { test, expect } = require('@playwright/test');
const fs = require('fs');
for (const period of ['monthly', 'daily', 'hourly']) test(`French minimum wage ${period} scenarios use monthly amounts once`, async ({ page }) => {
  await page.goto('/fr/tools/salaire-minimum/');
  for (const [id, value] of Object.entries({ minWage: '1000', actualPay: period === 'monthly' ? '1200' : period === 'daily' ? '60' : '10', daysMonth: '20', hoursWeek: '30', allowances: '100', employerRate: '10', payrollFees: '25', employeeRate: '0', fixedDeductions: '0' })) await page.locator('#' + id).fill(value);
  await page.locator('#currency').selectOption('EUR');
  await page.locator('#minPeriod').selectOption({label:'Mensuel'});
  await page.locator('#payPeriod').selectOption(period === 'monthly' ? {label:'Mensuel'} : period);
  const monthly = period === 'hourly' ? 1300 : 1200;
  const amount = text => Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
  const costs = await page.locator('#scenarioRows tr').evaluateAll(rows => rows.map(row => row.cells[2].textContent));
  expect(costs.slice(0, 3).map(amount)).toEqual([Math.round((monthly + 100) * 1.1 + 25), 1235, 1345]);
  expect(amount(await page.locator('#employerCostOut').innerText())).toBe(Math.round((monthly + 100) * 1.1 + 25));
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadSummary').click();
  const download = await downloadPromise;
  const content = fs.readFileSync(await download.path(), 'utf8');
  expect(content).toContain('Coût employeur');
  expect(content.replace(/[\s\u00a0\u202f]/g, '')).toContain(String(Math.round((monthly + 100) * 1.1 + 25)));
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
