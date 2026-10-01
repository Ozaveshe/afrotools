const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const home = '/tools/afrokitchen/';
const recipe = `${home}recipes/jollof-rice-ng/`;
const copy = '#ak-plan-copy';
const txt = '#ak-plan-export';
const status = '#ak-plan-status';
const pointerEvents = new WeakMap();
const pointerProof = new WeakMap();
const variants = [
  { width: 320, theme: 'light' }, { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' }, { width: 390, theme: 'dark' }
];

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const b = node.getBoundingClientRect(), navbar = document.querySelector('afro-navbar');
    const nodes = navbar ? [navbar, ...(navbar.shadowRoot ? navbar.shadowRoot.querySelectorAll('*') : [])] : [];
    const navBottom = Math.max(0, ...nodes.filter(n => {
      const r = n.getBoundingClientRect(), p = getComputedStyle(n).position;
      return ['fixed', 'sticky'].includes(p) && r.height > 20 && r.height < 150 && r.top < 150;
    }).map(n => n.getBoundingClientRect().bottom));
    const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    return {
      top: b.top, bottom: b.bottom, width: b.width, height: b.height,
      navBottom, fullyVisible: b.top >= navBottom + 1 && b.bottom <= innerHeight,
      centerHit: node === hit || node.contains(hit), focused: document.activeElement === node,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth)
    };
  });
}

async function settled(page, selector) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let previous = '', unchanged = 0;
  for (let sample = 0; sample < 60; sample += 1) {
    const position = await page.locator(selector).evaluate(node => {
      const b = node.getBoundingClientRect();
      return JSON.stringify([scrollY.toFixed(1), b.top.toFixed(1), b.bottom.toFixed(1)]);
    });
    unchanged = previous === position ? unchanged + 1 : 0;
    if (unchanged >= 4) return;
    previous = position;
    await page.waitForTimeout(30);
  }
  throw new Error(`Native scroll did not settle for ${selector}`);
}

async function pointer(page, selector) {
  const control = page.locator(selector);
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await settled(page, selector);
  const viewport = page.viewportSize(), center = viewport.height / 2;
  await page.mouse.move(viewport.width / 2, center);
  const initialBox = await control.boundingBox();
  // Native wheel travel can be capped; give long pages a finite distance-based budget.
  const movementLimit = Math.ceil(Math.abs(initialBox.y + initialBox.height / 2 - center) / 500) + 8;
  for (let move = 0; move < movementLimit; move += 1) {
    const box = await control.boundingBox(), distance = box.y + box.height / 2 - center;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance)));
    await settled(page, selector);
  }
  const before = await geometry(page, selector);
  expect(before.fullyVisible, JSON.stringify(before)).toBe(true);
  expect(before.centerHit, JSON.stringify(before)).toBe(true);
  expect(before.overflow).toBe(0);
  const bounds = await control.boundingBox();
  pointerEvents.set(page, []);
  await page.evaluate(selector => {
    const node = document.querySelector(selector);
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type, () => window.__recordPlannerPointer(type), { once: true });
  }, selector);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect.poll(() => pointerEvents.get(page)).toEqual(['mousedown', 'mouseup', 'click']);
  pointerProof.get(page).push({ selector, geometry: before, events: [...pointerEvents.get(page)] });
}

async function focusBounds(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
  await expect.poll(async () => {
    const b = await geometry(page, selector);
    return b.focused && b.fullyVisible && b.centerHit && b.overflow === 0;
  }).toBe(true);
  const b = await geometry(page, selector);
  expect(b.height).toBeGreaterThanOrEqual(42);
  expect(b.width).toBeGreaterThanOrEqual(44);
}

const path = require('node:path');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '../../tools/afrokitchen/recipe-index.json'), 'utf8'));
const ingredients = Object.fromEntries(index.recipes.map(recipe => [recipe.id, recipe.ingredients]));
const validation = 'Enter a whole number of servings from 1 to 30.';
const invalidValues = ['', '0', '31', '5.5'];
const observedErrors = new WeakMap();

