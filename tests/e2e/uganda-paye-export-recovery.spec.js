const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function geometry(page, selector) {
  return page.evaluate(selector => {
    const element = document.querySelector(selector);
    const rect = element.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const nav = host?.shadowRoot?.querySelector('nav') || host;
    const header = nav.getBoundingClientRect();
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      active: active?.id || active?.tagName, focused: active === element,
      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
      headerBottom: header.bottom, viewportHeight: innerHeight,
      full: rect.top >= header.bottom && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
      hit: hit === element || element.contains(hit), scrollY
    };
  }, selector);
}

async function pointer(page, selector, inspect) {
  for (let step = 0; step < 65; step += 1) {
    const before = await geometry(page, selector);
    if (before.full && before.hit) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const stable = await geometry(page, selector);
      if (stable.full && stable.hit && Math.abs(stable.top - before.top) < 0.5) {
        const inspected = inspect ? await geometry(page, inspect) : null;
        const count = await page.evaluate(() => window.__ugQa.events.length);
        await page.mouse.click((stable.left + stable.right) / 2, (stable.top + stable.bottom) / 2);
        const events = await page.evaluate(count => window.__ugQa.events.slice(count), count);
        expect(events.filter(event => event.type === 'click' && event.trusted)).toHaveLength(1);
        expect(events.every(event => event.trusted)).toBe(true);
        return { before: stable, inspected, events };
      }
    }
    const delta = Math.max(-650, Math.min(650, (before.top + before.bottom) / 2 - page.viewportSize().height * 0.52));
    await page.mouse.move(page.viewportSize().width / 2, page.viewportSize().height * 0.7);
    await page.mouse.wheel(0, Math.abs(delta) < 10 ? 120 : delta);
    await page.waitForTimeout(65);
  }
  throw new Error(`No stable visible native pointer target: ${selector} ${JSON.stringify(await geometry(page, selector))}`);
}

async function tabsTo(page, selector, key = 'Tab') {
  const focus = [];
  for (let index = 0; index < 95; index += 1) {
    await page.keyboard.press(key);
    const rect = await geometry(page, selector);
    focus.push(rect.active);
    if (rect.focused) {
      await expect.poll(async () => {
        const current = await geometry(page, selector);
        return current.focused && current.full && current.hit;
      }).toBe(true);
      return { focus, geometry: await geometry(page, selector) };
    }
  }
  throw new Error(`Native Tab did not reach ${selector}: ${JSON.stringify(focus)}`);
}

async function stableState(page) {
  const samples = [];
  let previous, unchanged = 0;
  for (let index = 0; index < 90; index += 1) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const scroll = await page.evaluate(() => scrollY);
    samples.push(scroll);
    unchanged = previous === scroll ? unchanged + 1 : 0;
    previous = scroll;
    if (unchanged >= 2) break;
  }
  expect(unchanged).toBeGreaterThanOrEqual(2);
  return { samples, state: await page.evaluate(() => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      active: active?.id || active?.tagName, scrollY,
      share: document.getElementById('ugShareStatus').textContent,
      pdf: document.getElementById('pdfStatus').textContent,
      disabled: document.getElementById('pdfBtn').disabled,
      busy: document.getElementById('pdfBtn').getAttribute('aria-busy'),
      result: RESULT && { gross: RESULT.gross, net: RESULT.netMonthly },
      calls: window.__ugQa.calls.length
    };
  }) };
}

async function contrast(locator) {
  return locator.evaluate(element => {
    const rgb = color => color.match(/[\d.]+/g).map(Number);
    const chain = []; let current = element;
    while (current) { chain.unshift(current); current = current.parentElement; }
    let background = [255, 255, 255];
    for (const node of chain) {
      const color = rgb(getComputedStyle(node).backgroundColor);
      const alpha = color[3] === undefined ? 1 : color[3];
      background = color.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
    }
    const foreground = rgb(getComputedStyle(element).color).slice(0, 3);
    const luminance = values => values.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
    const colors = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return { foreground, background, ratio: (colors[0] + 0.05) / (colors[1] + 0.05) };
  });
}

