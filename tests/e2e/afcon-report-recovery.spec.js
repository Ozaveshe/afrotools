const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

const route = '/tools/afcon-predictor/';
const copy = '[data-copy-local-report]';
const report = '[data-report-preview]';
const status = '[data-afcon-report-status]';
const variants = [
  { width: 320, theme: 'light' }, { width: 320, theme: 'dark' },
  { width: 390, theme: 'light' }, { width: 390, theme: 'dark' }
];

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const box = node.getBoundingClientRect(), host = document.querySelector('afro-navbar');
    const nav = host?.shadowRoot?.querySelector('nav') || host;
    const header = Math.max(0, nav?.getBoundingClientRect().bottom || 0);
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right,
      full: box.top >= header + 1 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth,
      hit: hit === node || node.contains(hit), header, focused: document.activeElement === node,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
  });
}

async function settle(page, selector) {
  let last = '', stable = 0;
  for (let i = 0; i < 60; i++) {
    const value = await page.locator(selector).evaluate(node => {
      const box = node.getBoundingClientRect();
      return JSON.stringify([scrollY.toFixed(1), box.top.toFixed(1), box.bottom.toFixed(1)]);
    });
    stable = value === last ? stable + 1 : 0;
    if (stable >= 4) return;
    last = value;
    await page.waitForTimeout(40);
  }
  throw new Error(`Native scroll did not settle: ${selector}`);
}

async function reveal(page, selector) {
  await expect(page.locator(selector)).toBeVisible();
  const center = page.viewportSize().height / 2;
  await page.mouse.move(2, center);
  await settle(page, selector);
  const initial = await page.locator(selector).boundingBox();
  const budget = Math.ceil(Math.abs(initial.y + initial.height / 2 - center) / 500) + 8;
  for (let i = 0; i < budget; i++) {
    const box = await page.locator(selector).boundingBox(), delta = box.y + box.height / 2 - center;
    if (Math.abs(delta) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, delta)));
    await settle(page, selector);
  }
  const box = await geometry(page, selector);
  expect(box.full, JSON.stringify(box)).toBe(true);
  expect(box.hit, JSON.stringify(box)).toBe(true);
  expect(box.overflow).toBe(0);
  return box;
}

async function pointer(page, selector) {
  const box = await reveal(page, selector);
  page.__observations.events = [];
  await page.locator(selector).evaluate(node => {
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type,
      event => window.__recordAFCON({ type, trusted: event.isTrusted }), { once: true });
  });
  await page.mouse.click((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  await expect.poll(() => page.__observations.events).toEqual(
    ['mousedown', 'mouseup', 'click'].map(type => ({ type, trusted: true })));
  page.__observations.controls.push({ selector, ...box, events: [...page.__observations.events] });
}

async function adapter(page, mode) {
  await page.evaluate(mode => {
    window.__copyPayloads = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : {
      writeText(text) {
        window.__copyPayloads.push(text);
        if (mode === 'throw') throw new Error('Synthetic synchronous Clipboard denial');
        if (mode === 'denied') return Promise.reject(new Error('Synthetic Clipboard denial'));
        if (mode === 'held') return new Promise((resolve, reject) => {
          window.__settleCopy = accepted => accepted ? resolve() : reject(new Error('Synthetic held denial'));
        });
        return Promise.resolve();
      }
    } });
  }, mode);
}

async function calculate(page, boost) {
  await reveal(page, '#sports-formBoost');
  await page.locator('#sports-formBoost').fill(String(boost));
  // The other number fields precede Calculate in the native tab order.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  const submit = '#sports-tool-form button[type="submit"]';
  await expect(page.locator(submit)).toBeFocused();
  const box = await reveal(page, submit);
  expect(box.focused).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator(report)).toContainText(`Recent form boost: ${boost}`);
}

