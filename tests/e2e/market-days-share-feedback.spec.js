const { test, expect } = require('@playwright/test');

test.use({ timezoneId: 'Africa/Lagos', serviceWorkers: 'block', reducedMotion: 'reduce' });

async function settled(page) {
  let previous;
  for (let i = 0; i < 30; i++) {
    const current = await page.evaluate(() => scrollY);
    await page.waitForTimeout(80);
    const next = await page.evaluate(() => scrollY);
    if (previous === current && current === next) return;
    previous = next;
  }
  throw new Error('Native wheel did not settle');
}

async function bounds(page, selector) {
  return page.locator(selector).evaluate(el => {
    const rect = el.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const nav = host?.shadowRoot?.querySelector('nav') || host;
    const headerBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, headerBottom, height: innerHeight, width: document.documentElement.clientWidth, hit: hit === el || el.contains(hit), focused: document.activeElement === el, scrollY };
  });
}

async function pointer(page, selector, evidence) {
  await page.mouse.move(6, 200);
  let box;
  for (let i = 0; i < 35; i++) {
    await settled(page); box = await bounds(page, selector);
    if (box.top >= box.headerBottom && box.bottom <= box.height && box.left >= 0 && box.right <= box.width && box.hit) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, box.top - 160)));
  }
  expect(box.top).toBeGreaterThanOrEqual(box.headerBottom); expect(box.bottom).toBeLessThanOrEqual(box.height);
  expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(box.width); expect(box.hit).toBe(true);
  evidence.geometry.push({ selector, ...box });
  const before = await page.evaluate(() => window.shareFixture.events.length);
  await page.mouse.click((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  const events = await page.evaluate(index => window.shareFixture.events.slice(index), before);
  for (const type of ['mousedown', 'mouseup', 'click']) expect(events.some(event => event.type === type && event.trusted)).toBe(true);
}

async function nativeTabToShare(page, evidence) {
  await pointer(page, '#lookupDate', evidence);
  for (let i = 0; i < 24; i++) {
    if (await page.locator('#shareView').evaluate(el => document.activeElement === el)) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('#shareView')).toBeFocused();
  await settled(page);
  const box = await bounds(page, '#shareView');
  expect(box.top).toBeGreaterThanOrEqual(box.headerBottom); expect(box.bottom).toBeLessThanOrEqual(box.height); expect(box.hit).toBe(true);
  evidence.keyboardShare = box;
  const outline = await page.locator('#shareView').evaluate(el => ({ style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
  expect(outline.style).not.toBe('none'); expect(outline.width).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
}

async function setup(page, baseURL, width, theme) {
  const evidence = { width, theme, pageErrors: [], consoleErrors: [], warnings: [], blocked: [], writes: [], ai: [], geometry: [] };
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); else if (message.type() === 'warning') evidence.warnings.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) evidence.writes.push({ method: request.method(), pathname: new URL(request.url()).pathname });
    if (/ai-advisor|ai-route-intent|\/api\/ai/.test(new URL(request.url()).pathname)) evidence.ai.push(new URL(request.url()).pathname);
  });
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method()) || /^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) {
      evidence.blocked.push({ method: request.method(), origin: url.origin, pathname: url.pathname }); return route.abort();
    }
    return route.continue();
  });
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(theme => {
    localStorage.setItem('aft_theme', theme); localStorage.setItem('afrotools_cookie_consent', 'declined');
    const fixture = window.shareFixture = { mode: 'ok', shareEnabled: false, clipboardEnabled: true, calls: [], pending: [], events: [] };
    function call(kind, value) {
      fixture.calls.push({ kind, value });
      if (fixture.mode === 'throw') throw new Error('Synthetic synchronous failure');
      if (fixture.mode === 'deny') return Promise.reject(new Error('Synthetic denial'));
      if (fixture.mode === 'cancel') return Promise.reject(new DOMException('Synthetic cancellation', 'AbortError'));
      if (fixture.mode === 'held') return new Promise((resolve, reject) => fixture.pending.push({ resolve, reject }));
      return Promise.resolve();
    }
    Object.defineProperty(navigator, 'share', { configurable: true, get: () => fixture.shareEnabled ? value => call('share', value) : undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => fixture.clipboardEnabled ? { writeText: value => call('copy', value) } : undefined });
    for (const type of ['mousedown', 'mouseup', 'click', 'input', 'change', 'keydown']) document.addEventListener(type, event => {
      const target = event.target.closest?.('button,input,select,textarea') || event.target;
      if (!target.id && !target.matches?.('.calendar-day')) return;
      fixture.events.push({ type, id: target.id, date: target.getAttribute?.('data-date-key'), trusted: event.isTrusted, value: target.value, key: event.key });
    }, true);
  }, theme);
  await page.goto('/tools/market-days/?date=2026-10-01', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('#lookupDate')).toHaveValue('2026-10-01');
  await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('#shareStatus')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('label[for="lookupDate"]')).toBeVisible();
  return evidence;
}

async function mode(page, value, share = false) {
  await page.evaluate(({ value, share }) => { window.shareFixture.mode = value; window.shareFixture.shareEnabled = share; }, { value, share });
}

async function finish(page, evidence, testInfo) {
  evidence.fixture = await page.evaluate(() => ({ calls: window.shareFixture.calls, events: window.shareFixture.events }));
  evidence.status = await page.locator('#shareStatus').textContent();
  evidence.widths = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, innerWidth }));
  evidence.overflow = evidence.widths.scrollWidth - evidence.widths.clientWidth;
  await testInfo.attach('local-observations', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
  expect(evidence.pageErrors).toEqual([]); expect(evidence.writes).toEqual([]); expect(evidence.ai).toEqual([]); expect(evidence.overflow).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('final.png') });
}

