const { test, expect } = require('@playwright/test');

test('contact form preserves a failed message and confirms only an accepted submission', async ({ page, baseURL }) => {
  let submissions = 0;
  const bodies = [];
  await page.route(new URL('/', baseURL).href, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    submissions += 1;
    bodies.push(new URLSearchParams(route.request().postData()));
    await route.fulfill({ status: submissions === 1 ? 503 : 200, body: '' });
  });

  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/contact/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const form = page.locator('#contactForm');
  await form.getByLabel('Your Name').fill('Example Tester');
  await form.getByLabel('Email Address', { exact: true }).fill('tester@example.invalid');
  await form.getByLabel('What is this about?').selectOption('error');
  await form.getByLabel('Your Message').fill('A synthetic calculator report for form QA.');

  const send = page.getByRole('button', { name: /Send Message/ });
  await send.click();
  await expect(page.locator('#contactStatus')).toContainText('could not be sent');
  await expect(form.getByLabel('Your Message')).toHaveValue('A synthetic calculator report for form QA.');
  await expect(send).toBeEnabled();
  await expect(page.locator('#successMsg')).toBeHidden();

  await send.click();
  await expect(page.locator('#successMsg')).toBeVisible();
  await expect(page.locator('#contactStatus')).toBeEmpty();
  expect(new URL(page.url()).pathname).toBe('/contact/');
  expect(submissions).toBe(2);
  for (const body of bodies) {
    expect(body.get('form-name')).toBe('contact');
    expect(body.get('bot-field')).toBe('');
    expect(body.get('name')).toBe('Example Tester');
    expect(body.get('email')).toBe('tester@example.invalid');
    expect(body.get('subject')).toBe('error');
    expect(body.get('message')).toBe('A synthetic calculator report for form QA.');
  }
});

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
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type, () => window.__recordContactPointer(type), { once: true });
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

const errorsByPage = new WeakMap();
const submitsByPage = new WeakMap();
const originalMessage = 'A synthetic calculator report for form QA.';
const newerMessage = 'A newer synthetic draft typed while the original request is pending.';
const newerFeedback = 'Your original message was sent. Your newer edits are still here and have not been sent.';
const sendSelector = '#contactForm .submit-btn';