async function open(page, theme = 'dark', width = 320) {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(theme => {
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    const qa = window.__ugQa = { calls: [], events: [], held: [], mode: 'copy-success' };
    function action(kind, payload) {
      qa.calls.push({ kind, payload });
      if (qa.mode === kind + '-sync') throw new Error('Synthetic ' + kind + ' synchronous denial');
      if (qa.mode === kind + '-reject') return Promise.reject(new Error('Synthetic ' + kind + ' denial'));
      if (qa.mode === 'share-cancel') return Promise.reject(new DOMException('Synthetic cancellation', 'AbortError'));
      if (qa.mode === kind + '-held') return new Promise((resolve, reject) => qa.held.push({ resolve, reject, kind, payload }));
      return Promise.resolve();
    }
    qa.setMode = mode => {
      qa.mode = mode;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : { writeText: text => action('copy', text) } });
      Object.defineProperty(navigator, 'share', { configurable: true, value: mode.startsWith('share-') ? payload => action('share', payload) : undefined });
    };
    qa.setMode(qa.mode);
    for (const type of ['mousedown', 'mouseup', 'click']) document.addEventListener(type, event => {
      const element = event.target.closest?.('.calc-btn,#ugShareBtn,#pdfBtn,.per-btn,[data-tog],#salarySlider');
      if (element) qa.events.push({ type, target: element.id || element.className, trusted: event.isTrusted });
    }, true);
  }, theme);
  await page.goto('/uganda/ug-paye', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof calculate === 'function' && document.querySelector('afro-navbar')?.shadowRoot?.querySelector('nav'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await pointer(page, '.calc-btn');
  await expect(page.locator('#resAmount')).toContainText('1,086,750');
}

async function setMode(page, mode) { await page.evaluate(mode => window.__ugQa.setMode(mode), mode); }
async function settle(page, outcome, index = 0) {
  await page.evaluate(({ outcome, index }) => {
    const held = window.__ugQa.held.splice(index, 1)[0];
    if (outcome === 'cancel') held.reject(new DOMException('Synthetic cancellation', 'AbortError'));
    else held[outcome](outcome === 'reject' ? new Error('Synthetic held denial') : undefined);
  }, { outcome, index });
}
async function currentGross(page, amount) {
  await page.locator('#grossSalary').fill(String(amount));
  await page.waitForFunction(amount => RESULT?.gross === amount, amount);
}

test.beforeEach(async ({ page, baseURL }) => {
  page.__errors = []; page.__consoleErrors = []; page.__writes = [];
  page.on('pageerror', error => page.__errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') page.__consoleErrors.push(message.text()); });
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin || /^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname) || !['GET', 'HEAD'].includes(request.method())) {
      if (!['GET', 'HEAD'].includes(request.method())) page.__writes.push({ path: url.pathname, method: request.method() });
      return route.fulfill({ status: 204, body: '', contentType: /\.js$/.test(url.pathname) ? 'application/javascript' : url.hostname === 'fonts.googleapis.com' || /\.css$/.test(url.pathname) ? 'text/css' : 'application/json' });
    }
    return route.continue();
  });
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach('browser-errors-and-blocked-writes', { body: Buffer.from(JSON.stringify({ pageerrors: page.__errors, consoleErrors: page.__consoleErrors, blockedWrites: page.__writes })), contentType: 'application/json' });
  expect(page.__errors).toEqual([]);
  expect(page.__consoleErrors).toEqual([]);
  expect(page.__writes).toEqual([]);
});

