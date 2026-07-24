const { test, expect } = require('@playwright/test');

const routes = [
  ['/gabon/ga-vat', 'Gabon VAT calculator'],
  ['/fr/gabon/calculateur-tva', 'Calculateur TVA Gabon'],
  ['/sw/gabon/kikokotoo-vat/', 'Kikokotoo cha VAT Gabon']
];

for (const [route, heading] of routes) {
  test(`${route} runs the verified shared engine`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.gav-hero h1')).toHaveText(heading);
    await page.locator('#gavAmount').fill('10999');
    await expect(page.locator('#gavGross')).toContainText(/12\D*799/);
    await expect(page.locator('#gavBase')).toContainText(/10\D*000/);
    await page.locator('#gavRate').selectOption('article-221-five-confirmed');
    await expect(page.locator('#gavResult')).not.toHaveClass(/on/);
    await page.locator('#gavEvidence').check();
    await expect(page.locator('#gavVat')).toContainText('500');
    expect(errors).toEqual([]);
  });
}

test('Gabon VAT is usable at 320px, dark mode and 200% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/gabon/ga-vat');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth)).toBe(true);
  await expect(page.locator('#gavAmount')).toBeVisible();
});

test('Gabon VAT stays usable at 375px and 768px with manual dark theme', async ({ page }) => {
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/gabon/ga-vat');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    expect(await page.locator('.gav-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.locator('#gavAmount').fill('10999');
    await expect(page.locator('#gavGross')).toContainText(/12\D*799/);
    await page.keyboard.press('Tab');
  }
});

test('Gabon VAT local PDF and standard-only iframe work', async ({ page }) => {
  await page.goto('/gabon/ga-vat');
  const download = page.waitForEvent('download');
  await page.locator('#gavPdf').click();
  expect((await download).suggestedFilename()).toBe('gabon-vat-estimate.pdf');
  await page.goto('/widgets/iframe/financial-gabon-vat.html');
  await expect(page.locator('[data-gross]')).toContainText('11,800');
  await page.locator('[data-mode="extract"]').click();
  await page.locator('#gaWidgetAmount').fill('12799');
  await expect(page.locator('[data-main]')).toContainText('10,999');
});