test.beforeEach(async ({ page, context, baseURL }) => {
  errorsByPage.set(page, []); pointerEvents.set(page, []); pointerProof.set(page, []);
  page.on('pageerror', error => errorsByPage.get(page).push({ name: error.name, message: error.message }));
  await page.exposeFunction('__recordContactPointer', type => pointerEvents.get(page).push(type));
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    if (/google|googletagmanager/.test(url.hostname) && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    return route.abort('blockedbyclient');
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.AfroDisableAssistant = true;
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const errors = errorsByPage.get(page) || [];
  await testInfo.attach('native-contact-controls', { body: Buffer.from(JSON.stringify(pointerProof.get(page) || [], null, 2)), contentType: 'application/json' });
  await testInfo.attach('observed-page-errors', { body: Buffer.from(JSON.stringify({ errors, nativeTransitionAborts: errors.filter(error => error.name === 'AbortError' && error.message === 'Transition was skipped').length }, null, 2)), contentType: 'application/json' });
  const submits = submitsByPage.get(page);
  if (submits) await testInfo.attach('synthetic-submitted-bodies', { body: Buffer.from(JSON.stringify(submits.map(row => row.body), null, 2)), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

async function openContact(page, baseURL, theme) {
  const pending = [];
  submitsByPage.set(page, pending);
  await page.route(new URL('/', baseURL).href, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const row = { body: Object.fromEntries(new URLSearchParams(route.request().postData())) };
    pending.push(row);
    const responseStatus = await new Promise(resolve => { row.release = resolve; });
    await route.fulfill({ status: responseStatus, body: '' });
  });
  await page.addInitScript(theme => localStorage.setItem('aft_theme', theme), theme);
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('#contactStatus')).toHaveAttribute('aria-live', 'polite');
  return pending;
}

async function fillContact(page, message = originalMessage) {
  const form = page.locator('#contactForm');
  await form.getByLabel('Your Name').fill('Example Tester');
  await form.getByLabel('Email Address', { exact: true }).fill('tester@example.invalid');
  await form.getByLabel('What is this about?').selectOption('error');
  await form.getByLabel('Your Message').fill(message);
}

async function nativeText(page, selector, text) {
  await pointer(page, selector);
  await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
  if (text) await page.keyboard.type(text);
}

function assertBody(body, message) {
  expect(body).toEqual({ 'form-name': 'contact', 'bot-field': '', name: 'Example Tester', email: 'tester@example.invalid', subject: 'error', message });
}

async function submitHeld(page, pending, expectedCount, message) {
  await pointer(page, sendSelector);
  await expect.poll(() => pending.length).toBe(expectedCount);
  assertBody(pending[expectedCount - 1].body, message);
  await expect(page.locator(sendSelector)).toBeDisabled();
  await expect(page.locator('#contactStatus')).toHaveText('Sending your message…');
}

async function editedFocus(page) {
  await nativeText(page, '#message', newerMessage);
  // Send is disabled; native Tab leaves the textarea, firing change, then returns.
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await focusBounds(page, '#message');
}

for (const variant of variants) test.describe(`contact ${variant.width} ${variant.theme}`, () => {
  test.use({ viewport: { width: variant.width, height: 850 }, colorScheme: variant.theme });

  test('held accepted submission preserves a newer native draft and its focus until that draft is sent', async ({ page, baseURL }, testInfo) => {
    const pending = await openContact(page, baseURL, variant.theme);
    await fillContact(page); await submitHeld(page, pending, 1, originalMessage);
    await editedFocus(page);
    const before = await geometry(page, '#message');
    await page.screenshot({ path: testInfo.outputPath('newer-draft-before-accept.png') });
    pending[0].release(200);
    await expect(page.locator(sendSelector)).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('newer-draft-after-accept.png') });
    await expect(page.locator('#message')).toHaveValue(newerMessage);
    await expect(page.locator('#contactStatus')).toHaveText(newerFeedback);
    await expect(page.locator('#successMsg')).toBeHidden();
    await focusBounds(page, '#message');
    expect(await geometry(page, '#message')).toEqual(before);
    await expect(page.locator('#name')).toHaveValue('Example Tester');
    await expect(page.locator('#email')).toHaveValue('tester@example.invalid');
    await expect(page.locator('#subject')).toHaveValue('error');
    expect(pending).toHaveLength(1);
    await submitHeld(page, pending, 2, newerMessage); pending[1].release(200);
    await expect(page.locator('#successMsg')).toBeVisible();
    await expect(page.locator('#contactStatus')).toBeEmpty();
    await expect(page.locator('#message')).toHaveValue('');
    await expect(page.locator(sendSelector)).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/contact/');
  });

  test('held rejected submission keeps native edits and focus and can retry the current exact draft', async ({ page, baseURL }, testInfo) => {
    const pending = await openContact(page, baseURL, variant.theme);
    await fillContact(page); await submitHeld(page, pending, 1, originalMessage);
    await editedFocus(page); const before = await geometry(page, '#message');
    pending[0].release(503);
    await expect(page.locator('#contactStatus')).toContainText('could not be sent');
    await expect(page.locator('#message')).toHaveValue(newerMessage);
    await expect(page.locator(sendSelector)).toBeEnabled();
    await expect(page.locator('#successMsg')).toBeHidden();
    await focusBounds(page, '#message');
    expect(await geometry(page, '#message')).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath('newer-draft-after-rejection.png') });
    await submitHeld(page, pending, 2, newerMessage);
    // Same current payload after a real edit/revert has already been submitted.
    await nativeText(page, '#message', originalMessage);
    await nativeText(page, '#message', newerMessage);
    pending[1].release(200);
    await expect(page.locator('#successMsg')).toBeVisible();
    await expect(page.locator('#message')).toHaveValue('');
    await expect(page.locator('#contactStatus')).toBeEmpty();
    expect(pending).toHaveLength(2);
  });

  test('native invalid fields block POST and disabled pointer or keyboard attempts do not duplicate an unchanged accepted draft', async ({ page, baseURL }) => {
    const pending = await openContact(page, baseURL, variant.theme);
    await pointer(page, sendSelector);
    await expect(page.locator('#name')).toBeFocused(); await focusBounds(page, '#name');
    expect(pending).toHaveLength(0);
    expect(await page.locator('#name').evaluate(node => node.validity.valueMissing)).toBe(true);
    await fillContact(page);
    await nativeText(page, '#email', 'invalid-address');
    await page.keyboard.press('Enter');
    await expect(page.locator('#email')).toBeFocused(); await focusBounds(page, '#email');
    expect(await page.locator('#email').evaluate(node => node.validity.typeMismatch)).toBe(true);
    expect(pending).toHaveLength(0);
    await nativeText(page, '#email', 'tester@example.invalid');
    await page.locator('#subject').selectOption(''); await pointer(page, sendSelector);
    await expect(page.locator('#subject')).toBeFocused(); await focusBounds(page, '#subject'); expect(pending).toHaveLength(0);
    await page.locator('#subject').selectOption('error');
    await nativeText(page, '#message', ''); await pointer(page, sendSelector);
    await expect(page.locator('#message')).toBeFocused(); await focusBounds(page, '#message'); expect(pending).toHaveLength(0);
    await nativeText(page, '#message', originalMessage);
    await submitHeld(page, pending, 1, originalMessage);
    // Real pointer on a fully visible disabled button; browser suppresses activation.
    const send = await page.locator(sendSelector).boundingBox();
    await page.mouse.click(send.x + send.width / 2, send.y + send.height / 2);
    await nativeText(page, '#email', 'tester@example.invalid'); await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(pending).toHaveLength(1);
    await expect(page.locator(sendSelector)).toBeDisabled();
    pending[0].release(200);
    await expect(page.locator('#successMsg')).toBeVisible();
    await expect(page.locator('#contactStatus')).toBeEmpty();
    await expect(page.locator('#message')).toHaveValue('');
    await expect(page.locator(sendSelector)).toBeHidden();
    expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
  });
});