for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`native invalid salary and live copy recovery at ${width}px ${theme}`, async ({ page }, testInfo) => {
    await open(page, theme, width);
    const copy = await pointer(page, '#ugShareBtn');
    await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
    await expect(page.locator('#ugShareBtn')).toHaveText('Share Result');
    expect(await page.evaluate(() => window.__ugQa.calls[0].payload)).toContain('Take-home UGX 1,086,750/mo');
    const copyContrast = await contrast(page.locator('#ugShareStatus'));
    expect(copyContrast.ratio).toBeGreaterThanOrEqual(4.5);
    await page.locator('#grossSalary').fill('0');
    await page.waitForTimeout(420);
    const invalidPointer = await pointer(page, '.calc-btn', '#grossSalary');
    expect(invalidPointer.inspected.top).toBeLessThan(invalidPointer.inspected.headerBottom);
    await expect.poll(async () => { const value = await geometry(page, '#grossSalary'); return value.focused && value.full && value.hit; }).toBe(true);
    await expect(page.getByRole('spinbutton', { name: 'Monthly salary' })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#salaryValidationStatus')).toContainText('above zero');
    await expect(page.locator('#salaryValidationStatus')).toHaveAttribute('role', 'status');
    await expect(page.locator('#salaryValidationStatus')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#ugShareStatus')).toBeEmpty();
    await page.locator('#grossSalary').fill('');
    await page.locator('#grossSalary').press('Enter');
    await expect.poll(async () => { const value = await geometry(page, '#grossSalary'); return value.focused && value.full && value.hit; }).toBe(true);
    const invalidKeyboard = await geometry(page, '#grossSalary');
    const errorContrast = await contrast(page.locator('#salaryValidationStatus'));
    expect(errorContrast.ratio).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath('invalid-focus-after.png') });
    await testInfo.attach('native-focus-and-message-contrast', { body: Buffer.from(JSON.stringify({ copy, invalidPointer, invalidKeyboard, copyContrast, errorContrast })), contentType: 'application/json' });
    const calls = await page.evaluate(() => window.__ugQa.calls.length);
    await page.evaluate(() => { shareResult(); downloadPdfSummary(); });
    expect(await page.evaluate(() => window.__ugQa.calls.length)).toBe(calls);
    await page.locator('#grossSalary').fill('500000');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => RESULT?.gross === 500000);
    await expect(page.locator('#resultsCard')).toBeVisible();
    await expect(page.locator('#resultsCard')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#pdfBtn')).toBeVisible();
    await expect(page.locator('#grossSalary')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#salaryValidationStatus')).toBeEmpty();
    await expect(page.locator('#grossSalary')).toHaveAttribute('placeholder', 'Monthly salary');
    await pointer(page, '#ugShareBtn');
    await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
    expect(await page.evaluate(() => window.__ugQa.calls.at(-1).payload)).toContain('Take-home UGX 436,750/mo');
  });
}

test('sync async absent and cancelled Share paths report honest local recovery', async ({ page }) => {
  await open(page);
  for (const [mode, message] of [['copy-sync', 'Copy was blocked.'], ['copy-reject', 'Copy was blocked.'], ['absent', 'Copy is unavailable.'], ['share-sync', 'Share could not finish.'], ['share-reject', 'Share could not finish.'], ['share-cancel', 'Share cancelled.'], ['share-success', 'Share completed.']]) {
    await setMode(page, mode);
    await pointer(page, '#ugShareBtn');
    await expect(page.locator('#ugShareStatus')).toContainText(message);
    if (!/cancel|success/.test(mode)) await expect(page.locator('#ugShareStatus')).toContainText('PDF');
    await expect(page.locator('#ugShareBtn')).toHaveText('Share Result');
    await expect(page.locator('#ugShareStatus')).not.toContainText('copied');
  }
});

for (const outcome of ['resolve', 'reject']) {
  test(`obsolete Copy ${outcome} preserves current focus feedback and newer attempt`, async ({ page }, testInfo) => {
    await open(page, 'light', 390);
    const evidence = [];
    for (const action of ['edit', 'calculate', 'period', 'newer']) {
      await setMode(page, 'copy-held');
      await pointer(page, '#ugShareBtn');
      await expect(page.locator('#ugShareStatus')).toHaveText('Copying summary…');
      if (action === 'edit') await currentGross(page, 500000);
      if (action === 'calculate') await pointer(page, '.calc-btn');
      if (action === 'period') await pointer(page, '.per-btn:not(.on)');
      if (action === 'newer') {
        await pointer(page, '#ugShareBtn');
        await settle(page, 'resolve', 1);
        await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
      }
      await tabsTo(page, '#ugPayeAskBtn');
      const before = await stableState(page);
      await settle(page, outcome);
      const after = await stableState(page);
      expect(after.state).toEqual(before.state);
      evidence.push({ action, before, after, focus: await geometry(page, '#ugPayeAskBtn') });
    }
    await testInfo.attach('copy-race-current-state', { body: Buffer.from(JSON.stringify(evidence)), contentType: 'application/json' });
  });
}

