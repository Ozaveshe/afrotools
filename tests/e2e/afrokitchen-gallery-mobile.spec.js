const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { buildRecipePageHtml } = require('../../scripts/generate-afrokitchen-static-pages');
const { loadAfroKitchenEngine, loadRecipeImages } = require('../../scripts/lib/afrokitchen-static');

const root = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/afrokitchen/seo-manifest.json')));
const research = JSON.parse(fs.readFileSync(path.join(root, 'data/afrokitchen/recipe-research-audit.json'))).recipes;
const intelligence = JSON.parse(fs.readFileSync(path.join(root, 'tools/afrokitchen/cuisine-intelligence.json')));
const engine = loadAfroKitchenEngine();
const images = loadRecipeImages();
const recipes = ['jollof-rice-ng', 'couscous-royal-dz', 'isombe-rw'];
const variants = [320, 390, 1366].flatMap(width => ['light', 'dark'].map(theme => ({ width, theme })));

async function setup(page, width, theme) {
  await page.setViewportSize({ width, height: 850 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  const origin = new URL(test.info().project.use.baseURL).origin;
  const errors = [], failedImages = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && response.status() >= 400 && new URL(response.url()).origin === origin) failedImages.push({ url: response.url(), status: response.status() });
  });
  await page.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method()) ? route.continue() : route.abort('blockedbyclient');
  });
  await page.addInitScript(theme => {
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  }, theme);
  return { errors, failedImages };
}

async function settled(page) {
  let previous = '', same = 0;
  await expect.poll(async () => {
    const next = await page.evaluate(() => JSON.stringify({ y: scrollY, h: document.documentElement.scrollHeight }));
    same = next === previous ? same + 1 : 0; previous = next;
    return same >= 4;
  }, { intervals: [40] }).toBe(true);
}

async function revealPhoto(page, image) {
  await page.mouse.move(page.viewportSize().width / 2, 420);
  await settled(page);
  // Firefox caps a single wheel's travel; keep observing the actual painted target.
  for (let attempt = 0; attempt < 30; attempt++) {
    const bounds = await image.boundingBox();
    if (bounds && bounds.y >= 64 && bounds.y + bounds.height <= 840) break;
    await page.mouse.wheel(0, bounds.y - 80);
    await settled(page);
  }
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await settled(page);
}

async function photoGeometry(image) {
  return image.evaluate(img => {
    const figure = img.closest('figure'), grid = img.closest('.ak-photo-gallery-grid');
    const r = img.getBoundingClientRect(), f = figure.getBoundingClientRect(), g = grid.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const nav = host.shadowRoot.querySelector('nav') || host;
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { image: r.toJSON(), figure: f.toJSON(), grid: g.toJSON(), viewport: innerWidth, viewportHeight: innerHeight,
      header: nav.getBoundingClientRect().bottom, hit: hit === img || figure.contains(hit),
      complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
      alt: img.alt, src: img.getAttribute('src'), caption: figure.querySelector('figcaption')?.textContent,
      documentWidth: document.documentElement.scrollWidth };
  });
}

for (const { width, theme } of variants) {
  test(`Kitchen gallery painted photos fit at ${width}px ${theme}`, async ({ page }, testInfo) => {
    const state = await setup(page, width, theme);
    for (const slug of recipes) {
      await page.goto(`/tools/afrokitchen/recipes/${slug}/`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.waitForFunction(() => document.querySelector('afro-navbar')?.shadowRoot?.querySelector('nav'));
      const gallery = page.locator('.ak-photo-gallery');
      await expect(gallery).toHaveAccessibleName(/photos/);
      const photos = gallery.locator('img');
      const rows = [];
      for (let index = 0; index < await photos.count(); index++) {
        const image = photos.nth(index);
        await revealPhoto(page, image);
        const bounds = await photoGeometry(image);
        expect(bounds.complete && bounds.naturalWidth > 0).toBe(true);
        expect(bounds.alt.trim()).not.toBe('');
        // Hidden body overflow must not conceal an oversized gallery child.
        expect(bounds.figure.left).toBeGreaterThanOrEqual(bounds.grid.left - 1);
        expect(bounds.figure.right).toBeLessThanOrEqual(bounds.grid.right + 1);
        expect(bounds.image.left).toBeGreaterThanOrEqual(0);
        expect(bounds.image.right).toBeLessThanOrEqual(bounds.viewport);
        expect(bounds.image.top).toBeGreaterThanOrEqual(bounds.header);
        expect(bounds.image.bottom).toBeLessThanOrEqual(bounds.viewportHeight);
        expect(bounds.hit).toBe(true);
        expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.viewport);
        rows.push(bounds);
        if (index === 0) await page.screenshot({ path: testInfo.outputPath(`${slug}-painted-gallery.png`) });
      }
      await testInfo.attach(`${slug}-painted-photo-bounds`, { body: JSON.stringify(rows), contentType: 'application/json' });
    }
    expect(state.errors).toEqual([]);
    expect(state.failedImages).toEqual([]);
  });
}

