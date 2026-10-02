const { test, expect } = require('@playwright/test');

const numeric = text => Number(text.replace(/[^\d.]/g, ''));
for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1280]) {
    test(`Zimbabwe annual/monthly and reverse workflow at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      const origin = new URL(testInfo.project.use.baseURL).origin;
      await page.route('**/*', request => {
        if (request.request().url().startsWith('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/')) {
          return request.fulfill({ contentType: 'application/javascript', body: 'window.Chart = class { destroy() {} };' });
        }
        return new URL(request.request().url()).origin === origin && ['GET', 'HEAD'].includes(request.request().method())
          ? request.continue() : request.abort();
      });
      await page.addInitScript(theme => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, theme);
      await page.goto('/zimbabwe/zw-paye');
      const input = page.locator('#grossSalary');
      const calculate = page.locator('.calc-btn');
      const heading = page.locator('.res-hero-label');
      const amount = page.locator('#resAmount');
      const context = page.locator('#resGross');
      const monthly = page.getByRole('button', { name: 'Monthly', exact: true });
      const annual = page.getByRole('button', { name: 'Annual', exact: true });
      await expect(page.getByRole('button', { name: 'Net → Gross', exact: true })).toHaveCount(1);
      await input.fill('24000');
      await calculate.click();
      await expect(page.locator('#resultsCard')).toBeVisible();
      await expect(heading).toHaveText('Annual Take-Home Pay');
      await expect(amount).toHaveText('$17,373');
      await expect(context).toContainText('/year');
      await monthly.press('Enter');
      await expect(heading).toHaveText('Monthly Take-Home Pay');
      expect(numeric(await amount.innerText())).toBe(1448);
      await calculate.click();
      await expect(heading).toHaveText('Monthly Take-Home Pay');
      expect(numeric(await amount.innerText())).toBe(1448);
      await annual.press('Space');
      await expect(heading).toHaveText('Annual Take-Home Pay');

      const netMode = page.getByRole('button', { name: 'Net → Gross', exact: true });
      await netMode.press('Enter');
      await expect(netMode).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#resultsCard')).not.toBeVisible();
      await expect(input).toHaveAttribute('aria-label', 'Desired annual take-home in US dollars');
      await input.fill('24000');
      await calculate.press('Enter');
      await expect(heading).toHaveText('Required Annual Gross Salary');
      const first = numeric(await amount.innerText());
      expect(first).toBe(34332);
      await expect(context).toContainText('Take-home: $24,000/year');
      await expect(input).toHaveValue('24000');
      expect(await page.evaluate(gross => window._grossToNet(gross) >= 24000 && window._grossToNet(gross - 1) < 24000, first)).toBe(true);
      await calculate.click();
      expect(numeric(await amount.innerText())).toBe(first);
      await monthly.click();
      await expect(heading).toHaveText('Required Monthly Gross Salary');
      expect(numeric(await amount.innerText())).toBe(2861);
      await expect(context).toContainText('Take-home: $2,000/month');
      await calculate.click();
      expect(numeric(await amount.innerText())).toBe(2861);
      await expect(input).toHaveValue('24000');

      await input.fill('0');
      await calculate.click();
      await expect(page.locator('#resultsCard')).not.toBeVisible();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toBeFocused();
      await expect(page.locator('#zimbabwe-paye-status')).toContainText('positive annual amount');
      await input.fill('24000');
      await calculate.click();
      await expect(input).toHaveAttribute('aria-invalid', 'false');
      await expect(page.locator('#resultsCard')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test('Zimbabwe reverse annual targets at tax bands and the NSSA ceiling', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const origin = new URL(testInfo.project.use.baseURL).origin;
  await page.route('**/*', request => {
    if (request.request().url().startsWith('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/')) {
      return request.fulfill({ contentType: 'application/javascript', body: 'window.Chart = class { destroy() {} };' });
    }
    return new URL(request.request().url()).origin === origin && ['GET', 'HEAD'].includes(request.request().method())
      ? request.continue() : request.abort();
  });
  await page.goto('/zimbabwe/zw-paye');
  await expect(page.getByRole('button', { name: 'Net → Gross', exact: true })).toHaveCount(1);
  await page.evaluate(() => window.setCalcMode('net'));
  const input = page.locator('#grossSalary');
  const amount = page.locator('#resAmount');
  const pension = page.locator('button.tog');
  for (const enabled of [true, false]) {
    if (!enabled) await pension.click();
    await expect(pension).toHaveAttribute('aria-pressed', String(enabled));
    for (const target of [1, 1200, 3600, 8400, 12000, 24000, 36000, 100000]) {
      await input.fill(String(target));
      await page.locator('.calc-btn').click();
      await expect(page.locator('#resultsCard')).toBeVisible();
      await expect(page.locator('.res-hero-label')).toHaveText('Required Annual Gross Salary');
      await expect(page.locator('#zimbabwe-paye-status')).toContainText('Required annual gross salary');
      // Wait for this request, then compare against the unchanged forward engine.
      await expect.poll(async () => {
        const gross = numeric(await amount.innerText());
        return page.evaluate(({gross,target}) => window._grossToNet(gross) >= target
          && window._grossToNet(gross - 1) < target, {gross,target});
      }).toBe(true);
      await expect(input).toHaveValue(String(target));
    }
  }
});
