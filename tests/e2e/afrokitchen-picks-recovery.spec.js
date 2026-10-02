const { test, expect } = require('@playwright/test');

const home = '/tools/afrokitchen/';
const recipe = `${home}recipes/jollof-rice-ng/`;
const picksKey = 'ak_meal_plan_v1';
const corrupt = '{synthetic corrupt recipe picks';
const recovery = 'Your picked recipes could not be read because their saved data is damaged. Clear picks to remove only these picks, then add recipes again.';
const unavailable = 'This browser could not read your picked recipes. Check browser storage access, then reload to try again. Your saved data has not been changed.';
const variants = [{ width: 320, theme: 'light' }, { width: 320, theme: 'dark' }, { width: 390, theme: 'light' }, { width: 390, theme: 'dark' }];

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const b = node.getBoundingClientRect(), nav = document.querySelector('afro-navbar');
    const header = Math.max(0, (nav?.shadowRoot?.querySelector('nav') || nav)?.getBoundingClientRect().bottom || 0);
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height, header,
      full: b.top > header && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth,
      hit: node === hit || node.contains(hit), focused: document.activeElement === node,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
  });
}

async function settled(page, selector) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let previous = '', unchanged = 0;
  for (let sample = 0; sample < 60; sample++) {
    const current = await page.locator(selector).evaluate(node => {
      const b = node.getBoundingClientRect(); return JSON.stringify([scrollY.toFixed(1), b.top.toFixed(1), b.bottom.toFixed(1)]);
    });
    unchanged = previous === current ? unchanged + 1 : 0;
    if (unchanged >= 4) return;
    previous = current; await page.waitForTimeout(40);
  }
  throw Error(`Native geometry did not settle: ${selector}`);
}

async function reveal(page, selector) {
  await expect(page.locator(selector)).toBeVisible();
  await page.mouse.move(2, 425); await settled(page, selector);
  const first = await page.locator(selector).boundingBox();
  const budget = Math.ceil(Math.abs(first.y + first.height / 2 - 425) / 500) + 8;
  for (let movement = 0; movement < budget; movement++) {
    const b = await page.locator(selector).boundingBox(), distance = b.y + b.height / 2 - 425;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance))); await settled(page, selector);
  }
  const measured = await geometry(page, selector);
  expect(measured.full, JSON.stringify(measured)).toBe(true);
  expect(measured.hit, JSON.stringify(measured)).toBe(true);
  expect(measured.overflow).toBe(0);
  return measured;
}

async function pointer(page, selector, observation, stage) {
  await expect(page.locator(selector)).toBeEnabled();
  const before = await reveal(page, selector);
  await page.locator(selector).evaluate(node => {
    window.__picksRecovery.events = [];
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type,
      event => window.__picksRecovery.events.push({ type, trusted: event.isTrusted }), { once: true });
  });
  await page.mouse.click((before.left + before.right) / 2, (before.top + before.bottom) / 2);
  // Link activation replaces the document; collect its events before unload through a binding.
  if (selector === '[data-ak-picks-recovery]') {
    await expect(page).toHaveURL(new RegExp('/tools/afrokitchen/#ak-picked-recipes$'));
    observation.controls.push({ selector, stage, before, events: observation.linkEvents });
    expect(observation.linkEvents).toEqual(['mousedown', 'mouseup', 'click'].map(type => ({ type, trusted: true })));
    return;
  }
  const events = await page.evaluate(() => window.__picksRecovery.events);
  expect(events).toEqual(['mousedown', 'mouseup', 'click'].map(type => ({ type, trusted: true })));
  observation.controls.push({ selector, stage, before, events });
}

async function focusedBounds(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
  await expect.poll(async () => { const b = await geometry(page, selector); return b.full && b.hit && b.focused && b.overflow === 0; }).toBe(true);
  return geometry(page, selector);
}

