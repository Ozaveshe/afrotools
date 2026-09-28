const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const home = '/tools/afrokitchen/';
const recipe = `${home}recipes/jollof-rice-ng/`;
const variants = [
  { width: 320, theme: 'light' }, { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' }, { width: 390, theme: 'dark' }
];

async function bounds(page, selector) {
  return page.locator(selector).evaluate(node => {
    const box = node.getBoundingClientRect(), navbar = document.querySelector('afro-navbar');
    const nav = navbar?.shadowRoot?.querySelector('nav') || navbar;
    const header = nav?.getBoundingClientRect().bottom || 0;
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right,
      height: box.height, width: box.width, header,
      full: box.top >= header + 1 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth,
      hit: node === hit || node.contains(hit), focused: document.activeElement === node,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
  });
}

async function settled(page, selector) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let previous = '', unchanged = 0;
  for (let sample = 0; sample < 60; sample++) {
    const current = await page.locator(selector).evaluate(node => {
      const rect = node.getBoundingClientRect();
      return JSON.stringify([scrollY.toFixed(1), rect.top.toFixed(1), rect.bottom.toFixed(1)]);
    });
    unchanged = current === previous ? unchanged + 1 : 0;
    if (unchanged >= 4) return;
    previous = current;
    await page.waitForTimeout(40);
  }
  throw new Error(`Native scroll did not settle for ${selector}`);
}

async function reveal(page, selector) {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  const center = page.viewportSize().height / 2;
  // A neutral margin avoids inherited hover transforms while scrolling.
  await page.mouse.move(2, center);
  await settled(page, selector);
  const initial = await target.boundingBox();
  const budget = Math.ceil(Math.abs(initial.y + initial.height / 2 - center) / 500) + 8;
  for (let movement = 0; movement < budget; movement++) {
    const rect = await target.boundingBox(), distance = rect.y + rect.height / 2 - center;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance)));
    await settled(page, selector);
  }
  const geometry = await bounds(page, selector);
  expect(geometry.full, JSON.stringify(geometry)).toBe(true);
  expect(geometry.hit, JSON.stringify(geometry)).toBe(true);
  expect(geometry.overflow).toBe(0);
  return geometry;
}

async function pointer(page, selector) {
  await expect(page.locator(selector)).toBeEnabled();
  const geometry = await reveal(page, selector);
  page.__taskObservation.nativeEvents.pointer = [];
  await page.evaluate(selector => {
    const control = document.querySelector(selector);
    for (const type of ['mousedown', 'mouseup', 'click']) control.addEventListener(type,
      event => window.__recordTaskNative('pointer', { type, trusted: event.isTrusted }), { once: true });
  }, selector);
  await page.mouse.click((geometry.left + geometry.right) / 2, (geometry.top + geometry.bottom) / 2);
  await expect.poll(() => page.__taskObservation.nativeEvents.pointer).toEqual(
    ['mousedown', 'mouseup', 'click'].map(type => ({ type, trusted: true })));
  page.__taskObservation.nativeControls.push({ selector, geometry, events: [...page.__taskObservation.nativeEvents.pointer] });
}

async function keyboardBuild(page) {
  await page.locator('#ak-plan-servings').fill('5');
  let focused = false;
  for (let step = 0; step < 12; step++) {
    await page.keyboard.press('Tab');
    if (await page.locator('#ak-plan-from-picks').evaluate(node => document.activeElement === node)) {
      focused = true; break;
    }
  }
  expect(focused, 'Native Tab must reach Build plan from my picks.').toBe(true);
  const geometry = await reveal(page, '#ak-plan-from-picks');
  await expect(page.locator('#ak-plan-from-picks')).toBeFocused();
  page.__taskObservation.nativeEvents.keyboard = [];
  await page.evaluate(() => {
    const button = document.querySelector('#ak-plan-from-picks');
    for (const type of ['keydown', 'click']) button.addEventListener(type,
      event => window.__recordTaskNative('keyboard', { type, key: event.key || null, trusted: event.isTrusted }), { once: true });
  });
  await page.keyboard.press('Enter');
  await expect.poll(() => page.__taskObservation.nativeEvents.keyboard).toEqual([
    { type: 'keydown', key: 'Enter', trusted: true }, { type: 'click', key: null, trusted: true }
  ]);
  page.__taskObservation.nativeControls.push({ selector: '#ak-plan-from-picks', keyboard: 'Tab and Enter', geometry,
    events: [...page.__taskObservation.nativeEvents.keyboard] });
}

