const { test, expect } = require('@playwright/test');

test.describe('French search growth hotspots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('fuel country page is native French, interactive, and mobile-safe', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/tools/suivi-carburant/senegal/');
    await expect(page.locator('h1')).toHaveText('Prix du carburant — Sénégal');
    await expect(page.locator('meta[name="afrotools-source-owner"]')).toHaveAttribute('content', 'scripts/build-french-fuel-country-pages.js');
    await expect(page.locator('[data-language-fallback-notice], [data-explicit-language-fallback]')).toHaveCount(0);
    await expect(page.locator('.fuel-faq details')).toHaveCount(6);

    await page.locator('[name="litres_per_day"]').fill('12');
    await page.locator('[name="days_per_month"]').fill('20');
    await page.locator('[name="fuel_type"]').selectOption('diesel');
    await expect(page.locator('[data-fuel-planner-output]')).toContainText('carburant (Diesel)');
    await expect(page.locator('[data-fuel-planner-output]')).toContainText('Vérifiez le prix local');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test('Orange Money guide renders official-source comparison without mobile overflow', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/blog/frais-orange-money-guide-2026/');
    await expect(page.locator('h1')).toContainText('Frais de retrait Orange Money 2026');
    await expect(page.locator('.article-body table')).toHaveCount(4);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://orangemoney.orange.cm/fr/tarification-orange-money.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0"]').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/plus de 30 millions|Western Union.*2 500/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile-money comparison stays native French and contains wide tables safely', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/blog/mobile-money-fees-africa-compared/');
    await expect(page.locator('h1')).toHaveText('Frais mobile money en Afrique : comparatif par pays');
    await expect(page.locator('meta[name="afrotools-source-owner"]')).toHaveAttribute('content', 'scripts/build-french-mobile-money-editorial.js');
    await expect(page.locator('[data-language-fallback-notice], [data-explicit-language-fallback]')).toHaveCount(0);
    await expect(page.locator('.article-body table')).toHaveCount(2);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://www.mtn.co.ug/tariffs/mobile-money-tariffs/"]').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/By Equipe|Published Mar|Compare transfer cost/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
