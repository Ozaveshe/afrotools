const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'tools/work-permit-cost/index.html'), 'utf8');
const countries = JSON.parse(html.match(/var sources=(\[[^\n]+\]);\n    var form/)[1]);

for (const [index, country] of countries.entries()) {
  const group = index < 27 ? 'group-a' : 'group-b';
  test(`${group} ${country[1]} work-permit option totals user inputs and exposes source state`, async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', request => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: country[0].charCodeAt(0) % 2 ? 320 : 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/work-permit-cost/', { waitUntil: 'domcontentloaded' });
    await page.locator('#permit-country').selectOption(country[0]);
    await page.locator('#main-applicants').fill('2');
    await page.locator('#official-main').fill('100');
    await page.locator('#documents').fill('50');
    await page.locator('#contingency').fill('10');
    await page.getByRole('button', { name: 'Calculate permit-cost scenario' }).click();
    await expect(page.locator('#permit-total')).toContainText('275');
    if (country[4]) {
      await expect(page.locator('#permit-official')).toBeVisible();
      await expect(page.locator('#permit-official')).toHaveAttribute('href', country[4]);
      await expect(page.locator('#permit-source-note')).toContainText('does not provide a live fee');
    } else {
      await expect(page.locator('#permit-official')).toBeHidden();
      await expect(page.locator('#permit-source-note')).toContainText('Source gap');
    }
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#permit-result')).not.toHaveClass(/gv-on/);
    await expect(page.locator('#permit-country')).toBeFocused();
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth
    }));
    expect(widths.document).toBe(widths.viewport);
    expect(writes.every(body => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });
}
