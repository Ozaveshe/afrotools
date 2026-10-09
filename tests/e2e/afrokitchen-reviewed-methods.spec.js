'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const overrides = require('../../data/afrokitchen/recipe-method-overrides.json');
const manifest = require('../../tools/afrokitchen/seo-manifest.json');
const imageRows = require('../../data/image-generation/kitchen-method-corrections-2026-10-09.json').images;
const root = path.resolve(__dirname, '../..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [slug, correction] of Object.entries(overrides)) for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`${slug}: ${width}px ${theme} reviewed method, illustration, controls and TXT`, async ({ page, baseURL }, info) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const origin = new URL(baseURL).origin, errors = [], missing = [];
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ status: 204, body: '' }));
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (new URL(response.url()).origin === origin && response.status() >= 400) missing.push({ url: response.url(), status: response.status() }); });
    await page.addInitScript(value => { localStorage.setItem('aft_theme', value); localStorage.setItem('afrotools_cookie_consent', 'declined'); }, theme);
    const response = await page.goto('/tools/afrokitchen/recipes/' + slug + '/', { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(200);
    await expect(page.locator('#ak-static-servings')).toHaveText(String(correction.default_servings));
    const recipe = await page.evaluate(() => window.__AK_STATIC_RECIPE);
    expect(recipe.slug).toBe(slug);
    expect(recipe.is_published).toBe(true);
    expect(recipe.is_verified).toBe(false);
    await expect(page.getByRole('complementary', { name: 'Recipe source and testing status' })).toContainText('AfroTools has not kitchen-tested this version.');
    expect(recipe.ingredients).toHaveLength(correction.ingredients.length);
    expect(recipe.steps).toHaveLength(correction.steps.length);
    for (let index = 0; index < correction.ingredients.length; index++) {
      expect(recipe.ingredients[index].name).toBe(correction.ingredients[index].name);
      expect(recipe.ingredients[index].amount).toBe(correction.ingredients[index].amount ?? 0);
    }
    for (let index = 0; index < correction.steps.length; index++) {
      expect(recipe.steps[index].instruction).toBe(correction.steps[index].instruction);
      expect(recipe.steps[index].timer_seconds).toBe(correction.steps[index].timer_seconds ?? null);
    }
    await expect(page.locator('.ak-nutrition-card')).toHaveCount(0);
    expect(await page.evaluate(() => window.AfroKitchenEngine.scaleNutrition(window.__AK_STATIC_RECIPE, 6))).toBeNull();
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)));
    for (const schema of schemas.filter(schema => schema['@type'] === 'Recipe')) {
      expect(schema.nutrition).toBeUndefined();
      const maintainedRecipe = manifest.recipes.find(recipe => recipe.slug === slug);
      expect(schema.dateModified).toBe([correction.reviewed_at, maintainedRecipe.updated_at?.slice(0, 10)].filter(Boolean).sort().at(-1));
      expect(schema.recipeInstructions.map(step => step.text)).toEqual(correction.steps.map(step => step.instruction));
    }
    const cover = page.locator('.ak-cookbook-cover-photo');
    await expect(cover).toBeVisible();
    await expect.poll(() => cover.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const image = await cover.evaluate(element => ({ src: new URL(element.currentSrc).pathname, alt: element.alt, width: element.naturalWidth, height: element.naturalHeight }));
    const artwork = imageRows.find(row => row.slug === slug);
    expect(image.alt).toMatch(/illustration/i);
    if (artwork) expect(artwork.variants.map(variant => variant.path)).toContain(image.src);
    else expect(image.src).toBe('/assets/img/kitchen/nthochi-bread-mw.webp');
    const before = await page.locator('#ak-static-ingredients').innerText();
    await page.getByRole('button', { name: 'Increase servings', exact: true }).focus();
    await page.keyboard.press('Enter');
    const servings = correction.default_servings + 1;
    await expect(page.locator('#ak-static-servings')).toHaveText(String(servings));
    expect(await page.locator('#ak-static-ingredients').innerText()).not.toBe(before);
    for (const item of correction.ingredients.filter(item => item.amount == null)) {
      const text = await page.locator('#ak-static-ingredients').innerText();
      expect(text).toContain(item.name);
      expect(text).toContain(item.unit);
    }
    const firstTimer = correction.steps.find(step => step.timer_seconds > 0);
    const stepNavigation = page.getByRole('navigation', { name: 'Recipe steps', exact: true });
    const stepButton = stepNavigation.getByRole('button', { name: 'Step ' + firstTimer.step_number + ': ' + firstTimer.title, exact: true });
    await stepButton.focus(); await expect(stepButton).toBeFocused(); await page.keyboard.press('Enter');
    const toggle = page.locator('#ak-timer-toggle-' + firstTimer.step_number);
    await expect(toggle).toBeVisible();
    await toggle.focus(); await expect(toggle).toBeFocused(); await page.keyboard.press('Enter');
    await expect(toggle).toContainText('Pause');
    const reset = page.locator('#step-' + firstTimer.step_number).getByRole('button', { name: 'Reset', exact: true });
    await reset.focus(); await expect(reset).toBeFocused(); await page.keyboard.press('Enter');
    await expect(toggle).toContainText('Start timer');
    await page.locator('.ak-visual-exports > summary').click();
    const pending = page.waitForEvent('download');
    await page.locator('[data-ak-download-recipe]').click();
    const download = await pending;
    expect(await download.failure()).toBeNull();
    const file = info.outputPath('recipe.txt'); await download.saveAs(file);
    const bytes = fs.readFileSync(file), text = bytes.toString();
    expect(text).toContain('Servings: ' + servings + ' ' + correction.serving_unit);
    expect(text).toContain('AfroTools has not kitchen-tested this version.');
    for (const source of correction.sources) expect(text).toContain(source.url);
    for (const item of correction.ingredients) expect(text).toContain(item.name);
    for (const item of correction.ingredients.filter(item => item.amount == null)) expect(text).toContain(item.unit);
    for (const step of correction.steps) expect(text).toContain(step.instruction);
    await page.getByRole('button', { name: 'Decrease servings', exact: true }).focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#ak-static-servings')).toHaveText(String(correction.default_servings));
    expect(await page.locator('#ak-static-ingredients').innerText()).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.addScriptTag({ path: path.join(root, 'node_modules/axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(row => ({ id: row.id, nodes: row.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
    expect(violations).toEqual([]); expect(errors).toEqual([]); expect(missing).toEqual([]);
    await info.attach('reviewed-method-observation', { body: Buffer.from(JSON.stringify({ slug, width, theme, image, ingredients: recipe.ingredients.length, steps: recipe.steps.length, txtSha256: hash(bytes), violations, errors, missing, externalRequests: 'stubbed; no provider or production claim' })), contentType: 'application/json' });
  });
}
