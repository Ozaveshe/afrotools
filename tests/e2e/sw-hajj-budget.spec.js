const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const route = '/sw/zana/bajeti-ya-hajj-na-umrah/';
const axePath = process.env.AXE_CORE_PATH;
test.describe.configure({ mode: 'serial' });

function observe(page) {
  const evidence = { consoleErrors: [], pageErrors: [], badResponses: [], failedRequests: [], writes: [], external: [] };
  page.on('console', message => { if (message.type() === 'error') evidence.consoleErrors.push(message.text()); });
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) evidence.badResponses.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => evidence.failedRequests.push(`${request.failure() && request.failure().errorText} ${request.url()}`));
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) evidence.external.push(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) evidence.writes.push({ method: request.method(), url: request.url(), body: request.postData() });
  });
  return evidence;
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.hajjBudget))).toBe(true);
  await expect(page.locator('#hb-status')).toContainText('Hakuna data');
}

async function open(page, width = 375) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await settle(page);
}

async function calculatePreset(page) {
  await page.getByRole('button', { name: 'Kokotoa mfano' }).click();
  await expect(page.locator('#hb-result')).toBeVisible();
}

async function calculateQuote(page) {
  await page.getByRole('button', { name: 'Kokotoa nukuu' }).click();
  await expect(page.locator('#hb-result')).toBeVisible();
}

async function expectValue(page, selector, value) {
  await expect(page.locator(selector)).toHaveAttribute('data-value', String(value));
}

async function chooseTheme(page, mode) {
  if (mode === 'system-light' || mode === 'system-dark') {
    await page.emulateMedia({ colorScheme: mode === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    await page.locator('#hb-theme').selectOption('system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  } else {
    await page.emulateMedia({ colorScheme: mode === 'dark' ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.locator('#hb-theme').selectOption(mode);
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function computedAudit(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const parse = value => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillStyle = String(value || 'transparent'); ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2], p[3] / 255]; };
    const composite = (fg, bg) => { const a = fg[3] + bg[3] * (1 - fg[3]); return a ? [(fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a, (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a, (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a, a] : [0, 0, 0, 0]; };
    const lum = color => color.slice(0, 3).map(c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const ignored = 'script,style,noscript,template,.hb-visually-hidden,[hidden],[aria-hidden="true"]';
    const visible = element => element && !element.closest(ignored) && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && element.getBoundingClientRect().width > 0;
    const background = element => { const layers = []; for (let current = element; current; current = current.parentElement) layers.push(parse(getComputedStyle(current).backgroundColor)); let output = parse(getComputedStyle(document.documentElement).colorScheme.includes('dark') ? '#080f1d' : '#ffffff'); for (let i = layers.length - 1; i >= 0; i -= 1) output = composite(layers[i], output); return output; };
    const failures = []; let minText = Infinity; let minBoundary = Infinity; let textNodes = 0; let boundaries = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.textContent.trim() && visible(node.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement; const style = getComputedStyle(element); const bg = background(element); const ratio = contrast(composite(parse(style.color), bg), bg); const size = parseFloat(style.fontSize); const weight = parseInt(style.fontWeight, 10) || 400; const required = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      minText = Math.min(minText, ratio); textNodes += 1; if (ratio + 0.005 < required) failures.push(`text ${element.tagName} ${ratio.toFixed(2)} ${element.textContent.trim().slice(0, 32)}`);
    }
    document.querySelectorAll('input,select,button,a[href],summary').forEach(element => {
      if (!visible(element)) return; const style = getComputedStyle(element); const adjacent = background(element.parentElement || element); const own = background(element); const border = composite(parse(style.borderColor), adjacent); const ratio = Math.max(contrast(border, adjacent), contrast(own, adjacent)); const inline = element.tagName === 'A' && style.textDecorationLine.includes('underline');
      if (!inline) { minBoundary = Math.min(minBoundary, ratio); boundaries += 1; if (ratio + 0.005 < 3) failures.push(`${element.id || element.tagName} boundary ${ratio.toFixed(2)} border=${style.borderColor} own=${own.slice(0, 3).map(Math.round).join(',')} adjacent=${adjacent.slice(0, 3).map(Math.round).join(',')} theme=${document.documentElement.dataset.theme}`); }
      const rect = element.getBoundingClientRect(); if (!inline && (rect.width < 24 || rect.height < 24)) failures.push(`${element.id || element.tagName} target ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`);
    });
    return { failures, minText: Number(minText.toFixed(2)), minBoundary: Number(minBoundary.toFixed(2)), textNodes, boundaries };
  });
}

async function sequentialKeyboardAudit(page) {
  const expected = await page.evaluate(() => Array.from(document.querySelectorAll('main a[href],main button:not(:disabled),main input:not(:disabled),main select:not(:disabled),main summary')).filter(element => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).map((element, index) => { element.dataset.hbTab = String(index); return String(index); }));
  await page.locator('#hb-main').focus();
  const visited = []; const focusFailures = [];
  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press('Tab');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const item = await page.evaluate(() => { const element = document.activeElement; const style = getComputedStyle(element); return { marker: element.dataset.hbTab || null, id: element.id || element.tagName, width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset), style: style.outlineStyle, color: style.outlineColor }; });
    visited.push(item.marker); if (!item.marker || item.width < 2 || item.offset < 2 || item.style === 'none' || item.color === 'transparent') focusFailures.push(item);
  }
  return { expected, visited, focusFailures, count: expected.length };
}

async function axeAudit(page) {
  if (!axePath || !fs.existsSync(axePath)) throw new Error('AXE_CORE_PATH must reference axe.min.js for the fail-closed accessibility gate.');
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const report = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    return { violations: report.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length, targets: item.nodes.map(node => node.target) })), passes: report.passes.length, incomplete: report.incomplete.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target), summaries: item.nodes.map(node => node.failureSummary) })) };
  });
}

