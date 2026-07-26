const { expect, test } = require('@playwright/test');

test.describe('NSC study admission and Matric points VIP', () => {
  test('separates the DBE route from the non-universal planning index and exports locally', async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.method() !== 'GET') writes.push({ url: request.url(), body: request.postData() || '' });
    });
    await page.addInitScript(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });

    await page.goto('/tools/matric-points/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('NSC Study Admission');
    await page.getByRole('button', { name: 'Check NSC route and points' }).click();

    await expect(page.locator('#apsScore')).toHaveText('29');
    await expect(page.locator('#passType')).toHaveText("Bachelor's minimum");
    await expect(page.locator('#matricActionGrid')).toContainText('Planning index');
    await expect(page.locator('#uniCheck')).toContainText('different best-seven contract');
    await expect(page.getByRole('link', { name: /DBE NSC requirements/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Wits scoring rules/i })).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    expect((await download).suggestedFilename()).toBe('nsc-study-admission-worksheet.txt');
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    expect(await page.locator('body').innerText()).not.toMatch(/Likely|UCT — Medicine|Wits — Medicine/);
    expect(writes.filter((request) => request.url.startsWith('http://127.0.0.1:4173/'))).toEqual([]);
    expect(writes.map((request) => request.body).join(' ')).not.toMatch(/Afrikaans Home Language|Physical Sciences/);
    expect(errors).toEqual([]);
  });

  test('blocks duplicate subjects instead of returning a misleading result', async ({ page }) => {
    await page.goto('/tools/matric-points/', { waitUntil: 'domcontentloaded' });
    await page.locator('#sub-1').selectOption('English First Additional Language');
    await page.getByRole('button', { name: 'Check NSC route and points' }).click();
    await expect(page.locator('#matricFormStatus')).toContainText('only once');
    await expect(page.locator('#resultCard')).toBeHidden();
  });

  test('320px mobile dark mode has named percentage controls and no overflow', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
    await page.goto('/tools/matric-points/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#pct-0')).toHaveAttribute('aria-label', /Final percentage/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
});
