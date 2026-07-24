const { test, expect } = require('@playwright/test');

async function noRootOverflow(page) {
  expect(await page.evaluate(() => {
    const root = document.scrollingElement;
    root.scrollLeft = 10000;
    const moved = root.scrollLeft;
    root.scrollLeft = 0;
    return moved;
  })).toBe(0);
}

for (const locale of [
  { route: '/tools/crypto-tax/', language: 'en', noEstimate: 'No estimate', submit: 'Calculate confirmed capital gain', expectedTax: /NGN\s*1,410,000/ },
  { route: '/fr/tools/impot-crypto/', language: 'fr', noEstimate: 'Aucune estimation', submit: 'Calculer la plus-value confirmée', expectedTax: /1[\s ]410[\s ]000.*NGN/ },
]) {
  test(`${locale.route} uses the reviewed fail-closed engine locally`, async ({ page }) => {
    const externalRequests = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(locale.route);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.language);
    await expect(page.locator('.cc-hero h1')).toHaveCSS('color', /rgb\((20, 33, 43|238, 247, 245)\)/);
    await expect(page.locator('#cc-tax')).toContainText(locale.noEstimate);
    await page.getByRole('button', { name: locale.submit }).click();
    await expect(page.locator('#cc-status')).not.toBeEmpty();
    await expect(page.locator('#cc-tax')).toContainText(locale.noEstimate);

    await page.locator('#cc-classification').selectOption('capital-confirmed');
    await page.locator('#cc-confirm').check();
    await page.getByRole('button', { name: locale.submit }).click();
    await expect(page.locator('#cc-tax')).toHaveText(locale.expectedTax);
    await expect(page.locator('#cc-source a')).toHaveAttribute('href', /nipc\.gov\.ng/);
    await expect(page.locator('#cc-metrics')).toBeVisible();
    expect(externalRequests.every(url => /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net\/gh\/twitter\/twemoji/.test(url)), externalRequests.join('\n')).toBe(true);
    await noRootOverflow(page);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('.cc-page')).toHaveCSS('color', /rgb/);
    await noRootOverflow(page);
  });
}

test('legacy fallback pages are aliases, not calculators', async ({ page }) => {
  await page.goto('/crypto/tax-calculator/');
  await page.waitForURL('**/tools/crypto-tax/');
  await expect(page.locator('html')).toHaveAttribute('data-tool', 'crypto-cgt');
});

test('crypto tax widget is an accessible method CTA without arithmetic', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/widgets/iframe/crypto-crypto-tax.html?theme=dark');
  await expect(page.getByRole('heading', { name: 'Crypto capital-gains estimate' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the reviewed calculator' })).toHaveAttribute('href', /\/tools\/crypto-tax\//);
  await expect(page.locator('#widget-root input, #widget-root select, #widget-root textarea, #widget-root button')).toHaveCount(0);
  await expect(page.getByText('No amounts are entered or calculated in this widget.')).toBeVisible();
  await noRootOverflow(page);
});
