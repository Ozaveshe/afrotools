const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/statistics-calc/';

test.describe('Statistics Calculator VIP', () => {
  test('calculates a known dataset and exposes the stated conventions', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    await page.locator('#dataInput').fill('1, 2, 2, 4');
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();

    await expect(page.locator('#statsStatus')).toContainText('4 values');
    await expect(page.locator('#statGrid')).toContainText('2.25');
    await expect(page.locator('#statGrid')).toContainText('Q1 (inclusive)');
    await expect(page.locator('#statGrid')).toContainText('Adjusted skewness');
    await expect(page.locator('#resultCard')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('rejects invalid and non-finite tokens rather than silently ignoring them', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    await page.locator('#dataInput').fill('1, missing, 1e999, 3');
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();

    await expect(page.locator('#statsStatus')).toContainText('missing');
    await expect(page.locator('#statsStatus')).toContainText('1e999');
    await expect(page.locator('#statsStatus')).toContainText('No values were silently ignored');
    await expect(page.locator('#resultCard')).toBeHidden();
  });

  test('shows undefined CV and skewness boundaries honestly', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    await page.locator('#dataInput').fill('-1, 1');
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();
    await expect(page.locator('#statGrid')).toContainText('Mean is zero');
    await expect(page.locator('#statGrid')).toContainText('Needs at least three values');

    await page.locator('#dataInput').fill('5, 5, 5, 5');
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();
    await expect(page.locator('#histogram .hist-count')).toHaveText('4');
    await expect(page.locator('#statGrid')).toContainText('zero spread');
  });

  test('exports a summary without the raw dataset and invokes print', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(request.url() + ' ' + (request.postData() || ''));
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    const privateFixture = '9472, 8143, 7231';
    await page.locator('#dataInput').fill(privateFixture);
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Count: 3');
    expect(text).toContain('exported summary omits the raw dataset');
    expect(text).not.toContain(privateFixture);

    await page.evaluate(() => {
      window.__statisticsPrintCalled = false;
      window.print = () => { window.__statisticsPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__statisticsPrintCalled)).toBe(true);
    expect(writes.every(payload => !decodeURIComponent(payload).includes(privateFixture))).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`reflows without app-level overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
      await page.locator('#dataInput').fill('1, 2, 3, 4, 5');
      await page.getByRole('button', { name: 'Calculate', exact: true }).click();
      const overflow = await page.evaluate(() => {
        const app = document.querySelector('.tool-main');
        return app.scrollWidth - app.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('#printStatsReport')).toBeVisible();
    });
  }

  test('remains usable in dark mode at 375px and 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.documentElement.style.fontSize = '200%';
    });
    await page.locator('#dataInput').fill('1, 2, 3, 4, 5');
    await page.evaluate(() => window.calculate());
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      text: getComputedStyle(document.querySelector('.card-title')).color,
      surface: getComputedStyle(document.querySelector('.card')).backgroundColor
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.text).not.toBe(metrics.surface);
  });

  test('gives visible app controls accessible names', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_STATISTICS_VIP === true);
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.tool-main input, .tool-main textarea, .tool-main button')
    ).filter(element => {
      if (element.type === 'hidden') return false;
      const labelledBy = element.getAttribute('aria-labelledby');
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !element.getAttribute('aria-label') && !labelledBy && !explicit && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});
