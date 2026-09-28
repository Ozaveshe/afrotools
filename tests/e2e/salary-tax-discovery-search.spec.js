const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`salary discovery finds reordered country and calculator terms at ${width}px ${theme}`, async ({ page, baseURL }) => {
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, theme);
      await page.route('**/*', route => {
        const sameOrigin = new URL(route.request().url()).origin === new URL(baseURL).origin;
        return sameOrigin ? route.continue() : route.abort();
      });
      await page.goto('/salary-tax/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const search = page.getByRole('searchbox', { name: 'Find a calculator or country' });
      const results = page.locator('#find-results');
      const kenya = results.locator('a[href="/kenya/ke-paye"]');
      const southAfrica = results.locator('a[href="/south-africa/za-paye"]');
      await search.focus();
      await page.waitForFunction(() => Array.isArray(window.AFRO_TOOLS) && window.AFRO_TOOLS.length > 0);
      await page.evaluate(() => window.filterHub('payroll'));
      const payrollRoutes = await results.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      await expect(results).toContainText('Payroll & HR');

      for (const query of ['Kenya PAYE', 'PAYE Kenya', 'Kenya salary', 'salary Kenya', 'Kenya tax', 'tax Kenya', '  kEnYa,   pAyE  ', 'KE PAYE']) {
        await search.fill(query);
        await expect(kenya, query).toBeVisible();
        await expect(results.locator('a[href="/ghana/gh-paye"]'), query).toHaveCount(0);
        await expect(southAfrica, query).toHaveCount(0);
      }
      await search.fill('PAYE South Africa');
      await expect(southAfrica).toBeVisible();
      await expect(kenya).toHaveCount(0);
      await search.fill('South Africa salary');
      await expect(southAfrica).toBeVisible();
      await search.fill('tax Côte d’Ivoire');
      await expect(results.locator('a[href="/cote-divoire/ci-paye"]')).toBeVisible();
      await search.fill('Kenya mortgage');
      await expect(kenya).toHaveCount(0);
      await search.fill('Kenya South Africa PAYE');
      await expect(kenya).toHaveCount(0);
      await expect(southAfrica).toHaveCount(0);
      await search.fill('zzzzz-nonexistent-483');
      await expect(results).toContainText('No tools found - try a different search.');
      await expect(results.locator('a')).toHaveCount(0);

      await page.evaluate(() => window.filterHub('payroll'));
      await expect(search).toHaveValue('');
      await expect(results).toContainText('Payroll & HR');
      expect(await results.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(payrollRoutes);
      await expect(kenya).toHaveCount(0);
      await expect(results.locator('a[href="/tools/ke-nssf/"]')).toBeVisible();
      await search.fill('PAYE Kenya');
      await expect(kenya).toBeVisible();
      await search.focus();
      await page.keyboard.press('Tab');
      await expect(kenya).toBeFocused();
      await expect(kenya).toHaveAttribute('href', '/kenya/ke-paye');
      const geometry = await kenya.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth - innerWidth, left: rect.left, right: rect.right };
      });
      expect(geometry.overflow).toBe(0);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(width);
      await search.fill('');
      await expect(results).toBeHidden();
      await expect(results.locator('a')).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }
}
