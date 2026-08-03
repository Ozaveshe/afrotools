const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const ROOT = path.resolve(__dirname, '../..');
const ROUTE = '/sw/zana/kikokotoo-cha-mfumuko-wa-bei/';

async function openPrivate(page) {
  const telemetry = { console:[], page:[], failed:[], data:[], analytics:[], requests:[], downloads:[] };
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  page.on('console', (message) => { if (message.type() === 'error') telemetry.console.push(message.text()); });
  page.on('pageerror', (error) => telemetry.page.push(error.message));
  page.on('requestfailed', (request) => telemetry.failed.push(request.url()));
  page.on('download', (download) => telemetry.downloads.push(download.suggestedFilename()));
  page.on('request', (request) => {
    const item = { url:request.url(), method:request.method(), body:request.postData() };
    telemetry.requests.push(item);
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) telemetry.data.push(item);
    if (/google-analytics\.com|googletagmanager\.com/i.test(request.url())) telemetry.analytics.push(item);
  });
  await page.goto(ROUTE, { waitUntil:'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('script[src^="/assets/js/lazy-analytics.js?v="]')).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('afrotools:cookie-consent', { detail:{ status:'declined' } })));
  await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(true);
  return telemetry;
}

async function fill(page, values = {}) {
  const fields = {
    'ic-currency':'KES', 'ic-amount':'1000', 'ic-rate':'10', 'ic-years':'2',
    'ic-source':'Toleo la CPI la KNBS Julai 2026', 'ic-date':'2026-07-20', ...values
  };
  for (const [id, value] of Object.entries(fields)) await page.locator(`#${id}`).fill(String(value));
}

async function calculate(page, values = {}) {
  await fill(page, values);
  await page.locator('#ic-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ic-results')).toBeVisible();
  await expect(page.locator('#ic-results-title')).toBeFocused();
}

