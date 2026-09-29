const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildRecipePageHtml } = require('../../scripts/generate-afrokitchen-static-pages');
const { loadAfroKitchenEngine, loadRecipeImages } = require('../../scripts/lib/afrokitchen-static');

const root = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('tools/afrokitchen/seo-manifest.json');
const recipe = manifest.recipes.find(item => item.slug === 'jollof-rice-ng');
const html = buildRecipePageHtml(recipe, manifest, loadAfroKitchenEngine(), loadRecipeImages(),
  read('data/afrokitchen/recipe-research-audit.json').recipes,
  read('tools/afrokitchen/cuisine-intelligence.json'));
const generatedSha256 = crypto.createHash('sha256').update(html).digest('hex');
const recipePath = '/tools/afrokitchen/recipes/jollof-rice-ng/';
const variants = [
  { width: 320, theme: 'dark' }, { width: 320, theme: 'light' },
  { width: 390, theme: 'dark' }, { width: 390, theme: 'light' },
  { width: 1280, theme: 'light' },
];

for (const variant of variants) test.describe(`${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });
  test('generated ingredient title and whole category pill fit their panel and viewport', async ({ page, context, baseURL }, testInfo) => {
    const origin = new URL(baseURL).origin;
    const observation = { generatedSha256, variant, pageErrors: [], consoleErrors: [], requestFailures: [], writes: [], ai: [], blocked: [], warnings: [] };
    page.on('pageerror', error => observation.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') observation.consoleErrors.push(message.text());
      if (message.type() === 'warning') observation.warnings.push(message.text());
    });
    page.on('requestfailed', request => observation.requestFailures.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      const write = !['GET', 'HEAD'].includes(request.method()), ai = /\/ai(?:\/|-)|openai|anthropic/i.test(request.url());
      const metadata = { method: request.method(), origin: url.origin, path: url.pathname, type: request.resourceType() };
      if (write) observation.writes.push(metadata);
      if (ai) observation.ai.push(metadata);
      if (url.origin === origin && !write && !ai && url.pathname === recipePath) return route.fulfill({ status: 200, contentType: 'text/html', body: html });
      if (url.origin === origin && !write && !ai && !/^\/(?:api|\.netlify\/functions)\//.test(url.pathname)) return route.continue();
      observation.blocked.push(metadata);
      return route.fulfill({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : request.resourceType() === 'stylesheet' ? 'text/css' : 'application/json', body: ['script', 'stylesheet'].includes(request.resourceType()) ? '' : '{}' });
    });
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    }, variant.theme);
    try {
      await page.goto(recipePath, { waitUntil: 'networkidle' });
      const row = page.locator('.ak-ingredients-panel .ak-panel-title-row');
      await expect(row).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      await row.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      observation.geometry = await row.evaluate(row => {
        const panel = row.closest('.ak-ingredients-panel'), title = row.querySelector('.ak-panel-title'), pill = row.querySelector('.ak-panel-pill');
        const rectangle = node => { const b = node.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
        function measured(node) {
          const b = rectangle(node), range = document.createRange(); range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          const clip = { left: 0, right: innerWidth, top: 0, bottom: innerHeight }, ancestors = [];
          for (let parent = node.parentElement; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent), r = parent.getBoundingClientRect();
            const clipsX = /^(hidden|clip|scroll|auto)$/.test(style.overflowX), clipsY = /^(hidden|clip|scroll|auto)$/.test(style.overflowY);
            const inner = { left: r.left + parent.clientLeft, right: r.left + parent.clientLeft + parent.clientWidth, top: r.top + parent.clientTop, bottom: r.top + parent.clientTop + parent.clientHeight };
            if (clipsX) { clip.left = Math.max(clip.left, inner.left); clip.right = Math.min(clip.right, inner.right); }
            if (clipsY) { clip.top = Math.max(clip.top, inner.top); clip.bottom = Math.min(clip.bottom, inner.bottom); }
            if (clipsX || clipsY) ancestors.push({ className: parent.className, overflowX: style.overflowX, overflowY: style.overflowY, inner });
          }
          return { text: node.textContent, ...b, textBounds: { left: text.left, right: text.right, top: text.top, bottom: text.bottom }, clip, ancestors, font: getComputedStyle(node).font };
        }
        return { viewport: { width: innerWidth, height: innerHeight, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) }, panel: rectangle(panel), row: rectangle(row), flexWrap: getComputedStyle(row).flexWrap, title: measured(title), pill: measured(pill) };
      });
      const geometry = observation.geometry;
      expect(geometry.viewport.overflow).toBe(0);
      expect(geometry.title.text).toBe('Ingredients');
      expect(geometry.pill.text).toBe('Main dish');
      for (const node of [geometry.title, geometry.pill]) {
        for (const box of [geometry.panel, node.clip]) {
          expect(node.left).toBeGreaterThanOrEqual(box.left - 0.5);
          expect(node.right).toBeLessThanOrEqual(box.right + 0.5);
          expect(node.top).toBeGreaterThanOrEqual(box.top - 0.5);
          expect(node.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
        }
        expect(node.textBounds.left).toBeGreaterThanOrEqual(node.clip.left - 0.5);
        expect(node.textBounds.right).toBeLessThanOrEqual(node.clip.right + 0.5);
      }
      const title = geometry.title, pill = geometry.pill;
      expect(title.right <= pill.left || pill.right <= title.left || title.bottom <= pill.top || pill.bottom <= title.top).toBe(true);
      if (variant.width === 1280) expect(Math.abs(title.top - pill.top)).toBeLessThan(2);
      const top = Math.max(0, Math.floor(geometry.row.top) - 16), bottom = Math.min(850, Math.ceil(geometry.row.bottom) + 22);
      observation.screenshot = testInfo.outputPath('ingredient-title-pill.png');
      await page.screenshot({ path: observation.screenshot, clip: { x: 0, y: top, width: variant.width, height: bottom - top } });
      expect(observation.pageErrors).toEqual([]);
      expect(observation.consoleErrors).toEqual([]);
      expect(observation.requestFailures).toEqual([]);
      expect(observation.writes).toEqual([]);
      expect(observation.ai).toEqual([]);
    } finally {
      await testInfo.attach('generated-recipe-badge-observation', { body: Buffer.from(JSON.stringify(observation, null, 2)), contentType: 'application/json' });
    }
  });
});
