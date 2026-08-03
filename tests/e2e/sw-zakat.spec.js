const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const route = '/sw/zana/kikokotoo-zakat/';

function observe(page) {
  const failures = [];
  const external = [];
  page.on('console', message => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => failures.push(`resource: ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(`${request.method()} ${url.href}`);
  });
  return { failures, external };
}

async function fillFixture(page) {
  const values = { cash: 100000, savings: 200000, goldGrams: 2, goldPrice: 9500, silverGrams: 10, silverPrice: 100, inventory: 50000, investments: 30000, receivables: 20000, debts: 40000, customNisab: 0 };
  await page.selectOption('#currency', 'KES');
  await page.selectOption('#nisabBasis', 'silver');
  for (const [id, value] of Object.entries(values)) await page.fill(`#${id}`, String(value));
  await page.fill('#hawlDate', '2026-08-30');
  await page.check('#hawlMet');
}

async function computedAudit(page) {
  return page.evaluate(async () => {
    function rgba(value) {
      const match = String(value).match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
    }
    function blend(fg, bg) { return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }; }
    function luminance(color) {
      const channel = value => { const n = value / 255; return n <= .04045 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4); };
      return .2126 * channel(color.r) + .7152 * channel(color.g) + .0722 * channel(color.b);
    }
    function ratio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
    function background(node) {
      let current = node instanceof Element ? node : node.parentElement;
      let color = { r: 255, g: 255, b: 255, a: 1 };
      const layers = [];
      while (current) { const parsed = rgba(getComputedStyle(current).backgroundColor); if (parsed && parsed.a > 0) layers.push(parsed); current = current.parentElement; }
      for (let index = layers.length - 1; index >= 0; index -= 1) color = blend(layers[index], color);
      return color;
    }
    function visible(element) { const style = getComputedStyle(element), rect = element.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight; }
    const textFailures = [];
    const controls = [];
    let minText = 99, minBoundary = 99, minFocus = 99;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.textContent.trim() || !visible(parent) || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    while (walker.nextNode()) {
      const node = walker.currentNode, style = getComputedStyle(node.parentElement), foreground = rgba(style.color);
      if (!foreground) continue;
      const measured = ratio(blend(foreground, background(node)), background(node));
      const size = parseFloat(style.fontSize), bold = parseInt(style.fontWeight, 10) >= 700;
      const required = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      minText = Math.min(minText, measured);
      if (measured + .01 < required) textFailures.push(`${node.parentElement.tagName}.${node.parentElement.className}: ${measured.toFixed(2)} < ${required}`);
    }
    for (const element of document.querySelectorAll('input,select,button,a[href],summary')) {
      if (!visible(element)) continue;
      const style = getComputedStyle(element), border = rgba(style.borderTopColor), outside = background(element.parentElement || element);
      if (border && parseFloat(style.borderTopWidth) > 0 && ['INPUT', 'SELECT', 'BUTTON'].includes(element.tagName)) {
        const measured = ratio(blend(border, outside), outside); minBoundary = Math.min(minBoundary, measured);
        if (measured + .01 < 3) controls.push(`${element.id || element.tagName} boundary ${measured.toFixed(2)}`);
      }
      if (element.disabled) continue;
      element.scrollIntoView({ block: 'center' });
      element.focus();
      await new Promise(resolve => requestAnimationFrame(resolve));
      const focused = getComputedStyle(element), outline = rgba(focused.outlineColor), width = parseFloat(focused.outlineWidth);
      if (!outline || width < 2) controls.push(`${element.id || element.tagName} focus width ${width}`);
      else { const measured = ratio(blend(outline, background(element)), background(element)); minFocus = Math.min(minFocus, measured); if (measured + .01 < 3) controls.push(`${element.id || element.tagName} focus ${measured.toFixed(2)}`); }
      const rect = element.getBoundingClientRect();
      if (rect.top < -1 || rect.bottom > innerHeight + 1) controls.push(`${element.id || element.tagName} focus viewport`);
    }
    return { textFailures, controls, minText, minBoundary, minFocus };
  });
}