async function open(page, context, baseURL, theme, initial, mode = '') {
  const origin = new URL(baseURL).origin;
  const observation = { pageErrors: [], nativeAborts: [], errors: [], warnings: [], failed: [], writes: [], ai: [], blocked: [], controls: [], linkEvents: [] };
  page.on('pageerror', error => {
    const item = { name: error.name, message: error.message };
    if (error.name === 'AbortError' && error.message === 'Transition was skipped') observation.nativeAborts.push(item);
    else observation.pageErrors.push(item);
  });
  page.on('console', message => { if (message.type() === 'error') observation.errors.push(message.text()); if (message.type() === 'warning') observation.warnings.push(message.text()); });
  const pendingAssets = new Set(); let lastAssetActivity = Date.now();
  const asset = request => new URL(request.url()).origin === origin && ['script', 'stylesheet', 'image', 'font'].includes(request.resourceType());
  page.on('request', request => { if (asset(request)) { pendingAssets.add(request); lastAssetActivity = Date.now(); } });
  for (const event of ['requestfinished', 'requestfailed']) page.on(event, request => { if (pendingAssets.delete(request)) lastAssetActivity = Date.now(); });
  page.on('requestfailed', request => observation.failed.push({ method: request.method(), path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
  observation.assets = () => ({ pending: pendingAssets.size, quiet: Date.now() - lastAssetActivity });
  observation.assetWaits = [];
  await page.exposeFunction('__recordPicksLink', event => observation.linkEvents.push(event));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url()), write = !['GET', 'HEAD'].includes(request.method());
    const ai = /\/ai(?:\/|-)|openai|anthropic/i.test(request.url());
    const metadata = { method: request.method(), origin: url.origin, path: url.pathname, type: request.resourceType() };
    if (write) observation.writes.push(metadata); if (ai) observation.ai.push(metadata);
    if (url.origin === origin && !write && !ai && !/^\/(?:api|\.netlify\/functions)\//.test(url.pathname)) return route.continue();
    observation.blocked.push(metadata);
    return route.fulfill({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : request.resourceType() === 'stylesheet' ? 'text/css' : 'application/json', body: ['script', 'stylesheet'].includes(request.resourceType()) ? '' : '{}' });
  });
  await context.addInitScript(({ theme, initial, mode }) => {
    localStorage.setItem('aft_theme', theme); localStorage.setItem('afrotools_cookie_consent', 'declined');
    if (!sessionStorage.getItem('synthetic_picks_seeded')) {
      localStorage.setItem('ak_meal_plan_v1', initial);
      localStorage.setItem('ak_saved_plan_v1', JSON.stringify({ version: 1, slugs: ['jollof-rice-ng', 'cachupa-rica-cv', 'caldo-de-mancarra-gw'], inputs: { days: 3, servings: 6, maxTime: 999, diet: '', country: '', occasion: '' } }));
      localStorage.setItem('ak_cooked_recipes_v1', JSON.stringify([{ slug: 'jollof-rice-ng', cooked_at: '2026-09-29T00:00:00.000Z' }]));
      localStorage.setItem('ak_static_recipe_jollof-rice-ng_v2', JSON.stringify({ servings: 6, checked: {}, timers: {} }));
      sessionStorage.setItem('synthetic_picks_seeded', '1'); sessionStorage.setItem('synthetic_picks_mode', mode);
    }
    window.__picksRecovery = { events: [], denied: [], operations: [] };
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'ak_meal_plan_v1' && get.call(sessionStorage, 'synthetic_picks_mode') === 'read') { window.__picksRecovery.denied.push('read'); throw Error('Synthetic denied picks read'); }
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ak_meal_plan_v1') {
        window.__picksRecovery.operations.push({ type: 'set', key, value });
        if (get.call(sessionStorage, 'synthetic_picks_mode') === 'write') { window.__picksRecovery.denied.push('write'); throw Error('Synthetic denied picks write'); }
      }
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      window.__picksRecovery.operations.push({ type: 'remove', key });
      if (key === 'ak_meal_plan_v1' && get.call(sessionStorage, 'synthetic_picks_mode') === 'clear') { window.__picksRecovery.denied.push('clear'); throw Error('Synthetic denied picks clear'); }
      return remove.call(this, key);
    };
    window.__rawPicks = () => get.call(localStorage, 'ak_meal_plan_v1');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText() { throw Error('Host clipboard excluded'); } } });
    window.print = () => { throw Error('Print excluded'); };
  }, { theme, initial, mode });
  return observation;
}