async function openLocal(page, context, baseURL, theme, options = {}) {
  const probe = { releaseIndex: null };
  const errors = [];
  observedErrors.set(page, errors);
  page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
  pointerProof.set(page, []);
  await page.exposeFunction('__recordPlannerPointer', type => pointerEvents.get(page).push(type));
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin && ['GET', 'HEAD'].includes(request.method())) {
      if (options.heldDetails && url.pathname === '/tools/afrokitchen/recipe-index.json') {
        if (options.saved) await new Promise(resolve => { probe.releaseIndex = resolve; });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...index, recipes: index.recipes.map(recipe => ({ ...recipe, ingredients: [] })) }) });
      }
      return route.continue();
    }
    if (/google|googletagmanager/.test(url.hostname)) return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(({ theme, saved }) => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('ak_meal_plan_v1', JSON.stringify([{ slug: 'jollof-rice-ng' }]));
    if (saved) localStorage.setItem('ak_saved_plan_v1', JSON.stringify({ version: 1, slugs: ['jollof-rice-ng', 'cachupa-rica-cv', 'caldo-de-mancarra-gw'], inputs: { days: 3, maxTime: 999, servings: 5, diet: '', country: '', occasion: '' } }));
    window.__planCopy = { held: [], legacy: 0, texts: [] };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText(text) {
      window.__planCopy.texts.push(text);
      return new Promise((resolve, reject) => window.__planCopy.held.push({ resolve, reject }));
    } } });
    document.execCommand = () => { window.__planCopy.legacy += 1; return false; };
  }, { theme, saved: !!options.saved });
  await page.goto(`${home}#cook-this-week`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  if (options.heldDetails) {
    await page.evaluate(ingredients => {
      window.__planReads = { held: [], immediate: false };
      window.AfroAuth = { getSupabase() { return { from(table) {
        if (table !== 'recipe_ingredients') throw new Error('Unexpected synthetic read');
        return { select() { return { eq(column, id) {
          if (column !== 'recipe_id') throw new Error('Unexpected synthetic query');
          return { order() {
            const result = { data: ingredients[id] || [], error: null };
            if (window.__planReads.immediate) return Promise.resolve(result);
            return new Promise(resolve => window.__planReads.held.push({ id, resolve: () => resolve(result) }));
          } };
        } }; } };
      } }; } };
    }, ingredients);
    if (options.saved) {
      await expect.poll(() => !!probe.releaseIndex).toBe(true);
      probe.releaseIndex();
      await expect.poll(() => page.evaluate(() => window.__planReads.held.length)).toBe(3);
      return errors;
    }
  }
  await page.locator('#ak-plan-days').selectOption('3');
  await page.locator('#ak-plan-time').selectOption('999');
  await expect(page.locator('#ak-plan-from-picks')).toBeEnabled();
  return errors;
}

async function enterServings(page, value) {
  await pointer(page, '#ak-plan-servings');
  await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
  if (value) await page.keyboard.type(value);
  await page.keyboard.press('Tab');
}

async function keyboardBuild(page) {
  for (let count = 0; count < 14 && !await page.locator('#ak-plan-from-picks').evaluate(node => document.activeElement === node); count += 1) await page.keyboard.press('Tab');
  await expect(page.locator('#ak-plan-from-picks')).toBeFocused();
  // Native focus may scroll a long page; use real wheels to make its full bounds visible.
  const viewport = page.viewportSize(), center = viewport.height / 2;
  await page.mouse.move(viewport.width / 2, center);
  await settled(page, '#ak-plan-from-picks');
  const initial = await page.locator('#ak-plan-from-picks').boundingBox();
  const limit = Math.ceil(Math.abs(initial.y + initial.height / 2 - center) / 500) + 8;
  for (let count = 0; count < limit; count += 1) {
    const bounds = await page.locator('#ak-plan-from-picks').boundingBox(), distance = bounds.y + bounds.height / 2 - center;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance))); await settled(page, '#ak-plan-from-picks');
  }
  await focusBounds(page, '#ak-plan-from-picks');
  pointerEvents.set(page, []);
  await page.evaluate(() => {
    const node = document.querySelector('#ak-plan-from-picks');
    node.addEventListener('keydown', event => window.__recordPlannerPointer('keydown:' + event.key), { once: true });
    node.addEventListener('click', () => window.__recordPlannerPointer('click'), { once: true });
    window.addEventListener('keyup', event => window.__recordPlannerPointer('keyup:' + event.key + ':' + event.target.id), { once: true, capture: true });
  });
  await page.keyboard.press('Enter');
  const invalid = await page.locator('#ak-plan-servings').getAttribute('aria-invalid') === 'true';
  await expect.poll(() => [...pointerEvents.get(page)].sort()).toEqual(['click', 'keydown:Enter', `keyup:Enter:${invalid ? 'ak-plan-servings' : 'ak-plan-from-picks'}`]);
  pointerProof.get(page).push({ selector: '#ak-plan-from-picks', keyboard: 'native Tab + Enter', events: [...pointerEvents.get(page)] });
}

