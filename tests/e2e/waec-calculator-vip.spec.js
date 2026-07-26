const { test, expect } = require('@playwright/test');

test.describe('WAEC/NECO result planner VIP', () => {
  test('Nigeria planning index is transparent and exports a local action pack', async ({ page }) => {
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

    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Result Planner');
    await expect(page.locator('#examSystem')).toHaveValue('ng-waec-neco');
    await page.getByRole('button', { name: 'Load sample grades' }).click();

    await expect(page.locator('#resultAggregate')).toHaveText('10');
    await expect(page.locator('#resultCredits')).toHaveText('7');
    await expect(page.locator('#resultBestOf')).toHaveText('Best-five planning index');
    await expect(page.locator('#eligibilityList')).toContainText('not an official Nigerian admission aggregate');
    await page.getByRole('tab', { name: 'Official checks' }).click();
    await expect(page.getByRole('link', { name: /JAMB IBASS eligibility checker/i })).toHaveAttribute('href', 'https://eligibility.jamb.gov.ng/');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    expect((await download).suggestedFilename()).toMatch(/result-verification-pack\.txt$/);
    expect(writes.filter((request) => request.url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
    expect(writes.map((request) => request.body).join(' ')).not.toMatch(/English Language|Mathematics|Civic Education/);
    expect(errors).toEqual([]);
  });

  test('Ghana aggregate uses the selected programme core and three electives', async ({ page }) => {
    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
    await page.selectOption('#examSystem', 'gh-wassce');

    const rows = page.locator('.wc-subject-row');
    await rows.nth(0).locator('select').selectOption('B3');
    await rows.nth(1).locator('select').selectOption('B2');
    await rows.nth(2).locator('select').selectOption('C4');
    await rows.nth(3).locator('select').selectOption('A1');
    await rows.nth(4).locator('input').fill('Physics');
    await rows.nth(4).locator('select').selectOption('B3');
    await rows.nth(5).locator('input').fill('Chemistry');
    await rows.nth(5).locator('select').selectOption('C5');
    await rows.nth(6).locator('input').fill('Biology');
    await rows.nth(6).locator('select').selectOption('A1');

    await expect(page.locator('#resultAggregate')).toHaveText('18');
    await expect(page.locator('#selectedSubjects')).toContainText('Integrated Science');
    await expect(page.locator('#selectedSubjects')).not.toContainText('Social Studies (A1)');

    await page.selectOption('#trackSelect', 'non-science');
    await expect(page.locator('#resultAggregate')).toHaveText('15');
    await expect(page.locator('#selectedSubjects')).toContainText('Social Studies');
    await expect(page.locator('#selectedSubjects')).not.toContainText('Integrated Science (C4)');
  });

  test('mobile dark mode stays usable without overflow and print action works', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem('aft_theme', 'dark');
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.goto('/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.getByRole('button', { name: /PDF/ }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    expect(errors).toEqual([]);
  });
});