// Let actual local scripts/styles/images finish before deliberate later navigation.
// The held catalog fetch is not a render asset, so pre-catalog recovery remains observable.
async function assetsReady(page, observation) {
  await page.waitForLoadState('load');
  await expect.poll(() => { const assets = observation.assets(); return assets.pending === 0 && assets.quiet >= 200; }).toBe(true);
  observation.assetWaits.push(observation.assets());
}

async function navigate(page, observation, url) {
  if (page.url() !== 'about:blank') await assetsReady(page, observation);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname.includes('/afrokitchen/recipes/')) await page.locator('.ak-visual-exports > summary').click();
  await assetsReady(page, observation);
}

async function homeReady(page) {
  await expect(page.locator('#recipes-grid a[href*="/recipes/"]').first()).toBeVisible();
  await expect(page.locator('#ak-plan-generate')).toBeEnabled();
}

async function preserved(page) {
  return page.evaluate(() => ({ weekly: localStorage.getItem('ak_saved_plan_v1'), cooked: localStorage.getItem('ak_cooked_recipes_v1'), recipe: localStorage.getItem('ak_static_recipe_jollof-rice-ng_v2') }));
}

async function finish(page, observation, testInfo) {
  observation.local = await page.evaluate(() => window.__picksRecovery);
  await testInfo.attach('picks-recovery-observation', { body: Buffer.from(JSON.stringify(observation, null, 2)), contentType: 'application/json' });
  expect(observation.pageErrors).toEqual([]); expect(observation.errors).toEqual([]); expect(observation.failed).toEqual([]);
  expect(observation.writes).toEqual([]); expect(observation.ai).toEqual([]);
}

