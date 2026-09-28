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

async function clipboard(page, mode, legacy = 'false') {
  await page.evaluate(({ mode, legacy }) => window.__configurePlannerClipboard(mode, legacy), { mode, legacy });
}

async function build(page, servings = 5) {
  await page.locator('#ak-plan-days').selectOption('3');
  await page.locator('#ak-plan-time').selectOption('999');
  await page.locator('#ak-plan-servings').fill(String(servings));
  await page.keyboard.press('Tab');
  await expect(page.locator('#ak-plan-from-picks')).toBeEnabled();
  await pointer(page, '#ak-plan-from-picks');
  await expect(page.locator('.ak-plan-day')).toHaveCount(3);
  await expect(page.locator('.ak-plan-day').first().locator('h4')).toHaveText('Jollof Rice');
  await expect(page.locator(status)).toContainText('Plan generated');
  await settled(page, copy);
}

async function verifyShopping(page, text, servings) {
  const groups = await page.locator('.ak-plan-shopping-group').evaluateAll(nodes => nodes.map(node => ({
    heading: node.querySelector('h4').textContent.trim(), rows: [...node.querySelectorAll('li')].map(row => row.textContent.trim())
  })));
  expect(groups.length).toBeGreaterThan(1);
  expect(text).toMatch(/^Shopping list\n/);
  expect(text).not.toContain('\\n');
  for (const group of groups) {
    expect(text).toContain(`${group.heading}:\n`);
  }
  expect(text.split('\n').filter(line => line.startsWith('- '))).toEqual(groups.flatMap(group => group.rows.map(row => `- ${row}`)));
  expect(text).toContain(`${servings === 5 ? '2½' : '3'} cups long-grain parboiled rice (Day 1: Jollof Rice)`);
}

async function downloadPlan(page, testInfo, servings) {
  const waiting = page.waitForEvent('download').then(value => ({ value }), error => ({ error }));
  await pointer(page, txt);
  const event = await waiting;
  if (event.error) throw event.error;
  expect(event.value.suggestedFilename()).toBe('afrokitchen-3-day-plan.txt');
  const path = testInfo.outputPath(`plan-${servings}.txt`);
  await event.value.saveAs(path);
  const content = fs.readFileSync(path, 'utf8');
  expect(content).toContain(`Servings per recipe: ${servings}\n`);
  const meals = await page.locator('.ak-plan-day h4 a').evaluateAll(nodes => nodes.map(node => ({ name: node.textContent, href: node.getAttribute('href') })));
  expect(meals).toHaveLength(3);
  for (const [index, meal] of meals.entries()) {
    expect(content).toContain(`Day ${index + 1}: ${meal.name}\n`);
    expect(content).toContain(`Recipe: ${new URL(meal.href, page.url()).href}\n`);
    expect(meal.href).toContain(`?plan_servings=${servings}`);
  }
  await verifyShopping(page, content.slice(content.indexOf('Shopping list\n')), servings);
  await expect(page.locator(status)).toHaveText('Plan exported as a text file.');
  return content;
}

test.beforeEach(async ({ page, context, baseURL }) => {
  pointerProof.set(page, []);
  await page.exposeFunction('__recordPlannerPointer', type => pointerEvents.get(page).push(type));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    if (/google|googletagmanager/.test(url.hostname)) return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    if (!localStorage.getItem('ak_meal_plan_v1')) localStorage.setItem('ak_meal_plan_v1', JSON.stringify([{ slug: 'jollof-rice-ng', servings: 7 }]));
    window.__plannerProbe = { events: [], requests: [], legacy: [], held: [], prompts: [], revoked: [], mode: 'success', legacyMode: 'false' };
    window.prompt = (...args) => { window.__plannerProbe.prompts.push(args); return null; };
    document.execCommand = command => {
      const p = window.__plannerProbe;
      p.legacy.push({ command, text: document.activeElement?.value });
      if (p.legacyMode === 'throw') throw new Error('Synthetic legacy copy denial');
      return p.legacyMode === 'true';
    };
    window.__configurePlannerClipboard = (mode, legacy) => {
      const p = window.__plannerProbe; p.mode = mode; p.legacyMode = legacy;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : {
        writeText(text) {
          p.requests.push(text);
          if (p.mode === 'sync-throw') throw new Error('Synthetic synchronous clipboard denial');
          if (p.mode === 'deny') return Promise.reject(new Error('Synthetic clipboard denial'));
          if (p.mode === 'held') return new Promise((resolve, reject) => p.held.push({ resolve, reject }));
          return Promise.resolve();
        }
      } });
    };
    window.__configurePlannerClipboard('success', 'false');
  });
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach('native-pointer-controls', { body: Buffer.from(JSON.stringify(pointerProof.get(page), null, 2)), contentType: 'application/json' });
});

