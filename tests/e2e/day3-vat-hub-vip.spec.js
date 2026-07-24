const { test, expect } = require('@playwright/test');

test.describe('Day 3 VAT and business-tax hub VIP', () => {
  for (const theme of ['light', 'dark']) {
    test(`truthful collection contract and mobile layout in ${theme} mode`, async ({ page }) => {
      const errors = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', (error) => errors.push(error.message));

      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto('/vat-business-tax/', { waitUntil: 'domcontentloaded' });
      await page.evaluate((selectedTheme) => document.documentElement.setAttribute('data-theme', selectedTheme), theme);

      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(page.locator('#tool-grid a').first()).toBeVisible();
      await page.getByText('Which countries and VAT workflows does this hub cover?').click();
      await expect(page.getByText('the hub itself is not a rate table')).toBeVisible();
      await page.getByText('How current is this hub?').click();
      await expect(page.getByText('a hub review does not refresh or validate every country rule')).toBeVisible();

      const evidence = await page.evaluate(() => {
        const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map((script) => JSON.parse(script.textContent));
        const collection = schemas.find((schema) => schema['@type'] === 'CollectionPage' && schema.dateModified === '2026-07-22');
        return {
          dateModified: collection && collection.dateModified,
          itemCount: collection && collection.mainEntity && collection.mainEntity.itemListElement.length,
          numberOfItems: collection && collection.mainEntity && collection.mainEntity.numberOfItems,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          introBackground: getComputedStyle(document.querySelector('.vat-hub-intro')).backgroundColor,
          faqBackground: getComputedStyle(document.querySelector('.vat-hub-faq details')).backgroundColor,
        };
      });

      expect(evidence.dateModified).toBe('2026-07-22');
      expect(evidence.itemCount).toBe(6);
      expect(evidence.numberOfItems).toBe(6);
      expect(evidence.scrollWidth).toBeLessThanOrEqual(evidence.clientWidth + 1);
      if (theme === 'dark') {
        expect(evidence.introBackground).toBe('rgb(28, 25, 16)');
        expect(evidence.faqBackground).toBe('rgb(23, 32, 51)');
      }
      expect(errors).toEqual([]);
    });
  }

  test('route planner changes the destination and stores metadata without the amount', async ({ page }) => {
    await page.goto('/vat-business-tax/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Country or market').selectOption('NG');
    await page.getByLabel('Business task').selectOption('withholding');
    await page.getByLabel('Transaction amount (optional, not saved)').fill('987654');

    await expect(page.locator('[data-vat-route-open]')).toHaveAttribute('href', '/tools/ng-wht/');
    await expect(page.locator('[data-vat-route-status]')).toContainText('Optional amount is not saved');
    await page.locator('[data-vat-route-save]').click();

    const saved = await page.evaluate(() => localStorage.getItem('afro_vat_route_plan_v1'));
    expect(saved).not.toContain('987654');
    expect(JSON.parse(saved)).toMatchObject({
      countryCode: 'NG',
      taskId: 'withholding',
      href: '/tools/ng-wht/',
      routeOnly: true,
      storesTransactionAmount: false,
      storesInvoiceLines: false,
      storesCustomerData: false,
      storesTaxDocuments: false,
    });
  });
});