for (const variant of variants) test.describe(`${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });
  test('corrupt picks offer native recovery without changing other Kitchen state', async ({ page, context, baseURL, browserName }, testInfo) => {
    const observation = await open(page, context, baseURL, variant.theme, corrupt);
    let releaseIndex;
    try {
      await navigate(page, observation, home); await homeReady(page);
      await expect(page.locator('#ak-picked-recipes')).toBeVisible();
      await expect(page.locator('#ak-picked-status')).toHaveText(recovery);
      await expect(page.locator('#ak-plan-from-picks')).toBeDisabled(); await expect(page.locator('#ak-picks-clear')).toBeEnabled();
      expect(await page.evaluate(() => window.__rawPicks())).toBe(corrupt);
      const initialOther = await preserved(page);
      await navigate(page, observation, recipe); await expect(page.locator('[data-ak-add-meal-plan]')).toBeVisible();
      const other = await preserved(page);
      expect(other.weekly).toBe(initialOther.weekly); expect(other.cooked).toBe(initialOther.cooked);
      observation.recipeInitialization = { before: initialOther.recipe, after: other.recipe };
      await pointer(page, '[data-ak-add-meal-plan]', observation, 'corrupt-add');
      await expect(page.locator('#ak-static-action-status')).toHaveText('Your saved recipe picks are damaged. Open your picked recipes and choose Clear picks, then add this recipe again. Open picked recipes');
      expect(await page.evaluate(() => window.__rawPicks())).toBe(corrupt);
      expect(await page.evaluate(() => window.__picksRecovery.operations.filter(operation => operation.key === 'ak_meal_plan_v1'))).toEqual([]);
      await expect(page.locator('[data-ak-picks-recovery]')).toHaveAttribute('href', `${home}#ak-picked-recipes`);
      // Hold the actual local index response to prove recovery does not depend on catalog readiness.
      const indexGate = new Promise(resolve => { releaseIndex = resolve; });
      await context.route(`${baseURL}/tools/afrokitchen/recipe-index.json`, async route => { await indexGate; await route.continue(); });
      if (browserName === 'webkit') {
        // Default Windows WebKit skips ordinary links in Tab order; use a real pointer.
        await page.locator('[data-ak-picks-recovery]').evaluate(node => {
          for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type, event => window.__recordPicksLink({ type, trusted: event.isTrusted }), { once: true });
        });
        await pointer(page, '[data-ak-picks-recovery]', observation, 'recovery-link-pointer');
      } else {
        // Real Tab reaches the recovery link from the activated Add button.
        for (let step = 0; step < 4 && !await page.locator('[data-ak-picks-recovery]').evaluate(node => document.activeElement === node); step++) await page.keyboard.press('Tab');
        await reveal(page, '[data-ak-picks-recovery]');
        observation.recoveryLinkFocus = await focusedBounds(page, '[data-ak-picks-recovery]');
        await page.locator('[data-ak-picks-recovery]').evaluate(node => {
          for (const type of ['keydown', 'click']) node.addEventListener(type, event => window.__recordPicksLink({ type, trusted: event.isTrusted, key: event.key || null }), { once: true });
        });
        await page.keyboard.press('Enter');
        expect(observation.linkEvents).toEqual([{ type: 'keydown', trusted: true, key: 'Enter' }, { type: 'click', trusted: true, key: null }]);
      }
      await expect(page).toHaveURL(`${baseURL}${home}#ak-picked-recipes`);
      await expect(page.locator('#ak-picked-status')).toHaveText(recovery);
      await expect(page.locator('#ak-picks-clear')).toBeEnabled();
      await expect(page.locator('#recipes-grid a[href*="/recipes/"]')).toHaveCount(0);
      await assetsReady(page, observation);
      await settled(page, '#ak-picks-clear');
      observation.fragmentBeforeCatalog = await geometry(page, '#ak-picks-clear');
      expect(observation.fragmentBeforeCatalog.full, JSON.stringify(observation.fragmentBeforeCatalog)).toBe(true);
      expect(observation.fragmentBeforeCatalog.hit).toBe(true);
      const title = await geometry(page, '#ak-picked-recipes h3');
      expect(title.full, JSON.stringify(title)).toBe(true);
      releaseIndex(); await homeReady(page); await settled(page, '#ak-picks-clear');
      observation.fragmentAfterCatalog = await geometry(page, '#ak-picks-clear');
      expect(observation.fragmentAfterCatalog.full, JSON.stringify(observation.fragmentAfterCatalog)).toBe(true);
      expect(observation.fragmentAfterCatalog.hit).toBe(true);
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', 'clear'));
      await pointer(page, '#ak-picks-clear', observation, 'denied-explicit-clear');
      await expect(page.locator('#ak-picked-status')).toHaveText('This browser could not clear your picked recipes. Your picks have not been changed.');
      expect(await page.evaluate(() => window.__rawPicks())).toBe(corrupt); expect(await preserved(page)).toEqual(other);
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', ''));
      await pointer(page, '#ak-picks-clear', observation, 'explicit-clear');
      await expect(page.locator('#ak-picked-recipes')).toBeHidden(); await expect(page.locator('#ak-plan-status')).toHaveText('Picked recipes cleared from this device.');
      observation.afterClearFocus = await focusedBounds(page, '#ak-plan-generate');
      expect(await page.evaluate(() => window.__rawPicks())).toBeNull(); expect(await preserved(page)).toEqual(other);
      expect((await page.evaluate(() => window.__picksRecovery.operations)).filter(operation => operation.type === 'remove' && operation.key === picksKey)).toEqual([{ type: 'remove', key: picksKey }, { type: 'remove', key: picksKey }]);
      await navigate(page, observation, recipe); await expect(page.locator('[data-ak-add-meal-plan]')).toBeVisible();
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', 'write'));
      await pointer(page, '[data-ak-add-meal-plan]', observation, 'denied-recipe-save-after-clear');
      await expect(page.locator('#ak-static-action-status')).toHaveText('Could not save this recipe to the meal plan.'); expect(await page.evaluate(() => window.__rawPicks())).toBeNull();
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', ''));
      await pointer(page, '[data-ak-add-meal-plan]', observation, 'recipe-save-after-clear');
      await expect(page.locator('#ak-static-action-status')).toContainText('Recipe saved.');
      expect(JSON.parse(await page.evaluate(() => window.__rawPicks()))).toEqual([expect.objectContaining({ slug: 'jollof-rice-ng', name: 'Jollof Rice', servings: 6, url: recipe })]);
      expect(await preserved(page)).toEqual(other);
      await navigate(page, observation, home); await homeReady(page);
      await expect(page.locator('#ak-picked-list li')).toHaveCount(1); await expect(page.locator('#ak-plan-from-picks')).toBeEnabled();
      await expect(page.locator('#ak-plan-time')).toHaveValue('999');
      await expect(page.locator('#ak-picked-status')).toContainText('1 of 1 picked recipe matches your filters');
      await reveal(page, '#ak-picked-status'); await page.screenshot({ path: testInfo.outputPath('recovered-picks.png') });
    } finally { if (releaseIndex) releaseIndex(); await finish(page, observation, testInfo); }
  });

  test('unreadable picks stay distinct from empty while denied updates preserve valid picks', async ({ page, context, baseURL }, testInfo) => {
    const initial = JSON.stringify([{ slug: 'jollof-rice-ng' }, { slug: 'jollof-rice-ng' }, { slug: 'not-a-published-recipe' }, null]);
    const observation = await open(page, context, baseURL, variant.theme, initial, 'read');
    try {
      await navigate(page, observation, home); await homeReady(page);
      await expect(page.locator('#ak-picked-status')).toHaveText(unavailable);
      await expect(page.locator('#ak-plan-from-picks')).toBeDisabled(); await expect(page.locator('#ak-picks-clear')).toBeDisabled();
      expect(await page.evaluate(() => window.__rawPicks())).toBe(initial);
      const initialOther = await preserved(page);
      await navigate(page, observation, recipe); await expect(page.locator('[data-ak-add-meal-plan]')).toBeVisible();
      const other = await preserved(page);
      expect(other.weekly).toBe(initialOther.weekly); expect(other.cooked).toBe(initialOther.cooked);
      observation.recipeInitialization = { before: initialOther.recipe, after: other.recipe };
      await pointer(page, '[data-ak-add-meal-plan]', observation, 'denied-recipe-read');
      await expect(page.locator('#ak-static-action-status')).toHaveText('This browser could not read your saved recipe picks. Check browser storage access, then try again.');
      expect(await page.evaluate(() => window.__picksRecovery.operations.filter(operation => operation.key === 'ak_meal_plan_v1'))).toEqual([]); expect(await page.evaluate(() => window.__rawPicks())).toBe(initial);
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', ''));
      await navigate(page, observation, home); await homeReady(page);
      await expect(page.locator('#ak-picked-list li')).toHaveCount(1); await expect(page.locator('#ak-plan-from-picks')).toBeEnabled();
      await expect(page.locator('#ak-plan-time')).toHaveValue('999');
      await expect(page.locator('#ak-picked-status')).toContainText('1 of 1 picked recipe matches your filters');
      await expect(page.locator('#ak-picked-list a')).toHaveAttribute('href', recipe);
      // A later storage denial must not erase data or leave focus on the removed list button.
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', 'read'));
      await pointer(page, '#ak-picked-list button', observation, 'picked-recipe-remove-read-denial');
      await expect(page.locator('#ak-picked-status')).toHaveText(unavailable);
      expect(await page.evaluate(() => window.__rawPicks())).toBe(initial);
      observation.afterDeniedRemoveFocus = await focusedBounds(page, '#ak-plan-generate');
      expect(await page.evaluate(() => window.__picksRecovery.operations.filter(operation => operation.key === 'ak_meal_plan_v1'))).toEqual([]);
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', ''));
      await assetsReady(page, observation); await page.reload({ waitUntil: 'domcontentloaded' }); await assetsReady(page, observation); await homeReady(page);
      await expect(page.locator('#ak-picked-list li')).toHaveCount(1);
      await expect(page.locator('#ak-plan-from-picks')).toBeEnabled();
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', 'write'));
      await pointer(page, '#ak-picked-list button', observation, 'denied-picked-recipe-remove');
      await expect(page.locator('#ak-plan-status')).toHaveText('This browser could not update your picked recipes.');
      expect(await page.evaluate(() => window.__rawPicks())).toBe(initial); await expect(page.locator('#ak-picked-list li')).toHaveCount(1);
      await page.evaluate(() => sessionStorage.setItem('synthetic_picks_mode', ''));
      await pointer(page, '#ak-picked-list button', observation, 'picked-recipe-remove');
      await expect(page.locator('#ak-picked-recipes')).toBeHidden(); expect(await page.evaluate(() => window.__rawPicks())).toBe('[]');
      expect(await preserved(page)).toEqual(other);
      observation.afterRemoveFocus = await focusedBounds(page, '#ak-plan-generate');
      await assetsReady(page, observation); await page.reload({ waitUntil: 'domcontentloaded' }); await assetsReady(page, observation); await homeReady(page);
      await expect(page.locator('#ak-picked-recipes')).toBeHidden();
    } finally { await finish(page, observation, testInfo); }
  });
});


