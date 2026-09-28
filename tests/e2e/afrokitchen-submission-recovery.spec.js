const { test, expect } = require('@playwright/test');

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
  const viewport = page.viewportSize(), center = viewport.height / 2;
  // Native pointer movement leaves a carried hover-transform edge before measuring rest.
  await page.mouse.move(viewport.width - 2, center);
  await settled(page, selector);
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
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type, () => window.__recordKitchenPointer(type), { once: true });
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
  pointerProof.get(page).push({ selector, focusedControl: b });
}

const provider = 'https://zpclagtgczsygrgztlts.supabase.co/rest/v1/recipe_submissions';
const wires = new WeakMap(), errors = new WeakMap();
const originalName = 'Synthetic test recipe';
const newerName = 'Newer synthetic test recipe';
const keptDraft = 'Your original recipe was submitted for review. Your newer edits are still here and have not been sent.';
const authStub = `window.AfroAuth={getSupabase:function(){
  if(window.__getterThrows)throw new Error('Synthetic client unavailable');
  return {from:function(table){if(table!=='recipe_submissions')throw new Error('Unexpected table');
    return {insert:function(payload){
      window.__insertSnapshots.push(JSON.parse(JSON.stringify(payload)));
      return fetch('${provider}',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(response){return response.json()});
    }};
  }};
}};`;

test.beforeEach(async ({ page, context, baseURL }) => {
  errors.set(page, []); wires.set(page, []); pointerEvents.set(page, []); pointerProof.set(page, []);
  page.on('pageerror', error => errors.get(page).push({ name: error.name, message: error.message }));
  page.on('dialog', dialog => dialog.dismiss());
  await page.exposeFunction('__recordKitchenPointer', type => pointerEvents.get(page).push(type));
  const origin = new URL(baseURL).origin;
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.href === provider && request.method() === 'POST') {
      expect(request.headers().authorization).toBeUndefined();
      expect(request.headers().apikey).toBeUndefined();
      const row = { body: JSON.parse(request.postData()), headers: request.headers() };
      wires.get(page).push(row);
      const response = await new Promise(resolve => { row.release = resolve; });
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify(response) });
    }
    if (url.href === provider && request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST' } });
    if (url.origin === origin && ['GET', 'HEAD'].includes(request.method())) {
      if (url.pathname === '/assets/js/afro-auth.js') return route.fulfill({ contentType: 'application/javascript', body: authStub });
      return route.continue();
    }
    // Every off-origin request other than the fully fulfilled synthetic POST aborts.
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined'); window.AfroDisableAssistant = true;
    window.__insertSnapshots = []; window.__copyRequests = []; window.__legacy = [];
    window.__configureClipboard = (mode, legacy = 'false') => {
      window.__legacyMode = legacy;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : { writeText(text) {
        const row = { text }; window.__copyRequests.push(row);
        if (mode === 'throw') throw new Error('Synthetic synchronous denial');
        if (mode === 'deny') return Promise.reject(new Error('Synthetic denial'));
        if (mode === 'held') return new Promise((resolve, reject) => { row.resolve = resolve; row.reject = reject; });
        return Promise.resolve();
      } } });
      document.execCommand = command => {
        window.__legacy.push({ command, text: document.activeElement.value });
        if (window.__legacyMode === 'throw') throw new Error('Synthetic legacy denial');
        return window.__legacyMode === 'true';
      };
    };
    window.__configureClipboard('success');
  });
});

test.afterEach(async ({ page }, info) => {
  await info.attach('native-controls', { body: Buffer.from(JSON.stringify(pointerProof.get(page), null, 2)), contentType: 'application/json' });
  await info.attach('synthetic-wire-and-engine-mapping', { body: Buffer.from(JSON.stringify({ wires: wires.get(page).map(row => row.body), engine: await page.evaluate(() => window.__insertSnapshots) }, null, 2)), contentType: 'application/json' });
  await info.attach('observed-page-errors', { body: Buffer.from(JSON.stringify({ errors: errors.get(page), nativeTransitionAborts: errors.get(page).filter(error => error.name === 'AbortError' && error.message === 'Transition was skipped').length }, null, 2)), contentType: 'application/json' });
  expect(errors.get(page)).toEqual([]);
  expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
});