async function assertInvalid(page, value) {
  await expect(page.locator('#ak-plan-servings')).toHaveValue(value);
  await expect(page.locator('#ak-plan-servings')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ak-plan-servings')).toHaveAttribute('aria-describedby', 'ak-plan-servings-help ak-plan-servings-error');
  await expect(page.locator('#ak-plan-servings-error')).toBeVisible();
  await expect(page.locator('#ak-plan-servings-error')).toHaveText(validation);
  await expect(page.locator(status)).toHaveText(validation);
  await expect(page.locator(status)).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('.ak-plan-day')).toHaveCount(0);
  await expect(page.locator('#ak-plan-copy, #ak-plan-export, #ak-plan-print, #ak-plan-save')).toHaveCount(0);
  await expect(page.locator('#ak-plan-generate')).toBeEnabled();
  await expect(page.locator('#ak-plan-generate')).toHaveAttribute('aria-busy', 'false');
  await focusBounds(page, '#ak-plan-servings');
  const geometryValue = await geometry(page, '#ak-plan-servings');
  const errorBounds = await page.locator('#ak-plan-servings-error').boundingBox();
  expect(errorBounds.y).toBeGreaterThanOrEqual(geometryValue.bottom);
  expect(errorBounds.y + errorBounds.height).toBeLessThanOrEqual(page.viewportSize().height);
}

async function assertValid(page, servings, picked = false) {
  await expect(page.locator('.ak-plan-day')).toHaveCount(3);
  await expect(page.locator(status)).toContainText('Plan generated');
  await expect(page.locator('#ak-plan-servings')).toHaveValue(String(servings));
  await expect(page.locator('#ak-plan-servings-error')).toBeHidden();
  await expect(page.locator('#ak-plan-servings')).not.toHaveAttribute('aria-invalid', 'true');
  const portions = await page.locator('.ak-plan-day-meta strong').allTextContents();
  expect(portions.filter(text => text.startsWith('Serves '))).toEqual(Array(3).fill(`Serves ${servings}`));
  const links = await page.locator('.ak-plan-day h4 a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(links.every(link => link.endsWith(`?plan_servings=${servings}`))).toBe(true);
  if (picked) await expect(page.locator('.ak-plan-shopping')).toContainText(`${servings === 1 ? '½ cups' : '15 cups'} long-grain parboiled rice`);
}

async function exportProof(page, testInfo, servings) {
  const wait = page.waitForEvent('download').then(download => ({ download }), error => ({ error }));
  await pointer(page, txt);
  const event = await wait; if (event.error) throw event.error;
  const filename = testInfo.outputPath(`valid-${servings}-plan.txt`);
  await event.download.saveAs(filename);
  const content = fs.readFileSync(filename, 'utf8');
  expect(content).toContain(`Servings per recipe: ${servings}\n`);
  expect((content.match(new RegExp(`plan_servings=${servings}\\n`, 'g')) || []).length).toBe(3);
  const rows = await page.locator('.ak-plan-shopping-group li').allTextContents();
  expect(content.split('\n').filter(line => line.startsWith('- ')).map(line => line.replace(/^- \[[ x]\] /, '- '))).toEqual(rows.map(row => `- ${row.trim()}`));
}

async function releaseReads(page, count) {
  await page.evaluate(count => window.__planReads.held.splice(0, count).forEach(read => read.resolve()), count);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach('native-pointer-and-keyboard-controls', { body: Buffer.from(JSON.stringify(pointerProof.get(page) || [], null, 2)), contentType: 'application/json' });
  const errors = observedErrors.get(page) || [];
  await testInfo.attach('observed-page-errors', { body: Buffer.from(JSON.stringify({ errors, nativeTransitionAborts: errors.filter(error => error.name === 'AbortError' && error.message === 'Transition was skipped').length }, null, 2)), contentType: 'application/json' });
});