function contrastRatio(foreground, background) {
  const channel = (value) => { const normalized = value / 255; return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; };
  const luminance = (color) => 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function samples(page, selector) {
  const values = await page.locator(selector).evaluateAll((nodes) => {
    const rgba = (value) => { const p = String(value).match(/[\d.]+/g)?.map(Number) || []; return { r:p[0]||0, g:p[1]||0, b:p[2]||0, a:p.length>3?p[3]:1 }; };
    const blend = (front, back) => ({ r:front.r*front.a+back.r*(1-front.a), g:front.g*front.a+back.g*(1-front.a), b:front.b*front.a+back.b*(1-front.a), a:1 });
    const background = (node) => { const chain=[]; for(let current=node;current instanceof Element;current=current.parentElement) chain.unshift(current); return chain.reduce((color,current)=>blend(rgba(getComputedStyle(current).backgroundColor),color),{r:255,g:255,b:255,a:1}); };
    return nodes.filter((node) => node.getClientRects().length > 0).map((node) => {
      const style=getComputedStyle(node), box=node.getBoundingClientRect(), bg=background(node);
      return { text:node.textContent.trim(), width:box.width, height:box.height, fg:blend(rgba(style.color),bg), bg, border:rgba(style.borderTopColor), outline:rgba(style.outlineColor), outlineWidth:parseFloat(style.outlineWidth) };
    });
  });
  return values.map((value) => ({ ...value, textRatio:contrastRatio(value.fg,value.bg), borderRatio:contrastRatio(value.border,value.bg), outlineRatio:contrastRatio(value.outline,value.bg) }));
}

test('real inputs produce exact inflation, purchasing-power, deflation and fractional oracles', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page);
  await expect(page.locator('#ic-future')).toContainText(/1[,.\s\u00a0]*210/);
  await expect(page.locator('#ic-power')).toContainText(/826[,.]45/);
  await expect(page.locator('#ic-change')).toContainText(/-.*173[,.]55/);
  await expect(page.locator('#ic-increase')).toContainText(/210[,.]00/);
  await expect(page.locator('#ic-timeline tr')).toHaveCount(3);
  await expect(page.locator('#ic-status')).toContainText('Hakuna taarifa iliyoondoka');

  await calculate(page, { 'ic-rate':'-10', 'ic-years':'1' });
  await expect(page.locator('#ic-future')).toContainText(/900[,.]00/);
  await expect(page.locator('#ic-power')).toContainText(/1[,.\s\u00a0]*111[,.]11/);

  await calculate(page, { 'ic-rate':'10', 'ic-years':'1.5' });
  await expect(page.locator('#ic-timeline tr')).toHaveCount(3);
  await expect(page.locator('#ic-timeline tr').last()).toContainText('1.5');
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('changed, stale-date and invalid inputs erase output and all exports fail closed', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await calculate(page);
  await page.locator('#ic-rate').fill('11');
  await expect(page.locator('#ic-results')).toBeHidden();
  for (const id of ['ic-future','ic-power','ic-change','ic-increase']) await expect(page.locator(`#${id}`)).toHaveText('—');
  await expect(page.locator('#ic-timeline tr')).toHaveCount(0);
  for (const id of ['ic-copy','ic-csv','ic-json','ic-pdf']) await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator('#ic-status')).toHaveText('Taarifa zimebadilika. Kokotoa tena.');

  await fill(page, { 'ic-date':'2025-01-01' });
  await page.locator('#ic-form').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#ic-results')).toBeHidden();
  await expect(page.locator('#ic-error')).toContainText('siku 365');
  const clipboardBeforeInvalidActions = await page.evaluate(() => navigator.clipboard.readText());
  for (const id of ['ic-copy','ic-csv','ic-json','ic-pdf']) await page.locator(`#${id}`).evaluate((button) => button.click());
  await page.waitForTimeout(150);
  expect(telemetry.downloads).toEqual([]);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(clipboardBeforeInvalidActions);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

test('copy, CSV, JSON and PDF reopen with the exact current scenario', async ({ page }) => {
  await openPrivate(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await calculate(page);
  await page.locator('#ic-copy').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Hali ya mfumuko wa bei');
  expect(copied).toContain('Chanzo cha kiwango');
  expect(copied).toMatch(/1[,.\s\u00a0]*210/);

  let event = page.waitForEvent('download');
  await page.locator('#ic-csv').click();
  let download = await event;
  expect(download.suggestedFilename()).toBe('hali-ya-mfumuko-wa-bei.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).map((row) => row.split(',').map((cell) => cell.replace(/^"|"$/g, '')));
  expect(csv[0]).toEqual(['mwaka','bei_sawa','uwezo_wa_kununua']);
  expect(Number(csv.at(-1)[1])).toBeCloseTo(1210, 8);

  event = page.waitForEvent('download');
  await page.locator('#ic-json').click();
  download = await event;
  expect(download.suggestedFilename()).toBe('hali-ya-mfumuko-wa-bei.json');
  const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(json.locale).toBe('sw');
  expect(json.privacy).toContain('kwenye kifaa');
  expect(json.scenario.priceEquivalent).toBeCloseTo(1210, 8);
  expect(json.scenario.sourceLabel).toBe('Toleo la CPI la KNBS Julai 2026');

  event = page.waitForEvent('download');
  await page.locator('#ic-pdf').click();
  download = await event;
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.numpages).toBeGreaterThanOrEqual(1);
  expect(parsed.text).toContain('Hali ya mfumuko wa bei');
  expect(parsed.text).toMatch(/bei sawa/i);
  expect(parsed.text).toMatch(/1,?210/);
  expect(parsed.text).toContain('Toleo la CPI la KNBS Julai 2026');
  expect(parsed.text).not.toMatch(/LEGAL BASIS|Africa's Financial Platform|Free tax calculators|Generated by/i);
});

test('denied consent keeps amounts, rate and source off network and storage', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await calculate(page, { 'ic-amount':'987654321', 'ic-rate':'7.25', 'ic-source':'Chanzo-SIRI-123456' });
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'afrotools_cookie_consent'))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(telemetry.data).toEqual([]);
  expect(telemetry.analytics).toEqual([]);
  expect(telemetry.requests.some((item) => /987654321|7\.25|Chanzo-SIRI-123456/.test(`${item.url} ${item.body || ''}`))).toBe(false);
  expect(await page.evaluate(() => window.__afroAnalyticsConfigured === true)).toBe(false);
  expect(telemetry.failed).toEqual([]);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
});

