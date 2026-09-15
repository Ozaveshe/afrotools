const { test, expect } = require('@playwright/test');
const path = require('node:path');
const pdfParse = require('pdf-parse');

test('Tanzania Swahili preserves annual totals, pension labels, local PDF and net-to-gross at 390px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const errors = [], mutations = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('/sw/tanzania/kikokotoo-kodi-mshahara/');
  const salary = page.locator('#grossSalary');
  await expect(page.getByRole('button', { name: 'Halisi → Ghafi', exact: true })).toBeVisible();
  for (const [sector, pension, tax, net] of [['Private', 'NSSF', 233000, 1117000], ['Public', 'PSSSF', 255500, 1169500]]) {
    await page.locator(`#btn${sector}`).click();
    await salary.fill('1500000');
    await page.locator('.calc-btn').click();
    const result = await page.evaluate(() => window.RESULT);
    expect(result.sector).toBe(sector.toLowerCase());
    expect(result.monthlyPAYE).toBe(tax);
    expect(result.netMonthly).toBe(net);
    expect(result.annualGross).toBe(18000000);
    expect(result.annualTax).toBe(tax * 12);
    await expect(page.locator('#resContent')).toContainText(pension);
    await expect(page.locator('#employerStrip')).toContainText(pension);
    await page.getByRole('button', { name: 'Kwa Mwaka', exact: true }).click();
    await expect(page.locator('#resContent')).not.toContainText('NaN');
    await expect(page.locator('#resContent')).toContainText('18,000,000');
    const pending = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Pakua PDF/ }).click();
    const report = await pending;
    await report.waitForLoadState('domcontentloaded');
    const parsed = await pdfParse(await report.pdf());
    expect(parsed.text).toContain(pension);
    expect(parsed.text).toContain(`${pension} mchango wa mfanyakazi (${sector === 'Private' ? 10 : 5}%,`);
    expect(parsed.text).toContain(`Mwajiri ${pension} (${sector === 'Private' ? 10 : 15}%)`);
    expect(parsed.text).not.toMatch(/NaN|undefined/);
    await report.close();
    await page.getByRole('button', { name: 'Kwa Mwezi', exact: true }).click();
  }
  await page.locator('#btnPrivate').click();
  await page.getByRole('button', { name: 'Halisi → Ghafi', exact: true }).click();
  await expect(salary).toHaveAttribute('aria-label', 'Mshahara Halisi wa Mwezi Unaolengwa');
  await salary.fill('1117000');
  await page.locator('.calc-btn').click();
  const first = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netMonthly }));
  expect(Math.abs(first.gross - 1500000)).toBeLessThanOrEqual(2);
  expect(Math.abs(first.net - 1117000)).toBeLessThanOrEqual(1);
  await page.locator('.calc-btn').click();
  expect(await page.evaluate(() => RESULT.gross)).toBe(first.gross);
  await expect(salary).toHaveValue('1117000');
  await expect(page.locator('.res-hero-label')).toContainText('Ghafi');
  await expect(page.locator('.f-label-text').first()).toHaveText('Sekta');
  await page.getByRole('button', { name: 'Kwa Mwaka', exact: true }).click();
  await expect(page.locator('.res-hero-label')).toContainText('Mwaka');
  await expect(page.locator('#resContent')).not.toContainText('NaN');
  await page.getByRole('button', { name: 'Ghafi → Halisi', exact: true }).click();
  await expect(salary).toHaveAttribute('aria-label', 'Mshahara Ghafi');
  await expect(page.locator('.slider-label')).toHaveText('Mshahara Ghafi wa Mwezi');
  const toggle = page.getByRole('button', { name: 'Halisi → Ghafi', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.res-hero-label')).toContainText('Mwaka');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(Number((await page.locator('#resAmount').innerText()).replace(/[^0-9]/g, ''))).toBe(await page.evaluate(() => Math.round(RESULT.annualGross)));
  await expect(page.locator('.res-hero-period')).toContainText('Kabla ya PAYE');
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#aiBtn').click();
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
  await page.locator('#resultsCard').screenshot({ path: testInfo.outputPath('tanzania-annual-390.png') });
});

for (const [locale, mode, resultLabel] of [['en', 'Net → Gross', 'Required Monthly Gross'], ['fr', 'Net → Brut', 'Brut mensuel requis']]) {
  for (const file of ['assets/js/lib/src/net-to-gross.js', 'assets/js/lib/net-to-gross.js']) {
    test(`${locale}: existing shared reverse workflow remains correct (${file})`, async ({ page }) => {
      await page.setContent(`<html lang="${locale}"><body><span class="slider-label">Salary</span><span class="f-label-text">Amount</span><input id="grossSalary" value="800"><input id="salarySlider"><span id="sliderVal"></span><button class="calc-btn" onclick="calculate()">Calculate</button><div class="res-hero-label"></div><div id="resAmount"></div><div id="resGross"></div></body></html>`);
      await page.evaluate(() => {
        window.PERIOD = 'monthly';
        window._grossToNet = gross => gross * 0.8;
        window.fmt = value => String(Math.round(value));
        window.calculate = () => { const gross = Number(document.getElementById('grossSalary').value); window.RESULT = { gross, monthly: gross, netMonthly: gross * 0.8, annualGross: gross * 12, annualNet: gross * 9.6 }; };
        window.setPeriod = value => { window.PERIOD = value; };
      });
      await page.addScriptTag({ path: path.resolve(__dirname, '../..', file) });
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.locator('.calc-btn').click();
      expect(Math.abs((await page.evaluate(() => RESULT.netMonthly)) - 800)).toBeLessThanOrEqual(1);
      await expect(page.locator('.res-hero-label')).toHaveText(resultLabel);
    });
  }
}
