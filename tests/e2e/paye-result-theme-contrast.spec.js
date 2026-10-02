const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/zimbabwe/zw-paye', input: '#grossSalary', amount: '24000' },
  { path: '/zambia/zm-paye', input: '#grossSalary', amount: '15000' },
  { path: '/eswatini/sz-paye', input: '#grossSalary', amount: '20000' }
];

for (const route of routes) {
  for (const systemTheme of ['light', 'dark']) {
    for (const width of [320, 1280]) {
      test(`${route.path} result rows follow selected theme at ${width}px with ${systemTheme} device theme`, async ({ page }, testInfo) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ colorScheme: systemTheme });
        const origin = new URL(testInfo.project.use.baseURL).origin;
        await page.route('**/*', request => {
          if (request.request().url().startsWith('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/')) {
            return request.fulfill({ contentType: 'application/javascript', body: 'window.Chart = class { destroy() {} };' });
          }
          return new URL(request.request().url()).origin === origin && ['GET', 'HEAD'].includes(request.request().method())
            ? request.continue() : request.abort();
        });
        await page.addInitScript(() => {
          localStorage.setItem('aft_theme', 'dark');
          localStorage.setItem('afrotools_cookie_consent', 'declined');
        });
        await page.goto(route.path);
        await page.locator(route.input).fill(route.amount);
        await page.locator('.calc-btn').click();
        await expect(page.locator('#resultsCard')).toBeVisible();
        const amount = await page.locator('#resAmount').innerText();
        const rows = await page.locator('#resultsCard .res-row').allTextContents();
        for (const theme of ['dark', 'light', 'dark']) {
          if (await page.locator('html').getAttribute('data-theme') !== theme) {
            if (width === 320) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
            await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).click();
            if (width === 320) {
              await page.keyboard.press('Escape');
              await expect(page.getByRole('dialog', { name: 'Navigation menu', exact: true })).not.toBeVisible();
            }
          }
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await expect(page.locator('#resAmount')).toHaveText(amount);
          expect(await page.locator('#resultsCard .res-row').allTextContents()).toEqual(rows);
          const samples = await page.locator('#resultsCard .res-row-lbl, #resultsCard .res-row-val').evaluateAll(elements => {
            const luminance = color => {
              const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
                const normalized = value / 255;
                return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
              });
              return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
            };
            return elements.map(element => {
              let ancestor = element;
              let background;
              do {
                background = getComputedStyle(ancestor).backgroundColor;
                ancestor = ancestor.parentElement;
              } while (ancestor && (background === 'transparent' || background === 'rgba(0, 0, 0, 0)'));
              const foreground = getComputedStyle(element).color;
              const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
              return { text: element.textContent.trim(), foreground, background, ratio: (values[0] + 0.05) / (values[1] + 0.05) };
            });
          });
          await testInfo.attach(`${theme}-rows`, { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
          expect(samples.length).toBeGreaterThan(5);
          for (const sample of samples) {
            expect(sample.ratio, `${theme}: ${JSON.stringify(sample)}`).toBeGreaterThanOrEqual(4.5);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        }
        expect(errors).toEqual([]);
      });
    }
  }
}
