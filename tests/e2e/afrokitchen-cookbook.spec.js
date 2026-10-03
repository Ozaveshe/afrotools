const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  const allowedOrigin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === allowedOrigin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    return route.fulfill({ status: 200, contentType: request.resourceType() === 'stylesheet' ? 'text/css' : request.resourceType() === 'script' ? 'application/javascript' : 'text/plain', body: '' });
  });
});

test('saved recipes return from the cookbook and sorting follows real recipe times', async ({ page }) => {
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  const save = page.locator('[data-ak-save-recipe]');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-ak-cookbook-status]')).toContainText('saved on this device');
  await page.reload();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/tools/afrokitchen/?saved=1');
  await expect(page.locator('#recipes-grid h3')).toHaveCount(1);
  await expect(page.locator('#recipes-grid h3')).toHaveText('Jollof Rice');
  await expect(page.locator('[data-ak-saved-filter]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#clear-recipe-filters').click();
  await expect(page.locator('#recipes-grid h3')).toHaveCount(12);
  await page.locator('#ak-recipe-sort').selectOption('quickest');
  const index = await (await page.request.get('/tools/afrokitchen/recipe-index.json')).json();
  const minutes = Object.fromEntries(index.recipes.map(recipe => [recipe.slug, Number(recipe.prep_time_minutes || 0) + Number(recipe.cook_time_minutes || 0)]));
  await expect.poll(async () => {
    const paths = await page.locator('#recipes-grid a').evaluateAll(links => links.map(link => link.pathname.split('/').filter(Boolean).pop()));
    const times = paths.map(slug => minutes[slug]);
    return times.length === 12 && times.every((value, i) => value > 0 && (!i || value >= times[i - 1]));
  }).toBe(true);
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  await page.locator('[data-ak-save-recipe]').click();
  await expect(page.locator('[data-ak-save-recipe]')).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/tools/afrokitchen/?saved=1');
  await expect(page.locator('#recipes-empty')).toContainText('choose Save recipe');
});

test('unreadable cookbook and refused storage are reported without replacing saved data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ak_cookbook_v1', 'broken fixture');
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ak_cookbook_v1') throw new DOMException('Synthetic storage refusal');
      return write.call(this, key, value);
    };
  });
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  await expect(page.locator('[data-ak-cookbook-status]')).toContainText('could not be read');
  await page.locator('[data-ak-save-recipe]').click();
  await expect(page.locator('[data-ak-cookbook-status]')).toContainText('could not save');
  expect(await page.evaluate(() => localStorage.getItem('ak_cookbook_v1'))).toBe('broken fixture');
  await page.goto('/tools/afrokitchen/?saved=1');
  await expect(page.locator('#recipes-empty')).toContainText('saved cookbook is unavailable');
  await expect(page.locator('#recipes-more-wrap')).toBeHidden();
  await page.locator('#clear-recipe-filters').click();
  await expect(page.locator('#recipes-grid h3')).toHaveCount(12);
  expect(await page.evaluate(() => localStorage.getItem('ak_cookbook_v1'))).toBe('broken fixture');
});

test('country and collection navigation opens the requested directory', async ({ page }) => {
  await page.goto('/tools/afrokitchen/');
  await page.locator('.ak-cookbook-nav').getByRole('link', { name: 'Countries', exact: true }).click();
  await expect(page.locator('#country-grid')).toBeVisible();
  await page.locator('.ak-cookbook-nav').getByRole('link', { name: 'Collections', exact: true }).click();
  await expect(page.locator('#collections-grid')).toBeVisible();
  await page.goto('/tools/afrokitchen/#country-grid');
  await expect(page.locator('#country-grid')).toBeVisible();
});

test('printing while cooking restores the complete recipe', async ({ page, browserName }, testInfo) => {
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  await page.locator('[data-ak-cook-mode]').click();
  await expect(page.getByRole('dialog', { name: 'Jollof Rice' })).toBeVisible();
  if (browserName === 'chromium') {
    const buffer = await page.pdf({ path: testInfo.outputPath('recipe-from-cook-mode.pdf'), format: 'A4' });
    const parsed = await pdfParse(buffer);
    expect(parsed.text).toContain('Jollof Rice');
    expect(parsed.text).toContain('Reduce pepper base');
    expect(parsed.text).toContain('Smoke bottom');
    expect(parsed.text).toContain('long-grain parboiled rice');
  } else {
    // Other headless engines have no PDF API; exercise their native print event boundary.
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  }
  await expect(page.getByRole('dialog', { name: 'Jollof Rice' })).not.toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#recipe-ingredients #step-1')).toBeVisible();
  await expect(page.locator('#recipe-ingredients #step-6')).toBeVisible();
  await expect(page.locator('#recipe-ingredients #ak-static-ingredients input')).toHaveCount(14);
});

for (const variant of [{ width: 320, theme: 'light' }, { width: 390, theme: 'dark' }, { width: 1280, theme: 'light' }]) {
  test.describe(`${variant.width}px ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 900 }, colorScheme: variant.theme });
    test('cook mode keeps the real checklist and timer, restores focus, and fits the screen', async ({ page }, testInfo) => {
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), variant.theme);
      await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
      await expect(page.locator('.ak-cookbook-cover-photo')).toBeVisible();
      expect(await page.locator('.ak-cookbook-cover-photo').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      const open = page.locator('[data-ak-cook-mode]');
      await open.click();
      const dialog = page.getByRole('dialog', { name: 'Jollof Rice' });
      await expect(dialog).toBeVisible();
      await expect(page.locator('[data-ak-cook-close]')).toBeFocused();
      await expect(page.locator('[data-ak-cook-progress]')).toHaveText('Step 1 of 6');
      const ingredients = dialog.locator('.ak-cook-ingredients');
      if (variant.width < 641) {
        await expect(ingredients).not.toHaveAttribute('open', '');
        await ingredients.locator(':scope > summary').click();
      }
      await dialog.locator('#ak-static-ingredients input').first().check();
      if (variant.width < 641) await ingredients.locator(':scope > summary').click();
      await dialog.locator('#ak-timer-toggle-1').click();
      await expect(dialog.locator('#step-1')).toHaveClass(/is-timer-running/);
      await dialog.locator('[data-ak-cook-next]').click();
      await expect(page.locator('[data-ak-cook-progress]')).toHaveText('Step 2 of 6');
      await expect(dialog.locator('#step-1')).toBeHidden();
      const metrics = await dialog.evaluate(node => ({ scroll: node.scrollWidth, width: node.clientWidth, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, viewport: document.documentElement.clientWidth }));
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.width + 1);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.viewport);
      const icons = await dialog.locator('svg:visible').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
      icons.forEach(width => expect(width).toBeLessThanOrEqual(32));
      const contrast = await dialog.locator('[data-ak-cook-next]').evaluate(button => {
        const style = getComputedStyle(button);
        function luminance(color) {
          const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => {
            const channel = Number(value) / 255;
            return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
          });
          return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
        }
        const foreground = luminance(style.color), background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      await page.screenshot({ path: testInfo.outputPath('cook-mode.png') });
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(open).toBeFocused();
      await expect(page.locator('#recipe-ingredients #ak-static-ingredients input').first()).toBeChecked();
      await expect(page.locator('#recipe-ingredients #step-1')).toHaveClass(/is-timer-running/);
      await page.locator('#ak-timer-toggle-1').click();
      await page.reload();
      await expect(page.locator('#ak-static-ingredients input').first()).toBeChecked();
      expect(errors).toEqual([]);
    });
  });
}
