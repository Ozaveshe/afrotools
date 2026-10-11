const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

for (const locale of ['en', 'fr', 'sw']) {
  test(`${locale}: confirmed bases, validation recovery and local exports reconcile`, async ({ page }, info) => {
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.postData() || '');
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const english = locale === 'en';
    await page.goto(english ? '/agriculture/farm-payroll/nigeria.html' : locale === 'fr'
      ? '/fr/agriculture/farm-payroll/nigeria' : '/sw/kilimo/mishahara-ya-shamba/nigeria/');
    const run = page.locator(english ? 'button[onclick="runCalculation()"]' : 'button[type="submit"]');
    for (const [id, value] of [['pension', 'standard'], ['health', 'basic'], ['housing', 'participating']]) {
      await page.locator('#ng_' + id).selectOption(value);
    }
    for (const [id, value] of [['pensionablePay', '60000'], ['healthBasicPay', '40000'], ['housingMonthlyIncome', '100000']]) {
      await page.locator('#ng_' + id).fill(value);
    }
    await page.locator(english ? '#inpMonthlySalary' : '#grossPay').fill('100000');
    await page.locator(english ? '#inpHousingValue' : '#inKindHousing').fill('20000');
    await page.locator(english ? '#inpFoodValue' : '#inKindFood').fill('10000');
    await run.click();
    await expect(page.locator('#ng_leaveBudget')).toBeFocused();
    await page.locator('#ng_leaveBudget').selectOption('include');
    for (const [id, value] of [['leavePayBase', '60000'], ['leaveDays', '6'], ['paidDaysPerMonth', '20']]) {
      await page.locator('#ng_' + id).fill(value);
    }
    await page.locator(english ? '#inpOvertimeHours' : '#overtimeHours').fill('10');
    await run.click();
    await expect(page.locator('#ng_overtimeHourlyPay')).toBeFocused();
    await page.locator('#ng_overtimeHourlyPay').fill('1500');
    await page.locator('#ng_wageCoverage').selectOption('applicable-confirmed');
    await page.locator('#ng_monthlyWage').fill('70000');
    await run.click();
    const net = page.locator(english ? '#resNetPay' : '#netPay');
    await expect.poll(async () => (await net.innerText()).replace(/\D/g, '')).toContain('10570000');
    const law = page.locator(english ? '#laborLawBox' : '#lawList');
    await expect(law).not.toContainText(/8 h|40 h|1 week|1 semaine/);
    if (!english) {
      const result = await page.evaluate(locale => window['__' + locale.toUpperCase() + '_AGRI_TEST__'].latest.result, locale);
      expect(result.overtimePay).toBe(15000);
      expect(result.leaveProvision).toBe(1500);
      expect(result.netCashPay).toBe(105700);
      expect(result.totalEmployerCost).toBe(156500);
      expect(result.employerContributions).toHaveLength(2);
      const attribute = locale === 'fr' ? 'data-action' : 'data-result-action';
      for (const format of ['json', 'csv', 'txt', 'pdf']) {
        const pending = page.waitForEvent('download');
        await page.locator(`[${attribute}="${format}"]`).click();
        const download = await pending;
        const file = info.outputPath('synthetic-payroll.' + format);
        await download.saveAs(file);
        const bytes = fs.readFileSync(file);
        if (format === 'pdf') {
          const parsed = await pdfParse(new Uint8Array(bytes));
          expect(parsed.numpages).toBeGreaterThan(0);
          expect(parsed.text.replace(/[\s,.]/g, '')).toContain('105700');
        } else {
          const text = bytes.toString('utf8');
          if (format === 'json') expect(() => JSON.parse(text)).not.toThrow();
          expect(text.replace(/[\s,.]/g, '')).toContain('105700');
        }
      }
    }
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    const before = await net.innerText();
    await page.locator('#ng_leaveBudget').selectOption('exclude');
    await expect(page.locator('#ng_leavePayBase')).toBeHidden();
    await run.click();
    await expect(net).toHaveText(before);
    expect(errors).toEqual([]);
    expect(writes.some(body => body.includes('pensionablePay') || body.includes('105700'))).toBe(false);
  });
}