for (const variant of variants) {
  test.describe(`${variant.width} ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), variant.theme);
    });

    test('shopping copy reports real outcomes and local TXT survives clipboard denial', async ({ page }, testInfo) => {
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(home); await build(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      for (const [mode, legacy] of [['success', 'false'], ['absent', 'true'], ['deny', 'true'], ['absent', 'false'], ['absent', 'throw'], ['sync-throw', 'false'], ['deny', 'false']]) {
        await clipboard(page, mode, legacy);
        await pointer(page, copy);
        await expect(page.locator(status)).toHaveText(legacy === 'true' || mode === 'success' ? 'Shopping list copied.' : 'Clipboard unavailable. Use Export TXT to keep this plan and shopping list.');
        await expect(page.locator(copy)).toHaveText(legacy === 'true' || mode === 'success' ? 'Copied' : 'Copy shopping list');
        expect(await page.locator('textarea[readonly]').count()).toBe(0);
        if (mode !== 'success') await focusBounds(page, copy);
        const p = await page.evaluate(() => window.__plannerProbe);
        await verifyShopping(page, mode === 'success' ? p.requests.at(-1) : p.legacy.at(-1).text, 5);
        expect(p.prompts).toEqual([]);
      }
      await downloadPlan(page, testInfo, 5);
      await page.evaluate(() => {
        const create = URL.createObjectURL, revoke = URL.revokeObjectURL, click = HTMLAnchorElement.prototype.click;
        window.__restoreDownload = () => { URL.createObjectURL = create; URL.revokeObjectURL = revoke; HTMLAnchorElement.prototype.click = click; };
        URL.createObjectURL = () => { throw new Error('Synthetic URL denial'); };
      });
      await pointer(page, txt);
      await expect(page.locator(status)).toHaveText('Text download unavailable. You can still copy the shopping list or print this plan.');
      await focusBounds(page, txt);
      expect(await page.locator('a[download]').count()).toBe(0);
      await page.evaluate(() => {
        window.__restoreDownload();
        URL.createObjectURL = () => 'blob:synthetic-local-plan';
        URL.revokeObjectURL = value => window.__plannerProbe.revoked.push(value);
        HTMLAnchorElement.prototype.click = function () { if (this.download) throw new Error('Synthetic anchor denial'); };
      });
      await pointer(page, txt);
      await expect(page.locator(status)).toContainText('Text download unavailable');
      await focusBounds(page, txt);
      expect(await page.locator('a[download]').count()).toBe(0);
      expect(await page.evaluate(() => window.__plannerProbe.revoked)).toEqual(['blob:synthetic-local-plan']);
      await page.evaluate(() => window.__restoreDownload());
      await downloadPlan(page, testInfo, 5);
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('export-recovery.png') });
    });

    test('held shopping copy follows current plan and preserves moved keyboard focus', async ({ page }) => {
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(home); await build(page);
      await clipboard(page, 'held'); await pointer(page, copy);
      await page.keyboard.press('Tab'); await focusBounds(page, txt);
      await page.evaluate(() => window.__plannerProbe.held.shift().reject(new Error('Synthetic held denial')));
      await expect(page.locator(status)).toContainText('Clipboard unavailable'); await focusBounds(page, txt);
      expect(await page.locator('textarea[readonly]').count()).toBe(0);

      await clipboard(page, 'held'); await pointer(page, copy);
      await page.locator('#ak-plan-servings').fill('6'); await page.keyboard.press('Tab');
      await expect(page.locator('.ak-plan-day')).toHaveCount(0);
      const before = await page.evaluate(() => ({ status: document.querySelector('#ak-plan-status').textContent, active: document.activeElement.id, legacy: window.__plannerProbe.legacy.length }));
      await page.evaluate(() => window.__plannerProbe.held.shift().resolve());
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await page.evaluate(() => ({ status: document.querySelector('#ak-plan-status').textContent, active: document.activeElement.id, legacy: window.__plannerProbe.legacy.length }))).toEqual(before);

      await build(page, 5); await clipboard(page, 'held'); await pointer(page, copy);
      await build(page, 6);
      const rebuilt = await page.locator(status).textContent();
      const legacyBefore = await page.evaluate(() => window.__plannerProbe.legacy.length);
      await page.evaluate(() => window.__plannerProbe.held.shift().reject(new Error('Synthetic stale denial')));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(page.locator(status)).toHaveText(rebuilt);
      expect(await page.evaluate(() => window.__plannerProbe.legacy.length)).toBe(legacyBefore);

      await clipboard(page, 'held'); await pointer(page, copy);
      await clipboard(page, 'success'); await pointer(page, copy);
      await expect(page.locator(status)).toHaveText('Shopping list copied.');
      await page.evaluate(() => window.__plannerProbe.held.shift().reject(new Error('Synthetic superseded denial')));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(page.locator(status)).toHaveText('Shopping list copied.');
      const p = await page.evaluate(() => window.__plannerProbe);
      expect(p.legacy).toHaveLength(legacyBefore); expect(p.prompts).toEqual([]);
      await verifyShopping(page, p.requests.at(-1), 6);
      expect(await page.locator('textarea[readonly]').count()).toBe(0); expect(errors).toEqual([]);
    });

    test('saved plan links and TXT open the planned servings while direct recipes keep local settings', async ({ page }, testInfo) => {
      const errors = []; page.on('pageerror', error => { if (error.name !== 'AbortError' || error.message !== 'Transition was skipped') errors.push(error.message); });
      await page.goto(recipe); await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
      await pointer(page, 'button[aria-label="Increase servings"]');
      await expect(page.locator('#ak-static-servings')).toHaveText('7');
      await pointer(page, '[data-ak-add-meal-plan]');
      await expect(page.locator('#ak-static-action-status')).toContainText('Recipe saved');
      await pointer(page, '#ak-static-action-status a');
      await expect(page).toHaveURL(/\/tools\/afrokitchen\/#cook-this-week$/);
      await build(page, 5);
      const shopping = await page.locator('.ak-plan-shopping').textContent();
      expect(shopping).toContain('2½ cups long-grain parboiled rice');
      await pointer(page, '#ak-plan-save');
      const slugs = await page.locator('.ak-plan-day h4 a').allTextContents();
      await page.reload(); await expect(page.locator(status)).toHaveText('Saved plan restored from this device.');
      expect(await page.locator('.ak-plan-day h4 a').allTextContents()).toEqual(slugs);
      expect(await page.locator('.ak-plan-shopping').textContent()).toBe(shopping);
      await downloadPlan(page, testInfo, 5);
      const first = '.ak-plan-day:first-child .ak-planner-actions a';
      await expect(page.locator(first)).toHaveAttribute('href', `${recipe}?plan_servings=5`);
      await pointer(page, first);
      await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
      await expect(page.locator('#ak-static-servings')).toHaveText('5');
      await expect(page.locator('#ak-static-ingredients')).toContainText('2½ cups long-grain parboiled rice');
      await clipboard(page, 'success'); await pointer(page, '[data-ak-copy-recipe]');
      await expect(page.locator('#ak-static-action-status')).toHaveText('Recipe copied.');
      const copied = await page.evaluate(() => window.__plannerProbe.requests.at(-1));
      expect(copied).toContain('Servings: 5 servings\n'); expect(copied).toContain('- 2½ cups long-grain parboiled rice');
      expect(copied).toContain('\nMethod\n'); expect(copied).toContain(`Source: ${page.url()}`);
      await pointer(page, 'button[aria-label="Increase servings"]');
      await expect(page.locator('#ak-static-servings')).toHaveText('6');
      await page.goto(recipe); await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
      await expect(page.locator('#ak-static-servings')).toHaveText('6');
      for (const invalid of ['0', '31', '1.5', 'abc', '%2B5']) {
        await page.goto(`${recipe}?plan_servings=${invalid}`); await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
        await expect(page.locator('#ak-static-servings')).toHaveText('6');
      }
      await page.goto(`${recipe}?plan_servings=30`); await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
      await expect(page.locator('#ak-static-servings')).toHaveText('30');
      await page.goto(`${recipe}?plan_servings=1`); await expect(page.locator('[data-ak-copy-recipe]')).toBeVisible();
      await expect(page.locator('#ak-static-servings')).toHaveText('1');
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('planned-recipe-portions.png') });
    });
  });
}
