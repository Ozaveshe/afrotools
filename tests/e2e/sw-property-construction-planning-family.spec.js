'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const pdfJs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');
const engine = require('../../assets/js/engines/property-assumption');
const manifest = require('../../data/registry/sw-property-construction-planning.json');

const ROOT = path.resolve(__dirname, '..', '..');
const EVIDENCE = path.join(ROOT, 'reports/sw-property-construction-planning-browser-evidence.json');
const receipt = { schemaVersion: 1, generatedAt: '2026-08-02', routes: [] };

function rgb(value) {
  const parts = String(value).match(/[\d.]+/g)?.map(Number) || [];
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
}
function composite(foreground, background) {
  return { r: foreground.r * foreground.a + background.r * (1 - foreground.a), g: foreground.g * foreground.a + background.g * (1 - foreground.a), b: foreground.b * foreground.a + background.b * (1 - foreground.a), a: 1 };
}
function luminance(color) {
  const values = [color.r, color.g, color.b].map((value) => { const x = value / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function ratio(first, second) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function resolved(layers) {
  return layers.slice().reverse().reduce((surface, layer) => composite(rgb(layer), surface), rgb('rgb(255,255,255)'));
}
async function styles(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    function layers(start) { const values = []; for (let node = start; node; node = node.parentElement) values.push(getComputedStyle(node).backgroundColor); return values; }
    return { color: style.color, border: style.borderTopColor, outline: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, layers: layers(element), parentLayers: layers(element.parentElement) };
  });
}
async function contrastProof(page, app) {
  const variants = [['light', 'light', 'light'], ['dark', 'dark', 'dark'], ['system-light', 'light', null], ['system-dark', 'dark', null]];
  const values = [];
  for (const [name, scheme, theme] of variants) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.evaluate((value) => value ? document.documentElement.dataset.theme = value : document.documentElement.removeAttribute('data-theme'), theme);
    for (const selector of ['h1', '.pcp-card h2', '.pcp-fields label span', '.pcp-card input', '.pcp-actions button[type=submit]', '.pcp-actions button[data-action=reset]']) {
      await expect(page.locator(selector).first()).toBeVisible();
      const computed = await styles(page, selector), surface = resolved(computed.layers);
      const value = ratio(composite(rgb(computed.color), surface), surface);
      expect(value, `${app.englishId}:${name}:${selector}:text`).toBeGreaterThanOrEqual(4.5);
      values.push({ variant: name, kind: 'text', selector, ratio: value });
    }
    for (const selector of ['.pcp-card input', '.pcp-actions button[type=submit]', '.pcp-actions button[data-action=reset]']) {
      const element = page.locator(selector).first(), computed = await styles(page, selector), outside = resolved(computed.parentLayers);
      const boundary = ratio(composite(rgb(computed.border), outside), outside);
      expect(boundary, `${app.englishId}:${name}:${selector}:boundary`).toBeGreaterThanOrEqual(3);
      values.push({ variant: name, kind: 'boundary', selector, ratio: boundary });
      await element.focus();
      const focus = await styles(page, selector);
      expect(focus.outlineStyle).not.toBe('none');
      expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
      const focusRatio = ratio(composite(rgb(focus.outline), outside), outside);
      expect(focusRatio, `${app.englishId}:${name}:${selector}:focus`).toBeGreaterThanOrEqual(3);
      values.push({ variant: name, kind: 'focus', selector, ratio: focusRatio });
    }
  }
  return values;
}
async function download(page, selector) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.locator(selector).click()]);
  return fs.promises.readFile(await file.path());
}
async function parsePdf(buffer) {
  const parsed = await pdfParse(new Uint8Array(buffer));
  const document = await pdfJs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const page = await document.getPage(1), viewport = page.getViewport(1), content = await page.getTextContent();
  const rows = content.items.map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width, height: item.height }));
  if (document.destroy) await document.destroy();
  return { pages: parsed.numpages, text: parsed.text, width: viewport.width, height: viewport.height, rows };
}
function diagnostics(page) {
  const result = { external: [], console: [], errors: [] };
  page.on('request', (request) => { const url = new URL(request.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) result.external.push(request.url()); });
  page.on('console', (message) => { if (message.type() === 'error') result.console.push(message.text()); });
  page.on('pageerror', (error) => result.errors.push(error.message));
  return result;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__pcpClipboard = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__pcpClipboard = String(value); }, readText: async () => window.__pcpClipboard } });
    window.__pcpWrites = [];
    for (const name of ['localStorage', 'sessionStorage']) {
      const storage = window[name], original = storage.setItem.bind(storage);
      storage.setItem = (key, value) => { window.__pcpWrites.push({ name, key, value }); return original(key, value); };
    }
  });
});

