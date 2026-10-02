const { test, expect } = require('@playwright/test');
const manifest = require('../../tools/afrokitchen/seo-manifest.json');
const zeroRecipe = manifest.recipes.find(recipe => recipe.generated_in_wave && recipe.protein_g === 0 && recipe.calories != null);

for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`nutrition basis and recorded zero survive serving changes at ${width}px ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(theme => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem('aft_theme', theme);
    }, theme);
    await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await page.goto('/tools/afrokitchen/recipes/amiwo-bj/');
    await page.waitForFunction(() => window.AKStaticRecipePage && window.AfroKitchenEngine);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const nutrition = page.locator('#ak-static-nutrition');
    await expect(nutrition).toContainText('basis not recorded');
    const calories = nutrition.locator('.ak-nutrition-card').filter({ has: page.locator('span', { hasText: /^Calories$/ }) });
    await expect(calories.locator('strong')).toHaveText('380');
    expect(await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)).find(schema => schema['@type'] === 'Recipe').nutrition)).toBeUndefined();
    await page.getByRole('button', { name: 'Decrease servings', exact: true }).click();
    await page.getByRole('button', { name: 'Decrease servings', exact: true }).click();
    await expect(page.locator('#ak-static-servings')).toHaveText('4');
    await expect(calories.locator('strong')).toHaveText('380');
    await expect(nutrition).toContainText('not recalculated when servings change');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

    expect(zeroRecipe).toBeTruthy();
    await page.goto('/tools/afrokitchen/recipes/' + zeroRecipe.slug + '/');
    await page.waitForFunction(() => window.AKStaticRecipePage && window.AfroKitchenEngine);
    expect(await page.evaluate(() => window.__AK_STATIC_RECIPE.protein_g)).toBe(0);
    const protein = page.locator('#ak-static-nutrition .ak-nutrition-card').filter({ has: page.locator('span', { hasText: /^Protein$/ }) });
    await expect(protein.locator('strong')).toHaveText('0g');
    await page.getByRole('button', { name: 'Increase servings', exact: true }).click();
    await expect(protein.locator('strong')).toHaveText('0g');
    await expect(page.locator('#ak-static-nutrition')).toContainText('basis not recorded');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
