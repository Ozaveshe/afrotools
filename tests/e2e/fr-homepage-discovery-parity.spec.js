const { test, expect } = require('@playwright/test');

function watchRuntimeFailures(page) {
  const failures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      failures.push(`request: ${url.pathname} ${request.failure()?.errorText || ''}`);
    }
  });
  return failures;
}

test.describe('French homepage and discovery parity', () => {
  test('publishes the complete category and structured discovery contract', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    await page.goto('/fr/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.fr-home-category')).toHaveCount(32);
    await expect(page.locator('.fr-home-task')).toHaveCount(8);
    await expect(page.locator('.fr-home-country-list a')).toHaveCount(12);

    const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => {
      const value = JSON.parse(script.textContent);
      return (value['@graph'] || [value]).map((item) => item['@type']);
    }));
    expect(schemaTypes).toEqual(expect.arrayContaining(['WebSite', 'Organization', 'CollectionPage']));
    expect(schemaTypes).not.toContain('FAQPage');
    expect(failures).toEqual([]);
  });

  test('carries a homepage query into the French directory', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    await page.goto('/fr/');
    await page.locator('#frHomeSearch').fill('PDF');
    await page.locator('.fr-home-search button[type="submit"]').click();

    await expect(page).toHaveURL(/\/fr\/all-tools\/\?q=PDF$/);
    await expect(page.locator('#searchInput')).toHaveValue('PDF');
    await expect(page.locator('#toolsGrid > a').first()).toBeVisible();
    await expect(page.locator('#resultsCount')).toContainText(/outil/i);
    expect(failures).toEqual([]);
  });

  for (const width of [320, 375]) {
    test(`keeps the full homepage usable at ${width}px and 200% reflow`, async ({ page }) => {
      const failures = watchRuntimeFailures(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/fr/');

      for (const theme of ['light', 'dark']) {
        await page.locator('html').evaluate((element, value) => element.setAttribute('data-theme', value), theme);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('#frHomeSearch')).toBeVisible();
        await expect(page.locator('.fr-home-category').first()).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
      }

      await page.setViewportSize({ width: width * 2, height: 900 });
      await page.locator('html').evaluate((element) => { element.style.zoom = '2'; });
      const zoomReflow = await page.evaluate(() => {
        const viewportRight = document.documentElement.clientWidth;
        return {
          overflow: document.documentElement.scrollWidth - viewportRight,
          offenders: [...document.querySelectorAll('body *')]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.right > viewportRight + 1;
            })
            .slice(0, 12)
            .map((element) => `${element.tagName.toLowerCase()}#${element.id}.${element.className}`),
        };
      });
      expect(zoomReflow.overflow, zoomReflow.offenders.join('\n')).toBeLessThanOrEqual(1);

      await page.keyboard.press('Home');
      await page.keyboard.press('Tab');
      await expect(page.locator('.skip-link')).toBeFocused();
      expect(failures).toEqual([]);
    });
  }
});
