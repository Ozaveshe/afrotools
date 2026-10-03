const { test, expect } = require('@playwright/test');

const pages = [
  { name: 'Eswatini', route: '/eswatini/sz-paye', field: '#grossSalary', amount: '#resAmount', first: '600000', second: '800000' },
  { name: 'Swahili Eswatini', route: '/sw/eswatini/kikokotoo-kodi-mshahara/', field: '#grossSalary', amount: '#resKiasi', first: '600000', second: '800000' },
  { name: 'Ghana', route: '/ghana/gh-paye', field: '#salaryInput', amount: '#resAmount', first: '60000', second: '70000' },
  { name: 'Uganda', route: '/uganda/ug-paye', field: '#grossSalary', amount: '#resAmount', first: '1500000', second: '2000000' },
  { name: 'Kenya', route: '/kenya/ke-paye', field: '#salaryInput', amount: '#resAmount', first: '100000', second: '120000' }
];

async function enterSalary(field, value) {
  // Let the page's native focus formatter finish before replacing the text.
  await field.click();
  await expect(field).toBeFocused();
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

for (const pageInfo of pages) {
  for (const variant of [{ width: 320, theme: 'dark' }, { width: 390, theme: 'light' }]) {
    test(`${pageInfo.name} recovers current salary results after invalid input at ${variant.width}px ${variant.theme}`, async ({ page, context, baseURL }, testInfo) => {
      const origin = new URL(baseURL).origin;
      const errors = [], writes = [], observations = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (!['GET', 'HEAD'].includes(request.method())) writes.push(new URL(request.url()).pathname);
      });
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === origin && ['GET', 'HEAD'].includes(request.method()) && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/.netlify/')) return route.continue();
        if (request.resourceType() === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        if (request.resourceType() === 'script') return route.fulfill({ status: 200, contentType: 'application/javascript', body: url.hostname === 'cdnjs.cloudflare.com' ? 'window.Chart = class { destroy() {} };' : '' });
        return route.abort();
      });
      await page.setViewportSize({ width: variant.width, height: 844 });
      await page.emulateMedia({ colorScheme: variant.theme, reducedMotion: 'reduce' });
      await page.addInitScript(theme => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, variant.theme);
      await page.goto(pageInfo.route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      const field = page.locator(pageInfo.field), card = page.locator('#resultsCard');
      const amount = page.locator(pageInfo.amount), calculate = page.locator('.calc-btn');
      await enterSalary(field, pageInfo.first);
      await calculate.click();
      await expect(card).toBeVisible();
      const originalAmount = await amount.innerText();

      for (const [invalid, valid] of [['', pageInfo.second], ['0', pageInfo.first]]) {
        await enterSalary(field, invalid);
        await calculate.click();
        await expect(card).toBeHidden();
        await expect(card.locator('.action-row button:visible')).toHaveCount(0);
        await enterSalary(field, valid);
        await calculate.click();
        await expect(card).toBeVisible();
        await expect(card).not.toHaveAttribute('aria-hidden', 'true');
        await expect(amount).not.toContainText(/NaN|undefined|Infinity/);
        if (valid === pageInfo.second) await expect(amount).not.toHaveText(originalAmount);
        else await expect(amount).toHaveText(originalAmount);
        observations.push(await card.evaluate(node => ({ display: node.style.display, ariaHidden: node.getAttribute('aria-hidden'), height: node.getBoundingClientRect().height })));
        expect(observations.at(-1).height).toBeGreaterThan(0);
        for (const button of await card.locator('.action-row button').all()) await expect(button).toBeVisible();
      }
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
      await testInfo.attach('recovery-checkpoints', { body: JSON.stringify({ page: pageInfo.name, ...variant, observations, errors, writes }, null, 2), contentType: 'application/json' });
    });
  }
}