test('zakat route preserves exact formula, boundaries, stale gating, CSV, print and privacy', async ({ page, context }) => {
  const observed = observe(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await fillFixture(page);
  const submit = page.getByRole('button', { name: 'Hesabu zakat ndani ya kifaa' });
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sw-zakat-result')).toBeVisible();
  await expect(page.locator('#sw-zakat-wealth')).toContainText(/380.?000/);
  await expect(page.locator('#sw-zakat-nisab')).toContainText(/59.?500/);
  await expect(page.locator('#sw-zakat-due')).toContainText(/9.?500/);
  const exact = await page.evaluate(() => window.__SW_ZAKAT_TEST__.latest);
  expect(exact.grossAssets).toBe(420000);
  expect(exact.zakatableWealth).toBe(380000);
  expect(exact.zakatDue).toBe(9500);

  await page.fill('#cash', '100001');
  await expect(page.locator('#sw-zakat-result')).toBeHidden();
  await expect(page.locator('#sw-zakat-csv')).toBeDisabled();
  await expect(page.locator('#sw-zakat-status')).toContainText('Hesabu tena');
  await page.fill('#cash', '-1');
  await submit.click();
  await expect(page.locator('#cash')).toBeFocused();
  await expect(page.locator('#sw-zakat-status')).toContainText('namba halali');
  await expect(page.locator('#sw-zakat-result')).toBeHidden();

  await fillFixture(page);
  await page.uncheck('#hawlMet');
  await submit.click();
  await expect(page.locator('#sw-zakat-due')).toContainText(/0([,.]00)?/);
  await expect(page.locator('#sw-zakat-verdict')).toHaveText('Hakiki hawl');
  await page.check('#hawlMet');
  await page.selectOption('#nisabBasis', 'custom');
  await page.fill('#customNisab', '0');
  await submit.click();
  await expect(page.locator('#customNisab')).toBeFocused();
  await expect(page.locator('#sw-zakat-status')).toContainText('zaidi ya sifuri');

  await fillFixture(page);
  await submit.click();
  const csvPending = page.waitForEvent('download');
  await page.locator('#sw-zakat-csv').click();
  const csvDownload = await csvPending;
  expect(csvDownload.suggestedFilename()).toBe('makadirio-zakat-afrotools.csv');
  const csv = fs.readFileSync(await csvDownload.path(), 'utf8').replace(/^\uFEFF/, '');
  expect(csv).toContain('"Mali halisi inayohusika","380000"');
  expect(csv).toContain('"Zakat inayokadiriwa","9500"');
  expect(csv).toContain('"Mapitio ya chanzo","2026-05-16"');
  expect(csv.split(/\r?\n/).length).toBe(17);
  await page.locator('#sw-zakat-copy').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Zakat inayokadiriwa: 9500');
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.locator('#sw-zakat-print').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  const printPdf = await page.pdf({ format: 'A4', printBackground: true });
  const parsed = await pdfParse(printPdf);
  expect(parsed.text).toContain('Makadirio ya zakat');
  expect(parsed.text.replace(/\s/g, '')).toMatch(/9[,.]?500/);

  expect(await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)))).toEqual([]);
  expect(observed.external).toEqual([]);
  expect(observed.failures).toEqual([]);
});

test('zakat metadata, reciprocal discovery, artwork and accessible names are route-real', async ({ page }) => {
  const observed = observe(page);
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-zakat/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/zakat-calculator/');
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/calculateur-zakat/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/zakat-calculator.webp');
  const appJson = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  expect(appJson.inLanguage).toBe('sw');
  expect(appJson.url).toBe('https://afrotools.com/sw/zana/kikokotoo-zakat/');
  expect(await page.locator('#sw-zakat-form input,#sw-zakat-form select').evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length >= 1))).toBe(true);
  expect(await page.locator('iframe').count()).toBe(0);
  const english = fs.readFileSync('tools/zakat-calculator/index.html', 'utf8');
  const french = fs.readFileSync('fr/tools/calculateur-zakat/index.html', 'utf8');
  const hub = fs.readFileSync('sw/dini-na-utamaduni/index.html', 'utf8');
  const registry = fs.readFileSync('assets/js/components/tool-registry.js', 'utf8');
  expect(english).toContain('hreflang="sw" href="https://afrotools.com/sw/zana/kikokotoo-zakat/"');
  expect(french).toContain('hreflang="sw" href="https://afrotools.com/sw/zana/kikokotoo-zakat/"');
  expect(hub).toContain('href="/sw/zana/kikokotoo-zakat/"');
  expect(registry).toMatch(/id:\s*'zakat-calculator'.+href:\s*'\/tools\/zakat-calculator\/'/);
  expect(fs.existsSync('assets/img/tools/zakat-calculator.webp')).toBe(true);
  expect(observed.failures).toEqual([]);
});

for (const mode of ['system-light', 'system-dark', 'light', 'dark']) {
  test(`zakat full computed contrast and focus traversal: ${mode}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: mode.includes('dark') ? 'dark' : 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (mode === 'light' || mode === 'dark') await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), mode);
    else await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    const audit = await computedAudit(page);
    expect(audit.textFailures, JSON.stringify(audit)).toEqual([]);
    expect(audit.controls, JSON.stringify(audit)).toEqual([]);
    expect(audit.minText).toBeGreaterThanOrEqual(4.5);
    expect(audit.minBoundary).toBeGreaterThanOrEqual(3);
    expect(audit.minFocus).toBeGreaterThanOrEqual(3);
    console.log(`ZAKAT_THEME ${mode} text=${audit.minText.toFixed(2)} boundary=${audit.minBoundary.toFixed(2)} focus=${audit.minFocus.toFixed(2)}`);
  });
}

for (const viewport of [{ width: 320, scale: 100 }, { width: 375, scale: 100 }, { width: 375, scale: 200 }]) {
  test(`zakat reflow ${viewport.width}px at ${viewport.scale}%`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: 900 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (viewport.scale === 200) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const result = await page.evaluate(() => {
      const offenders = [...document.querySelectorAll('body *')].filter(node => {
        const style = getComputedStyle(node), rect = node.getBoundingClientRect();
        return style.display !== 'none' && rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1 || node.scrollWidth > node.clientWidth + 1) && !['SCRIPT', 'STYLE'].includes(node.tagName);
      }).map(node => `${node.tagName}.${node.className}`).slice(0, 20);
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, offenders };
    });
    expect(result.overflow, JSON.stringify(result)).toBeLessThanOrEqual(1);
    expect(result.offenders, JSON.stringify(result)).toEqual([]);
    console.log(`ZAKAT_REFLOW width=${viewport.width} scale=${viewport.scale} overflow=${result.overflow} offenders=${result.offenders.length}`);
  });
}
