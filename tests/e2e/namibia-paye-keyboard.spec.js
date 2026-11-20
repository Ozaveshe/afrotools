const { test, expect } = require('@playwright/test');
const path = require('node:path');

test('Namibia PAYE supports keyboard calculation and recovery on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.endsWith('/chart.umd.min.js')) {
      return route.fulfill({ path: path.join(__dirname, '../fixtures/chart-4.4.1-test-fixture.js') });
    }
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
  await page.goto('/namibia/na-paye', { waitUntil: 'domcontentloaded' });
  const slider = page.getByRole('slider', { name: 'Annual gross salary (N$)', exact: true });
  const gross = page.getByRole('spinbutton', { name: 'Exact annual gross salary (N$)', exact: true });
  await slider.focus();
  await page.keyboard.press('Tab');
  await expect(gross).toBeFocused();
  await gross.press('Enter');
  const breakdown = page.getByRole('region', { name: 'Pay and deductions breakdown' });
  await expect(breakdown).toContainText('N$207,312');
  await expect(breakdown).toContainText('N$31,500');
  await expect(breakdown).toContainText('N$1,188');

  for (const invalid of ['', '0', '-1']) {
    await gross.fill(invalid);
    await gross.press('Enter');
    await expect(gross).toBeFocused();
    await expect(page.locator('#grossSalaryError')).toBeVisible();
    await expect(gross).toHaveAccessibleDescription('Enter an annual gross salary of at least N$0.01.');
    expect(await gross.evaluate(input => input.validity.valid)).toBe(false);
    await expect(breakdown).toBeHidden();
  }
  await gross.press('Tab');
  const preset = page.getByRole('button', { name: 'N$ 120k' });
  await expect(preset).toBeFocused();
  // The original hint was removed after three seconds. Recovery must still be explained.
  await page.waitForTimeout(3200);
  await expect(page.locator('#grossSalaryError')).toBeVisible();
  await expect(preset).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await gross.fill('120000');
  await gross.press('Enter');
  await expect(page.locator('#grossSalaryError')).toBeHidden();
  await expect(breakdown).toContainText('N$115,320');
  await expect(breakdown).toContainText('N$3,600');
  await expect(breakdown).toContainText('N$1,080');
  await expect(page.locator('#resAmount')).toHaveText('N$115,320');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