async function open(page, theme) {
  await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), theme);
  await page.goto('/tools/afrokitchen/submit.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('#f-country option[value="NG"]')).toHaveCount(1);
  await expect(page.locator('#submit-status')).toHaveAttribute('aria-live', 'polite');
  const primary = await page.locator('#submit-btn').evaluate(node => {
    const style = getComputedStyle(node);
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(c => {
      c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const foreground = luminance(style.webkitTextFillColor || style.color), background = luminance(style.backgroundColor);
    return { color: style.color, textFill: style.webkitTextFillColor, background: style.backgroundColor,
      ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05),
      fontSize: parseFloat(style.fontSize), height: node.getBoundingClientRect().height };
  });
  expect(primary.ratio).toBeGreaterThanOrEqual(4.5);
  expect(primary.fontSize).toBeGreaterThanOrEqual(16);
  expect(primary.height).toBeGreaterThanOrEqual(44);
  pointerProof.get(page).push({ selector: '#submit-btn', primaryContrast: primary, theme });
}
async function fill(page) {
  await page.getByLabel('Recipe Name', { exact: false }).fill(originalName);
  await page.getByLabel('Country of Origin').selectOption('NG');
  await page.getByLabel('Ingredients', { exact: false }).fill('2 cups synthetic rice');
  await page.getByLabel('Cooking Steps').fill('1. Simmer the synthetic ingredients for 20 minutes.');
}
function body(name = originalName, permission = false, links = '') {
  return { name, country_code: 'NG', description: null, ingredients_text: '2 cups synthetic rice', steps_text: '1. Simmer the synthetic ingredients for 20 minutes.', story: `Editorial context\n${links ? `Photo links: ${links}\n` : ''}Photo permission: ${permission ? 'yes' : 'not confirmed'}`, submitted_by: null, email: null };
}
async function held(page, count, expectedBody = body()) {
  await pointer(page, '#submit-btn');
  await expect.poll(() => wires.get(page).length).toBe(count);
  expect(wires.get(page)[count - 1].body).toEqual(expectedBody);
  expect(await page.evaluate(() => window.__insertSnapshots.at(-1))).toEqual(expectedBody);
  await expect(page.locator('#submit-btn')).toBeDisabled();
  await expect(page.locator('#submit-btn')).toHaveText('Sending…');
}
async function nativeName(page, name) {
  await pointer(page, '#f-name');
  await page.keyboard.press('Control+A'); await page.keyboard.type(name);
  await page.keyboard.press('Tab');
  await focusBounds(page, '#f-country');
}
async function configured(page, mode, legacy) { await page.evaluate(({ mode, legacy }) => window.__configureClipboard(mode, legacy), { mode, legacy }); }
async function tempCount(page) { return page.locator('body > textarea:not(#ak-contribution-checklist)').count(); }
async function stableSubmitEdge(page) {
  const viewport = page.viewportSize(), target = page.locator('#submit-btn');
  await page.mouse.move(viewport.width - 2, viewport.height / 2);
  await settled(page, '#submit-btn');
  const box = await target.boundingBox();
  const limit = Math.ceil(Math.abs(box.y + box.height / 2 - viewport.height / 2) / 500) + 8;
  for (let move = 0; move < limit; move += 1) {
    const bounds = await target.boundingBox(), distance = bounds.y + bounds.height / 2 - viewport.height / 2;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance))); await settled(page, '#submit-btn');
  }
  const before = await target.boundingBox(), point = { x: before.x + before.width / 2, y: before.y + before.height - .5 };
  await page.mouse.move(point.x, point.y);
  const samples = [];
  for (let sample = 0; sample < 60; sample += 1) {
    expect(await target.boundingBox()).toEqual(before);
    const hit = await target.evaluate((node, point) => ({
      hover: node.matches(':hover'), transform: getComputedStyle(node).transform,
      hit: node === document.elementFromPoint(point.x, point.y) || node.contains(document.elementFromPoint(point.x, point.y))
    }), point);
    expect(hit).toEqual({ hover: true, transform: 'none', hit: true }); samples.push(hit);
    await page.waitForTimeout(30);
  }
  pointerProof.get(page).push({ selector: '#submit-btn', nativeHoverEdge: { before, point, samples } });
}