test('both English-owner workflows have exact oracles, invalid boundaries and stale gating with no network writes', async ({ page }) => {
  const evidence = observe(page); await open(page); await expect(page.locator('html')).toHaveAttribute('lang', 'sw'); await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.locator('main input,main select').evaluateAll(controls => controls.every(control => control.labels && control.labels.length === 1))).toBe(true);
  expect(await page.locator('#hb-copy,#hb-json,#hb-save,#hb-pdf,#hb-print').evaluateAll(buttons => buttons.every(button => button.disabled))).toBe(true);

  await calculatePreset(page); await expectValue(page, '#hb-total', 8002.4); await expectValue(page, '#hb-per-traveler', 8002.4); await expectValue(page, '#hb-buffer-value', 857.4); await expectValue(page, '#hb-subtotal', 7145); await expectValue(page, '#hb-line-one', 6200); await expectValue(page, '#hb-line-two', 945);
  await page.locator('#hb-days').fill('22'); await expect(page.locator('#hb-result')).toBeHidden(); expect(await page.locator('#hb-copy,#hb-json,#hb-save,#hb-pdf,#hb-print').evaluateAll(buttons => buttons.every(button => button.disabled))).toBe(true);
  await page.locator('#hb-travelers').fill('0'); await page.getByRole('button', { name: 'Kokotoa mfano' }).click(); await expect(page.locator('#hb-status')).toContainText('si halali'); await expect(page.locator('#hb-travelers')).toBeFocused(); await expect(page.locator('#hb-result')).toBeHidden();

  await page.locator('#hb-origin').selectOption('KE'); await page.locator('#hb-trip').selectOption('umrah'); await page.locator('#hb-travelers').fill('2'); await page.locator('#hb-package').selectOption('economy'); await page.locator('#hb-days').fill('10'); await page.locator('#hb-buffer').fill('0'); await calculatePreset(page); await expectValue(page, '#hb-total', 4073.76); await expectValue(page, '#hb-per-traveler', 2036.88); await expectValue(page, '#hb-line-one', 1622.88); await expectValue(page, '#hb-line-two', 900);
  await page.locator('#hb-origin').selectOption('ZA'); await page.locator('#hb-trip').selectOption('hajj'); await page.locator('#hb-travelers').fill('100'); await page.locator('#hb-package').selectOption('premium'); await page.locator('#hb-days').fill('365'); await page.locator('#hb-buffer').fill('100'); await calculatePreset(page); await expectValue(page, '#hb-total', 6189100);

  await calculateQuote(page); await expectValue(page, '#hb-total', 7840); await expectValue(page, '#hb-per-traveler', 7840); await expectValue(page, '#hb-buffer-value', 840); await expectValue(page, '#hb-subtotal', 7000); await expectValue(page, '#hb-line-one', 6200); await expectValue(page, '#hb-line-two', 800);
  await page.locator('#hb-package-cost').fill('-1'); await page.getByRole('button', { name: 'Kokotoa nukuu' }).click(); await expect(page.locator('#hb-status')).toContainText('si halali'); await expect(page.locator('#hb-package-cost')).toBeFocused(); await expect(page.locator('#hb-result')).toBeHidden();

  expect(evidence.external).toEqual([]); expect(evidence.writes).toEqual([]); expect(evidence.pageErrors).toEqual([]); expect(evidence.consoleErrors, JSON.stringify(evidence)).toEqual([]); expect(evidence.badResponses).toEqual([]); expect(evidence.failedRequests, JSON.stringify(evidence)).toEqual([]);
});

