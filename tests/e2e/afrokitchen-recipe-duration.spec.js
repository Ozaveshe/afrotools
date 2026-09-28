const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { buildRecipePageHtml } = require('../../scripts/generate-afrokitchen-static-pages');
const { loadAfroKitchenEngine, loadRecipeImages } = require('../../scripts/lib/afrokitchen-static');

const root = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('tools/afrokitchen/seo-manifest.json');
const recipe = manifest.recipes.find(item => item.slug === 'jollof-rice-ng');
const html = buildRecipePageHtml(recipe, manifest, loadAfroKitchenEngine(), loadRecipeImages(),
  read('data/afrokitchen/recipe-research-audit.json'), read('tools/afrokitchen/cuisine-intelligence.json'));
const projected = JSON.parse(html.match(/<script>window\.__AK_STATIC_RECIPE = ([\s\S]*?);<\/script>/)[1]);
const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1])).find(item => item['@type'] === 'Recipe');
const recipeRoute = '/tools/afrokitchen/recipes/jollof-rice-ng/';
const copySelector = '[data-ak-copy-recipe]';
const txtSelector = '[data-ak-download-recipe]';

async function settled(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let previous = '', stable = 0;
  for (let sample = 0; sample < 60; sample += 1) {
    const position = await page.locator(copySelector).evaluate(node => JSON.stringify({ scrollY, top: node.getBoundingClientRect().top }));
    stable = position === previous ? stable + 1 : 0;
    if (stable >= 4) return;
    previous = position;
    await page.waitForTimeout(30);
  }
  throw new Error('Owner-rendered recipe controls did not settle');
}

async function pointerClick(page, selector) {
  const control = page.locator(selector);
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await page.mouse.move(160, 420);
  for (let movement = 0; movement < 8; movement += 1) {
    const bounds = await control.boundingBox();
    const distance = bounds.y + bounds.height / 2 - 420;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, distance);
    await settled(page);
  }
  const geometry = await control.evaluate(node => {
    const bounds = node.getBoundingClientRect(), navbar = document.querySelector('afro-navbar');
    const nodes = navbar ? [navbar, ...(navbar.shadowRoot ? navbar.shadowRoot.querySelectorAll('*') : [])] : [];
    const navBottom = Math.max(0, ...nodes.filter(item => {
      const box = item.getBoundingClientRect();
      return ['fixed', 'sticky'].includes(getComputedStyle(item).position) && box.height > 20 && box.height < 150 && box.top < 150;
    }).map(item => item.getBoundingClientRect().bottom));
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right, width: bounds.width,
      height: bounds.height, navBottom, viewportHeight: innerHeight, viewportWidth: innerWidth, hit: node === hit || node.contains(hit) };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.navBottom + 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(geometry.width).toBeGreaterThanOrEqual(44);
  expect(geometry.hit).toBe(true);
  const first = await control.boundingBox();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await control.boundingBox();
  expect(bounds.y).toBeCloseTo(first.y, 1);
  const before = await page.evaluate(() => window.__recipeDurationProbe.events.length);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  expect(await page.evaluate(({ before, selector }) => window.__recipeDurationProbe.events.slice(before)
    .filter(event => event.selector === selector).map(event => event.type), { before, selector }))
    .toEqual(['mousedown', 'mouseup', 'click']);
  await settled(page);
}

function verifyPayload(text, servings, url) {
  expect(text).toContain('Time: 95 minutes\n');
  expect(text).not.toContain('Time: 0 minutes');
  expect(text).toContain(`Servings: ${servings} servings\n`);
  expect(text).toContain(projected.description);
  expect(text.match(/^- /gm)).toHaveLength(projected.ingredients.length);
  for (const ingredient of projected.ingredients) expect(text).toContain(ingredient.name);
  for (const step of projected.steps) expect(text).toContain(`${step.step_number}. ${step.title}\n${step.instruction}`);
  expect(text).toContain(servings === 6 ? '- 3 cups long-grain parboiled rice' : '- 3½ cups long-grain parboiled rice');
  expect(text).toContain('Timer: 30:00');
  expect(text).toContain('Timer: 03:00');
  expect(text).toContain(`Source: ${url}`);
}