test.describe('320 dark delayed catalog', () => {
  test.use({ viewport: { width: 320, height: 850 }, colorScheme: 'dark' });
  test('native user scrolling cancels later recovery alignment', async ({ page, context, baseURL }, testInfo) => {
    const observation = await open(page, context, baseURL, 'dark', corrupt);
    let releaseIndex;
    await context.addInitScript(() => {
      window.__fragmentScrolls = [];
      const scroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (options) {
        if (this.id === 'ak-picked-recipes') window.__fragmentScrolls.push({ at: performance.now(), scrollY, options });
        return scroll.call(this, options);
      };
      window.__trustedWheels = [];
      window.addEventListener('wheel', event => { if (event.isTrusted) window.__trustedWheels.push({ at: performance.now(), deltaY: event.deltaY }); }, { passive: true });
    });
    try {
      const gate = new Promise(resolve => { releaseIndex = resolve; });
      await context.route(baseURL + '/tools/afrokitchen/recipe-index.json', async route => { await gate; await route.continue(); });
      await navigate(page, observation, home + '#ak-picked-recipes');
      await expect(page.locator('#ak-picked-status')).toHaveText(recovery);
      await settled(page, '#ak-picks-clear');
      const initial = await geometry(page, '#ak-picks-clear');
      expect(initial.full, JSON.stringify(initial)).toBe(true); expect(initial.hit).toBe(true);
      await expect(page.locator('#recipes-grid a[href*="/recipes/"]')).toHaveCount(0);
      const before = await page.evaluate(() => ({ scrollY, calls: window.__fragmentScrolls, active: document.activeElement.tagName }));
      await page.mouse.move(2, 425); await page.mouse.wheel(0, -500);
      await expect.poll(() => page.evaluate(() => window.__trustedWheels.length)).toBe(1);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before.scrollY);
      await settled(page, '#ak-picks-clear');
      const user = await page.evaluate(() => ({ scrollY, calls: window.__fragmentScrolls, active: document.activeElement.tagName, wheels: window.__trustedWheels }));
      releaseIndex(); await homeReady(page); await settled(page, '#ak-picks-clear');
      const after = await page.evaluate(() => ({ scrollY, calls: window.__fragmentScrolls, active: document.activeElement.tagName }));
      expect(after.calls).toEqual(user.calls); expect(after.active).toBe(user.active);
      expect(await page.evaluate(() => window.__rawPicks())).toBe(corrupt);
      await expect(page.locator('#ak-picked-status')).toHaveText(recovery);
      observation.userScrollCancellation = { initial, before, user, after, finalGeometry: await geometry(page, '#ak-picks-clear') };
    } finally { if (releaseIndex) releaseIndex(); await finish(page, observation, testInfo); }
  });
});
