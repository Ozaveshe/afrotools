const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const ROOT = path.resolve(__dirname, '../..');
const ROUTE = '/sw/zana/riba-ya-mchanganyiko/';

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
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools?.analyticsConsent))).toBe(true);
  await page.evaluate(() => window.AfroTools.analyticsConsent.decline());
  await expect.poll(() => page.evaluate(() => (window.dataLayer || []).some((entry) => {
    const command = Array.from(entry);
    return command[0] === 'consent'
      && command[1] === 'update'
      && command[2]?.analytics_storage === 'denied';
  }))).toBe(true);
  return telemetry;
}

async function setInputs(page, values) {
  for (const [id, value] of Object.entries(values)) {
    const field = page.locator(`#${id}`);
    if (await field.evaluate((node) => node.tagName === 'SELECT')) await field.selectOption(String(value));
    else await field.fill(String(value));
  }
}

async function calculate(page, values = {}) {
  await setInputs(page, values);
  await page.locator('#ciForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ciResult')).toBeVisible();
  await expect(page.locator('#ciResultHeading')).toBeFocused();
}

async function textDownload(page, selector) {
  const event = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await event;
  const file = await download.path();
  return { name: download.suggestedFilename(), text: fs.readFileSync(file, 'utf8') };
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

async function visibleTextContrast(page, selector) {
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
      const box = node.getBoundingClientRect();
      const bg = background(node);
      const style = getComputedStyle(node);
      return {
        text: node.textContent.trim(), width: box.width, height: box.height,
        fg: blend(rgba(style.color), bg), bg, border: rgba(style.borderTopColor),
        outline: rgba(style.outlineColor), outlineWidth: parseFloat(style.outlineWidth)
      };
    });
  });
  return samples.map((sample) => ({
    ...sample, textRatio: contrastRatio(sample.fg, sample.bg),
    borderRatio: contrastRatio(sample.border, sample.bg), outlineRatio: contrastRatio(sample.outline, sample.bg)
  }));
}

test('real inputs produce exact standard, zero-rate and timing oracles', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page);
  await expect(page.locator('#ciFinal')).toContainText('883,753.13');
  await expect(page.locator('#ciContributed')).toContainText('700,000');
  await expect(page.locator('#ciInterest')).toContainText('183,753.13');
  await expect(page.locator('#ciEffective')).toContainText('8.30%');
  await expect(page.locator('#ciStatus')).toHaveText('Makadirio yamekokotolewa kwenye kifaa chako.');

  await setInputs(page, { ciInitial: 1000, ciMonthly: 100, ciRate: 0, ciYears: 1, ciFrequency: 12, ciTiming: 'end' });
  await page.locator('#ciForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ciFinal')).toContainText('2,200');
  await expect(page.locator('#ciInterest')).toContainText('0.00');
  const endValue = await page.locator('#ciFinal').textContent();

  await page.locator('#ciRate').fill('12');
  await page.locator('#ciTiming').selectOption('beginning');
  await page.locator('#ciForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ciFinal')).toContainText('2,407.76');
  expect(await page.locator('#ciFinal').textContent()).not.toBe(endValue);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('changed and invalid inputs erase prior output and exports fail closed', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page);
  await expect(page.locator('#ciTxt')).toBeEnabled();
  const ngnResult = await page.locator('#ciFinal').textContent();
  await page.locator('#ciCurrency').selectOption('KES');
  await expect(page.locator('#ciResult')).toBeHidden();
  await expect(page.locator('#ciFinal')).toHaveText('');
  await expect(page.locator('#ciTxt')).toBeDisabled();
  await expect(page.locator('#ciPdf')).toBeDisabled();
  await expect(page.locator('#ciStatus')).toHaveText('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua.');
  await page.locator('#ciTxt').evaluate((button) => button.click());
  await page.locator('#ciPdf').evaluate((button) => button.click());
  await page.waitForTimeout(100);
  expect(telemetry.downloads).toEqual([]);
  await calculate(page);
  const kesResult = await page.locator('#ciFinal').textContent();
  expect(kesResult).not.toBe(ngnResult);
  expect(kesResult).toMatch(/KSh|Ksh|KES/);
  await page.locator('#ciMonthly').fill('9000');
  await expect(page.locator('#ciResult')).toBeHidden();
  await expect(page.locator('#ciFinal')).toHaveText('');
  await expect(page.locator('#ciTableBody tr')).toHaveCount(0);
  await expect(page.locator('#ciYearCards article')).toHaveCount(0);
  await expect(page.locator('#ciTxt')).toBeDisabled();
  await expect(page.locator('#ciPdf')).toBeDisabled();
  await expect(page.locator('#ciStatus')).toHaveText('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua.');

  await page.locator('#ciInitial').fill('-1');
  await page.locator('#ciForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ciResult')).toBeHidden();
  await expect(page.locator('#ciStatus')).toHaveText('Kagua kiasi, kiwango, muda na marudio. Kiasi hakiwezi kuwa hasi.');
  await page.locator('#ciTxt').evaluate((button) => button.click());
  await page.locator('#ciPdf').evaluate((button) => button.click());
  await page.waitForTimeout(150);
  expect(telemetry.downloads).toEqual([]);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('every advertised native export downloads and reopens with exact result', async ({ page }) => {
  await openPrivate(page);
  await calculate(page, { ciCurrency: 'KES' });
  const txt = await textDownload(page, '#ciTxt');
  expect(txt.name).toBe('compound-interest-sw.txt');
  expect(txt.text).toContain('Makadirio ya riba ya mchanganyiko na akiba ya mara kwa mara');
  expect(txt.text).toMatch(/883,753\.13/);
  expect(txt.text).toContain('Jumla ya michango');
  expect(txt.text).toContain('Makadirio ya kupanga tu');

  const pdfEvent = page.waitForEvent('download');
  await page.locator('#ciPdf').click();
  const pdf = await pdfEvent;
  expect(pdf.suggestedFilename()).toBe('compound-interest-sw.pdf');
  const parsed = await pdfParse(fs.readFileSync(await pdf.path()));
  expect(parsed.numpages).toBeGreaterThanOrEqual(1);
  expect(parsed.text).toContain('Makadirio ya riba ya mchanganyiko na akiba ya mara kwa mara');
  expect(parsed.text).toMatch(/883,753\.13/);
  expect(parsed.text).toContain('Jumla ya michango');
});