for (const variant of variants) test.describe(`${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });

  test('Generate rejects invalid servings and recovers at both valid boundaries', async ({ page, context, baseURL }, testInfo) => {
    const errors = await openLocal(page, context, baseURL, variant.theme);
    await expect(page.locator('#ak-plan-servings')).toHaveValue('4');
    await expect(page.locator('#ak-plan-servings')).toHaveAttribute('required', '');
    for (const value of invalidValues) {
      await enterServings(page, value); await pointer(page, '#ak-plan-generate'); await assertInvalid(page, value);
    }
    for (const servings of [1, 30]) {
      await enterServings(page, String(servings));
      await expect(page.locator('#ak-plan-servings-error')).toBeHidden();
      await pointer(page, '#ak-plan-generate'); await assertValid(page, servings); await exportProof(page, testInfo, servings);
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('generate-valid-recovery.png') });
  });

  test('native keyboard Build from picks rejects invalid servings and preserves exact shopping quantities', async ({ page, context, baseURL }, testInfo) => {
    const errors = await openLocal(page, context, baseURL, variant.theme);
    for (const value of invalidValues) {
      await enterServings(page, value); await keyboardBuild(page); await assertInvalid(page, value);
    }
    for (const servings of [1, 30]) {
      await enterServings(page, String(servings)); await keyboardBuild(page); await assertValid(page, servings, true); await exportProof(page, testInfo, servings);
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('picked-valid-recovery.png') });
  });

  test('held generations cannot restore invalid or older inputs or reset a newer loading request', async ({ page, context, baseURL }) => {
    const errors = await openLocal(page, context, baseURL, variant.theme, { heldDetails: true });
    await enterServings(page, '5'); await pointer(page, '#ak-plan-generate');
    await expect.poll(() => page.evaluate(() => window.__planReads.held.length)).toBe(3);
    await enterServings(page, '0'); await keyboardBuild(page); await assertInvalid(page, '0');
    await releaseReads(page, 3); await assertInvalid(page, '0');

    await page.reload();
    await openLocalProviderAfterReload(page);
    await page.locator('#ak-plan-days').selectOption('3'); await page.locator('#ak-plan-time').selectOption('999');
    await enterServings(page, '1'); await pointer(page, '#ak-plan-generate');
    await expect.poll(() => page.evaluate(() => window.__planReads.held.length)).toBe(3);
    await enterServings(page, '30'); await keyboardBuild(page);
    await expect.poll(() => page.evaluate(() => window.__planReads.held.length)).toBe(6);
    await releaseReads(page, 3);
    await expect(page.locator('.ak-plan-day')).toHaveCount(0);
    await expect(page.locator('#ak-plan-generate')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator(status)).toHaveText('Finding matching stored recipes…');
    await releaseReads(page, 3); await assertValid(page, 30, true);
    await pointer(page, copy);
    await expect.poll(() => page.evaluate(() => window.__planCopy.held.length)).toBe(1);
    await enterServings(page, '5.5'); await pointer(page, '#ak-plan-generate'); await assertInvalid(page, '5.5');
    await page.evaluate(() => window.__planCopy.held.shift().reject(new Error('Synthetic obsolete copy denial')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await assertInvalid(page, '5.5');
    expect(await page.evaluate(() => window.__planCopy.legacy)).toBe(0);
    expect(await page.locator('textarea[readonly]').count()).toBe(0); expect(errors).toEqual([]);
  });

  test('held saved-plan restoration cannot overwrite an invalid edit and valid correction recovers', async ({ page, context, baseURL }) => {
    const errors = await openLocal(page, context, baseURL, variant.theme, { heldDetails: true, saved: true });
    await expect(page.locator('#ak-plan-servings')).toHaveValue('5');
    await enterServings(page, '31'); await pointer(page, '#ak-plan-generate'); await assertInvalid(page, '31');
    await releaseReads(page, 3); await assertInvalid(page, '31');
    await page.evaluate(() => { window.__planReads.immediate = true; });
    await enterServings(page, '1'); await keyboardBuild(page); await assertValid(page, 1, true);
    expect(errors).toEqual([]);
  });
});

async function openLocalProviderAfterReload(page) {
  await page.evaluate(ingredients => {
    window.__planReads = { held: [], immediate: false };
    window.AfroAuth = { getSupabase() { return { from() { return { select() { return { eq(column, id) { return { order() {
      const result = { data: ingredients[id] || [], error: null };
      if (window.__planReads.immediate) return Promise.resolve(result);
      return new Promise(resolve => window.__planReads.held.push({ id, resolve: () => resolve(result) }));
    } }; } }; } }; } }; } };
  }, ingredients);
}