test('Kitchen renderer uses neutral unannotated photos and preserves reviewed metadata', async ({ page }, testInfo) => {
  const state = await setup(page, 320, 'dark');
  const recipe = manifest.recipes.find(recipe => recipe.slug === 'jollof-rice-ng');
  const render = recipe => buildRecipePageHtml(recipe, manifest, engine, images, research, intelligence);
  const unannotated = render(recipe);
  const explicit = render({ ...recipe, media: [...recipe.media, {
    image_url: '/assets/img/kitchen/jollof-rice-ng-2.webp', role: 'process',
    alt_text: 'Rice finishing in a cooking pot', caption: 'Covered pot after steaming',
    source_type: 'reviewed-local', credit_text: 'Synthetic local QA credit', credit_url: 'https://afrotools.com/'
  }] });
  // Render the maintained owner in memory; generated pages and saved data stay untouched.
  await page.route('**/__gallery-fixture/**', route => route.fulfill({ contentType: 'text/html', body: route.request().url().endsWith('/annotated/') ? explicit : unannotated }));
  await page.goto('/__gallery-fixture/unannotated/', { waitUntil: 'domcontentloaded' });
  const expectedOrder = ['/assets/img/kitchen/jollof-rice-ng.webp', '/assets/img/kitchen/jollof-rice-ng-1.webp', '/assets/img/kitchen/jollof-rice-ng-2.webp'];
  expect(await page.locator('.ak-photo-gallery img').evaluateAll(images => images.map(image => image.getAttribute('src')))).toEqual(expectedOrder);
  const extra = page.locator('.ak-photo-gallery figure').filter({ has: page.locator('img[src="/assets/img/kitchen/jollof-rice-ng-2.webp"]') });
  await expect(extra.locator('figcaption')).toHaveText('Jollof Rice additional recipe photo');
  await expect(extra.locator('img')).toHaveAttribute('alt', 'Jollof Rice recipe from Nigeria');
  await revealPhoto(page, extra.locator('img'));
  await page.screenshot({ path: testInfo.outputPath('neutral-photo-caption.png') });
  await page.goto('/__gallery-fixture/annotated/', { waitUntil: 'domcontentloaded' });
  expect(await page.locator('.ak-photo-gallery img').evaluateAll(images => images.map(image => image.getAttribute('src')))).toEqual(expectedOrder);
  const reviewed = page.locator('.ak-photo-gallery figure').filter({ has: page.locator('img[src="/assets/img/kitchen/jollof-rice-ng-2.webp"]') });
  await expect(reviewed.locator('figcaption')).toHaveText('Covered pot after steaming');
  await expect(reviewed.locator('img')).toHaveAttribute('alt', 'Rice finishing in a cooking pot');
  await expect(page.locator('.ak-photo-gallery .ak-static-credit')).toContainText('reviewed-local by Synthetic local QA credit');
  await expect(page.locator('.ak-photo-gallery .ak-static-credit a')).toHaveAttribute('href', 'https://afrotools.com/');
  await revealPhoto(page, reviewed.locator('img'));
  await page.screenshot({ path: testInfo.outputPath('reviewed-photo-caption.png') });
  expect(state.errors).toEqual([]);
  expect(state.failedImages).toEqual([]);
});
