const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const directory = path.resolve(__dirname, '..', '..', 'tools', 'visa-checker');
const slugs = fs.readdirSync(directory)
  .filter(file => file !== 'index.html' && file.endsWith('.html'))
  .map(file => file.slice(0, -5))
  .sort();

async function expectNoOverflow(page) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }));
  expect(widths.document).toBe(widths.viewport);
}

for (const slug of slugs) {
  test(`/tools/visa-checker/${slug} prepares a no-verdict route brief`, async ({ page }) => {
    const writes = [];
    const errors = [];
    page.on('request', request => {
      if (request.method() !== 'GET') writes.push(request.postData() || '');
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: slug.length % 2 ? 320 : 375, height: 840 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(`/tools/visa-checker/${slug}`, { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-visa-family]');
    const destination = await root.getAttribute('data-destination-code');
    const select = page.locator('[name=origin]');
    await page.getByRole('button', { name: 'Prepare verification brief' }).click();
    await expect(page.locator('[data-result]')).toContainText('Choose a passport country');
    await expect(select).toBeFocused();
    await select.selectOption(destination === 'NG' ? 'KE' : 'NG');
    await page.getByRole('button', { name: 'Prepare verification brief' }).click();
    await expect(page.locator('[data-result]')).toContainText('no live verdict');
    await expect(page.locator('[data-result]')).toBeFocused();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('[data-result]')).toHaveText('');
    await expect(select).toBeFocused();
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await expectNoOverflow(page);
    expect(writes.every(body => body === '')).toBe(true);
    expect(errors).toEqual([]);
  });
}
