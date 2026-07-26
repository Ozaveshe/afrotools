const { expect, test } = require('@playwright/test');

test.describe('JAMB screening calculation worksheet VIP', () => {
  test('uses user-entered published weights and exports an honest local worksheet', async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.method() !== 'GET') {
        writes.push({ url: request.url(), body: request.postData() || '' });
      }
    });

    await page.addInitScript(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.goto('/tools/jamb-aggregate/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Screening');
    await page.getByRole('button', { name: 'Load sample scores' }).click();
    await page.getByRole('button', { name: 'Calculate planning aggregate' }).click();

    await expect(page.locator('#aggregateScore')).toHaveText('69.00');
    await expect(page.locator('#formulaUsed')).toContainText('UTME 50% + Post-UTME 50%');
    await expect(page.locator('#jambActionChecks')).toContainText('not an admission prediction');
    await expect(page.getByRole('link', { name: /JAMB IBASS eligibility checker/i }))
      .toHaveAttribute('href', 'https://eligibility.jamb.gov.ng/');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    expect((await download).suggestedFilename()).toBe('jamb-screening-calculation-worksheet.txt');
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    expect(await page.locator('body').innerText()).not.toMatch(/UNILAG|University of Ibadan|likely qualifies/i);
    expect(writes.filter((request) => request.url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
    expect(writes.map((request) => request.body).join(' ')).not.toMatch(/Example University|Example Programme|280|publishedBenchmark/);
    expect(writes.map((request) => request.url).join(' ')).not.toMatch(/Example(?:%20|\+)University|Example(?:%20|\+)Programme/);
    expect(errors).toEqual([]);
  });

  test('rejects invalid weights instead of manufacturing an aggregate', async ({ page }) => {
    await page.goto('/tools/jamb-aggregate/', { waitUntil: 'domcontentloaded' });
    await page.locator('#utme').fill('280');
    await page.locator('#postUtme').fill('68');
    await page.locator('#utmeWeight').fill('60');
    await page.locator('#postUtmeWeight').fill('50');
    await page.getByRole('button', { name: 'Calculate planning aggregate' }).click();

    await expect(page.locator('#jambFormStatus')).toContainText('must add up to 100%');
    await expect(page.locator('#resultCard')).toBeHidden();
  });

  test('mobile dark mode stays readable and overflow-free', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
    await page.goto('/tools/jamb-aggregate/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await expect(page.getByRole('link', { name: /JAMB official website/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