async function readable(page, selector) {
  const colors = await page.locator(selector).evaluate(node => {
    let background = node;
    while (background.parentElement && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement;
    return { foreground: getComputedStyle(node).color, background: getComputedStyle(background).backgroundColor };
  });
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => a - b);
  const ratio = (values[1] + .05) / (values[0] + .05);
  expect(ratio, JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
  page.__observations.contrast.push({ selector, ...colors, ratio });
}

async function manualSelection(page, text) {
  let reached = false;
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('Tab');
    if (await page.locator(report).evaluate(node => document.activeElement === node)) { reached = true; break; }
  }
  expect(reached, 'Native Tab reaches the visible manual report.').toBe(true);
  await expect(page.locator(report)).toHaveAccessibleName('Local report text for manual copying');
  const box = await reveal(page, report);
  expect(box.focused).toBe(true);
  const focus = await page.locator(report).evaluate(node => ({ visible: node.matches(':focus-visible'),
    outline: getComputedStyle(node).outlineStyle, width: getComputedStyle(node).outlineWidth }));
  expect(focus.visible).toBe(true);
  expect(focus.outline).not.toBe('none');
  expect(parseFloat(focus.width)).toBeGreaterThan(0);
  // Real pointer selection demonstrates the offered recovery; no clipboard shortcut runs.
  const point = await page.locator(report).evaluate(node => {
    const range = document.createRange();
    range.setStart(node.firstChild, 0); range.setEnd(node.firstChild, 1);
    const rect = range.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.click(point.x, point.y, { clickCount: 3 });
  const selection = await page.evaluate(() => getSelection().toString());
  expect(selection.length).toBeGreaterThan(10);
  expect(text).toContain(selection.trim());
  page.__observations.manualSelection = { ...box, focus, selectedText: selection };
}

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL).origin;
  page.__observations = { writes: [], ai: [], errors: [], console: [], events: [], controls: [], contrast: [] };
  await page.exposeFunction('__recordAFCON', event => page.__observations.events.push(event));
  page.on('pageerror', error => page.__observations.errors.push({ name: error.name, message: error.message }));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) page.__observations.console.push({ type: message.type(), text: message.text() });
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) page.__observations.writes.push({ method: request.method(), path: url.pathname });
    if (/\/api\/ai|ai-advisor|ai-route-intent|openai\.com|anthropic/i.test(request.url())) page.__observations.ai.push(url.pathname);
  });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin && ['GET', 'HEAD'].includes(request.method()) && !url.pathname.startsWith('/api/')) return route.continue();
    if (request.method() === 'GET' && ['script', 'stylesheet'].includes(request.resourceType())) {
      return route.fulfill({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/css', body: '' });
    }
    return route.abort();
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    window.__prints = [];
    window.print = () => window.__prints.push({
      active: document.body.classList.contains('sports-printing'),
      gate: document.querySelector('[data-sports-report-gate]').classList.contains('print-active'),
      report: document.querySelector('[data-report-preview]').textContent
    });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const observation = page.__observations;
  observation.nativeTransitionAborts = observation.errors.filter(error => error.name === 'AbortError' && /Transition was skipped/.test(error.message));
  await testInfo.attach('local-observations', { body: JSON.stringify(observation, null, 2), contentType: 'application/json' });
  expect(observation.writes).toEqual([]);
  expect(observation.ai).toEqual([]);
  expect(observation.errors.filter(error => !observation.nativeTransitionAborts.includes(error))).toEqual([]);
});