for (const width of [320, 375]) {
  test(`${width}px and 200% equivalent reflow keep every real control usable`, async ({ page }) => {
    await page.setViewportSize({ width, height:900 });
    await openPrivate(page);
    await calculate(page);
    const layout = await page.evaluate(() => {
      const controls=[...document.querySelectorAll('#ic-form input,#ic-form button,#ic-results button')].filter((node)=>node.getClientRects().length>0);
      return { overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, inside:controls.every((node)=>{const b=node.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;}), targets:controls.every((node)=>node.getBoundingClientRect().height>=44) };
    });
    expect(layout).toEqual({ overflow:0, inside:true, targets:true });
    await page.setViewportSize({ width:640, height:900 });
    await page.evaluate(() => { document.documentElement.style.zoom='2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('light, dark and system themes preserve visible hero text, controls, focus and keyboard flow', async ({ page }) => {
  await page.setViewportSize({ width:375, height:900 });
  await openPrivate(page);
  for (const scenario of [
    { name:'light', media:'light', attr:'light' }, { name:'dark', media:'dark', attr:'dark' },
    { name:'system-light', media:'light', attr:null }, { name:'system-dark', media:'dark', attr:null }
  ]) {
    await page.emulateMedia({ colorScheme:scenario.media });
    await page.evaluate((theme) => theme ? document.documentElement.setAttribute('data-theme', theme) : document.documentElement.removeAttribute('data-theme'), scenario.attr);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const hero=await samples(page,'.ic-hero h1,.ic-hero .ic-kicker,.ic-hero .ic-lead,.ic-hero .ic-badge,.ic-hero .ic-langs');
    expect(hero.length).toBeGreaterThanOrEqual(8);
    for(const item of hero){ expect(item.text).not.toBe(''); expect(item.width).toBeGreaterThan(0); expect(item.height).toBeGreaterThan(0); expect(item.textRatio,`${scenario.name}: ${item.text}`).toBeGreaterThanOrEqual(4.5); }
    const interfaceText=await samples(page,'.ic-card h2,.ic-field label,.ic-help,.ic-button:not(:disabled)');
    for(const item of interfaceText) expect(item.textRatio,`${scenario.name}: ${item.text}`).toBeGreaterThanOrEqual(4.5);
    const boundaries=await samples(page,'.ic-field input');
    for(const item of boundaries) expect(item.borderRatio,`${scenario.name} input boundary`).toBeGreaterThanOrEqual(3);
    await page.locator('#ic-amount').focus();
    const focused=(await samples(page,'#ic-amount'))[0];
    expect(focused.outlineWidth).toBeGreaterThanOrEqual(3);
    expect(focused.outlineRatio,`${scenario.name} focus`).toBeGreaterThanOrEqual(3);
  }
  for(const id of ['ic-currency','ic-amount','ic-rate','ic-years','ic-source','ic-date']) await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
  await expect(page.locator('#ic-status')).toHaveAttribute('aria-live','polite');
  await fill(page);
  await page.locator('#ic-form button[type="submit"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ic-results-title')).toBeFocused();
  await page.locator('#ic-copy').focus(); await page.keyboard.press('Tab'); await expect(page.locator('#ic-csv')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#ic-json')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#ic-pdf')).toBeFocused();
});

test('SEO, reciprocal hreflang, official source, schema and artwork match the route', async ({ page }) => {
  const telemetry = await openPrivate(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://afrotools.com/sw/zana/kikokotoo-cha-mfumuko-wa-bei/');
  const alternates={ en:'https://afrotools.com/tools/inflation-calc/', fr:'https://afrotools.com/fr/tools/calculateur-inflation/', sw:'https://afrotools.com/sw/zana/kikokotoo-cha-mfumuko-wa-bei/', 'x-default':'https://afrotools.com/tools/inflation-calc/' };
  for(const [language,href] of Object.entries(alternates)) await expect(page.locator(`link[rel="alternate"][hreflang="${language}"]`)).toHaveAttribute('href',href);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content','https://afrotools.com/sw/zana/kikokotoo-cha-mfumuko-wa-bei/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content','https://afrotools.com/assets/img/tools/inflation-calc.webp');
  expect(fs.existsSync(path.join(ROOT,'assets/img/tools/inflation-calc.webp'))).toBe(true);
  const schemas=(await page.locator('script[type="application/ld+json"]').allTextContents()).map((text)=>JSON.parse(text));
  expect(schemas).toEqual(expect.arrayContaining([expect.objectContaining({'@type':'WebApplication',inLanguage:'sw',dateModified:'2026-08-02'}),expect.objectContaining({'@type':'FAQPage'}),expect.objectContaining({'@type':'BreadcrumbList'})]));
  await expect(page.getByRole('link',{name:/Metadata ya kiashirio cha Benki ya Dunia/})).toHaveAttribute('href',/worldbank/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Calculate scenario');
  expect(telemetry.failed).toEqual([]); expect(telemetry.console).toEqual([]); expect(telemetry.page).toEqual([]);
});
