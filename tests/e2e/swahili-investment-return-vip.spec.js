const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const ROOT = path.resolve(__dirname, '../..');
const ROUTE = '/sw/zana/faida-ya-uwekezaji/';

async function openPrivate(page) {
  const telemetry = { console: [], page: [], failed: [], data: [], analytics: [], requests: [], downloads: [] };
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  page.on('console', (message) => { if (message.type() === 'error') telemetry.console.push(message.text()); });
  page.on('pageerror', (error) => telemetry.page.push(error.message));
  page.on('requestfailed', (request) => telemetry.failed.push(request.url()));
  page.on('download', (download) => telemetry.downloads.push(download.suggestedFilename()));
  page.on('request', (request) => {
    const item = { url: request.url(), method: request.method(), body: request.postData() };
    telemetry.requests.push(item);
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) telemetry.data.push(item);
    if (/google-analytics\.com|googletagmanager\.com/i.test(request.url())) telemetry.analytics.push(item);
  });
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('script[src^="/assets/js/lazy-analytics.js?v="]')).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('afrotools:cookie-consent', { detail: { status: 'declined' } })));
  await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(true);
  return telemetry;
}

async function setInputs(page, values) {
  for (const [id, value] of Object.entries(values)) {
    const field = page.locator(`#${id}`);
    if (id === 'ir-currency') {
      await field.evaluate((select, code) => {
        const index = [...select.options].findIndex((option) => option.dataset.code === code);
        if (index < 0) throw new Error(`Unknown currency ${code}`);
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, String(value));
    } else if (await field.evaluate((node) => node.tagName === 'SELECT')) await field.selectOption(String(value));
    else await field.fill(String(value));
  }
}

async function calculate(page, values = {}) {
  await setInputs(page, values);
  await page.locator('#ir-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ir-final')).toBeFocused();
}

function contrastRatio(foreground, background) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color) => 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function visualSamples(page, selector) {
  const samples = await page.locator(selector).evaluateAll((nodes) => {
    const rgba = (value) => {
      const parts = String(value).match(/[\d.]+/g)?.map(Number) || [];
      return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
    };
    const blend = (front, back) => ({
      r: front.r * front.a + back.r * (1 - front.a),
      g: front.g * front.a + back.g * (1 - front.a),
      b: front.b * front.a + back.b * (1 - front.a), a: 1
    });
    const background = (node) => {
      const chain = [];
      for (let current = node; current instanceof Element; current = current.parentElement) chain.unshift(current);
      return chain.reduce((color, current) => blend(rgba(getComputedStyle(current).backgroundColor), color), { r: 255, g: 255, b: 255, a: 1 });
    };
    return nodes.filter((node) => node.getClientRects().length > 0).map((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const bg = background(node);
      return {
        text: node.textContent.trim(), width: box.width, height: box.height,
        fg: blend(rgba(style.color), bg), bg,
        border: rgba(style.borderTopColor), outline: rgba(style.outlineColor), outlineWidth: parseFloat(style.outlineWidth)
      };
    });
  });
  return samples.map((sample) => ({
    ...sample,
    textRatio: contrastRatio(sample.fg, sample.bg),
    borderRatio: contrastRatio(sample.border, sample.bg),
    outlineRatio: contrastRatio(sample.outline, sample.bg)
  }));
}