// Exercise native abort and draft recovery without sending a real contact message.
test('stalled contact submission restores controls and preserves newer edits', async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 320, height: 850 });
  await page.addInitScript(() => {
    localStorage.setItem('aft_theme', 'dark');
    const originalFetch = window.fetch;
    window.__syntheticContactPostCount = 0;
    window.fetch = function(input, options) {
      if (input === '/' && options && options.method === 'POST') {
        window.__syntheticContactPostCount += 1;
        if (window.__syntheticContactPostCount === 1) {
          return new Promise((resolve, reject) => {
            if (options.signal) options.signal.addEventListener('abort', () => reject(new DOMException('Synthetic timeout', 'AbortError')), { once: true });
          });
        }
        return Promise.resolve(new Response('', { status: 200 }));
      }
      return originalFetch.apply(this, arguments);
    };
  });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  await fillContact(page);
  const send = page.locator(sendSelector);
  await send.click();
  await expect(send).toBeDisabled();
  await page.getByLabel('Your Message').fill(newerMessage);
  await page.clock.fastForward(30000);
  await expect(send).toBeEnabled();
  await expect(page.locator('#contactStatus')).toContainText('could not confirm');
  await expect(page.locator('#successMsg')).toBeHidden();
  await expect(page.locator('#message')).toHaveValue(newerMessage);
  expect(await page.evaluate(() => window.__syntheticContactPostCount)).toBe(1);
  await send.click();
  await expect(page.locator('#successMsg')).toBeVisible();
  await expect(page.locator('#message')).toHaveValue('');
  expect(await page.evaluate(() => window.__syntheticContactPostCount)).toBe(2);
});
