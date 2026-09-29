const { test, expect } = require('@playwright/test');

const selected = [
  { id: 'amount-words-gh', route: '/tools/amount-words-gh/', width: 320, theme: 'dark', kind: 'tool' },
  { id: 'naira-to-words', route: '/tools/naira-to-words/', width: 390, theme: 'light', kind: 'tool' },
  { id: 'relocation', route: '/african/', width: 390, theme: 'dark', kind: 'route' },
];

async function geometry(page, selector) {
  return page.locator(selector).evaluate(node => {
    const box = node.getBoundingClientRect();
    const navbar = document.querySelector('afro-navbar');
    const headerNode = navbar && (navbar.shadowRoot?.querySelector('nav') || navbar);
    const header = headerNode ? Math.max(0, headerNode.getBoundingClientRect().bottom) : 0;
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, height: box.height, width: box.width,
      header, full: box.top >= header + 1 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth,
      hit: node === hit || node.contains(hit), focused: document.activeElement === node,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
  });
}

async function settled(page, selector) {
  let previous = '', stable = 0;
  for (let sample = 0; sample < 60; sample++) {
    const current = await page.locator(selector).evaluate(node => {
      const box = node.getBoundingClientRect();
      return JSON.stringify([scrollY.toFixed(1), box.top.toFixed(1), box.bottom.toFixed(1)]);
    });
    stable = current === previous ? stable + 1 : 0;
    if (stable >= 4) return;
    previous = current;
    await page.waitForTimeout(40);
  }
  throw new Error(`Native scrolling did not settle: ${selector}`);
}

async function pointer(page, selector, observation, stage) {
  await expect(page.locator(selector)).toBeVisible();
  await expect(page.locator(selector)).toBeEnabled();
  const center = 425;
  await page.mouse.move(2, center);
  await settled(page, selector);
  const first = await page.locator(selector).boundingBox();
  const budget = Math.ceil(Math.abs(first.y + first.height / 2 - center) / 500) + 8;
  for (let movement = 0; movement < budget; movement++) {
    const box = await page.locator(selector).boundingBox();
    const distance = box.y + box.height / 2 - center;
    if (Math.abs(distance) < 3) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, distance)));
    await settled(page, selector);
  }
  const before = await geometry(page, selector);
  expect(before.full, JSON.stringify(before)).toBe(true);
  expect(before.hit, JSON.stringify(before)).toBe(true);
  expect(before.overflow).toBe(0);
  await page.locator(selector).evaluate(node => {
    window.__workflowSaveProbe.pointer = [];
    for (const type of ['mousedown', 'mouseup', 'click']) node.addEventListener(type,
      event => window.__workflowSaveProbe.pointer.push({ type, trusted: event.isTrusted }), { once: true });
  });
  await page.mouse.click((before.left + before.right) / 2, (before.top + before.bottom) / 2);
  const events = await page.evaluate(() => window.__workflowSaveProbe.pointer);
  expect(events).toEqual(['mousedown', 'mouseup', 'click'].map(type => ({ type, trusted: true })));
  const after = await geometry(page, selector);
  expect(after.full, JSON.stringify(after)).toBe(true);
  expect(after.hit, JSON.stringify(after)).toBe(true);
  observation.controls.push({ stage, selector, before, after, events });
}

async function currentAmount(page) {
  return page.evaluate(() => ({ amount: document.getElementById('amount').value,
    words: document.getElementById('wordsResult')?.textContent || document.getElementById('result')?.textContent,
    documentLine: document.getElementById('docPreview').textContent }));
}

