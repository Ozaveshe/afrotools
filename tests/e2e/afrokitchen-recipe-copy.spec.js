const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const recipeRoute = '/tools/afrokitchen/recipes/jollof-rice-ng/';
const copySelector = '[data-ak-copy-recipe]';
const txtSelector = '[data-ak-download-recipe]';
const statusSelector = '#ak-static-action-status';
const variants = [
  { width: 320, theme: 'light' }, { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' }, { width: 390, theme: 'dark' }
];

async function settled(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  let previous = '', unchanged = 0;
  for (let sample = 0; sample < 60; sample += 1) {
    const position = await page.evaluate(() => {
      const bounds = document.querySelector('[data-ak-copy-recipe]').getBoundingClientRect();
      return JSON.stringify({ scrollY, top: bounds.top, bottom: bounds.bottom });
    });
    unchanged = position === previous ? unchanged + 1 : 0;
    if (unchanged >= 4) return;
    previous = position;
    await page.waitForTimeout(30);
  }
  throw new Error('Recipe controls did not settle');
}

async function controlGeometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const navbar = document.querySelector('afro-navbar');
    const nodes = navbar ? [navbar, ...(navbar.shadowRoot ? navbar.shadowRoot.querySelectorAll('*') : [])] : [];
    const navBottom = Math.max(0, ...nodes.filter(item => {
      const b = item.getBoundingClientRect(), p = getComputedStyle(item).position;
      return ['fixed', 'sticky'].includes(p) && b.height > 20 && b.height < 150 && b.top < 150;
    }).map(item => item.getBoundingClientRect().bottom));
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return {
      top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right,
      width: bounds.width, height: bounds.height, navBottom,
      fullyVisible: bounds.top >= navBottom + 1 && bounds.bottom <= innerHeight,
      centerHit: node === hit || node.contains(hit), focused: document.activeElement === node
    };
  });
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
  await expect.poll(async () => {
    const geometry = await controlGeometry(page, selector);
    return geometry.fullyVisible && geometry.centerHit;
  }).toBe(true);
  const first = await control.boundingBox();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await control.boundingBox();
  expect(bounds.y).toBeCloseTo(first.y, 1);
  const eventsBefore = await page.evaluate(() => window.__recipeCopyProbe.events.length);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const events = await page.evaluate(({ start, selector }) => window.__recipeCopyProbe.events.slice(start).filter(event => event.selector === selector), { start: eventsBefore, selector });
  expect(events.map(event => event.type)).toEqual(['mousedown', 'mouseup', 'click']);
  await settled(page);
}

async function focusedControl(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
  await expect.poll(async () => {
    const bounds = await controlGeometry(page, selector);
    return bounds.focused && bounds.fullyVisible && bounds.centerHit;
  }).toBe(true);
  const bounds = await controlGeometry(page, selector);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  expect(bounds.width).toBeGreaterThanOrEqual(44);
}

async function adapter(page, mode, legacy = 'false') {
  await page.evaluate(({ mode, legacy }) => window.__configureRecipeClipboard(mode, legacy), { mode, legacy });
}

async function verifyFullRecipe(page, text, servings) {
  const recipe = await page.evaluate(() => window.__AK_STATIC_RECIPE);
  expect(text).toContain(`${recipe.name}\n${recipe.country_name}`);
  expect(text).toContain(`Servings: ${servings} servings\n`);
  expect(text).toContain(recipe.description);
  expect(text).toContain('\nIngredients\n');
  expect(text).toContain('\nMethod\n');
  expect(text).toContain(`Source: ${page.url()}`);
  expect(text).not.toContain('\\n');
  expect(text.match(/^- /gm)).toHaveLength(recipe.ingredients.length);
  for (const ingredient of recipe.ingredients) {
    expect(text).toContain(ingredient.name);
    if (ingredient.prep_note) expect(text).toContain(ingredient.prep_note);
    if (ingredient.group_name) expect(text).toContain(`${ingredient.group_name}:`);
    if (ingredient.substitution) expect(text).toContain(`Substitution: ${ingredient.substitution}`);
  }
  for (const step of recipe.steps) {
    expect(text).toContain(`${step.step_number}. ${step.title}\n${step.instruction}`);
    if (step.tip) expect(text).toContain(`Tip: ${step.tip}`);
  }
  expect(text).toContain('Timer: 30:00');
  expect(text).toContain('Timer: 03:00');
  expect(text).toContain('Serve with: Fried plantain');
  expect(text).toContain(servings === 6 ? '- 3 cups long-grain parboiled rice' : '- 3½ cups long-grain parboiled rice');
}