for (const variant of variants) test.describe(`submission ${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 } });

  test('accepted snapshot keeps newer edits, reverted draft and unchanged retry use normal success', async ({ page }) => {
    await open(page, variant.theme); await fill(page); await held(page, 1);
    await nativeName(page, newerName);
    const before = await geometry(page, '#f-country');
    wires.get(page)[0].release({ error: null });
    await expect(page.locator('#submit-form')).toBeVisible();
    await expect(page.locator('#submit-success')).toBeHidden();
    await expect(page.locator('#submit-status')).toHaveText(keptDraft);
    await expect(page.locator('#f-name')).toHaveValue(newerName);
    await expect(page.locator('#submit-btn')).toBeEnabled();
    await focusBounds(page, '#f-country');
    expect(await geometry(page, '#f-country')).toEqual(before);
    await held(page, 2, body(newerName));
    wires.get(page)[1].release({ error: null });
    await expect(page.locator('#submit-form')).toBeHidden();
    await expect(page.locator('#submit-success')).toBeVisible();
    // A native edit reverted to the original normalized payload does not become an unsent draft.
    await open(page, variant.theme); await fill(page); await held(page, 3);
    await nativeName(page, newerName); await nativeName(page, originalName);
    wires.get(page)[2].release({ error: null });
    await expect(page.locator('#submit-success')).toBeVisible();
    await expect(page.locator('#submit-form')).toBeHidden();
  });

  test('native invalid and photo consent block sending; failure and thrown getter retain editable draft and recover', async ({ page }) => {
    await open(page, variant.theme);
    await stableSubmitEdge(page);
    await pointer(page, '#submit-btn');
    await expect(page.locator('#f-name')).toBeFocused(); await focusBounds(page, '#f-name');
    expect(wires.get(page)).toHaveLength(0);
    await fill(page);
    await page.locator('#f-email').fill('invalid-email');
    await pointer(page, '#submit-btn'); await focusBounds(page, '#f-email');
    expect(wires.get(page)).toHaveLength(0);
    await page.locator('#f-email').fill('');
    await page.locator('#f-photo-links').fill('https://example.invalid/synthetic-photo');
    await pointer(page, '#submit-btn');
    expect(wires.get(page)).toHaveLength(0);
    await page.locator('#f-photo-permission').check();
    await held(page, 1, body(originalName, true, 'https://example.invalid/synthetic-photo'));
    // Disabled native Send cannot initiate a second request.
    const bounds = await page.locator('#submit-btn').boundingBox();
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    expect(wires.get(page)).toHaveLength(1);
    await nativeName(page, newerName);
    wires.get(page)[0].release({ error: { message: 'Synthetic denial' } });
    await expect(page.locator('#submit-status')).toContainText('could not send');
    await expect(page.locator('#submit-btn')).toBeEnabled();
    await expect(page.locator('#f-name')).toHaveValue(newerName); await focusBounds(page, '#f-country');
    await held(page, 2, body(newerName, true, 'https://example.invalid/synthetic-photo'));
    wires.get(page)[1].release({ error: null }); await expect(page.locator('#submit-success')).toBeVisible();
    await open(page, variant.theme); await fill(page);
    await page.evaluate(() => { window.__getterThrows = true; });
    await pointer(page, '#submit-btn');
    await expect(page.locator('#submit-status')).toContainText('could not send');
    await expect(page.locator('#submit-btn')).toBeEnabled(); await expect(page.locator('#submit-form')).toBeVisible();
    expect(wires.get(page)).toHaveLength(2);
    await page.evaluate(() => { window.__getterThrows = false; });
    await held(page, 3); wires.get(page)[2].release({ error: null });
    await expect(page.locator('#submit-success')).toBeVisible();
  });

  test('checklist copy truthfully handles every failure, cleans fallback and preserves moved keyboard focus', async ({ page }) => {
    await open(page, variant.theme);
    const text = await page.locator('#ak-contribution-checklist').inputValue();
    for (const [mode, legacy, success] of [
      ['absent', 'false', false], ['deny', 'false', false], ['throw', 'false', false],
      ['absent', 'throw', false], ['deny', 'throw', false], ['absent', 'true', true], ['success', 'false', true]
    ]) {
      await configured(page, mode, legacy); await pointer(page, '#copy-checklist-btn');
      await expect(page.locator('#copy-checklist-status')).toHaveText(success ? 'Checklist copied.' : 'Copy failed. Select the checklist text and copy it manually.');
      expect(await tempCount(page)).toBe(0);
      const probe = await page.evaluate(() => ({ requests: window.__copyRequests, legacy: window.__legacy }));
      for (const row of [...probe.requests, ...probe.legacy]) expect(row.text).toBe(text);
    }
    await configured(page, 'held', 'false'); await pointer(page, '#copy-checklist-btn');
    // Focus Copy through native Tab, then move backward to the existing manual-copy textarea.
    await page.keyboard.press('Shift+Tab');
    if (!await page.locator('#ak-contribution-checklist').evaluate(node => document.activeElement === node)) await page.keyboard.press('Shift+Tab');
    await focusBounds(page, '#ak-contribution-checklist');
    const before = await geometry(page, '#ak-contribution-checklist');
    await page.evaluate(() => window.__copyRequests.at(-1).reject(new Error('Synthetic held denial')));
    await expect(page.locator('#copy-checklist-status')).toContainText('Copy failed');
    await focusBounds(page, '#ak-contribution-checklist');
    expect(await geometry(page, '#ak-contribution-checklist')).toEqual(before);
    expect(await tempCount(page)).toBe(0);
    await configured(page, 'held', 'false'); await pointer(page, '#copy-checklist-btn');
    const oldIndex = await page.evaluate(() => window.__copyRequests.length - 1);
    await configured(page, 'success', 'false'); await pointer(page, '#copy-checklist-btn');
    await expect(page.locator('#copy-checklist-status')).toHaveText('Checklist copied.');
    const legacyBefore = await page.evaluate(() => window.__legacy.length);
    await page.evaluate(index => window.__copyRequests[index].reject(new Error('Synthetic older denial')), oldIndex);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('#copy-checklist-status')).toHaveText('Checklist copied.');
    expect(await page.evaluate(() => window.__legacy.length)).toBe(legacyBefore);
    expect(await tempCount(page)).toBe(0);
  });
});
