const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test.describe('Citation generator VIP', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/citation-generator/');
  });

  test('builds, copies, saves, restores and prints a citation locally', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.reload();
    const requests = [];
    page.on('request', request => {
      if (request.method() !== 'GET') requests.push({ url: request.url(), body: request.postData() || '' });
    });
    await page.getByLabel('Author names').fill('Okafor, Ada');
    await page.getByLabel('Publication year').fill('2024');
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Research across borders');
    await page.getByLabel('Edition (optional)').fill('2nd');
    await page.getByLabel('Publisher').fill('Coast Press');
    await expect(page.locator('#referenceOutput')).toHaveText('Okafor, A. (2024). Research across borders (2nd ed.). Coast Press.');
    await expect(page.locator('#inTextOutput')).toHaveText('(Okafor, 2024)');

    await page.evaluate(() => {
      window.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: text => { window.__copied.push(text); return Promise.resolve(); } }
      });
    });
    await page.getByRole('button', { name: 'Copy plain text' }).click();
    await expect(page.locator('#previewStatus')).toHaveText('Reference copied.');

    await page.getByRole('button', { name: 'Add to bibliography' }).click();
    await expect(page.locator('#bibliographyList li')).toHaveCount(1);
    await page.getByRole('button', { name: 'Save locally' }).click();
    await expect(page.locator('#bibliographyStatus')).toHaveText('Bibliography saved in this browser only.');

    await page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.locator('#bibliographyList li')).toContainText('No entries yet');
    await page.getByRole('button', { name: 'Restore saved' }).click();
    await expect(page.locator('#bibliographyList li')).toHaveCount(1);
    await expect(page.locator('#bibliographyList cite')).toHaveText('Research across borders');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^bibliography-\d{4}-\d{2}-\d{2}\.txt$/);
    const downloadPath = await download.path();
    expect(fs.readFileSync(downloadPath, 'utf8')).toContain('Okafor, A. (2024). Research across borders');

    await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    expect(await page.evaluate(() => window.__printed)).toBe(true);
    expect(requests.filter(request => request.url.includes('/.netlify/functions/'))).toEqual([]);
    expect(requests.some(request => /Okafor|Research across borders|Coast Press/.test(request.url + request.body))).toBe(false);
    expect(errors).toEqual([]);
  });

  test('explains Harvard and Chicago scope and has no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.getByLabel('Harvard').check();
    await expect(page.locator('#styleNote')).toContainText('vary by institution');
    await page.getByLabel('Chicago').check();
    await expect(page.locator('#styleNote')).toContainText('not a footnote');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await page.setViewportSize({ width: 360, height: 900 });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const darkOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(darkOverflow).toBe(false);
  });

  test('keeps controls named and readable in dark mode at 375px and 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.zoom = '2';
    });
    await expect(page.getByRole('heading', { name: 'Citation generator', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Author names')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to bibliography' })).toBeVisible();
    const unnamed = await page.locator('main button, main input, main select, main textarea').evaluateAll(nodes => nodes.filter(node => {
      if (node.disabled || node.hidden || node.type === 'hidden' || node.closest('[hidden]')) return false;
      const label = node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim();
      if (label) return false;
      if (node.id && document.querySelector(`label[for="${node.id}"]`)) return false;
      if (node.closest('label')) return false;
      return true;
    }).length);
    expect(unnamed).toBe(0);
  });
});