for (const app of manifest.rows) {
  test(`${app.englishId}: native workflow, exports, privacy and full UI proof`, async ({ page }) => {
    const diag = diagnostics(page);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(app.swahiliRoute);
    const root = page.locator('[data-sw-property-construction-app]'), form = root.locator('form');
    await expect(root).toHaveAttribute('data-workflow-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toHaveText(app.name);
    for (const field of app.fields) {
      const control = form.locator(`[name=${field.name}]`);
      await expect(control).toHaveValue(field.initialValue);
      await expect(control).toHaveAttribute('type', field.type);
      await expect(control).toHaveAttribute('required', '');
      if (field.min != null) await expect(control).toHaveAttribute('min', field.min); else await expect(control).not.toHaveAttribute('min');
      if (field.max != null) await expect(control).toHaveAttribute('max', field.max); else await expect(control).not.toHaveAttribute('max');
      if (field.step != null) await expect(control).toHaveAttribute('step', field.step); else await expect(control).not.toHaveAttribute('step');
      expect(await control.evaluate((element) => element.labels.length)).toBe(1);
    }
    await expect(page.locator('[data-result]')).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    for (const [name, value] of Object.entries(app.fixture)) await form.locator(`[name=${name}]`).fill(value);
    await form.locator('button[type=submit]').click();
    const result = page.locator('[data-result]');
    await expect(result).toBeVisible();
    const oracle = engine.calculate(app.englishId, app.fixture);
    expect(oracle.ok).toBe(true);
    expect(Number(await result.locator('[data-result-field=total]').getAttribute('data-raw-value'))).toBeCloseTo(1155, 8);
    expect(oracle.total).toBeCloseTo(1155, 8);
    await expect(result).toContainText(app.source.jurisdiction);
    await expect(result).toContainText(app.source.confidence.applicability);
    await expect(page.locator('[data-source-panel]')).toHaveAttribute('data-source-state', 'available');
    await expect(page.locator('[data-source-link]')).toHaveAttribute('href', app.source.url);
    await expect(page.locator('[data-source-panel]')).toContainText('Stats SA haitoi bei ya kipimo, kiasi, BOQ, nukuu, sarafu au matokeo ya zana hii');

    await page.locator('[data-action=copy]').click();
    const copied = await page.evaluate(() => window.__pcpClipboard);
    expect(copied).toContain(app.swahiliRoute);
    expect(copied).toContain(app.source.jurisdiction);
    const txt = (await download(page, '[data-action=txt]')).toString('utf8');
    expect(txt).toContain(app.source.checkedAt);
    expect(txt).toContain(app.source.confidence.applicability);
    const json = JSON.parse((await download(page, '[data-action=json]')).toString('utf8'));
    expect(json.englishId).toBe(app.englishId);
    expect(json.njia).toBe(app.swahiliRoute);
    expect(json.chanzo.role).toBe('official-south-africa-index-context-only');
    expect(json.chanzo.suppliesUnitPrices).toBe(false);
    const pdf = await parsePdf(await download(page, '[data-action=pdf]'));
    expect(pdf.pages).toBe(1);
    expect(pdf.text).toContain(app.swahiliRoute);
    expect(pdf.text).toContain('Chanzo:');
    expect(pdf.width).toBe(595);
    expect(pdf.height).toBe(842);
    expect(pdf.rows.length).toBeGreaterThan(7);
    for (const row of pdf.rows) {
      expect(row.x, row.text).toBeGreaterThanOrEqual(48);
      expect(row.x + row.width, row.text).toBeLessThanOrEqual(pdf.width - 48 + 0.01);
      expect(row.y, row.text).toBeGreaterThanOrEqual(48);
      expect(row.y + row.height, row.text).toBeLessThanOrEqual(pdf.height + 0.01);
    }
    await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; });
    await page.locator('[data-action=print]').click();
    expect(await page.evaluate(() => window.__printCalls)).toBe(1);

    const invalidName = app.englishId === 'building-materials' ? 'quantity' : 'contingency';
    const invalidValue = app.englishId === 'building-materials' ? '0' : '101';
    await form.locator(`[name=${invalidName}]`).fill(invalidValue);
    await expect(result).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    expect(await form.locator(`[name=${invalidName}]`).evaluate((control) => control.validity.valid)).toBe(false);
    await form.locator('button[type=submit]').click();
    await expect(result).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    await page.locator('[data-action=reset]').click();
    for (const field of app.fields) await expect(form.locator(`[name=${field.name}]`)).toHaveValue(field.initialValue);
    await expect(form.locator('input').first()).toBeFocused();

    const contrast = await contrastProof(page, app);
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(form.locator('button[type=submit]')).toBeVisible();
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    expect((await form.locator('input,button').evaluateAll((items) => items.map((item) => item.tabIndex))).every((value) => value >= 0)).toBe(true);

    const meta = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel=canonical]')?.href,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      image: document.querySelector('.pcp-hero img')?.getAttribute('src'),
      natural: [document.querySelector('.pcp-hero img')?.naturalWidth, document.querySelector('.pcp-hero img')?.naturalHeight],
      writes: window.__pcpWrites
    }));
    expect(meta.canonical).toBe(`https://afrotools.com${app.swahiliRoute}`);
    expect(meta.ogUrl).toBe(meta.canonical);
    expect(meta.ogImage).toBe(`https://afrotools.com/assets/img/tools/${app.englishId}.webp`);
    expect(meta.image).toBe(`/assets/img/tools/${app.englishId}.webp`);
    expect(meta.natural).toEqual([app.artworkWidth, app.artworkHeight]);
    for (const write of meta.writes) {
      expect(write.key).not.toContain(app.englishId);
      expect(Object.values(app.fixture).every((value) => write.value.includes(value))).toBe(false);
    }
    expect(diag.external).toEqual([]);
    expect(diag.console).toEqual([]);
    expect(diag.errors).toEqual([]);
    receipt.routes.push({ englishId: app.englishId, route: app.swahiliRoute, expected: app.expected, pdf: { parser: 'pdf-parse', width: pdf.width, height: pdf.height, rows: pdf.rows.length }, contrast, widths: [320, 375], reflowPercent: 200, source: { url: app.source.url, checkedAt: app.source.checkedAt, role: app.source.role }, externalRequests: 0, consoleErrors: 0, pageErrors: 0 });
  });
}

test.afterAll(() => fs.writeFileSync(EVIDENCE, `${JSON.stringify(receipt, null, 2)}\n`));