test('held native Share success denial and cancellation cannot overwrite a changed or newer result', async ({ page }, testInfo) => {
  await open(page, 'light', 390);
  const evidence = [];
  for (const outcome of ['resolve', 'reject', 'cancel']) for (const action of ['edit', 'newer']) {
    await setMode(page, 'share-held');
    await pointer(page, '#ugShareBtn');
    if (action === 'edit') await currentGross(page, (await page.locator('#grossSalary').inputValue()) === '500000' ? 750000 : 500000);
    else {
      await pointer(page, '#ugShareBtn');
      await settle(page, 'resolve', 1);
      await expect(page.locator('#ugShareStatus')).toHaveText('Share completed.');
    }
    await tabsTo(page, '#ugPayeAskBtn');
    const before = await stableState(page);
    await settle(page, outcome);
    const after = await stableState(page);
    expect(after.state).toEqual(before.state);
    evidence.push({ outcome, action, before, after });
  }
  await testInfo.attach('native-share-race-current-state', { body: Buffer.from(JSON.stringify(evidence)), contentType: 'application/json' });
});

test('new Copy feedback survives the previous timeout window', async ({ page }) => {
  await open(page);
  await pointer(page, '#ugShareBtn');
  await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
  await page.waitForTimeout(1500);
  await pointer(page, '#ugShareBtn');
  await page.waitForTimeout(1200);
  await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
  await expect(page.locator('#ugShareBtn')).toHaveText('Share Result');
});

test('actual native-keyboard PDFs contain current monthly annual and employer figures', async ({ page }, testInfo) => {
  await open(page, 'dark', 390);
  const evidence = [];
  for (const [gross, net, old] of [[1500000, '1,086,750', null], [500000, '436,750', '1,086,750']]) {
    if (gross !== 1500000) {
      await page.locator('#grossSalary').fill('0');
      await page.keyboard.press('Enter');
      await expect(page.locator('#resultsCard')).not.toBeVisible();
      await page.locator('#grossSalary').fill(String(gross));
      await page.keyboard.press('Enter');
      await page.waitForFunction(gross => RESULT?.gross === gross, gross);
      await expect(page.locator('#resultsCard')).toBeVisible();
      await expect(page.locator('#resultsCard')).not.toHaveAttribute('aria-hidden', 'true');
    }
    const focus = await tabsTo(page, '#pdfBtn');
    const event = page.waitForEvent('download');
    await page.keyboard.press('Enter');
    const download = await event;
    const file = testInfo.outputPath(`current-${gross}.pdf`);
    await download.saveAs(file);
    const parsed = await pdfParse(fs.readFileSync(file));
    const text = parsed.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('Uganda PAYE Summary');
    expect(text).toContain(net);
    expect(text).toContain('MONTHLY RESULT'); expect(text).toContain('ANNUAL VIEW'); expect(text).toContain('EMPLOYER VIEW');
    expect(text).toContain('Verify with local tax authority.');
    expect(text).not.toMatch(/Calculate Take-Home Pay|Frequently Asked|Get AI Tax Analysis/);
    if (old) expect(text).not.toContain(old);
    await expect(page.locator('#pdfStatus')).toContainText('PDF prepared');
    await expect(page.locator('#pdfBtn')).toBeEnabled();
    await expect(page.locator('#pdfBtn')).not.toHaveAttribute('aria-busy', 'true');
    evidence.push({ gross, net, focus, file, pages: parsed.numpages, text });
  }
  await testInfo.attach('actual-current-pdf-content', { body: Buffer.from(JSON.stringify(evidence)), contentType: 'application/json' });
});

