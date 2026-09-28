const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const engineContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../assets/js/engines/ke-paye.js'), 'utf8'), engineContext);
const engine = engineContext.window.AfroTools.engines.kePAYE;
const calculationOptions = { nssf: true, shif: true, ahl: true, personalRelief: true };

async function geometry(control) {
  return control.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const host = document.querySelector('afro-navbar');
    const nav = host?.shadowRoot?.querySelector('nav') || host;
    const header = nav?.getBoundingClientRect().bottom || 0;
    const x = (rect.left + rect.right) / 2, y = (rect.top + rect.bottom) / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
      width: rect.width, height: rect.height, header, viewport: innerHeight, x, y,
      focused: document.activeElement === element,
      full: rect.width > 0 && rect.height > 0 && rect.top >= header && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth,
      centerHit: !!hit && (hit === element || element.contains(hit))
    };
  });
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function revealWithWheel(page, control) {
  let previous;
  for (let attempt = 0; attempt < 35; attempt++) {
    const bounds = await geometry(control);
    if (bounds.full && bounds.centerHit && bounds.top >= bounds.header + 8 && bounds.bottom <= bounds.viewport - 8 && previous && Math.abs(previous.top - bounds.top) < 0.01) return bounds;
    previous = bounds;
    if (bounds.top < bounds.header + 8) await page.mouse.wheel(0, -200);
    else if (bounds.bottom > bounds.viewport - 8) await page.mouse.wheel(0, 200);
    await settle(page);
  }
  throw new Error('Native wheel did not reveal a stable, fully visible, hittable control: ' + JSON.stringify(await geometry(control)));
}

async function nativePointer(page, control, beforeClick) {
  const bounds = await revealWithWheel(page, control);
  if (beforeClick) await beforeClick();
  await page.mouse.click(bounds.x, bounds.y);
  await settle(page);
  return bounds;
}

async function expectUsableFocus(control) {
  await expect.poll(async () => {
    const bounds = await geometry(control);
    return bounds.focused && bounds.full && bounds.centerHit;
  }).toBe(true);
}

async function currentResult(page, gross) {
  const expected = engine.calculate(gross, calculationOptions);
  const card = page.locator('#resultsCard');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/\bon\b/);
  await expect.poll(() => card.evaluate(element => ({ display: element.style.display, aria: element.getAttribute('aria-hidden'), computed: getComputedStyle(element).display, height: element.getBoundingClientRect().height })))
    .toMatchObject({ display: '', aria: null, computed: 'block' });
  const result = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.net, paye: RESULT.paye, taxable: RESULT.taxable }));
  expect(result.gross).toBe(gross);
  expect(result.net).toBeCloseTo(expected.net, 4);
  expect(result.paye).toBeCloseTo(expected.paye, 4);
  expect(result.taxable).toBeCloseTo(expected.taxable, 4);
  await expect(page.locator('#resAmount')).toHaveText('KES ' + Math.round(expected.net).toLocaleString('en-KE'));
  for (const button of await card.locator('.action-row button').all()) {
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
}