test('clipboard, parsed JSON/import, local reopen, parsed PDF, print and offline recalc preserve the owner result', async ({ page, context }) => {
  test.setTimeout(120000); const evidence = observe(page); await context.grantPermissions(['clipboard-read', 'clipboard-write']); await open(page); await calculatePreset(page);
  await page.locator('#hb-copy').click(); await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Jumla ya makadirio: US$'); await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('8,002.40');
  const jsonPromise = page.waitForEvent('download'); await page.locator('#hb-json').click(); const jsonDownload = await jsonPromise; expect(jsonDownload.suggestedFilename()).toBe('bajeti-ya-hajj-na-umrah.json'); const jsonPath = await jsonDownload.path(); const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(payload).toMatchObject({ schemaVersion: 1, tool: 'hajj-budget', locale: 'sw', mode: 'preset', inputs: { origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 12 }, results: { total: 8002.4, perTraveler: 8002.4, contingencyValue: 857.4, subtotal: 7145 } }); expect(payload.sourceSnapshot.packageUsd).toEqual({ economy: 4200, standard: 6200, premium: 9800 }); expect(payload.sourceSnapshot.dailyAllowanceUsd).toBe(45); expect(payload.privacy).toContain('hakuna data');
  await page.locator('#hb-days').fill('30'); await page.locator('#hb-import').setInputFiles(jsonPath); await expect(page.locator('#hb-days')).toHaveValue('21'); await expectValue(page, '#hb-total', 8002.4); await expect(page.locator('#hb-status')).toContainText('JSON imefunguliwa');
  await page.locator('#hb-save').click(); await page.locator('#hb-days').fill('30'); await page.locator('#hb-open-saved').click(); await expect(page.locator('#hb-days')).toHaveValue('21'); await expectValue(page, '#hb-total', 8002.4); await expect(page.locator('#hb-status')).toContainText('kukokotolewa upya');
  const pdfPromise = page.waitForEvent('download'); await page.locator('#hb-pdf').click(); const pdfDownload = await pdfPromise; const pdf = await pdfParse(fs.readFileSync(await pdfDownload.path())); expect(pdf.text).toContain('Bajeti ya Hajj na Umrah'); expect(pdf.text).toMatch(/8,002\.40/); expect(pdf.text).toMatch(/MPAKA WA UTHIBITISHO/i);
  await page.evaluate(() => { window.__hbPrinted = 0; window.print = () => { window.__hbPrinted += 1; }; }); await page.locator('#hb-print').click(); expect(await page.evaluate(() => window.__hbPrinted)).toBe(1);
  await context.setOffline(true); await page.locator('#hb-package-cost').fill('6200'); await page.locator('#hb-cash-budget').fill('800'); await page.locator('#hb-quote-travelers').fill('1'); await page.locator('#hb-quote-buffer').fill('12'); await calculateQuote(page); await expectValue(page, '#hb-total', 7840); await context.setOffline(false);
  expect(evidence.external).toEqual([]); expect(evidence.writes).toEqual([]); expect(evidence.pageErrors).toEqual([]); expect(evidence.consoleErrors, JSON.stringify(evidence)).toEqual([]); expect(evidence.badResponses).toEqual([]); expect(evidence.failedRequests, JSON.stringify(evidence)).toEqual([]);
});