for (const variant of [{ width: 320, theme: 'dark' }, { width: 390, theme: 'light' }]) {
  test.describe(`Owner-rendered duration at ${variant.width}px in ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme, serviceWorkers: 'block' });
    test('saved recipe durations reach runtime, complete Copy and local TXT without changing servings math', async ({ page, baseURL }, testInfo) => {
      expect({ prep: recipe.prep_time_minutes, cook: recipe.cook_time_minutes, total: recipe.total_time_minutes })
        .toEqual({ prep: 30, cook: 65, total: 95 });
      expect({ prep: projected.prep_time_minutes, cook: projected.cook_time_minutes, total: projected.total_time_minutes })
        .toEqual({ prep: recipe.prep_time_minutes, cook: recipe.cook_time_minutes, total: recipe.total_time_minutes });
      expect({ prep: schema.prepTime, cook: schema.cookTime, total: schema.totalTime })
        .toEqual({ prep: 'PT30M', cook: 'PT65M', total: 'PT95M' });
      expect(html).toContain('95 min total');
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        const request = route.request();
        return new URL(request.url()).origin === new URL(baseURL).origin && ['GET', 'HEAD'].includes(request.method())
          ? route.continue() : route.abort('blockedbyclient');
      });
      // Render in memory through the maintained owner; do not regenerate tracked pages or contact providers.
      await page.route(new URL(recipeRoute, baseURL).href, route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
      await page.addInitScript(theme => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        const probe = window.__recipeDurationProbe = { texts: [], events: [] };
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
          writeText(text) { probe.texts.push(text); return Promise.resolve(); }
        } });
        document.execCommand = () => false;
        for (const type of ['mousedown', 'mouseup', 'click']) document.addEventListener(type, event => {
          const control = event.target.closest('[data-ak-copy-recipe],[data-ak-download-recipe]');
          if (control) probe.events.push({ type, selector: control.hasAttribute('data-ak-copy-recipe') ? '[data-ak-copy-recipe]' : '[data-ak-download-recipe]' });
        }, true);
      }, variant.theme);
      await page.goto(recipeRoute, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(copySelector)).toBeVisible();
      await settled(page);
      expect(await page.evaluate(() => [window.__AK_STATIC_RECIPE.prep_time_minutes, window.__AK_STATIC_RECIPE.cook_time_minutes, window.__AK_STATIC_RECIPE.total_time_minutes]))
        .toEqual([30, 65, 95]);
      await expect(page.locator('.ak-method-stat-row')).toContainText('95 min total');
      for (const servings of [6, 7]) {
        if (servings === 7) {
          await page.getByRole('button', { name: 'Increase servings', exact: true }).focus();
          await page.keyboard.press('Enter');
        }
        await pointerClick(page, copySelector);
        await expect(page.locator('#ak-static-action-status')).toHaveText('Recipe copied.');
        const text = await page.evaluate(() => window.__recipeDurationProbe.texts.at(-1));
        verifyPayload(text, servings, page.url());
        const downloadPromise = page.waitForEvent('download');
        await pointerClick(page, txtSelector);
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(`jollof-rice-ng-${servings}-servings.txt`);
        expect(await download.failure()).toBeNull();
        const target = testInfo.outputPath(download.suggestedFilename());
        await download.saveAs(target);
        const downloaded = fs.readFileSync(target, 'utf8');
        expect(downloaded).toBe(text);
        verifyPayload(downloaded, servings, page.url());
        await expect(page.locator('#ak-static-action-status')).toHaveText('Recipe TXT downloaded.');
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('duration-export-controls.png') });
      await testInfo.attach('owner-rendered-recipe', { body: html, contentType: 'text/html' });
    });
  });
}
