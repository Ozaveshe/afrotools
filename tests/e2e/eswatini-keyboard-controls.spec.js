const { test, expect } = require('@playwright/test');

for (const theme of ['light', 'dark']) {
  test(`Eswatini deductions and tax bands work with a keyboard in ${theme} mode`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: theme });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const origin = new URL(testInfo.project.use.baseURL).origin;
    await page.route('**/*', request => {
      if (request.request().url().startsWith('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/')) {
        return request.fulfill({ contentType: 'application/javascript', body: 'window.Chart = class { destroy() {} };' });
      }
      return new URL(request.request().url()).origin === origin && ['GET','HEAD'].includes(request.request().method())
        ? request.continue() : request.abort();
    });
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    }, theme);
    await page.goto('/eswatini/sz-paye');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const pension = page.getByRole('button', { name: /ENPF Pension/ });
    await page.locator('.preset-btn').last().focus();
    await page.keyboard.press('Tab');
    await expect(pension).toBeFocused();
    await expect(pension).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(pension).toHaveAttribute('aria-pressed', 'false');
    await expect(pension).not.toHaveClass(/\bon\b/);
    await page.keyboard.press('Space');
    await expect(pension).toHaveAttribute('aria-pressed', 'true');
    await expect(pension).toHaveClass(/\bon\b/);
    await page.locator('#grossSalary').fill('600000');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toContainText('426,971');
    const bands = page.getByRole('button', { name: 'ERS 2025/26 Annual Bands', exact: true });
    await bands.focus();
    await page.keyboard.press('Enter');
    await expect(bands).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#ers-annual-bands')).toHaveClass(/open/);
    await page.keyboard.press('Space');
    await expect(bands).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#ers-annual-bands')).not.toHaveClass(/open/);
    for (const button of [pension, bands]) {
      const size = await button.boundingBox();
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await bands.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('keyboard-controls.png') });
    expect(errors).toEqual([]);
  });
}