async function readDownload(page, testInfo, filename) {
  const downloadPromise = page.waitForEvent('download');
  await pointerClick(page, txtSelector);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(filename);
  expect(await download.failure()).toBeNull();
  const file = testInfo.outputPath(filename);
  await download.saveAs(file);
  return fs.readFileSync(file, 'utf8');
}

async function snapshot(page) {
  return page.evaluate(() => ({
    status: document.querySelector('#ak-static-action-status').textContent,
    servings: document.querySelector('#ak-static-servings').textContent,
    activeId: document.activeElement.id,
    activeTag: document.activeElement.tagName,
    activeText: document.activeElement.tagName === 'BUTTON' ? document.activeElement.textContent : null,
    scrollY,
    legacyAttempts: window.__recipeCopyProbe.legacy.length,
    temporaryAreas: document.querySelectorAll('textarea[readonly]').length
  }));
}

for (const variant of variants) {
  test.describe(`Static recipe exports at ${variant.width}px in ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });
    let pageErrors;
    test.beforeEach(async ({ page, baseURL }) => {
      pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.route('**/*', route => {
        const request = route.request();
        return new URL(request.url()).origin === new URL(baseURL).origin && ['GET', 'HEAD'].includes(request.method()) ? route.continue() : route.abort('blockedbyclient');
      });
      await page.addInitScript(theme => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        const probe = window.__recipeCopyProbe = { mode: 'success', legacyMode: 'false', requests: [], legacy: [], events: [], prints: 0, prompts: [] };
        const clipboard = { writeText(text) {
          const request = { text };
          probe.requests.push(request);
          if (probe.mode === 'syncThrow') throw new Error('Synthetic synchronous clipboard denial');
          if (probe.mode === 'deny') return Promise.reject(new Error('Synthetic clipboard denial'));
          if (probe.mode === 'held') return new Promise((resolve, reject) => { request.resolve = resolve; request.reject = reject; });
          return Promise.resolve();
        } };
        window.__configureRecipeClipboard = (mode, legacy) => {
          probe.mode = mode;
          probe.legacyMode = legacy;
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : clipboard });
        };
        window.__configureRecipeClipboard('success', 'false');
        window.__settleRecipeClipboard = (index, success) => success ? probe.requests[index].resolve() : probe.requests[index].reject(new Error('Synthetic held clipboard denial'));
        document.execCommand = command => {
          probe.legacy.push({ command, text: document.activeElement.value });
          if (probe.legacyMode === 'throw') throw new Error('Synthetic legacy copy denial');
          return probe.legacyMode === 'true';
        };
        window.prompt = (title, text) => { probe.prompts.push({ title, text }); return null; };
        window.print = () => { probe.prints += 1; };
        for (const type of ['mousedown', 'mouseup', 'click']) document.addEventListener(type, event => {
          const control = event.target.closest('[data-ak-copy-recipe],[data-ak-download-recipe],[data-ak-print-recipe],[data-ak-add-meal-plan],[data-ak-mark-cooked]');
          if (control) {
            const attribute = [...control.attributes].find(item => item.name.startsWith('data-ak-')).name;
            probe.events.push({ type, selector: `[${attribute}]` });
          }
        }, true);
      }, variant.theme);
      await page.goto(recipeRoute, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(copySelector)).toBeVisible();
      await expect(page.locator(txtSelector)).toBeVisible();
      await settled(page);
    });
    test.afterEach(async ({ page }) => {
      expect(pageErrors).toEqual([]);
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator('textarea[readonly]')).toHaveCount(0);
      expect(await page.evaluate(() => window.__recipeCopyProbe.prompts.length)).toBe(0);
    });

    test('Copy and TXT retain the complete scaled recipe and neighboring cooking controls', async ({ page }, testInfo) => {
      await pointerClick(page, copySelector);
      await expect(page.locator(statusSelector)).toHaveText('Recipe copied.');
      const original = await page.evaluate(() => window.__recipeCopyProbe.requests[0].text);
      await verifyFullRecipe(page, original, 6);
      const downloaded = await readDownload(page, testInfo, 'jollof-rice-ng-6-servings.txt');
      expect(downloaded).toBe(original);
      await expect(page.locator(statusSelector)).toHaveText('Recipe TXT downloaded.');

      await page.getByRole('button', { name: 'Increase servings', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#ak-static-servings')).toHaveText('7');
      await expect(page.locator('#ak-static-ingredients')).toContainText('3½ cups');
      const scaled = await readDownload(page, testInfo, 'jollof-rice-ng-7-servings.txt');
      await verifyFullRecipe(page, scaled, 7);
      await pointerClick(page, copySelector);
      await expect(page.locator(statusSelector)).toHaveText('Recipe copied.');
      expect(await page.evaluate(() => window.__recipeCopyProbe.requests.at(-1).text)).toBe(scaled);

      await pointerClick(page, '[data-ak-print-recipe]');
      expect(await page.evaluate(() => window.__recipeCopyProbe.prints)).toBe(1);
      await expect(page.locator(statusSelector)).toHaveText('Print dialog opened.');
      await pointerClick(page, '[data-ak-add-meal-plan]');
      const picks = await page.evaluate(() => JSON.parse(localStorage.getItem('ak_meal_plan_v1')));
      expect(picks).toHaveLength(1);
      expect(picks[0]).toMatchObject({ slug: 'jollof-rice-ng', name: 'Jollof Rice', servings: 7, url: recipeRoute });
      await expect(page.locator(statusSelector).getByRole('link')).toHaveAttribute('href', '/tools/afrokitchen/#cook-this-week');
      await pointerClick(page, '[data-ak-mark-cooked]');
      await expect(page.locator('[data-ak-mark-cooked]')).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ak_cooked_recipes_v1'))[0].slug)).toBe('jollof-rice-ng');
      await pointerClick(page, '[data-ak-mark-cooked]');
      await expect(page.locator('[data-ak-mark-cooked]')).toHaveAttribute('aria-pressed', 'false');
      await page.locator('.ak-ing-check').first().check();
      await expect(page.locator('#ak-check-progress')).toContainText('1 of');
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await expect(page.locator('#ak-check-progress')).toContainText('0 of');
      await expect(page.locator('#ak-timer-display-6')).toHaveText('03:00');
      await page.screenshot({ path: testInfo.outputPath('normal-controls.png') });
    });

    test('clipboard denial, absence and throws have honest feedback, clean DOM and visible focus', async ({ page }, testInfo) => {
      for (const [mode, legacy, copied] of [
        ['deny', 'false', false], ['deny', 'true', true], ['absent', 'false', false],
        ['absent', 'throw', false], ['syncThrow', 'false', false], ['syncThrow', 'true', true]
      ]) {
        await adapter(page, mode, legacy);
        const previousLegacy = await page.evaluate(() => window.__recipeCopyProbe.legacy.length);
        await pointerClick(page, copySelector);
        await expect(page.locator(statusSelector)).toHaveText(copied ? 'Recipe copied.' : 'Copy unavailable. Use Download TXT to keep this recipe.');
        expect(await page.evaluate(() => window.__recipeCopyProbe.legacy.length)).toBe(previousLegacy + 1);
        await focusedControl(page, copySelector);
        await expect(page.locator('textarea[readonly]')).toHaveCount(0);
        const fallbackText = await page.evaluate(() => window.__recipeCopyProbe.legacy.at(-1).text);
        await verifyFullRecipe(page, fallbackText, 6);
        await page.screenshot({ path: testInfo.outputPath(`${mode}-${legacy}.png`) });
      }
      const text = await readDownload(page, testInfo, 'jollof-rice-ng-6-servings.txt');
      await verifyFullRecipe(page, text, 6);
      await adapter(page, 'held', 'false');
      await page.locator(copySelector).focus();
      await page.keyboard.press('Enter');
      const index = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
      await page.keyboard.press('Tab');
      await focusedControl(page, txtSelector);
      await page.evaluate(index => window.__settleRecipeClipboard(index, false), index);
      await expect(page.locator(statusSelector)).toHaveText('Copy unavailable. Use Download TXT to keep this recipe.');
      await focusedControl(page, txtSelector);
      await page.evaluate(() => { URL.createObjectURL = () => { throw new Error('Synthetic local download denial'); }; });
      await pointerClick(page, txtSelector);
      await expect(page.locator(statusSelector)).toHaveText('This browser could not download the recipe TXT. Try Print to keep a local copy.');
      const pointerBounds = await controlGeometry(page, txtSelector);
      expect(pointerBounds.fullyVisible).toBe(true);
      expect(pointerBounds.centerHit).toBe(true);
      // WebKit pointer activation can blur a button before its handler; keyboard activation retains focus.
      await page.locator(copySelector).focus();
      await page.keyboard.press('Tab');
      await focusedControl(page, txtSelector);
      await page.keyboard.press('Enter');
      await expect(page.locator(statusSelector)).toHaveText('This browser could not download the recipe TXT. Try Print to keep a local copy.');
      await focusedControl(page, txtSelector);
    });

    test('late copy outcomes cannot replace a newer selection, request, action or focus', async ({ page }, testInfo) => {
      for (const success of [false, true]) {
        for (const returnToOriginal of [false, true]) {
          await adapter(page, 'held', 'true');
          await page.locator(copySelector).focus();
          await page.keyboard.press('Enter');
          const index = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
          await page.getByRole('button', { name: 'Increase servings', exact: true }).focus();
          await page.keyboard.press('Enter');
          if (returnToOriginal) {
            await page.getByRole('button', { name: 'Decrease servings', exact: true }).focus();
            await page.keyboard.press('Enter');
          }
          await settled(page);
          const before = await snapshot(page);
          await page.evaluate(({ index, success }) => window.__settleRecipeClipboard(index, success), { index, success });
          await settled(page);
          expect(await snapshot(page)).toEqual(before);
          await focusedControl(page, returnToOriginal ? '[aria-label="Decrease servings"]' : '[aria-label="Increase servings"]');
        }
      }

      await adapter(page, 'held', 'true');
      await page.locator(copySelector).focus(); await page.keyboard.press('Enter');
      const older = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
      await adapter(page, 'success', 'true');
      await page.keyboard.press('Enter');
      await expect(page.locator(statusSelector)).toHaveText('Recipe copied.');
      await settled(page);
      const newer = await snapshot(page);
      await page.evaluate(index => window.__settleRecipeClipboard(index, false), older);
      await settled(page);
      expect(await snapshot(page)).toEqual(newer);
      await focusedControl(page, copySelector);

      await adapter(page, 'held', 'true');
      await page.keyboard.press('Enter');
      const printing = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
      await pointerClick(page, '[data-ak-print-recipe]');
      const afterPrint = await snapshot(page);
      await page.evaluate(index => window.__settleRecipeClipboard(index, false), printing);
      await settled(page);
      expect(await snapshot(page)).toEqual(afterPrint);

      await adapter(page, 'held', 'true');
      await page.locator(copySelector).focus(); await page.keyboard.press('Enter');
      const downloading = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
      const servings = await page.locator('#ak-static-servings').textContent();
      const currentText = await readDownload(page, testInfo, `jollof-rice-ng-${servings}-servings.txt`);
      expect(currentText).toContain(`Servings: ${servings} servings`);
      const afterDownload = await snapshot(page);
      await page.evaluate(index => window.__settleRecipeClipboard(index, false), downloading);
      await settled(page);
      expect(await snapshot(page)).toEqual(afterDownload);

      await adapter(page, 'held', 'true');
      await page.locator(copySelector).focus(); await page.keyboard.press('Enter');
      const hidden = await page.evaluate(() => window.__recipeCopyProbe.requests.length - 1);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      await settled(page); const afterHide = await snapshot(page);
      await page.evaluate(index => window.__settleRecipeClipboard(index, false), hidden);
      await settled(page);
      expect(await snapshot(page)).toEqual(afterHide);
      await page.screenshot({ path: testInfo.outputPath('guarded-late-copy.png') });

      await page.goto('/tools/afrokitchen/recipes/doro-wat/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Doro Wat', exact: true, level: 1 })).toBeVisible();
      await expect(page.locator(statusSelector)).toBeEmpty();
      expect(await page.evaluate(() => window.__recipeCopyProbe.legacy.length)).toBe(0);
    });
  });
}