test('canonical, reciprocal hreflang, hub, registry, source boundary and artwork are route-exact', async ({ page }) => {
  await open(page); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/bajeti-ya-hajj-na-umrah/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/hajj-budget/'); await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/budget-hajj-umrah/');
  await expect.poll(() => page.locator('meta[property="og:image"],meta[name="twitter:image"]').evaluateAll(nodes => nodes.map(node => node.content))).toEqual(['https://afrotools.com/assets/img/tools/hajj-budget.webp', 'https://afrotools.com/assets/img/tools/hajj-budget.webp']);
  await expect(page.locator('meta[name="afrotools:source-owner"]')).toHaveAttribute('content', 'hajj-budget'); await expect(page.getByRole('heading', { name: 'Chanzo, ufreshi na kiwango cha uhakika' })).toBeVisible(); await expect(page.getByText('AfroTools haivuti bei, nafasi, visa wala hali ya mwendeshaji')).toBeVisible();
  const en = fs.readFileSync('tools/hajj-budget/index.html', 'utf8'); const fr = fs.readFileSync('fr/tools/budget-hajj-umrah/index.html', 'utf8'); const hub = fs.readFileSync('sw/dini-na-utamaduni/index.html', 'utf8'); const registry = fs.readFileSync('assets/js/components/tool-registry.js', 'utf8'); expect(en).toContain('hreflang="sw" href="https://afrotools.com/sw/zana/bajeti-ya-hajj-na-umrah/"'); expect(fr).toContain('hreflang="sw" href="https://afrotools.com/sw/zana/bajeti-ya-hajj-na-umrah/"'); expect(hub).toContain('href="/sw/zana/bajeti-ya-hajj-na-umrah/"'); expect(registry).toMatch(/id: "zana-bajeti-ya-hajj-na-umrah-sw".+href: "\/sw\/zana\/bajeti-ya-hajj-na-umrah\/".+lang: 'sw'/); expect(fs.existsSync('assets/img/tools/hajj-budget.webp')).toBe(true);
  expect(await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')))).not.toContain('/assets/js/religious-cultural-apps.js?v=ffd639e0'); await expect(page.locator('[data-rs-tool-id],[data-df-upgrade]')).toHaveCount(0);
});

test('four themes pass computed traversal, sequential keyboard order and axe', async ({ page }) => {
  test.setTimeout(300000); await open(page); await calculatePreset(page); await page.locator('#hb-save').click(); const receipt = [];
  for (const mode of ['system-light', 'system-dark', 'light', 'dark']) {
    await chooseTheme(page, mode); const computed = await computedAudit(page); const keyboard = await sequentialKeyboardAudit(page); const axe = await axeAudit(page);
    expect(computed.failures, `${mode}: ${JSON.stringify(computed)}`).toEqual([]); expect(keyboard.focusFailures, `${mode}: ${JSON.stringify(keyboard)}`).toEqual([]); expect(keyboard.visited, `${mode}: ${JSON.stringify(keyboard)}`).toEqual(keyboard.expected); expect(axe.violations, `${mode}: ${JSON.stringify(axe)}`).toEqual([]); expect(axe.incomplete, `${mode}: ${JSON.stringify(axe)}`).toEqual([]);
    receipt.push({ mode, ...computed, sequentialFocusables: keyboard.count, axePasses: axe.passes, axeIncomplete: axe.incomplete });
  }
  console.log(`SW_HAJJ_BUDGET_A11Y_RECEIPT ${JSON.stringify(receipt)}`);
});

for (const [width, textPercent] of [[320, 100], [375, 100], [320, 200], [375, 200]]) {
  test(`fixed ${width}px viewport reflows at true ${textPercent}% computed root text`, async ({ page }) => {
    await open(page, width); const baselineRootPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    if (textPercent === 200) await page.evaluate(px => { document.documentElement.style.fontSize = `${px}px`; return document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }, baselineRootPx * 2);
    await calculatePreset(page);
    const result = await page.evaluate(({ baselineRootPx, textPercent }) => {
      const computedRootPx = parseFloat(getComputedStyle(document.documentElement).fontSize); const ignored = '.hb-skip,.hb-visually-hidden,script,style,noscript,[hidden]';
      const offenders = Array.from(document.querySelectorAll('body *')).filter(element => !element.matches(ignored) && !element.closest('.hb-visually-hidden,[hidden]') && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).flatMap(element => { const rect = element.getBoundingClientRect(); return rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1 ? [`${element.tagName}.${element.id || ''}.${String(element.className || '')} rect=${rect.left.toFixed(1)}..${rect.right.toFixed(1)} box=${element.clientWidth}/${element.scrollWidth}`] : []; });
      const main = document.querySelector('main'); return { baselineRootPx, computedRootPx, ratio: computedRootPx / baselineRootPx, textPercent, bodyOverflow: document.body.scrollWidth - document.body.clientWidth, mainOverflow: main.scrollWidth - main.clientWidth, offenders };
    }, { baselineRootPx, textPercent });
    expect(result.baselineRootPx).toBeGreaterThan(0); expect(result.computedRootPx).toBeCloseTo(result.baselineRootPx * (textPercent / 100), 5); expect(result.ratio).toBeCloseTo(textPercent / 100, 5); expect(result.bodyOverflow, JSON.stringify(result)).toBeLessThanOrEqual(1); expect(result.mainOverflow, JSON.stringify(result)).toBeLessThanOrEqual(1); expect(result.offenders, JSON.stringify(result)).toEqual([]);
    console.log(`SW_HAJJ_BUDGET_REFLOW_RECEIPT ${JSON.stringify({ width, ...result })}`);
  });
}
