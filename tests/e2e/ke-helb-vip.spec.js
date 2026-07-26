const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/ke-helb/';

test.describe('Kenya HELB repayment VIP', () => {
  test('uses statement and billing-schedule inputs without a salary formula', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    await page.locator('#statementBalance').fill('10000');
    await page.locator('#annualRate').fill('0');
    await page.locator('#monthlyPayment').fill('3000');
    await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
    await expect(page.locator('#resultGrid')).toContainText('4 monthly payments');
    await expect(page.locator('#scheduleBody tr').last()).toContainText('KSh 1,000');
    await expect(page.locator('body')).not.toContainText('minimum monthly payment floor');
    expect(errors).toEqual([]);
  });

  test('shows a failure path when payment cannot reduce the balance', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    await page.locator('#statementBalance').fill('240000');
    await page.locator('#annualRate').fill('12');
    await page.locator('#monthlyPayment').fill('1500');
    await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
    await expect(page.locator('#resultGrid')).toContainText('Not clearing');
    await expect(page.locator('#warningStack')).toContainText('contact HELB');
    await expect(page.locator('#scheduleBody')).toContainText('No reliable repayment schedule');
  });

  test('validates inputs accessibly instead of coercing bad values', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    await page.locator('#statementBalance').fill('');
    await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
    await expect(page.locator('#helbError')).toContainText('statement balance');
    await expect(page.locator('#statementBalance')).toBeFocused();
  });

  test('exports a useful worksheet and invokes print without network writes', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(`${request.url()} ${request.postData() || ''}`);
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    await page.locator('#statementBalance').fill('247139');
    await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Current statement balance: KSh');
    expect(text).toContain('not an official statement');
    expect(text).toContain('https://www.helb.co.ke/repay-loan/');
    await page.evaluate(() => {
      window.__helbPrintCalled = false;
      window.print = () => { window.__helbPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__helbPrintCalled)).toBe(true);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(20000);
    expect(writes.every(payload => !decodeURIComponent(payload).includes('247139'))).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`has no page overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
      await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
      const sizes = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth
      }));
      expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
    });
  }

  test('remains readable in dark mode at 375px and 200% text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('button', { name: 'Calculate repayment plan' }).click();
    const state = await page.evaluate(() => {
      const panel = document.querySelector('.panel');
      const text = document.querySelector('.panel h2');
      return {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        bg: getComputedStyle(panel).backgroundColor,
        fg: getComputedStyle(text).color
      };
    });
    expect(state.scroll).toBeLessThanOrEqual(state.client + 1);
    expect(state.bg).not.toBe(state.fg);
  });

  test('all app controls have accessible names', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_HELB_VIP === true);
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('main input, main button, main select, main textarea')
    ).filter(element => {
      const label = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !label && !element.getAttribute('aria-label') && !element.textContent.trim();
    }).map(element => element.outerHTML.slice(0, 100)));
    expect(unnamed).toEqual([]);
  });
});
