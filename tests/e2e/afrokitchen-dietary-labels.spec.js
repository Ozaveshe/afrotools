const { test, expect } = require('@playwright/test');
const withdrawals = require('../fixtures/afrokitchen/reviewed-dietary-withdrawals.json');

function normalized(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.fulfill({ status: 204, body: '' }));
});

for (const width of [390, 1280]) {
  for (const [slug, count] of [['ethiopian-fasting-table', 6], ['vegetarian-african-classics', 30]]) {
    test(`derived collection membership ${slug} at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`/tools/afrokitchen/collections/${slug}/`, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      const cards = page.locator('#collection-recipes a.ak-static-recipe-card');
      await expect(cards).toHaveCount(count);
      for (const removed of ['eritrean-ful', 'eritrean-shiro']) {
        await expect(page.locator(`#collection-recipes a[href="/tools/afrokitchen/recipes/${removed}/"]`)).toHaveCount(0);
      }
      const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)));
      const itemList = schemas.find(schema => schema['@type'] === 'ItemList');
      expect(itemList.numberOfItems).toBe(count);
      expect(itemList.itemListElement.map(item => new URL(item.url).pathname)).toEqual(await cards.evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname)));
      await expect(page.locator('.ak-stat').filter({ has: page.locator('.ak-stat-lbl', { hasText: /^Recipes$/ }) }).locator('.ak-stat-val')).toHaveText(String(count));
      if (slug === 'vegetarian-african-classics') {
        for (const added of ['injera', 'shiro-wat-et']) await expect(page.locator(`#collection-recipes a[href="/tools/afrokitchen/recipes/${added}/"]`)).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
  test(`reviewed diet filters and unfiltered recovery at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/afrokitchen/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#filter-diet option').length > 1 &&
      document.querySelector('#recipes-loading').style.display === 'none');
    const index = await page.evaluate(() => fetch('/tools/afrokitchen/recipe-index.json').then(response => response.json()));
    expect(index.recipes).toHaveLength(410);
    if (!await page.locator('#ak-more-filters').evaluate(element => element.open)) {
      await page.locator('#ak-more-filters summary').click();
    }
    for (const [slug, removed] of Object.entries(withdrawals)) {
      const recipe = index.recipes.find(row => row.slug === slug);
      expect(recipe, slug).toBeTruthy();
      const card = page.locator(`#recipes-grid a[href="/tools/afrokitchen/recipes/${slug}/"]`);
      await page.locator('#search-input').fill(recipe.name);
      await expect(card).toBeVisible();
      for (const tag of removed) {
        await page.locator('#filter-diet').selectOption(tag);
        await expect(page.locator('#results-summary')).not.toContainText('Updating');
        await expect(page.locator('#recipes-loading')).toBeHidden();
        await expect(card).toHaveCount(0);
        expect(recipe.diet_tags, slug).not.toContain(tag);
        expect(recipe.tags, slug).not.toContain(tag);
      }
      await page.locator('#filter-diet').selectOption('');
      await expect(card).toBeVisible();
      const diet = await card.locator('.ak-recipe-card-meta > span').filter({ has: page.locator('small', { hasText: /^Diet$/ }) }).locator('strong').allTextContents();
      for (const tag of removed) expect(diet.map(normalized), slug).not.toContain(tag);
    }
    await page.locator('#clear-recipe-filters').click();
    await expect(page.locator('#search-input')).toHaveValue('');
    await expect(page.locator('#filter-diet')).toHaveValue('');
    await expect(page.locator('#results-summary')).toContainText('410');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  for (const [slug, removed] of Object.entries(withdrawals)) {
    test(`reviewed recipe metadata and country card ${slug} at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`/tools/afrokitchen/recipes/${slug}/`, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBe(200);
      await page.waitForFunction(() => window.AKStaticRecipePage && window.AfroKitchenEngine);
      const state = await page.evaluate(() => ({
        payload: window.__AK_STATIC_RECIPE,
        schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => {
          const schema = JSON.parse(node.textContent);
          return schema['@graph'] || [schema];
        }),
        blocker: document.querySelector('meta[name="afrokitchen-schema-blockers"]')?.content,
        country: document.querySelector('a[href^="/tools/afrokitchen/countries/"]')?.getAttribute('href')
      }));
      expect(state.payload.slug).toBe(slug);
      expect(state.payload.ingredients.length).toBeGreaterThan(0);
      expect(state.payload.steps.length).toBeGreaterThan(0);
      const schema = state.schemas.find(row => row['@type'] === 'Recipe');
      if (schema) {
        const tags = String(schema.keywords || '').split(',').map(value => value.trim().toLowerCase());
        for (const tag of removed) expect(tags).not.toContain(tag);
      } else expect(state.blocker).toBe('missing_image');
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(state.country).toBeTruthy();
      const countryResponse = await page.goto(state.country, { waitUntil: 'domcontentloaded' });
      expect(countryResponse.status()).toBe(200);
      const cards = page.locator(`a.ak-static-recipe-card[href="/tools/afrokitchen/recipes/${slug}/"]`);
      expect(await cards.count()).toBeGreaterThan(0);
      for (const card of await cards.all()) {
        const diet = await card.locator('.ak-static-recipe-card-meta > span').filter({ has: page.locator('small', { hasText: /^Diet$/ }) }).locator('strong').allTextContents();
        for (const tag of removed) expect(diet.map(normalized)).not.toContain(tag);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}
