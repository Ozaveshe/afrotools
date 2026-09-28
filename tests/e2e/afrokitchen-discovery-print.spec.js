const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const variants = [
  { width: 320, theme: 'light' },
  { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' },
  { width: 390, theme: 'dark' },
  { width: 1366, theme: 'light' }
];
const normalized = text => text.normalize('NFC').replace(/\s+/g, ' ').trim();

for (const variant of variants) {
  test.describe(`AfroKitchen discovery and print at ${variant.width}px in ${variant.theme} mode`, () => {
    test.use({ viewport: { width: variant.width, height: 844 }, colorScheme: variant.theme });
    let pageErrors;

    test.beforeEach(async ({ page }) => {
      pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.route('**/*', route => {
        const host = new URL(route.request().url()).hostname;
        return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
      });
      await page.addInitScript(theme => {
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.setItem('aft_theme', theme);
        window.print = () => { window.__akPrintCalls = (window.__akPrintCalls || 0) + 1; };
      }, variant.theme);
    });

    test.afterEach(async ({ page }) => {
      expect(pageErrors).toEqual([]);
      await page.emulateMedia({ media: 'screen' });
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    });

    test('empty search clears pagination, reset recovers and filtered pagination exhausts', async ({ page }) => {
      await page.goto('/tools/afrokitchen/', { waitUntil: 'domcontentloaded' });
      const cards = page.locator('#recipes-grid .ak-recipe-card');
      const more = page.locator('#recipes-more-wrap');
      await expect(cards).toHaveCount(12);
      await expect(more).toBeVisible();
      await page.locator('#search-input').fill('zz-kitchen-no-matches');
      await expect(page.locator('#recipes-empty')).toBeVisible();
      await expect(cards).toHaveCount(0);
      await expect(more).toBeHidden();
      await expect(page.locator('#results-summary')).toContainText('No recipes found');

      await page.locator('#clear-recipe-filters').click();
      await expect(page.locator('#search-input')).toHaveValue('');
      await expect(cards).toHaveCount(12);
      await expect(more).toBeVisible();
      await expect(page.locator('#recipes-empty')).toBeHidden();
      if (!await page.locator('#ak-more-filters').evaluate(node => node.open)) {
        await page.locator('#ak-more-filters summary').click();
      }
      await page.locator('#filter-country').selectOption('NG');
      await expect(page.locator('#results-summary')).toContainText('Nigeria');
      const recipeCount = await page.evaluate(async () => {
        const index = await fetch('/tools/afrokitchen/recipe-index.json').then(response => response.json());
        return index.recipes.filter(recipe => recipe.country_code === 'NG').length;
      });
      let visible = 12;
      while (visible < recipeCount) {
        await page.locator('#recipes-more').click();
        visible = Math.min(visible + 12, recipeCount);
        await expect(cards).toHaveCount(visible);
      }
      await expect(more).toBeHidden();
      await expect(page.locator('#results-summary')).toContainText(`Showing ${recipeCount} of ${recipeCount}`);
      await page.locator('#search-input').fill('zz-kitchen-no-matches');
      await expect(cards).toHaveCount(0);
      await expect(more).toBeHidden();
      await page.locator('#clear-recipe-filters').click();
      await expect(cards).toHaveCount(12);
      await expect(more).toBeVisible();
    });

    test('Print plan shows only readable meals and shopping, with PDF content verified in Chromium', async ({ page, browserName }, testInfo) => {
      await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-ak-add-meal-plan]').click();
      await page.goto('/tools/afrokitchen/#cook-this-week', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#ak-picked-list li')).toHaveCount(1);
      await page.locator('#ak-plan-days').selectOption('3');
      await page.locator('#ak-plan-time').selectOption('999');
      await page.locator('#ak-plan-servings').fill('5');
      await page.locator('#ak-plan-from-picks').click();
      await expect(page.locator('.ak-plan-day')).toHaveCount(3);
      const titles = await page.locator('.ak-plan-day h4 a').allTextContents();
      const shopping = await page.locator('.ak-plan-shopping-group li').allTextContents();
      expect(shopping.join('\n')).toContain('2½ cups long-grain parboiled rice');
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(await page.locator('body').evaluate(body => getComputedStyle(body).display)).toBe('block');

      await page.locator('#ak-plan-print').click();
      expect(await page.evaluate(() => window.__akPrintCalls)).toBe(1);
      await expect(page.locator('#ak-plan-status')).toContainText('Opening print dialog');
      await expect(page.locator('#ak-plan-result')).toBeVisible();
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('#browse-panel')).toBeHidden();
      await expect(page.locator('#country-grid')).toBeHidden();
      await expect(page.locator('afro-navbar')).toBeHidden();
      await expect(page.locator('.ak-plan-result-actions')).toBeHidden();
      await expect(page.locator('.ak-plan-day-image').first()).toBeHidden();
      await expect(page.locator('.ak-plan-shopping')).toBeVisible();
      await expect(page.locator('.ak-plan-day h4 a')).toHaveText(titles);
      await expect(page.locator('.ak-plan-shopping-group li')).toHaveText(shopping);
      for (const item of await page.locator('.ak-plan-day h4 a, .ak-plan-shopping-group li').all()) {
        await expect(item).toBeVisible();
      }
      const printGeometry = await page.locator('.ak-plan-output').evaluate(node => {
        const width = document.documentElement.clientWidth;
        return [...node.querySelectorAll('.ak-plan-day, .ak-plan-shopping-group, li')].map(item => {
          const rect = item.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width };
        });
      });
      printGeometry.forEach(rect => {
        expect(rect.left).toBeGreaterThanOrEqual(-1);
        expect(rect.right).toBeLessThanOrEqual(rect.width + 1);
      });

      if (browserName === 'chromium') {
        const file = testInfo.outputPath('afrokitchen-plan.pdf');
        const buffer = await page.pdf({ path: file, format: 'A4', preferCSSPageSize: true });
        const parsed = await pdfParse(buffer);
        const text = normalized(parsed.text);
        expect(parsed.numpages).toBeGreaterThan(0);
        expect(parsed.numpages).toBeLessThanOrEqual(5);
        expect(text).toContain('3-day plan ready');
        expect(text).toContain('Grouped shopping list');
        titles.forEach(title => expect(text).toContain(normalized(title)));
        shopping.forEach(line => expect(text).toContain(normalized(line)));
        for (const unrelated of [
          'Find something good to cook.', 'What are you hungry for?', 'Browse by country',
          'Save plan on this device', 'Copy shopping list', 'Export TXT', 'Regenerate'
        ]) expect(text).not.toContain(unrelated);
        if (process.env.AFROTOOLS_KITCHEN_PRINT_EVIDENCE === '1') {
          const directory = path.join(__dirname, '../../.tmp/kitchen-print-evidence');
          fs.mkdirSync(directory, { recursive: true });
          fs.writeFileSync(path.join(directory, `plan-${variant.width}-${variant.theme}.pdf`), buffer);
          fs.writeFileSync(path.join(directory, `plan-${variant.width}-${variant.theme}.json`), JSON.stringify({
            pageCount: parsed.numpages, titles, shopping, extractedText: parsed.text, printGeometry
          }, null, 2));
          await page.locator('.ak-plan-output').screenshot({ path: path.join(directory, `plan-${variant.width}-${variant.theme}.png`) });
        }
      }

      await page.emulateMedia({ media: 'screen' });
      await expect(page.locator('.ak-plan-result-actions')).toBeVisible();
      await expect(page.locator('#ak-plan-save')).toBeEnabled();
      await expect(page.locator('#ak-plan-generate')).toBeVisible();

      // A no-match plan must remove the special printable-plan state.
      await page.locator('#ak-plan-country').selectOption('SS');
      await page.locator('#ak-plan-diet').selectOption('vegan');
      await page.locator('#ak-plan-occasion').selectOption('street-food');
      await page.locator('#ak-plan-time').selectOption('30');
      await page.locator('#ak-plan-generate').click();
      await expect(page.locator('#ak-plan-result')).toContainText('No complete plan yet');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('#browse-panel')).toBeVisible();
    });
  });
}
