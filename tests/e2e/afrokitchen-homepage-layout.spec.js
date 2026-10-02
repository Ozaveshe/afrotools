const { test, expect } = require('@playwright/test');

async function tabTo(page, selector) {
  for (let count = 0; count < 120; count += 1) {
    if (await page.locator(selector).evaluate(node => node === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${selector}`);
}

for (const width of [320, 390, 1366]) {
  for (const theme of ['light', 'dark']) {
    test(`${width}px ${theme}: homepage discovery and notes work with the keyboard`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(theme => {
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.setItem('aft_theme', theme);
      }, theme);
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
        return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
      });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/tools/afrokitchen/');
      await expect(page.locator('#recipes-grid .ak-recipe-card')).toHaveCount(12);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const layout = await page.evaluate(() => ({
        searchBottom: document.querySelector('#search-input').getBoundingClientRect().bottom,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      }));
      expect(layout.searchBottom).toBeLessThan(740);
      expect(layout.overflow).toBeLessThanOrEqual(1);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await axe.run({ include: [
        '.ak-home-hero', '#browse-panel', '#cook-this-week', '.ak-home-notes'
      ] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
      expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      await tabTo(page, '#search-input');
      await expect(page.locator('#search-input')).toBeFocused();
      expect(await page.locator('#search-input').evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2);
      await page.keyboard.type('jollof');
      await expect(page.locator('#results-summary')).toContainText('"jollof"');
      await expect(page.locator('#recipes-grid .ak-recipe-card').first()).toContainText('Jollof');
      await tabTo(page, '[data-quick-filter="vegetarian"]');
      const target = await page.locator('[data-quick-filter="vegetarian"]').evaluate(node => {
        const b = node.getBoundingClientRect();
        return { left: b.left, right: b.right, height: b.height, hit: node.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)) };
      });
      expect(target.left).toBeGreaterThanOrEqual(0); expect(target.right).toBeLessThanOrEqual(width);
      expect(target.height).toBeGreaterThanOrEqual(44); expect(target.hit).toBe(true);
      await page.keyboard.press('Space');
      await expect(page.locator('#filter-diet')).toHaveValue('vegetarian');
      await tabTo(page, '#clear-recipe-filters'); await page.keyboard.press('Enter');
      await expect(page.locator('#search-input')).toHaveValue('');
      await expect(page.locator('#filter-diet')).toHaveValue('');
      await tabTo(page, '.ak-home-notes:not(.ak-home-explore) > summary');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-tool-verification-panel]')).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-tool-verification-panel]')).toBeHidden();
      await page.locator('#ak-plan-generate').click();
      await expect(page.locator('.ak-plan-day').first()).toBeVisible();
      const resultViolations = await page.evaluate(async () => (await axe.run({ include: ['.ak-plan-output-head'] }, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
      })).violations);
      expect(resultViolations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