test('real inputs produce exact standard, zero-rate, timing and loss oracles', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page, {
    'ir-initial': 1000, 'ir-monthly': 100, 'ir-rate': 12, 'ir-years': 1,
    'ir-compound': 12, 'ir-timing': 'end', 'ir-inflation': 6, 'ir-currency': 'KES'
  });
  await expect(page.locator('#ir-final')).toContainText(/2[,\s\u00a0]*395[,.]08/);
  await expect(page.locator('#ir-metrics')).toContainText(/2[,\s\u00a0]*200[,.]00/);
  await expect(page.locator('#ir-metrics')).toContainText(/195[,.]08/);
  await expect(page.locator('#ir-metrics')).toContainText(/12[,.]68%/);
  await expect(page.locator('#ir-metrics')).toContainText(/6[,.]30%/);
  await expect(page.locator('#ir-sensitivity .ir-scenario')).toHaveCount(3);
  await expect(page.locator('#ir-year-body tr')).toHaveCount(1);
  await expect(page.locator('#ir-status')).toHaveText('Makadirio yamekokotolewa kwenye kifaa chako.');

  await setInputs(page, { 'ir-rate': 0, 'ir-inflation': 0 });
  await page.locator('#ir-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ir-final')).toContainText(/2[,\s\u00a0]*200[,.]00/);
  await expect(page.locator('#ir-metrics')).toContainText(/0[,.]00%/);

  await setInputs(page, { 'ir-rate': 12, 'ir-timing': 'beginning' });
  await page.locator('#ir-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ir-final')).toContainText(/2[,\s\u00a0]*407[,.]76/);
  await expect(page.locator('#ir-result-note')).toContainText('kabla ya ukuaji');

  await setInputs(page, { 'ir-monthly': 0, 'ir-rate': -10, 'ir-compound': 1, 'ir-timing': 'end' });
  await page.locator('#ir-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ir-final')).toContainText(/900[,.]00/);
  await expect(page.locator('#ir-metrics .ir-negative').first()).toContainText(/-.*100[,.]00/);
  expect((await page.locator('#ir-chart polyline').getAttribute('points')).trim().split(/\s+/)).toHaveLength(2);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('changed and invalid inputs erase all output and every export fails closed', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await calculate(page);
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) await expect(page.locator(`#${id}`)).toBeEnabled();
  const ngnResult = await page.locator('#ir-final').textContent();
  await setInputs(page, { 'ir-currency': 'KES' });
  await expect(page.locator('#ir-final')).toHaveText('—');
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator('#ir-status')).toHaveText('Taarifa zimebadilika. Kokotoa tena kabla ya kunakili au kupakua.');
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) await page.locator(`#${id}`).evaluate((button) => button.click());
  await page.waitForTimeout(100);
  expect(telemetry.downloads).toEqual([]);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('');
  await calculate(page);
  const kesResult = await page.locator('#ir-final').textContent();
  expect(kesResult).not.toBe(ngnResult);
  expect(kesResult).toMatch(/KSh|Ksh|KES/);
  await page.locator('#ir-monthly').fill('9000');
  await expect(page.locator('#ir-final')).toHaveText('—');
  await expect(page.locator('#ir-metrics')).toBeEmpty();
  await expect(page.locator('#ir-chart')).toBeEmpty();
  await expect(page.locator('#ir-sensitivity')).toBeEmpty();
  await expect(page.locator('#ir-year-body tr')).toHaveCount(0);
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator('#ir-status')).toHaveText('Taarifa zimebadilika. Kokotoa tena kabla ya kunakili au kupakua.');

  await setInputs(page, { 'ir-initial': 0, 'ir-monthly': 0 });
  await page.locator('#ir-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ir-final')).toHaveText('—');
  await expect(page.locator('#ir-status')).toHaveText('Kagua kiasi, viwango, muda na marudio ya kujumuisha riba.');
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) await page.locator(`#${id}`).evaluate((button) => button.click());
  await page.waitForTimeout(150);
  expect(telemetry.downloads).toEqual([]);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('');
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('copy, CSV and PDF exports reopen with the exact current result', async ({ page }) => {
  await openPrivate(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await calculate(page, {
    'ir-initial': 1000, 'ir-monthly': 100, 'ir-rate': 12, 'ir-years': 1,
    'ir-compound': 12, 'ir-timing': 'end', 'ir-inflation': 6, 'ir-currency': 'KES'
  });
  await page.locator('#ir-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Makadirio ya faida ya uwekezaji');
  expect(copied).toMatch(/2[,\s\u00a0]*395[,.]08/);
  expect(copied).toContain('Jumla ya michango');
  expect(copied).toContain('Makadirio ya kupanga tu');

  const csvEvent = page.waitForEvent('download');
  await page.locator('#ir-csv').click();
  const csv = await csvEvent;
  expect(csv.suggestedFilename()).toBe('makadirio-faida-uwekezaji.csv');
  const csvText = fs.readFileSync(await csv.path(), 'utf8');
  expect(csvText).toContain('"Wakati wa mchango","mwishoni mwa mwezi"');
  expect(csvText).toContain('"Mwaka 1","2200.00","195.08","2395.08"');

  const pdfEvent = page.waitForEvent('download');
  await page.locator('#ir-pdf').click();
  const pdf = await pdfEvent;
  const parsed = await pdfParse(fs.readFileSync(await pdf.path()));
  expect(parsed.numpages).toBeGreaterThanOrEqual(1);
  expect(parsed.text).toContain('Makadirio ya Faida ya Uwekezaji');
  expect(parsed.text).toContain('Uwekezaji wa kuanzia');
  expect(parsed.text).toMatch(/2,?395\.08/);
  expect(parsed.text).toContain('Marudio ya kujumuisha riba');
});

test('denied consent keeps financial inputs off network and storage', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page, { 'ir-initial': 987654321, 'ir-monthly': 1234567, 'ir-rate': 7.25 });
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'afrotools_cookie_consent'))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(telemetry.data).toEqual([]);
  expect(telemetry.analytics).toEqual([]);
  expect(telemetry.requests.some((item) => /987654321|1234567|7\.25/.test(`${item.url} ${item.body || ''}`))).toBe(false);
  expect(await page.evaluate(() => window.__afroAnalyticsConfigured === true)).toBe(false);
  expect(await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)))).toEqual([]);
  expect(telemetry.failed).toEqual([]);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