test('calculation remains local and denied consent sends no analytics or financial payload', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page, { ciInitial: 987654321, ciMonthly: 1234567, ciRate: 7.25 });
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
  test(`${width}px and 200% equivalent reflow keep controls and results usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPrivate(page);
    await calculate(page);
    const layout = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('#ciForm input,#ciForm select,#ciForm button')]
        .filter((node) => node.getClientRects().length > 0);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        inside: controls.every((node) => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth; }),
        targets: controls.every((node) => node.getBoundingClientRect().height >= 44),
        cardsVisible: getComputedStyle(document.querySelector('#ciYearCards')).display !== 'none',
        tableHidden: getComputedStyle(document.querySelector('.ci-table-wrap')).display === 'none'
      };
    });
    expect(layout).toEqual({ overflow: 0, inside: true, targets: true, cardsVisible: true, tableHidden: true });

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const zoomed = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      formWidth: document.querySelector('#ciForm').getBoundingClientRect().width,
      viewport: innerWidth
    }));
    expect(zoomed.overflow).toBeLessThanOrEqual(1);
    expect(zoomed.formWidth).toBeLessThanOrEqual(zoomed.viewport);
  });
}

test('light, dark and system themes keep hero and interface text visible with keyboard access', async ({ page }) => {
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
    const hero = await visibleTextContrast(page, '.ci-hero h1,.ci-hero p');
    expect(hero.length).toBeGreaterThanOrEqual(4);
    for (const item of hero) {
      expect(item.text, `${scenario.name} hero text`).not.toBe('');
      expect(item.width, `${scenario.name} hero width`).toBeGreaterThan(0);
      expect(item.height, `${scenario.name} hero height`).toBeGreaterThan(0);
      expect(item.textRatio, `${scenario.name} contrast for ${item.text}`).toBeGreaterThanOrEqual(4.5);
    }
    const interfaceText = await visibleTextContrast(page, '.ci-card h2,.ci-field label,.ci-field small,.ci-assumptions,.ci-button:not(:disabled)');
    for (const item of interfaceText) expect(item.textRatio, `${scenario.name} contrast for ${item.text}`).toBeGreaterThanOrEqual(4.5);
    const boundaries = await visibleTextContrast(page, '.ci-field input,.ci-field select');
    for (const item of boundaries) expect(item.borderRatio, `${scenario.name} input boundary`).toBeGreaterThanOrEqual(3);
    await page.locator('#ciInitial').focus();
    const focused = (await visibleTextContrast(page, '#ciInitial'))[0];
    expect(focused.outlineWidth, `${scenario.name} focus width`).toBeGreaterThanOrEqual(3);
    expect(focused.outlineRatio, `${scenario.name} focus contrast`).toBeGreaterThanOrEqual(3);
  }

  const controls = page.locator('#ciForm input,#ciForm select,#ciForm button');
  expect(await controls.count()).toBe(11);
  for (const id of ['ciCurrency', 'ciInitial', 'ciMonthly', 'ciRate', 'ciYears', 'ciFrequency', 'ciTiming']) {
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('#ciStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#ciStatus')).toHaveAttribute('aria-live', 'polite');
  await calculate(page);
  await page.locator('#ciCurrency').focus();
  for (let index = 0; index < 10; index += 1) await page.keyboard.press('Tab');
  await expect(page.locator('#ciPdf')).toBeFocused();
  await page.locator('#ciForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ciResultHeading')).toBeFocused();
});

test('SEO, reciprocal hreflang, source schema and artwork match the native route', async ({ page }) => {
  await openPrivate(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/riba-ya-mchanganyiko/');
  const alternates = {
    en: 'https://afrotools.com/tools/compound-interest/',
    fr: 'https://afrotools.com/fr/tools/interet-compose/',
    sw: 'https://afrotools.com/sw/zana/riba-ya-mchanganyiko/',
    'x-default': 'https://afrotools.com/tools/compound-interest/'
  };
  for (const [language, href] of Object.entries(alternates)) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute('href', href);
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/sw/zana/riba-ya-mchanganyiko/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/compound-interest.webp');
  expect(fs.existsSync(path.join(ROOT, 'assets/img/tools/compound-interest.webp'))).toBe(true);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  const parsed = schemas.map((text) => JSON.parse(text));
  expect(parsed).toEqual(expect.arrayContaining([
    expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw', dateModified: '2026-08-02' }),
    expect.objectContaining({ '@type': 'FAQPage' }),
    expect.objectContaining({ '@type': 'BreadcrumbList' })
  ]));
  await expect(page.getByRole('link', { name: /Kikokotoo cha Riba ya Mchanganyiko cha Investor\.gov/ })).toHaveAttribute('href', /investor\.gov/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Fungua zana kamili ya Kiingereza');
});
