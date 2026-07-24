const { test, expect } = require('@playwright/test');

test.describe('Day 3 HR and payroll VIP', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hub exposes exactly the six canonical tools without mobile overflow', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/hr-payroll/');
    const cards = page.locator('#hr-core-grid .tool-card');
    await expect(cards).toHaveCount(6);
    expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')))).toEqual([
      '/tools/contractor-vs-employee/',
      '/tools/domestic-worker/',
      '/tools/employee-cost/',
      '/tools/gratuity-calculator/',
      '/tools/maternity-leave/',
      '/tools/retrenchment-calculator/'
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
    expect(pageErrors).toEqual([]);
  });

  test('contractor comparison is task-first, exact, local, and export guarded', async ({ page }) => {
    await page.addInitScript(() => {
      window.__afroToolsPrintCalls = 0;
      window.print = () => { window.__afroToolsPrintCalls += 1; };
    });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/tools/contractor-vs-employee/');
    const calculatorTop = await page.locator('.contractor-calculator').evaluate((element) => element.offsetTop);
    const countryDirectoryTop = await page.locator('.hr-hub').evaluate((element) => element.offsetTop);
    expect(calculatorTop).toBeLessThan(countryDirectoryTop);
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    await expect(page.locator('#contractor-print-result')).toBeDisabled();

    await page.getByLabel('Currency code or symbol').fill('USD');
    await page.getByLabel('Employee base monthly pay').fill('1000');
    await page.getByLabel('Employer contributions and benefits').fill('200');
    await page.getByLabel('Other recurring employee costs').fill('50');
    await page.getByLabel('Contractor monthly quote').fill('1400');
    await page.getByRole('button', { name: 'Compare hiring cost' }).click();

    await expect(page.locator('#employee-monthly-result')).toHaveText('USD 1,250.00');
    await expect(page.locator('#contractor-monthly-result')).toHaveText('USD 1,400.00');
    await expect(page.locator('#employee-annual-result')).toHaveText('USD 15,000.00');
    await expect(page.locator('#contractor-annual-result')).toHaveText('USD 16,800.00');
    await page.locator('#contractor-print-result').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);

    await page.getByLabel('Employee base monthly pay').fill('1100');
    await expect(page.locator('#contractor-comparison-result')).toBeHidden();
    await expect(page.locator('#contractor-print-result')).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
    expect(pageErrors).toEqual([]);
  });

  test('domestic worker plan uses explicit inputs and exports only a current result', async ({ page }) => {
    await page.addInitScript(() => {
      window.__afroToolsPrintCalls = 0;
      window.print = () => { window.__afroToolsPrintCalls += 1; };
    });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/tools/domestic-worker/');
    await expect(page.getByLabel('Agreed base pay')).toHaveValue('');
    await expect(page.getByLabel('Source label')).toHaveValue('');
    await expect(page.locator('#printSummary')).toBeDisabled();

    await page.getByRole('button', { name: 'Load synthetic fixture' }).click();
    await expect(page.locator('#monthlyCost')).toHaveText('TST 1,455');
    await expect(page.locator('#annualCost')).toHaveText('TST 17,454');
    await expect(page.locator('#scenarioRows tr')).toHaveCount(2);
    await expect(page.locator('#sourceUsed')).toContainText('Synthetic test wage notice');
    await page.locator('#printSummary').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);

    await page.getByLabel('Agreed base pay').fill('1100');
    await expect(page.locator('#monthlyCost')).toHaveText('—');
    await expect(page.locator('#printSummary')).toBeDisabled();
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
    expect(pageErrors).toEqual([]);
  });

  test('employee cost brief is task-first, exact, sourced, and export guarded', async ({ page }) => {
    await page.addInitScript(() => {
      window.__afroToolsPrintCalls = 0;
      window.print = () => { window.__afroToolsPrintCalls += 1; };
    });
    await page.goto('/tools/employee-cost/');
    expect(await page.locator('.employee-cost-calculator').evaluate((element) => element.offsetTop)).toBeLessThan(
      await page.locator('.hr-hub').evaluate((element) => element.offsetTop)
    );
    await expect(page.locator('#employee-cost-print')).toBeDisabled();

    const fixture = {
      '#employee-cost-currency': 'TST', '#employee-cost-salary': '1000', '#employee-cost-obligations': '100',
      '#employee-cost-benefits': '50', '#employee-cost-allowances': '100', '#employee-cost-other': '50',
      '#employee-cost-once': '0', '#employee-cost-allocation': '12', '#employee-cost-source': 'Synthetic source',
      '#employee-cost-source-date': '2026-07-18'
    };
    for (const [selector, value] of Object.entries(fixture)) await page.locator(selector).fill(value);
    await page.getByRole('button', { name: 'Build employee cost brief' }).click();
    await expect(page.locator('#employee-cost-recurring')).toHaveText('TST 1,300.00');
    await expect(page.locator('#employee-cost-first-year')).toHaveText('TST 15,600.00');
    await page.locator('#employee-cost-print').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);

    await page.locator('#employee-cost-salary').fill('1100');
    await expect(page.locator('#employee-cost-result')).toBeHidden();
    await expect(page.locator('#employee-cost-print')).toBeDisabled();
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
  });

  test('gratuity estimate separates core, additions, deductions, and source evidence', async ({ page }) => {
    await page.addInitScript(() => { window.__afroToolsPrintCalls = 0; window.print = () => { window.__afroToolsPrintCalls += 1; }; });
    await page.goto('/tools/gratuity-calculator/');
    const fixture = {
      '#gratuity-currency': 'TST', '#gratuity-pay': '3000', '#gratuity-years': '5', '#gratuity-months': '6',
      '#gratuity-days': '15', '#gratuity-divisor': '30', '#gratuity-additions': '500', '#gratuity-deductions': '250',
      '#gratuity-source': 'Synthetic rule', '#gratuity-source-date': '2026-07-18'
    };
    for (const [selector, value] of Object.entries(fixture)) await page.locator(selector).fill(value);
    await page.getByRole('button', { name: 'Build final-pay estimate' }).click();
    await expect(page.locator('#gratuity-core')).toHaveText('TST 8,250.00');
    await expect(page.locator('#gratuity-gross')).toHaveText('TST 8,750.00');
    await expect(page.locator('#gratuity-net')).toHaveText('TST 8,500.00');
    await page.locator('#gratuity-print').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);
    await page.locator('#gratuity-pay').fill('3100');
    await expect(page.locator('#gratuity-result')).toBeHidden();
    await expect(page.locator('#gratuity-print')).toBeDisabled();
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
  });

  test('parental leave uses one verified planner and never persists sensitive inputs or summary', async ({ page }) => {
    await page.addInitScript(() => { window.__afroToolsPrintCalls = 0; window.print = () => { window.__afroToolsPrintCalls += 1; }; });
    await page.goto('/tools/maternity-leave/');
    await expect(page.locator('#countrySelect option')).toHaveCount(54);
    const fixture = {
      '#monthlySalary': '3043.75', '#currencyLabel': 'TST', '#startDate': '2026-08-01', '#plannedDays': '90',
      '#requestedDays': '100', '#payRate': '80', '#companyDays': '112', '#companyRate': '100',
      '#leaveSource': 'Synthetic rule', '#leaveSourceDate': '2026-07-18'
    };
    for (const [selector, value] of Object.entries(fixture)) await page.locator(selector).fill(value);
    await page.getByRole('button', { name: 'Calculate and compare' }).click();
    await expect(page.locator('#leaveResults tbody tr td:last-child')).toHaveText(['TST 7,200.00', 'TST 8,000.00', 'TST 11,200.00']);
    const storageLeaks = await page.evaluate(() => {
      const entries = [];
      for (const storage of [localStorage, sessionStorage]) {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          entries.push([key, storage.getItem(key)]);
        }
      }
      return entries.filter(([key, value]) =>
        /maternity|parental[-_: ]?leave|monthlySalary|leaveSource|leaveNotes/i.test(String(key)) ||
        /Parental leave pay planning summary|Synthetic rule|3043\.75/i.test(String(value))
      );
    });
    expect(storageLeaks).toEqual([]);
    await expect(page.locator('#saveScenario')).toHaveCount(0);
    await page.locator('#printLeave').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);
    await page.locator('#monthlySalary').fill('3100');
    await expect(page.locator('#printLeave')).toBeDisabled();
    await expect(page.locator('#leaveResults')).toContainText('No current result');
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
  });

  test('retrenchment package reconciles every component and guards stale exports', async ({ page }) => {
    await page.addInitScript(() => { window.__afroToolsPrintCalls = 0; window.print = () => { window.__afroToolsPrintCalls += 1; }; });
    await page.goto('/tools/retrenchment-calculator/');
    const fixture = {
      '#retrenchment-currency': 'TST', '#retrenchment-pay': '7800', '#retrenchment-years': '7', '#retrenchment-months': '4',
      '#retrenchment-weeks': '1', '#retrenchment-notice': '1', '#retrenchment-leave-days': '10', '#retrenchment-divisor': '39',
      '#retrenchment-other': '1000', '#retrenchment-deductions': '500', '#retrenchment-source': 'Synthetic rule', '#retrenchment-source-date': '2026-07-18'
    };
    for (const [selector, value] of Object.entries(fixture)) await page.locator(selector).fill(value);
    await page.getByRole('button', { name: 'Build package estimate' }).click();
    await expect(page.locator('#retrenchment-severance')).toHaveText('TST 13,200.00');
    await expect(page.locator('#retrenchment-notice-result')).toHaveText('TST 7,800.00');
    await expect(page.locator('#retrenchment-leave-result')).toHaveText('TST 2,000.00');
    await expect(page.locator('#retrenchment-gross')).toHaveText('TST 24,000.00');
    await expect(page.locator('#retrenchment-net')).toHaveText('TST 23,500.00');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#retrenchment-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('retrenchment-package-estimate.txt');
    const storageLeaks = await page.evaluate(() => {
      const entries = [];
      for (const storage of [localStorage, sessionStorage]) {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          entries.push([key, storage.getItem(key)]);
        }
      }
      return entries.filter(([key, value]) =>
        /retrenchment|severance|monthlyPay|ruleSource/i.test(String(key)) ||
        /Retrenchment package planning estimate|Synthetic rule|TST 23,500\.00/i.test(String(value))
      );
    });
    expect(storageLeaks).toEqual([]);
    await page.locator('#retrenchment-print').click();
    expect(await page.evaluate(() => window.__afroToolsPrintCalls)).toBe(1);
    await page.locator('#retrenchment-pay').fill('7900');
    await expect(page.locator('#retrenchment-result')).toBeHidden();
    await expect(page.locator('#retrenchment-print')).toBeDisabled();
    await expect(page.locator('.hr-payroll-focus-rail')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
  });
});