for (const variant of variants) {
  test(`AFCON current report recovery ${variant.width} ${variant.theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: variant.width, height: 844 });
    await page.emulateMedia({ colorScheme: variant.theme, reducedMotion: 'reduce' });
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    const original = await page.locator(report).textContent();
    expect(original).toContain('Morocco title model - 8.0%');
    expect(original).toContain('scouting assumptions, not live rankings');

    for (const mode of ['absent', 'throw', 'denied', 'available']) {
      await adapter(page, mode);
      await pointer(page, copy);
      const expected = mode === 'available' ? 'Report copied locally.' : 'Copy is unavailable. Select the report below and copy it manually, or use Print / save PDF.';
      await expect(page.locator(status)).toHaveText(expected);
      await expect(page.locator(status)).toHaveAttribute('role', 'status');
      await expect(page.locator(status)).toHaveAttribute('aria-live', 'polite');
      await expect(page.locator(report)).toBeVisible();
      expect(await page.evaluate(() => window.__copyPayloads)).toEqual(mode === 'absent' ? [] : [original]);
      if (mode === 'absent') {
        await readable(page, status); await readable(page, report);
        await manualSelection(page, original);
        await page.screenshot({ path: testInfo.outputPath('manual-report.png') });
      }
    }
    await page.screenshot({ path: testInfo.outputPath('report-actions.png') });

    // A report requested before a real edit is an original snapshot, not the new report.
    await adapter(page, 'held');
    await pointer(page, copy);
    await calculate(page, 10);
    const edited = await page.locator(report).textContent();
    expect(edited).not.toBe(original);
    expect(await page.evaluate(() => window.__copyPayloads)).toEqual([original]);
    await page.evaluate(() => window.__settleCopy(false));
    await expect(page.locator(status)).toHaveText('');

    await adapter(page, 'held');
    await pointer(page, copy);
    await page.evaluate(() => { window.__olderCopy = window.__settleCopy; });
    await adapter(page, 'available');
    await pointer(page, copy);
    await expect(page.locator(status)).toHaveText('Report copied locally.');
    await page.evaluate(() => window.__olderCopy(false));
    await expect(page.locator(status)).toHaveText('Report copied locally.');

    await adapter(page, 'held');
    await pointer(page, copy);
    // WebKit leaves a mouse-clicked button unfocused; its first reverse Tab reaches Copy.
    // Observe native targets, then continue to the adjacent Print button without assigning focus.
    const nativeTargets = [];
    for (let step = 0; step < 3; step++) {
      await page.keyboard.press('Shift+Tab');
      nativeTargets.push(await page.evaluate(() => document.activeElement.outerHTML.slice(0, 200)));
      if (await page.locator('[data-print-report]').evaluate(node => document.activeElement === node)) break;
    }
    page.__observations.nativePrintTabTargets = nativeTargets;
    await expect(page.locator('[data-print-report]')).toBeFocused();
    await reveal(page, '[data-print-report]');
    page.__observations.events = [];
    await page.locator('[data-print-report]').evaluate(node => {
      for (const type of ['keydown', 'click']) node.addEventListener(type,
        event => window.__recordAFCON({ type, trusted: event.isTrusted }), { once: true });
    });
    await page.keyboard.press('Enter');
    await expect.poll(() => page.__observations.events).toEqual([
      { type: 'keydown', trusted: true }, { type: 'click', trusted: true }
    ]);
    await expect.poll(() => page.evaluate(() => window.__prints.length)).toBe(1);
    expect(await page.evaluate(() => window.__prints[0])).toEqual({ active: true, gate: true, report: edited });
    await expect(page.locator('body')).not.toHaveClass(/sports-printing/);
    await expect(page.locator('[data-sports-report-gate]')).not.toHaveClass(/print-active/);
    await page.evaluate(() => window.__settleCopy(true));
    // Copy completion does not move a user who intentionally switched controls.
    await expect(page.locator('[data-print-report]')).toBeFocused();
    await expect(page.locator(status)).toHaveText('Report copied locally.');

    await adapter(page, 'held');
    await pointer(page, copy);
    await pointer(page, '[data-reset]');
    await expect(page.locator(report)).toContainText('Recent form boost: 3');
    await page.evaluate(() => window.__settleCopy(true));
    await expect(page.locator(status)).toHaveText('');
    expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
  });
}

for (const theme of ['light', 'dark']) {
  test(`AFCON native Print captures the current synthetic report ${theme}`, async ({ page, browserName }, testInfo) => {
    // Explicit project matching gives two real Chromium PDF cases, with no skipped matrix cases.
    test.skip(browserName !== 'chromium', 'Real PDF parsing uses Chromium; native Print lifecycle is covered in all engines.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(route);
    const captures = [];
    await page.exposeFunction('__captureAFCONPDF', async () => {
      const bytes = await page.pdf({ format: 'A4', printBackground: true });
      const parsed = await pdfParse(bytes);
      fs.writeFileSync(testInfo.outputPath(`current-${captures.length}.pdf`), bytes);
      captures.push({ pages: parsed.numpages, text: parsed.text });
    });
    await page.evaluate(() => {
      const original = window.print;
      window.print = () => { original(); window.__captureAFCONPDF(); };
    });
    for (const boost of [3, 10]) {
      if (boost === 10) await calculate(page, boost);
      const text = await page.locator(report).textContent();
      await pointer(page, '[data-print-report]');
      await expect.poll(() => captures.length).toBe(boost === 3 ? 1 : 2);
      const actual = captures.at(-1).text.replace(/\s+/g, ' ');
      const headline = text.match(/^Headline: (.*)$/m)[1];
      expect(actual).toContain(headline);
      expect(actual).toContain(`Recent form boost: ${boost}`);
      expect(actual).toContain('scouting assumptions, not live rankings');
      expect(actual).not.toContain('Calculate');
      expect(actual).not.toContain('Choose your sports workflow');
      await expect(page.locator('body')).not.toHaveClass(/sports-printing/);
      await expect(page.locator('[data-sports-report-gate]')).not.toHaveClass(/print-active/);
    }
    const updated = captures[1].text.replace(/\s+/g, ' ');
    expect(updated).not.toContain('Recent form boost: 3');
    await testInfo.attach('parsed-current-pdfs', { body: JSON.stringify(captures), contentType: 'application/json' });
  });
}

test('A non-AFCON report retains its existing local export path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/athlete-earnings/');
  await expect(page.locator(status)).toHaveCount(0);
  await expect(page.locator(report)).not.toBeVisible();
  await adapter(page, 'available');
  const text = await page.locator(report).textContent();
  expect(text).toContain('Athlete Career Earnings Calculator - AfroTools Sports Report');
  expect(text).toContain('Projected career net - NGN 99,676,248');
  await pointer(page, copy);
  expect(await page.evaluate(() => window.__copyPayloads)).toEqual([text]);
  await pointer(page, '[data-print-report]');
  await expect.poll(() => page.evaluate(() => window.__prints.length)).toBe(1);
  expect(await page.evaluate(() => window.__prints[0])).toEqual({ active: true, gate: true, report: text });
  await expect(page.locator('body')).not.toHaveClass(/sports-printing/);
});

test('AFCON raw edits invalidate a held Copy before change-driven calculation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(route);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, get() { throw new Error('Synthetic Clipboard getter denial'); }
  }));
  await pointer(page, copy);
  await expect(page.locator(status)).toHaveText('Copy is unavailable. Select the report below and copy it manually, or use Print / save PDF.');

  await adapter(page, 'held');
  const original = await page.locator(report).textContent();
  await pointer(page, copy);
  await expect(page.locator(status)).toHaveText('Copying report…');
  await page.evaluate(() => { window.__originalPreview = document.querySelector('[data-report-preview]'); });
  await reveal(page, '#sports-formBoost');
  await page.locator('#sports-formBoost').fill('7');
  // Keep focus in the native input: the shared controller recalculates only on change/submit.
  await expect(page.locator('#sports-formBoost')).toBeFocused();
  await expect(page.locator('#sports-formBoost')).toHaveValue('7');
  expect(await page.locator(report).textContent()).toBe(original);
  expect(await page.evaluate(() => window.__originalPreview === document.querySelector('[data-report-preview]'))).toBe(true);
  await expect(page.locator(status)).toHaveText('');
  await page.evaluate(() => window.__settleCopy(false));
  await expect(page.locator(status)).toHaveText('');
  await expect(page.locator('#sports-formBoost')).toBeFocused();
  const box = await geometry(page, '#sports-formBoost');
  expect(box.full, JSON.stringify(box)).toBe(true);
  expect(box.hit, JSON.stringify(box)).toBe(true);
  expect(await page.evaluate(() => window.__copyPayloads)).toEqual([original]);
  page.__observations.rawEditFocus = box;
});
