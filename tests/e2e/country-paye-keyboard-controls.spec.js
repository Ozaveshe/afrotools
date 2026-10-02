const { test, expect } = require('@playwright/test');

const calculators = [
  { route: '/zimbabwe/zw-paye', deduction: 'NSSA', disclosureIds: ['zimra-annual-bands', 'nssa-rates'] },
  { route: '/zambia/zm-paye', deduction: 'NAPSA', disclosureIds: ['zra-annual-bands', 'napsa-rates'] }
];

for (const calculator of calculators) {
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 390, 1280]) {
      test(`${calculator.route} keyboard controls at ${width}px in ${theme} mode`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ colorScheme: theme });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
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
        await page.goto(calculator.route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const deduction = page.getByRole('button', { name: new RegExp(calculator.deduction) }).filter({ has: page.locator('.tog-label') });
        await page.locator('.preset-btn').last().focus();
        await page.keyboard.press('Tab');
        await expect(deduction).toBeFocused();
        await expect(deduction).toHaveAttribute('aria-pressed', 'true');
        const focusStyle = await deduction.evaluate(el => getComputedStyle(el).outlineStyle);
        expect(focusStyle).not.toBe('none');
        await page.locator('.calc-btn').click();
        const withDeduction = await page.locator('#resAmount').innerText();
        await deduction.focus();
        await page.keyboard.press('Enter');
        await expect(deduction).toHaveAttribute('aria-pressed', 'false');
        await expect(deduction).not.toHaveClass(/\bon\b/);
        await page.locator('.calc-btn').click();
        const withoutDeduction = await page.locator('#resAmount').innerText();
        const numeric = value => Number(value.replace(/[^\d.]/g, ''));
        expect(numeric(withoutDeduction)).toBeGreaterThan(numeric(withDeduction));
        await deduction.focus();
        await page.keyboard.press('Space');
        await expect(deduction).toHaveAttribute('aria-pressed', 'true');
        await expect(deduction).toHaveClass(/\bon\b/);
        await page.locator('.calc-btn').click();
        await expect(page.locator('#resAmount')).toHaveText(withDeduction);

        for (const id of calculator.disclosureIds) {
          const disclosure = page.locator(`button[aria-controls="${id}"]`);
          const panel = page.locator(`#${id}`);
          await expect(panel).not.toBeVisible();
          await disclosure.focus();
          await page.keyboard.press('Enter');
          await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
          await expect(panel).toBeVisible();
          await page.keyboard.press('Space');
          await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
          await expect(panel).not.toBeVisible();
          expect((await disclosure.boundingBox()).height).toBeGreaterThanOrEqual(44);
        }
        expect((await deduction.boundingBox()).height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  }
}