async function guideGeometry(page) {
  return page.locator('.ng-guide-grid').evaluate(grid => {
    const bounds = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width }; };
    const table = grid.querySelector('.ng-bands-table');
    const card = table.closest('.ng-guide-card');
    return {
      grid: bounds(grid), columns: [...grid.querySelectorAll('.ng-guide-col')].map(bounds), cards: [...grid.querySelectorAll('.ng-guide-card')].map(bounds),
      table: bounds(table), card: bounds(card), tableText: table.textContent,
      cells: [...table.querySelectorAll('th,td')].map(cell => ({ ...bounds(cell), text: cell.textContent.trim(), scrollWidth: cell.scrollWidth, clientWidth: cell.clientWidth, whiteSpace: getComputedStyle(cell).whiteSpace })),
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
}

for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`Kenya salary invalid recovery keeps current results and controls visible at ${width}px ${theme}`, async ({ page, context, baseURL }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const report = { width, theme, events: [], pageErrors: [], consoleErrors: [], warnings: [], blocked: [], failedRequests: [], checkpoints: {} };
    const origin = new URL(baseURL).origin;
    await context.addInitScript(({ theme }) => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem('aft_theme', theme);
      window.__kenyaRecoveryEvents = [];
      for (const type of ['input', 'change', 'keydown', 'pointerdown', 'pointerup', 'click']) document.addEventListener(type, event => {
        if (event.target?.id === 'salaryInput' || event.target?.closest?.('.calc-btn,.preset-btn')) window.__kenyaRecoveryEvents.push({ type, trusted: event.isTrusted, key: event.key || null, target: event.target.id || event.target.className });
      });
    }, { theme });
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === 'https://fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '/* Local-only QA uses the existing bundled typography. */' });
      if (url.origin === 'https://www.googletagmanager.com') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Analytics declined: local-only QA. */' });
      if (url.origin !== origin || request.method() !== 'GET' || url.pathname.startsWith('/.netlify/')) {
        report.blocked.push({ origin: url.origin, path: url.pathname, method: request.method() });
        return route.abort();
      }
      return route.continue();
    });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
      if (message.type() === 'warning') report.warnings.push(message.text());
    });
    page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
    try {
      await page.goto('/kenya/ke-paye', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__afroPayeInvalidResultGuard && window.__afroPayeInvalidResultGuardV2 && document.querySelector('afro-navbar')?.shadowRoot?.querySelector('nav'));
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const salary = page.getByLabel('Monthly Gross Salary', { exact: true });
      await expect(salary).toHaveAttribute('id', 'salaryInput');
      await nativePointer(page, salary);
      await salary.fill('100000');
      await expectUsableFocus(salary);
      await salary.press('Enter');
      await currentResult(page, 100000);
      expect((await page.evaluate(() => RESULT.net))).toBeCloseTo(70441.65, 2);

      for (const [invalid, positive] of [['0', '120000'], ['', '200000']]) {
        await nativePointer(page, salary);
        await salary.fill(invalid);
        await salary.press('Enter');
        await expect(page.locator('#resultsCard')).toBeHidden();
        expect(await page.evaluate(() => RESULT)).toBeNull();
        await expectUsableFocus(salary);
        report.checkpoints['invalid-' + (invalid || 'blank')] = await geometry(salary);
        await salary.fill(positive);
        await expectUsableFocus(salary);
        await salary.press('Enter');
        await currentResult(page, Number(positive));
      }

      const pdf = page.getByRole('button', { name: 'Download PDF', exact: true });
      report.checkpoints.recoveredPdf = await revealWithWheel(page, pdf);
      expect(report.checkpoints.recoveredPdf.full && report.checkpoints.recoveredPdf.centerHit).toBe(true);

      await nativePointer(page, salary);
      await salary.fill('0');
      const calculate = page.getByRole('button', { name: /Calculate My Take-Home Pay/ });
      report.checkpoints.invalidCalculateDispatch = await nativePointer(page, calculate, async () => {
        report.checkpoints.invalidPointerBefore = await geometry(salary);
      });
      await expectUsableFocus(salary);
      report.checkpoints.invalidPointerAfter = await geometry(salary);
      await expect(page.locator('#resultsCard')).toBeHidden();
      await salary.fill('100000');
      report.checkpoints.validCalculateDispatch = await nativePointer(page, calculate);
      await currentResult(page, 100000);

      await nativePointer(page, salary);
      await salary.fill('0');
      const preset = page.getByRole('button', { name: 'KES 50k', exact: true });
      report.checkpoints.presetDispatch = await nativePointer(page, preset);
      await currentResult(page, 50000);

      report.guide = await guideGeometry(page);
      expect(report.guide.overflow).toBe(0);
      for (const rect of [...report.guide.columns, ...report.guide.cards]) {
        expect(rect.left).toBeGreaterThanOrEqual(report.guide.grid.left);
        expect(rect.right).toBeLessThanOrEqual(report.guide.grid.right);
      }
      expect(report.guide.table.left).toBeGreaterThanOrEqual(report.guide.card.left);
      expect(report.guide.table.right).toBeLessThanOrEqual(report.guide.card.right);
      for (const cell of report.guide.cells) {
        // WebKit collapsed borders can round a cell edge by one 1/64 CSS pixel.
        // This precision allowance applies only to table/cell edges, not page or focus bounds.
        expect(cell.left).toBeGreaterThanOrEqual(report.guide.table.left - 0.02);
        expect(cell.right).toBeLessThanOrEqual(report.guide.table.right + 0.02);
        expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
      }
      expect(report.guide.tableText).toContain('Monthly Income (KES)');
      expect(report.guide.cells.map(cell => cell.text)).toEqual(['Monthly Income (KES)', 'Rate', 'Up to 24,000', '10%', '24,001 - 32,333', '25%', '32,334 - 500,000', '30%', '500,001 - 800,000', '32.5%', 'Above 800,000', '35%']);
      await revealWithWheel(page, pdf);
      await page.screenshot({ path: testInfo.outputPath('recovered-controls.png') });
      await revealWithWheel(page, page.locator('.ng-bands-table'));
      await page.screenshot({ path: testInfo.outputPath('guide-table.png') });
      report.events = await page.evaluate(() => window.__kenyaRecoveryEvents);
      expect(report.events.filter(event => event.type === 'keydown' && event.key === 'Enter' && event.trusted).length).toBeGreaterThanOrEqual(5);
      expect(report.events.filter(event => event.type === 'click' && event.target === 'calc-btn' && event.trusted).length).toBe(2);
      expect(report.pageErrors).toEqual([]);
      expect(report.blocked.filter(request => request.method !== 'GET')).toEqual([]);
      const unexpectedFailed = report.failedRequests.filter(request => new URL(request.url).origin === origin);
      expect(unexpectedFailed).toEqual([]);
      const deliberatelyBlocked = report.blocked.map(request => request.origin + request.path);
      const unexpectedConsole = report.consoleErrors.filter(error => !(deliberatelyBlocked.includes(error.location.url.split('?')[0]) && /Failed to load resource/.test(error.text)));
      expect(unexpectedConsole).toEqual([]);
    } finally {
      report.events = await page.evaluate(() => window.__kenyaRecoveryEvents || []).catch(() => report.events);
      await fs.promises.writeFile(testInfo.outputPath('workflow.json'), JSON.stringify(report, null, 2));
      await testInfo.attach('workflow evidence', { path: testInfo.outputPath('workflow.json'), contentType: 'application/json' });
    }
  });
}
