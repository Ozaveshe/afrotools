const { test, expect } = require('@playwright/test');

test.describe('Lobola planning cluster', () => {
  test('main calculator is calculation-first and saves a private local handoff', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/tools/lobola-calculator/?country=zw&currency=USD#lobola-planner');
    await expect(page.getByRole('heading', { level: 1, name: /Lobola Calculator/i })).toBeVisible();
    await expect(page.locator('#country')).toHaveValue('zw');
    await expect(page.locator('#currency')).toHaveValue('USD');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByText('Deep improvement')).toHaveCount(0);
    await expect(page.getByText('Continue from Lobola Calculator')).toHaveCount(0);

    await page.locator('#customCattle').fill('6');
    await page.locator('#cattlePrice').fill('500');
    await page.locator('#zwCustom').fill('500');
    await page.locator('#giftValue').fill('300');
    await page.locator('#ceremonyCost').fill('200');
    await page.getByRole('button', { name: 'Build my family plan' }).click();

    await expect(page.locator('#results')).toHaveClass(/show/);
    await expect(page.locator('#rTotal')).toHaveText('$4,400');
    await page.getByRole('button', { name: 'Save on this device' }).click();
    await expect(page.locator('#resultActionStatus')).toContainText('saved on this device');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afrotools_lobola_plan_v1')).country)).toBe('Zimbabwe');

    await page.goto('/tools/lobola-gift-list/');
    await expect(page.getByRole('button', { name: 'Use saved Zimbabwe plan' })).toBeEnabled();
    await page.getByRole('button', { name: 'Use saved Zimbabwe plan' }).click();
    await expect(page.locator('#statusMsg')).toContainText('Saved calculator context added');
    expect(consoleErrors).toEqual([]);
  });

  const countries = [
    ['botswana', 'P64,000'],
    ['eswatini', 'E144,000'],
    ['lesotho', 'M100,000'],
    ['south-africa', 'R180,000'],
    ['zambia', 'K68,000'],
    ['zimbabwe', '$3,500']
  ];

  for (const [slug, expectedTotal] of countries) {
    test(`${slug} page calculates natively without a blocked frame`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      await page.goto(`/tools/lobola-calculator/${slug}/`);
      await expect(page.locator('iframe')).toHaveCount(0);
      await expect(page.locator('[data-lobola-quick-planner] .lc-quick-total')).toHaveText(expectedTotal);
      await expect(page.getByRole('link', { name: 'Open full family planner' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Prepare the family meeting' })).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }

  test('main and country planner do not overflow a 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/tools/lobola-calculator/', '/tools/lobola-calculator/zimbabwe/', '/fr/tools/calculateur-lobola/']) {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });

  test('French calculator and supporting routes are native and useful', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/tools/calculateur-lobola/');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Calculateur Lobola' })).toBeVisible();
    await expect(page.locator('[data-lobola-quick-planner] .lc-quick-total')).toHaveText('R180,000');
    await expect(page.getByRole('button', { name: 'Copier le résumé' })).toBeVisible();

    await page.goto('/fr/tools/checklist-negociation-dot/');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.locator('#fr-check-pending').fill('Confirmer la date et les cadeaux');
    await expect(page.locator('[data-native-output]')).toContainText('Confirmer la date et les cadeaux');

    await page.goto('/fr/tools/liste-cadeaux-dot/');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.locator('#fr-gift-items').fill('300');
    await page.locator('#fr-gift-ceremony').fill('200');
    await expect(page.locator('[data-native-output]')).toContainText('Total modifiable : ZAR 500');
    expect(consoleErrors).toEqual([]);
  });
});