async function heroAction(page, testInfo, browserName) {
  const selector = '.ak-hero-actions a[href="#browse-panel"]';
  async function contrast(state) {
    const colors = await page.locator(selector).evaluate(node => {
      const style = getComputedStyle(node);
      return { foreground: style.color, background: style.backgroundColor,
        fontSize: style.fontSize, fontWeight: style.fontWeight,
        focusVisible: node.matches(':focus-visible'), hovered: node.matches(':hover') };
    });
    function luminance(color) {
      const components = color.match(/[\d.]+/g).map(Number);
      expect(components.length === 3 || components[3] === 1, color).toBe(true);
      return components.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    }
    const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => a - b);
    const ratio = (values[1] + .05) / (values[0] + .05);
    expect(ratio, `${state}: ${JSON.stringify(colors)}`).toBeGreaterThanOrEqual(4.5);
    page.__taskObservation.heroContrast.push({ state, ...colors, ratio });
  }
  await reveal(page, selector);
  await contrast('rest');
  const hover = await bounds(page, selector);
  await page.mouse.move((hover.left + hover.right) / 2, (hover.top + hover.bottom) / 2);
  await settled(page, selector);
  await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(154, 42, 17)');
  await contrast('hover');
  if (browserName === 'webkit') {
    // This runner skips native anchors with Tab and Alt+Tab on the unchanged page too.
    // Keep actual pointer navigation and contrast here; button keyboard flow is checked below.
    page.__taskObservation.heroKeyboardCoverage = 'Unavailable in this WebKit configuration: native Tab/Alt+Tab skip links in exact base and candidate.';
    await reveal(page, selector);
    await page.screenshot({ path: testInfo.outputPath('hero-primary-pointer.png') });
    await pointer(page, selector);
    await expect(page).toHaveURL(/\/tools\/afrokitchen\/#browse-panel$/);
    return;
  }
  page.__taskObservation.heroKeyboardCoverage = 'Native Tab focus and Enter activation.';
  await page.mouse.move(2, page.viewportSize().height / 2);
  let reached = false;
  for (let step = 0; step < 32; step++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate(node => document.activeElement === node)) {
      reached = true; break;
    }
  }
  expect(reached, 'Native Tab must reach the primary recipe-discovery action.').toBe(true);
  const geometry = await reveal(page, selector);
  await expect(page.locator(selector)).toBeFocused();
  await contrast('native Tab focus');
  expect(page.__taskObservation.heroContrast.at(-1).focusVisible).toBe(true);
  page.__taskObservation.nativeEvents.keyboard = [];
  await page.locator(selector).evaluate(control => {
    for (const type of ['keydown', 'click']) control.addEventListener(type,
      event => window.__recordTaskNative('keyboard', { type, key: event.key || null, trusted: event.isTrusted }), { once: true });
  });
  await page.screenshot({ path: testInfo.outputPath('hero-primary-focus.png') });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tools\/afrokitchen\/#browse-panel$/);
  await expect.poll(() => page.__taskObservation.nativeEvents.keyboard).toEqual([
    { type: 'keydown', key: 'Enter', trusted: true }, { type: 'click', key: null, trusted: true }
  ]);
  page.__taskObservation.nativeControls.push({ selector, keyboard: 'Tab and Enter', geometry,
    events: [...page.__taskObservation.nativeEvents.keyboard] });
}