for (const width of [320, 375]) {
  test(`${width}px and 200% equivalent reflow keep every real control usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPrivate(page);
    await calculate(page);
    const layout = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('#ir-form input,#ir-form select,#ir-form button,.ir-export button')]
        .filter((node) => node.getClientRects().length > 0);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        inside: controls.every((node) => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth; }),
        targets: controls.every((node) => node.getBoundingClientRect().height >= 44)
      };
    });
    expect(layout).toEqual({ overflow: 0, inside: true, targets: true });
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const zoomed = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      formWidth: document.querySelector('#ir-form').getBoundingClientRect().width,
      viewport: innerWidth
    }));
    expect(zoomed.overflow).toBeLessThanOrEqual(1);
    expect(zoomed.formWidth).toBeLessThanOrEqual(zoomed.viewport);
  });
}

test('light, dark and system themes preserve hero, interface, boundaries, focus and keyboard flow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await openPrivate(page);
  for (const scenario of [
    { name: 'light', media: 'light', attr: 'light' },
    { name: 'dark', media: 'dark', attr: 'dark' },
    { name: 'system-light', media: 'light', attr: null },
    { name: 'system-dark', media: 'dark', attr: null }
  ]) {
    await page.emulateMedia({ colorScheme: scenario.media });
    await page.evaluate((theme) => theme ? document.documentElement.setAttribute('data-theme', theme) : document.documentElement.removeAttribute('data-theme'), scenario.attr);
    const hero = await visualSamples(page, '.ir-hero h1,.ir-hero .ir-kicker,.ir-hero .ir-lede,.ir-hero-note strong,.ir-hero-note p');
    expect(hero.length).toBe(5);
    for (const item of hero) {
      expect(item.text, `${scenario.name} hero text`).not.toBe('');
      expect(item.width, `${scenario.name} hero width`).toBeGreaterThan(0);
      expect(item.height, `${scenario.name} hero height`).toBeGreaterThan(0);
      expect(item.textRatio, `${scenario.name} contrast for ${item.text}`).toBeGreaterThanOrEqual(4.5);
    }
    const interfaceText = await visualSamples(page, '.ir-card h2,.ir-field label,.ir-field small,.ir-button:not(:disabled)');
    for (const item of interfaceText) expect(item.textRatio, `${scenario.name} contrast for ${item.text}`).toBeGreaterThanOrEqual(4.5);
    const primaryButton = (await visualSamples(page, '.ir-button-primary:not(:disabled)'))[0];
    expect(primaryButton.textRatio, `${scenario.name} primary button contrast`).toBeGreaterThanOrEqual(7);
    const inputs = await visualSamples(page, '.ir-field input,.ir-field select');
    for (const item of inputs) expect(item.borderRatio, `${scenario.name} input boundary ${JSON.stringify(item)}`).toBeGreaterThanOrEqual(3);
    await page.locator('#ir-initial').focus();
    const focused = (await visualSamples(page, '#ir-initial'))[0];
    expect(focused.outlineWidth).toBeGreaterThanOrEqual(3);
    expect(focused.outlineRatio, `${scenario.name} focus indicator`).toBeGreaterThanOrEqual(3);
  }

  for (const id of ['ir-initial', 'ir-currency', 'ir-monthly', 'ir-timing', 'ir-rate', 'ir-years', 'ir-compound', 'ir-inflation']) {
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('#ir-status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#ir-status')).toHaveAttribute('aria-live', 'polite');
  await page.locator('#ir-form button[type="submit"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ir-final')).toBeFocused();
  await expect(page.locator('#ir-copy')).toBeEnabled();
  await page.locator('#ir-copy').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#ir-csv')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#ir-pdf')).toBeFocused();
});

test('SEO, reciprocal hreflang, sources, schema and artwork match the native route', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/faida-ya-uwekezaji/');
  const alternates = {
    en: 'https://afrotools.com/tools/investment-return/',
    fr: 'https://afrotools.com/fr/tools/rendement-investissement/',
    sw: 'https://afrotools.com/sw/zana/faida-ya-uwekezaji/',
    'x-default': 'https://afrotools.com/tools/investment-return/'
  };
  for (const [language, href] of Object.entries(alternates)) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute('href', href);
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/sw/zana/faida-ya-uwekezaji/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/investment-return.webp');
  expect(fs.existsSync(path.join(ROOT, 'assets/img/tools/investment-return.webp'))).toBe(true);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
  expect(schemas).toEqual(expect.arrayContaining([
    expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw', dateModified: '2026-08-02' }),
    expect.objectContaining({ '@type': 'FAQPage' }),
    expect.objectContaining({ '@type': 'BreadcrumbList' })
  ]));
  await expect(page.getByRole('link', { name: /Investor\.gov/ })).toHaveAttribute('href', /investor\.gov/);
  await expect(page.getByRole('link', { name: /Federal Reserve Bank of St\. Louis/ })).toHaveAttribute('href', /stlouisfed\.org/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Calculate projection');
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
  expect(telemetry.failed).toEqual([]);
});
