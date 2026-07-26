const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test.describe('Periodic table VIP', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/periodic-table/');
  });

  test('searches, filters and exports authoritative element notes locally', async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => {
      if (request.method() !== 'GET') nonGet.push({ url: request.url(), body: request.postData() || '' });
    });
    await page.reload();
    await expect(page.locator('.periodic-element')).toHaveCount(118);
    await page.getByLabel('Search by name, symbol or atomic number').fill('26');
    await expect(page.locator('#tableStatus')).toHaveText('1 element shown.');
    await page.getByRole('button', { name: /Iron, symbol Fe/ }).click();
    await expect(page.locator('#detailName')).toHaveText('Iron');
    await expect(page.locator('#detailGrid')).toContainText('55.845');

    await page.evaluate(() => {
      window.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: text => { window.__copied.push(text); return Promise.resolve(); } }
      });
    });
    await page.getByRole('button', { name: 'Copy element notes' }).click();
    await expect(page.locator('#detailStatus')).toHaveText('Element notes copied.');
    expect(await page.evaluate(() => window.__copied[0])).toContain('CIAAW Abridged Standard Atomic Weights 2024');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    expect(fs.readFileSync(await download.path(), 'utf8')).toContain('Iron (Fe)');

    await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    expect(await page.evaluate(() => window.__printed)).toBe(true);
    expect(nonGet.filter(request => request.url.includes('/.netlify/functions/'))).toEqual([]);
    expect(nonGet.some(request => /Iron|55\.845/.test(request.url + request.body))).toBe(false);
    expect(errors).toEqual([]);
  });

  test('supports keyboard quiz behavior and reports sources and limitations', async ({ page }) => {
    await page.getByRole('button', { name: 'Quiz mode' }).click();
    await expect(page.getByRole('dialog', { name: 'Element quiz' })).toBeVisible();
    await expect(page.locator('#quizClose')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Element quiz' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Quiz mode' })).toBeFocused();
    await expect(page.getByRole('link', { name: /CIAAW 2024/ })).toHaveAttribute('href', /abridged-atomic-weights/);
    await expect(page.locator('main')).not.toContainText(/WAEC|KCSE|Matric|mining|conflict mineral/i);
  });

  test('has no page overflow at 320/360 and remains usable in dark mode at 375px 200%', async ({ page }) => {
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.zoom = '2';
    });
    await expect(page.getByLabel('Search by name, symbol or atomic number')).toBeVisible();
    await expect(page.getByRole('button', { name: /Hydrogen, symbol H/ })).toBeVisible();
    const unnamed = await page.locator('main button, main input, main select').evaluateAll(nodes => nodes.filter(node => {
      if (node.disabled || node.type === 'hidden' || node.closest('[hidden]')) return false;
      if (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim()) return false;
      if (node.id && document.querySelector(`label[for="${node.id}"]`)) return false;
      if (node.closest('label')) return false;
      return true;
    }).length);
    expect(unnamed).toBe(0);
  });
});