test('PDF failure retry and obsolete finally preserve the newest request button state', async ({ page }, testInfo) => {
  await open(page);
  await page.evaluate(() => { window.__ugQa.realPdf = window.AfroTools.pdf; delete window.AfroTools.pdf; });
  await pointer(page, '#pdfBtn');
  await expect(page.locator('#pdfStatus')).toContainText('could not load');
  await expect(page.locator('#pdfBtn')).toBeEnabled();
  await page.evaluate(() => { window.AfroTools.pdf = window.__ugQa.realPdf; window.__ugQa.realGenerate = window.AfroTools.pdf.generate; window.AfroTools.pdf.generate = () => { throw new Error('Synthetic synchronous PDF denial'); }; });
  await pointer(page, '#pdfBtn');
  await expect(page.locator('#pdfStatus')).toContainText('failed. Please try again.');
  await expect(page.locator('#pdfBtn')).toBeEnabled();
  const evidence = [];
  for (const outcome of ['resolve', 'reject']) for (const action of ['edit', 'calculate', 'period']) {
    await page.evaluate(() => { window.__ugQa.pdfHeld = []; window.AfroTools.pdf.generate = options => new Promise((resolve, reject) => window.__ugQa.pdfHeld.push({ options, resolve, reject })); });
    await pointer(page, '#pdfBtn');
    await expect(page.locator('#pdfBtn')).toBeDisabled();
    if (action === 'edit') await currentGross(page, (await page.locator('#grossSalary').inputValue()) === '500000' ? 750000 : 500000);
    if (action === 'calculate') await pointer(page, '.calc-btn');
    if (action === 'period') await pointer(page, '.per-btn:not(.on)');
    await expect(page.locator('#pdfBtn')).toBeEnabled();
    await expect(page.locator('#pdfStatus')).toBeEmpty();
    await pointer(page, '#pdfBtn');
    await expect(page.locator('#pdfBtn')).toBeDisabled();
    await tabsTo(page, '#ugShareBtn');
    const before = await stableState(page);
    await page.evaluate(outcome => { const older = window.__ugQa.pdfHeld[0]; older[outcome](outcome === 'reject' ? new Error('Synthetic obsolete PDF denial') : undefined); }, outcome);
    const after = await stableState(page);
    expect(after.state).toEqual(before.state);
    await expect(page.locator('#pdfBtn')).toBeDisabled();
    await expect(page.locator('#pdfBtn')).toHaveAttribute('aria-busy', 'true');
    const payloads = await page.evaluate(() => window.__ugQa.pdfHeld.map(held => held.options));
    expect(payloads.every(value => value.title === 'Uganda PAYE Summary' && value.skipGate === true)).toBe(true);
    await page.evaluate(() => window.__ugQa.pdfHeld[1].resolve());
    await expect(page.locator('#pdfBtn')).toBeEnabled();
    await expect(page.locator('#pdfStatus')).toContainText('PDF prepared');
    evidence.push({ outcome, action, before, after, payloads });
  }
  await testInfo.attach('pdf-race-button-and-captured-payload', { body: Buffer.from(JSON.stringify(evidence)), contentType: 'application/json' });
});

test('salary slider immediately invalidates exports before the delayed calculation', async ({ page }, testInfo) => {
  await open(page);
  await pointer(page, '#ugShareBtn');
  await expect(page.locator('#ugShareStatus')).toHaveText('Summary copied.');
  const focus = await tabsTo(page, '#salarySlider', 'Shift+Tab');
  await page.evaluate(() => {
    document.getElementById('salarySlider').addEventListener('input', event => {
      const calls = window.__ugQa.calls.length;
      const immediate = {
        trusted: event.isTrusted,
        gross: Number(event.target.value),
        result: RESULT,
        share: document.getElementById('ugShareStatus').textContent,
        resultVisible: document.getElementById('resultsCard').classList.contains('on')
      };
      shareResult();
      downloadPdfSummary();
      immediate.exportCalls = window.__ugQa.calls.length - calls;
      window.__ugQa.sliderImmediate = immediate;
    }, { once: true });
  });
  await page.keyboard.press('ArrowRight');
  const immediate = await page.evaluate(() => window.__ugQa.sliderImmediate);
  expect(immediate.trusted).toBe(true);
  expect(immediate.gross).not.toBe(1500000);
  expect(immediate.result).toBeNull();
  expect(immediate.share).toBe('');
  expect(immediate.resultVisible).toBe(false);
  expect(immediate.exportCalls).toBe(0);
  await testInfo.attach('native-slider-keyboard-focus-and-immediate-state', { body: Buffer.from(JSON.stringify({ focus, immediate })), contentType: 'application/json' });
  await page.waitForFunction(gross => RESULT?.gross === gross, immediate.gross);
});