test('mobile clipboard failures, unavailable recovery and native keyboard retry are truthful', async ({ page, baseURL }, testInfo) => {
  const evidence = await setup(page, baseURL, 320, 'dark');
  for (const failure of ['throw', 'deny']) {
    await mode(page, failure); await pointer(page, '#shareView', evidence);
    await expect(page.locator('#shareStatus')).toContainText('Could not copy automatically. Copy this link manually:');
    await expect(page.locator('#shareStatus')).toContainText('/tools/market-days/?date=2026-10-01');
    if (failure === 'throw') await page.screenshot({ path: testInfo.outputPath('clipboard-failure.png') });
  }
  await page.evaluate(() => { window.shareFixture.clipboardEnabled = false; });
  await pointer(page, '#shareView', evidence);
  await expect(page.locator('#shareStatus')).toContainText('Copy this URL from the address bar:');
  await page.evaluate(() => { window.shareFixture.clipboardEnabled = true; });
  await mode(page, 'ok'); await nativeTabToShare(page, evidence);
  await expect(page.locator('#shareStatus')).toHaveText('Link copied to clipboard.');
  await expect(page.locator('#shareView')).toBeFocused();
  expect(await page.evaluate(() => window.shareFixture.calls.at(-1).value)).toBe(new URL('/tools/market-days/?date=2026-10-01', baseURL).href);
  await finish(page, evidence, testInfo);
});

test('blank date and a newer clipboard attempt suppress stale feedback without moving focus', async ({ page, baseURL }, testInfo) => {
  const evidence = await setup(page, baseURL, 1200, 'light');
  await mode(page, 'held'); await pointer(page, '#shareView', evidence);
  await expect(page.locator('#shareStatus')).toHaveText('Copying link…');
  await pointer(page, '#lookupDate', evidence);
  await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await page.keyboard.press('Tab');
  await expect(page.locator('#lookupDate')).toHaveValue('');
  await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#selectedDateResult')).toBeHidden(); await expect(page.locator('#shareView')).toBeDisabled();
  await expect(page.locator('#shareStatus')).toHaveText('');
  const focused = await page.evaluate(() => document.activeElement.id);
  await page.evaluate(() => window.shareFixture.pending[0].resolve());
  await expect(page.locator('#shareStatus')).toHaveText('');
  expect(await page.evaluate(() => document.activeElement.id)).toBe(focused);
  await page.screenshot({ path: testInfo.outputPath('blank-after-old-completion.png') });
  await pointer(page, '#useNigeriaToday', evidence);
  await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'false'); await expect(page.locator('#shareView')).toBeEnabled();
  const currentDate = await page.locator('#lookupDate').inputValue();
  await mode(page, 'held'); await pointer(page, '#shareView', evidence);
  await mode(page, 'ok'); await pointer(page, '#shareView', evidence);
  await expect(page.locator('#shareStatus')).toHaveText('Link copied to clipboard.');
  await pointer(page, '#lookupDate', evidence);
  await page.evaluate(() => window.shareFixture.pending[1].reject(new Error('Synthetic old denial')));
  await expect(page.locator('#shareStatus')).toHaveText('Link copied to clipboard.'); await expect(page.locator('#lookupDate')).toBeFocused();
  expect(await page.evaluate(() => window.shareFixture.calls.at(-1).value)).toBe(new URL('/tools/market-days/?date=' + currentDate, baseURL).href);
  evidence.nativeClear = await page.evaluate(() => window.shareFixture.events.filter(event => event.id === 'lookupDate' && ['input', 'change'].includes(event.type)));
  expect(evidence.nativeClear.some(event => event.trusted && event.value === '')).toBe(true);
  await finish(page, evidence, testInfo);
});

test('Share failures and cancellation stay honest and date-away-and-back invalidates held completion', async ({ page, baseURL }, testInfo) => {
  const evidence = await setup(page, baseURL, 390, 'dark');
  for (const failure of ['throw', 'deny']) {
    await mode(page, failure, true); await pointer(page, '#shareView', evidence);
    await expect(page.locator('#shareStatus')).toContainText('Could not share automatically. Copy this link manually:');
    if (failure === 'throw') await page.screenshot({ path: testInfo.outputPath('share-failure.png') });
  }
  await mode(page, 'cancel', true); await pointer(page, '#shareView', evidence);
  await expect(page.locator('#shareStatus')).toHaveText('Share cancelled.');
  await mode(page, 'ok', true); await pointer(page, '#shareView', evidence); await expect(page.locator('#shareStatus')).toHaveText('Shared.');
  await mode(page, 'held', true); await pointer(page, '#shareView', evidence);
  await pointer(page, '#calendarGrid [data-date-key="2026-10-02"]', evidence);
  await expect(page.locator('#lookupDate')).toHaveValue('2026-10-02');
  await pointer(page, '#calendarGrid [data-date-key="2026-10-01"]', evidence);
  await expect(page.locator('#lookupDate')).toHaveValue('2026-10-01'); await expect(page.locator('#shareStatus')).toHaveText('');
  await page.evaluate(() => window.shareFixture.pending[0].resolve()); await expect(page.locator('#shareStatus')).toHaveText('');
  const payload = await page.evaluate(() => window.shareFixture.calls[0].value);
  expect(payload).toEqual({ title: 'Igbo Market Day Finder', text: 'Check this verified Igbo market day lookup.', url: new URL('/tools/market-days/?date=2026-10-01', baseURL).href });
  await finish(page, evidence, testInfo);
});
