const { test, expect } = require('@playwright/test');

test.describe('French country discovery', () => {
  test('homepage country and category submission works at 390px', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fr/');
    await expect(page.locator('#frEvidence')).toHaveCount(0);
    await page.locator('#frCountry').selectOption('senegal');
    await page.locator('#frCategory').selectOption('financial');
    await page.getByRole('button', { name: 'Afficher les outils', exact: true }).click();
    await expect(page.locator('#directoryCountry')).toHaveValue('SN');
    await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#directoryCountryStatus')).toContainText('Sénégal');
    await expect(page.locator('#toolsGrid > a').first()).toBeVisible();
    const unsupported = await page.locator('#toolsGrid > a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')).filter(href => {
      return !AFRO_TOOLS.some(tool => tool.href === href && tool.lang === 'fr' && tool.category === 'financial' &&
        Array.isArray(tool.countries) && (tool.countries.includes('SN') || tool.countries.includes('ALL')));
    }));
    expect(unsupported).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await page.locator('#directoryCountryReset').boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.locator('#directoryCountry').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('country-filter-390.png') });
    await page.getByRole('button', { name: 'Effacer le pays' }).click();
    await expect(page.locator('#directoryCountry')).toBeFocused();
    await expect(page.locator('#directoryCountry')).toHaveValue('');
    await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('country aliases and search preserve the category', async ({ page }) => {
    for (const country of ['cote-divoire', 'Côte d’Ivoire', 'CI']) {
      await page.goto('/fr/all-tools/?category=financial&q=TVA&country=' + encodeURIComponent(country));
      await expect(page.locator('#directoryCountry')).toHaveValue('CI');
      await expect(page.locator('#searchInput')).toHaveValue('TVA');
      await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
    }
    await page.locator('#searchInput').fill('salaire');
    await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#directoryCountry')).toHaveValue('CI');
    await page.getByRole('button', { name: 'Effacer la recherche' }).click();
    await expect(page.locator('#directoryCountry')).toHaveValue('CI');
    await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('unknown country fails closed and can be cleared', async ({ page }) => {
    await page.goto('/fr/all-tools/?country=unrecognized-country&category=financial');
    await expect(page.locator('#directoryCountryStatus')).toContainText('Pays non reconnu');
    await expect(page.locator('#toolsGrid > a')).toHaveCount(0);
    await page.getByRole('button', { name: 'Effacer le pays' }).click();
    await expect(page.locator('#toolsGrid > a').first()).toBeVisible();
    await expect(page.locator('[data-filter="financial"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

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
    const staticCount = Number(await page.locator('[data-static-tool-directory]').getAttribute('data-static-tool-count'));
    expect(staticCount).toBeGreaterThan(0);
    await expect(page.locator('#toolsGrid [data-directory-record]')).toHaveCount(staticCount);

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
