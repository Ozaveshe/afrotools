const { test, expect } = require('@playwright/test');

const pages = [
  { locale: 'en', route: '/tools/backup-power-costs/', button: 'Compare backup costs' },
  { locale: 'fr', route: '/fr/tools/couts-secours-energie/', button: 'Comparer les coûts' },
  { locale: 'sw', route: '/sw/zana/gharama-ya-nishati-ya-dharura/', button: 'Linganisha gharama' }
];

for (const item of pages) {
  test(`${item.locale} calculates the same formula, exports locally and clears a failed result`, async ({ page }) => {
    const requests = [];
    const consoleErrors = [];
    page.on('request', request => requests.push({ url: request.url(), method: request.method(), data: request.postData() || '' }));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale);
    await expect(page.locator('#bpGenerator')).toContainText(/114[,.\s]000/);
    await expect(page.locator('#bpBattery')).toContainText(/54[,.\s]470/);
    await expect(page.locator('#bpSolar')).toContainText(/35[,.\s]000/);
    await page.fill('#bpCurrency', 'PRV');
    await page.fill('#bpFuelPrice', '-1');
    await page.getByRole('button', { name: item.button }).click();
    await expect(page.locator('#bpResults')).not.toHaveClass(/on/);
    await page.fill('#bpFuelPrice', '1200');
    await page.getByRole('button', { name: item.button }).click();
    await expect(page.locator('#bpResults')).toHaveClass(/on/);
    expect(JSON.stringify(requests)).not.toContain('PRV');
    expect(requests.filter(request => request.method !== 'GET' && request.method !== 'HEAD')).toEqual([]);
    await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
    await page.locator('#bpPrint').click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#bpDownload').click();
    expect((await downloadEvent).suggestedFilename()).toBe('backup-power-cost-comparison.txt');
    expect(consoleErrors).toEqual([]);
  });
}

for (const width of [320, 375, 768]) {
  test(`English route fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/backup-power-costs/');
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
    await expect(page.getByRole('button', { name: 'Compare backup costs' })).toBeVisible();
  });
}

test('manual dark mode and system dark mode both preserve a usable 200 percent layout', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 750, height: 900 });
  await page.goto('/tools/backup-power-costs/');
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.body.style.zoom = '2'; });
  const manual = await page.locator('.bp-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
  expect(manual).toBe('rgb(22, 34, 26)');
  const manualSize = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(manualSize.scroll).toBeLessThanOrEqual(manualSize.client + 1);
  await expect(page.getByRole('button', { name: 'Compare backup costs' })).toBeVisible();
  await page.screenshot({ path: 'test-results/backup-power-costs-mobile-dark-200.png', fullPage: true });

  await page.evaluate(() => { document.documentElement.removeAttribute('data-theme'); document.body.style.zoom = '1'; });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const system = await page.locator('.bp-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
  expect(system).toBe('rgb(22, 34, 26)');
});

test('desktop visual receipt and accessible landmarks are present', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/tools/backup-power-costs/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('#bpPlanner label')).toHaveCount(15);
  await expect(page.locator('[role="status"]')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/backup-power-costs-desktop.png', fullPage: true });
});
