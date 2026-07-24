const { test, expect } = require('@playwright/test');

const routes = [
  ['/mauritania/mr-vat', 'Mauritania VAT calculator', 'Sources & verification', 'Report a calculation error'],
  ['/fr/mauritanie/calculateur-tva', 'Calculateur TVA Mauritanie', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/mauritania/kikokotoo-vat/', 'Kikokotoo cha VAT Mauritania', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) {
  test(`${route} shares the official Mauritania VAT engine`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.gnv-hero h1')).toHaveText(title);
    await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
    await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
    await expect(page.locator('#mrvGross')).toContainText(/1\D*160/);
    await page.locator('#mrvRate').selectOption('confirmed-telephony');
    await expect(page.locator('#mrvResult')).not.toHaveClass(/on/);
    await page.locator('#mrvEvidence').check();
    await expect(page.locator('#mrvVat')).toContainText(/180/);
    await page.locator('#mrvRate').selectOption('confirmed-article-215-exempt');
    await expect(page.locator('#mrvResult')).not.toHaveClass(/on/);
    expect(errors).toEqual([]);
  });
}

test('Mauritania VAT is usable at mobile widths, 200% zoom, dark mode and reduced motion', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/mauritania/mr-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
});

test('Mauritania VAT exposes labels, status and keyboard focus', async ({ page }) => {
  await page.goto('/mauritania/mr-vat');
  await expect(page.getByLabel('Amount (MRU)')).toBeVisible();
  await expect(page.getByLabel('VAT treatment')).toBeVisible();
  await expect(page.locator('#mrvStatus')).toHaveAttribute('role', 'status');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Mauritania VAT downloads a local PDF', async ({ page }) => {
  await page.goto('/mauritania/mr-vat');
  const download = page.waitForEvent('download');
  await page.locator('#mrvPdf').click();
  expect((await download).suggestedFilename()).toBe('mauritania-vat-estimate.pdf');
});

test('Mauritania VAT visual proof', async ({ browser }) => {
  for (const item of [
    { width: 320, theme: 'system-dark' },
    { width: 375, theme: 'light' },
    { width: 768, theme: 'manual-dark' }
  ]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light' });
    const page = await context.newPage();
    await page.goto('/mauritania/mr-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: `test-results/mauritania-vat-${item.width}-${item.theme}.png`, fullPage: true });
    await context.close();
  }
});