async function cleanTaskFlow(page) {
  await expect(page.locator('script[src*="african-workflow"], link[href*="african-workflow"]')).toHaveCount(0);
  await expect(page.locator('[data-african-workflow-mounted], [data-afw-save], [data-afw-pdf]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save to dashboard', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Meal plan PDF', exact: true })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Source-backed pass|Gap found|AfroTools upgrade|Save recipe plan for dashboard/);
  await expect(page.getByRole('link', { name: 'Find a dish', exact: true })).toHaveAttribute('href', '#browse-panel');
  await expect(page.getByRole('link', { name: 'Plan this week', exact: true })).toHaveAttribute('href', '#cook-this-week');
  expect(await page.evaluate(() => localStorage.getItem('african_workflow_items'))).toBeNull();
  expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
}

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const observation = { writes: [], ai: [], workflowRequests: [], blocked: [], errors: [], consoleErrors: [],
    nativeControls: [], heroContrast: [], nativeEvents: { pointer: [], keyboard: [] } };
  page.__taskObservation = observation;
  await page.exposeFunction('__recordTaskNative', (kind, event) => observation.nativeEvents[kind].push(event));
  page.on('request', request => {
    const url = new URL(request.url()), metadata = { method: request.method(), origin: url.origin, path: url.pathname };
    if (!['GET', 'HEAD'].includes(request.method())) observation.writes.push(metadata);
    if (/\/ai-(?:advisor|route-intent|assist)|\/api\/ai(?:\/|$)|anthropic|openai\.com/i.test(request.url())) observation.ai.push(metadata);
    if (/african-workflow\.(?:js|css)$/.test(url.pathname)) observation.workflowRequests.push(metadata);
  });
  page.on('pageerror', error => observation.errors.push({ name: error.name, message: error.message }));
  page.on('console', message => { if (message.type() === 'error') observation.consoleErrors.push(message.text()); });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const allowed = url.origin === origin && ['GET', 'HEAD'].includes(request.method()) &&
      !/\/ai-(?:advisor|route-intent|assist)|\/api\/ai(?:\/|$)/i.test(url.pathname);
    if (allowed) return route.continue();
    observation.blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
    // Empty external script/styles preserve local rendering without contacting their hosts.
    if (url.origin !== origin && request.method() === 'GET' && ['script', 'stylesheet'].includes(request.resourceType())) {
      return route.fulfill({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/css', body: '' });
    }
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.__taskFlow = { clipboard: [], print: [], controls: [], pointer: [], keyboard: [], deniedSaves: 0 };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: text => { window.__taskFlow.clipboard.push(text); return Promise.resolve(); }
    } });
    document.execCommand = () => { throw new Error('Host clipboard access is excluded from this test.'); };
    window.print = () => window.__taskFlow.print.push({
      scoped: document.body.hasAttribute('data-ak-print-plan'),
      meals: [...document.querySelectorAll('.ak-plan-day h4 a')].map(node => node.textContent),
      shopping: [...document.querySelectorAll('.ak-plan-shopping-group li')].map(node => node.textContent.trim())
    });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const observation = page.__taskObservation;
  await testInfo.attach('local task flow observation', {
    body: Buffer.from(JSON.stringify({ ...observation, nativeTransitionAborts: observation.errors.filter(
      error => error.name === 'AbortError' && error.message === 'Transition was skipped').length,
      probe: await page.evaluate(() => window.__taskFlow) }, null, 2)), contentType: 'application/json'
  });
  expect(observation.writes).toEqual([]);
  expect(observation.ai).toEqual([]);
  expect(observation.workflowRequests).toEqual([]);
  // Known native transition cancellation is counted above rather than reported as zero total errors.
  expect(observation.errors.filter(error => error.name !== 'AbortError' || error.message !== 'Transition was skipped')).toEqual([]);
});

