const { test, expect } = require('@playwright/test');

test.describe('French discovery foundation', () => {
  test('categories and filtered directory expose the complete French discovery model', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/categories/');
    await expect(page.locator('.hero-ey')).toHaveText('32 catégories');
    await expect(page.locator('#heroToolCount')).toHaveText('1452');
    await expect(page.locator('#cg > [data-directory-record]')).toHaveCount(32);
    await expect(page.locator('[data-category="engineering"]')).toHaveAttribute('href', '/fr/all-tools/?category=engineering');
    await expect(page.locator('body')).not.toContainText(/tools available|tools planned|12 catégories/i);

    await page.goto('/fr/all-tools/?category=engineering');
    await expect(page.locator('.filter-tab[data-filter="engineering"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sectionTitle')).toHaveText('Ingénierie');
    await expect(page.locator('#toolsGrid > a').first()).toBeVisible();
    const hrefs = await page.locator('#toolsGrid > a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((href) => href && href.startsWith('/fr/'))).toBeTruthy();
    await expect(page.locator('#resultsCount')).toContainText(/ sur .* outils/);
    expect(consoleErrors).toEqual([]);
  });

  test('no-JavaScript discovery remains complete', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/fr/categories/');
    await expect(page.locator('#cg [data-directory-record]')).toHaveCount(32);
    await page.goto('/fr/all-tools/');
    await expect(page.locator('[data-static-tool-directory]')).toHaveAttribute('data-static-tool-count', '1452');
    await expect(page.locator('#toolsGrid [data-directory-record]')).toHaveCount(1452);

    await context.close();
  });

  test('320px and dark-mode layouts do not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

    for (const route of ['/fr/categories/', '/fr/all-tools/']) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} must not overflow at 320px`).toBeLessThanOrEqual(1);
    }

    await expect(page.locator('#searchInput')).toHaveAttribute('aria-label', 'Rechercher dans tous les outils');
    await page.locator('#searchInput').focus();
    await expect(page.locator('#searchInput')).toBeFocused();
  });
});