for (const item of selected) test.describe(`${item.id} ${item.width} ${item.theme}`, () => {
  test.use({ viewport: { width: item.width, height: 850 }, colorScheme: item.theme });
  test('normal and denied native Save feedback reflect device persistence', async ({ page, context, baseURL }, testInfo) => {
    const origin = new URL(baseURL).origin;
    const observation = { pageErrors: [], consoleErrors: [], warnings: [], requestFailures: [], blocked: [], writes: [], ai: [], controls: [], stages: {} };
    page.on('pageerror', error => observation.pageErrors.push({ name: error.name, message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') observation.consoleErrors.push(message.text());
      if (message.type() === 'warning') observation.warnings.push(message.text());
    });
    page.on('requestfailed', request => observation.requestFailures.push({ method: request.method(), path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
    await context.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      const metadata = { method: request.method(), origin: url.origin, path: url.pathname, type: request.resourceType() };
      const write = !['GET', 'HEAD'].includes(request.method());
      const ai = /\/ai(?:\/|-)|openai|anthropic/i.test(request.url());
      if (write) observation.writes.push(metadata);
      if (ai) observation.ai.push(metadata);
      if (url.origin === origin && !write && !ai && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/.netlify/functions/')) return route.continue();
      observation.blocked.push(metadata);
      return route.fulfill({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : request.resourceType() === 'stylesheet' ? 'text/css' : 'application/json',
        body: ['script', 'stylesheet'].includes(request.resourceType()) ? '' : '{}' });
    });
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      window.__workflowSaveProbe = { pointer: [], denied: [], clipboard: [], prints: 0 };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText(text) { window.__workflowSaveProbe.clipboard.push(text); return Promise.resolve(); },
      } });
      document.execCommand = () => { throw new Error('Host clipboard is excluded'); };
      window.print = () => { window.__workflowSaveProbe.prints++; };
    }, item.theme);
    try {
      const panel = item.kind === 'tool' ? `[data-african-workflow-mounted="${item.id}"]` : '[data-african-hub-workflows]';
      const save = item.kind === 'tool' ? panel + ' [data-afw-save]' : panel + ` [data-afw-save-route="${item.id}"]`;
      const status = panel + ' .afw-status';
      await page.goto(item.route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', item.theme);
      await expect(page.locator(status)).toHaveAttribute('aria-live', 'polite');
      if (item.kind === 'tool') {
        await expect(page.locator('#amount')).toBeEnabled();
        await pointer(page, '#amount', observation, 'amount-entry');
        await page.keyboard.type('12500.75');
        await expect(page.locator('#resultCard')).toBeVisible();
        observation.amountBefore = await currentAmount(page);
        await expect(page.locator('#resultCard button[onclick="copyDocumentLine()"]')).toBeEnabled();
        await expect(page.locator(panel + ' [data-afw-brief]')).toHaveText('Copy action brief');
      }
      await pointer(page, save, observation, 'normal-save');
      const success = item.kind === 'tool' ? 'Saved to your African workflow on this device.' : 'Route saved on this device. Open the dashboard workspace to continue from the first tool.';
      const failure = item.kind === 'tool' ? 'This browser could not save your African workflow on this device.' : 'This browser could not save this route on this device.';
      await expect(page.locator(status)).toHaveText(success);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('african_workflow_items')));
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(item.kind === 'tool' ? item.id : 'route-' + item.id);
      expect(stored[0].href).toBe(item.kind === 'tool' ? item.route : '/tools/japa-calculator/');
      observation.stages.normal = { status: await page.locator(status).textContent(), stored };
      if (item.kind === 'tool') expect(await currentAmount(page)).toEqual(observation.amountBefore);
      await page.screenshot({ path: testInfo.outputPath('normal-save.png') });
      await page.evaluate(() => {
        localStorage.removeItem('african_workflow_items');
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === 'african_workflow_items') {
            window.__workflowSaveProbe.denied.push({ key, value });
            throw new Error('Synthetic denied anonymous workflow write');
          }
          return original.call(this, key, value);
        };
      });
      await pointer(page, save, observation, 'denied-save');
      await expect(page.locator(status)).toHaveText(failure);
      expect(await page.evaluate(() => localStorage.getItem('african_workflow_items'))).toBeNull();
      expect(await page.evaluate(() => window.__workflowSaveProbe.denied.length)).toBe(1);
      observation.stages.denied = { status: await page.locator(status).textContent(), stored: null };
      if (item.kind === 'tool') expect(await currentAmount(page)).toEqual(observation.amountBefore);
      await page.screenshot({ path: testInfo.outputPath('denied-save.png') });
      expect(await page.evaluate(() => window.__workflowSaveProbe.clipboard)).toEqual([]);
      expect(await page.evaluate(() => window.__workflowSaveProbe.prints)).toBe(0);
      expect(observation.pageErrors).toEqual([]);
      expect(observation.consoleErrors).toEqual([]);
      expect(observation.requestFailures).toEqual([]);
      expect(observation.writes).toEqual([]);
      expect(observation.ai).toEqual([]);
    } finally {
      observation.nativeTransitionAborts = observation.pageErrors.filter(error => error.name === 'AbortError' && error.message === 'Transition was skipped').length;
      await testInfo.attach('native-save-observation', { body: Buffer.from(JSON.stringify(observation, null, 2)), contentType: 'application/json' });
    }
  });
});