for (const variant of variants) test.describe(`${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });
  test('recipe picks lead to one usable planner, current shopping list and honest local exports', async ({ page, browserName }, testInfo) => {
    test.setTimeout(120000);
    await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), variant.theme);
    await page.goto(home, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    await cleanTaskFlow(page);
    await heroAction(page, testInfo, browserName);
    await page.goto(recipe, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#ak-static-servings')).toHaveText('6');
    await pointer(page, 'button[aria-label="Increase servings"]');
    await expect(page.locator('#ak-static-servings')).toHaveText('7');
    await pointer(page, '[data-ak-add-meal-plan]');
    await expect(page.locator('#ak-static-action-status')).toContainText('Recipe saved');
    await pointer(page, '#ak-static-action-status a');
    await expect(page).toHaveURL(/\/tools\/afrokitchen\/#cook-this-week$/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    await expect(page.locator('#ak-picked-recipes')).toBeVisible();
    await cleanTaskFlow(page);

    await page.locator('#ak-plan-days').selectOption('3');
    await page.locator('#ak-plan-time').selectOption('999');
    await page.locator('#ak-plan-servings').fill('5');
    await page.keyboard.press('Tab');
    await pointer(page, '#ak-plan-generate');
    await expect(page.locator('.ak-plan-day')).toHaveCount(3);
    await keyboardBuild(page);
    await expect(page.locator('.ak-plan-day')).toHaveCount(3);
    await expect(page.locator('.ak-plan-day h4 a').first()).toHaveText('Jollof Rice');
    await expect(page.locator('.ak-plan-shopping')).toContainText('2½ cups long-grain parboiled rice');
    const meals = await page.locator('.ak-plan-day h4 a').allTextContents();
    const rows = (await page.locator('.ak-plan-shopping-group li').allTextContents()).map(row => row.trim());
    expect(rows.length).toBeGreaterThan(10);
    await expect(page.locator('#ak-plan-save')).toHaveText('Save plan on this device');
    await expect(page.locator('#ak-plan-save')).toHaveCount(1);
    await pointer(page, '#ak-plan-copy');
    await expect(page.locator('#ak-plan-status')).toHaveText('Shopping list copied.');
    const copied = await page.evaluate(() => window.__taskFlow.clipboard.at(-1));
    expect(copied).toMatch(/^Shopping list\n/);
    expect(copied.split('\n').filter(line => line.startsWith('- '))).toEqual(rows.map(row => `- ${row}`));
    expect(copied).toContain('2½ cups long-grain parboiled rice (Day 1: Jollof Rice)');

    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      window.__restoreTaskStorage = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function (key, value) {
        if (key === 'ak_saved_plan_v1') { window.__taskFlow.deniedSaves++; throw new Error('Synthetic denied local plan write.'); }
        return original.call(this, key, value);
      };
    });
    await pointer(page, '#ak-plan-save');
    await expect(page.locator('#ak-plan-status')).toHaveText('This browser could not save your plan. You can still export it as a text file.');
    await expect(page.locator('#ak-plan-save')).toBeEnabled();
    expect(await page.evaluate(() => localStorage.getItem('ak_saved_plan_v1'))).toBeNull();
    expect(await page.evaluate(() => window.__taskFlow.deniedSaves)).toBe(1);
    await page.evaluate(() => window.__restoreTaskStorage());
    await pointer(page, '#ak-plan-save');
    await expect(page.locator('#ak-plan-status')).toHaveText('Plan saved on this device. Open it again whenever you return.');
    await expect(page.locator('#ak-plan-save')).toHaveText('Saved on this device');
    await expect(page.locator('#ak-plan-save')).toBeDisabled();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ak_saved_plan_v1')));
    expect(saved.version).toBe(1); expect(saved.slugs).toHaveLength(3);
    expect(saved.slugs[0]).toBe('jollof-rice-ng');
    expect(saved.inputs).toMatchObject({ days: 3, servings: 5, maxTime: 999 });
    page.__taskObservation.beforeReload = await page.evaluate(() => window.__taskFlow);

    await page.reload();
    await expect(page.locator('#ak-plan-status')).toHaveText('Saved plan restored from this device.');
    expect(await page.locator('.ak-plan-day h4 a').allTextContents()).toEqual(meals);
    expect((await page.locator('.ak-plan-shopping-group li').allTextContents()).map(row => row.trim())).toEqual(rows);
    await cleanTaskFlow(page);
    const waiting = page.waitForEvent('download');
    await pointer(page, '#ak-plan-export');
    const download = await waiting;
    expect(download.suggestedFilename()).toBe('afrokitchen-3-day-plan.txt');
    const downloadPath = testInfo.outputPath('current-plan.txt');
    await download.saveAs(downloadPath);
    const text = fs.readFileSync(downloadPath, 'utf8');
    expect(text).toContain('Servings per recipe: 5\n');
    for (const [index, meal] of meals.entries()) expect(text).toContain(`Day ${index + 1}: ${meal}\n`);
    expect((text.match(/\?plan_servings=5\n/g) || []).length).toBe(3);
    expect(text.split('\n').filter(line => line.startsWith('- '))).toEqual(rows.map(row => `- ${row}`));
    await expect(page.locator('#ak-plan-status')).toHaveText('Plan exported as a text file.');

    await pointer(page, '#ak-plan-print');
    expect(await page.evaluate(() => window.__taskFlow.print)).toEqual([{ scoped: true, meals, shopping: rows }]);
    await expect(page.locator('#ak-plan-status')).toHaveText('Opening print dialog for this plan.');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#ak-plan-result h3').first()).toBeVisible();
    await expect(page.locator('.ak-hero')).toBeHidden();
    await expect(page.locator('.ak-planner-grid')).toBeHidden();
    await expect(page.locator('afro-navbar')).toBeHidden();
    await expect(page.locator('#ak-plan-print')).toBeHidden();
    await expect(page.locator('.ak-plan-shopping')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    await expect(page.locator('#ak-plan-print')).toBeVisible();
    await expect(page.locator('.ak-planner-grid')).toBeVisible();
    await expect(page.locator('afro-navbar')).toBeVisible();
    await cleanTaskFlow(page);
    await reveal(page, '#ak-plan-print');
    await page.screenshot({ path: testInfo.outputPath('current-planner.png') });
  });
});
