const { test, expect } = require('@playwright/test');

const apps = [
  {
    id: 'emergency-fund', english: '/tools/emergency-fund/', swahili: '/sw/zana/mfuko-wa-dharura/', art: [600, 400],
    values: {'#ef-currency':'KES','#ef-monthly':'150000','#ef-months':'6','#ef-current':'200000','#ef-monthly-save':'30000','#ef-inflation':'10','#ef-inflation-years':'3'},
    calculate: 'calcEF', result: '#ef-results', metrics: ['#ef-target','#ef-gap','#ef-months-to-goal','#ef-monthly-need','#ef-inflation-adj','#ef-progress-pct'], dirty: '#ef-current', invalid: '#ef-monthly'
  },
  {
    id: 'debt-snowball', english: '/tools/debt-snowball/', swahili: '/sw/zana/mpango-wa-kulipa-madeni/', art: [600, 400],
    values: {'#ds-currency':'KES','#ds-extra':'10000'}, calculate: 'calcDebtPayoff', result: '#ds-results',
    metrics: ['#ds-snowball-months','#ds-snowball-interest','#ds-snowball-total','#ds-avalanche-months','#ds-avalanche-interest','#ds-avalanche-total','#ds-order tr:first-child td:nth-child(3)'], dirty: '#ds-extra', invalid: '#debt-balance-1', englishInvalid: '#debt-list tr:first-child input:nth-of-type(2)'
  },
  {
    id: 'loan-consolidation', english: '/tools/loan-consolidation/', swahili: '/sw/zana/unganisha-mikopo/', art: [800, 450],
    values: {'#lc-currency':'KES','#lc-new-rate':'22','#lc-new-tenor':'24','#lc-origination':'2'}, calculate: 'calcConsolidation', result: '#lc-results',
    metrics: ['#lc-current-monthly','#lc-new-monthly','#lc-monthly-savings','#lc-total-savings','#lc-total-balance'], dirty: '#lc-new-rate', invalid: '#loan-balance-1', englishInvalid: '.lc-balance:first'
  }
];

async function fill(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const node = page.locator(selector);
    if (await node.evaluate((element) => element.tagName === 'SELECT')) await node.selectOption(value);
    else await node.fill(value);
  }
}

async function numericEvidence(page, selectors) {
  return Promise.all(selectors.map(async (selector) => {
    const value = await page.locator(selector).textContent();
    return value.match(/-?\d[\d,.]*/g) || [];
  }));
}

for (const app of apps) {
  test(`${app.id} matches its English formula owner and clears stale or invalid output`, async ({page}) => {
    await page.goto(app.english);
    await fill(page, app.values);
    await page.evaluate((fn) => window[fn](), app.calculate);
    await expect(page.locator(app.result)).toHaveClass(/on/);
    const oracle = await numericEvidence(page, app.metrics);

    await page.goto(app.swahili);
    await fill(page, app.values);
    await page.evaluate((fn) => window[fn](), app.calculate);
    await expect(page.locator(app.result)).toHaveClass(/on/);
    expect(await numericEvidence(page, app.metrics)).toEqual(oracle);

    const original = await page.locator(app.dirty).inputValue();
    await page.locator(app.dirty).fill(original === '1' ? '2' : '1');
    await expect(page.locator(app.result)).not.toHaveClass(/on/);
    await page.locator(app.invalid).fill('0');
    await page.evaluate((fn) => window[fn](), app.calculate);
    await expect(page.locator(app.result)).not.toHaveClass(/on/);
    expect(await page.locator(app.invalid).evaluate((node) => node.checkValidity())).toBe(false);
  });
}

function contrastProof() {
  function rgb(value) { return (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number); }
  function luminance(value) {
    const parts = rgb(value).map((part) => { const v = part / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * parts[0] + .7152 * parts[1] + .0722 * parts[2];
  }
  function ratio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function background(node) {
    let current = node;
    while (current) {
      const value = getComputedStyle(current).backgroundColor;
      if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value;
      current = current.parentElement;
    }
    return 'rgb(255,255,255)';
  }
  const badText = Array.from(document.querySelectorAll('body *')).filter((node) => {
    const style = getComputedStyle(node);
    const direct = Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    return direct && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
  }).map((node) => { const style=getComputedStyle(node), bg=background(node); return {tag:node.tagName,text:node.textContent.trim().slice(0,60),color:style.color,background:bg,value:ratio(style.color,bg)}; }).filter((item) => item.value + .01 < 4.5);
  const badBoundaries = Array.from(document.querySelectorAll('input,select,button,.ai-handoff')).map((node) => {
    const style = getComputedStyle(node);
    const parentBackground = background(node.parentElement);
    return {tag:node.tagName,id:node.id,border:style.borderColor,parentBackground,value:ratio(style.borderColor,parentBackground)};
  }).filter((item) => item.value + .01 < 3);
  return {badText, badBoundaries};
}

test('three debt-resilience routes pass mobile, zoom, theme, a11y, metadata, privacy and scoped AI proof', async ({page, request}) => {
  const failed = [], errors = [];
  page.on('requestfailed', (item) => failed.push(item.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  for (const app of apps) {
    const external = [], writes = [], badResources = [];
    const onRequest = (item) => {
      const url = new URL(item.url());
      if (!['127.0.0.1','localhost'].includes(url.hostname)) external.push(item.url());
      if (!['GET','HEAD'].includes(item.method())) writes.push(`${item.method()} ${item.url()}`);
    };
    const onResponse = (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); };
    page.on('request', onRequest); page.on('response', onResponse);
    await page.setViewportSize({width:320,height:900});
    await page.emulateMedia({reducedMotion:'reduce',colorScheme:'light'});
    await page.goto(app.swahili, {waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang','sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
    for (const lang of ['en','fr','sw']) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveCount(1);
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate((img) => [img.naturalWidth,img.naturalHeight])).toEqual(app.art);
    await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', `/sw/ai/?tool=${app.id}`);
    await expect(page.locator('.source-box')).toContainText('uhakika ni wa kati');
    await expect(page.locator('.source-box')).toContainText('Udhamini');
    await expect(page.locator('.privacy-box')).toContainText('Hakuna data');
    for (const theme of ['light','dark']) {
      await page.locator('html').evaluate((node, value) => { node.dataset.theme=value; node.dataset.themeChoice=value; }, theme);
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id}:${theme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id}:${theme} boundaries`).toEqual([]);
    }
    for (const scheme of ['light','dark']) {
      await page.emulateMedia({reducedMotion:'reduce',colorScheme:scheme});
      await page.locator('html').evaluate((node) => { delete node.dataset.theme; node.dataset.themeChoice='auto'; });
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id}:system-${scheme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id}:system-${scheme} boundaries`).toEqual([]);
    }
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => { const style=getComputedStyle(document.activeElement); return {tag:document.activeElement.tagName,width:parseFloat(style.outlineWidth),style:style.outlineStyle}; });
    expect(focus.tag).not.toBe('BODY'); expect(focus.width).toBeGreaterThanOrEqual(3); expect(focus.style).not.toBe('none');
    const unnamed = await page.locator('main input,main select,main button,main a').evaluateAll((nodes) => nodes.filter((node) => {
      if (node.tagName === 'A' || node.tagName === 'BUTTON') return !node.textContent.trim() && !node.getAttribute('aria-label');
      return !node.labels?.length && !node.getAttribute('aria-label');
    }).map((node) => node.outerHTML.slice(0,160)));
    expect(unnamed).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({width:375,height:900});
    await page.addStyleTag({content:'html{font-size:200%!important}'});
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    page.off('request',onRequest); page.off('response',onResponse);
    expect(external).toEqual([]); expect(writes).toEqual([]); expect(badResources).toEqual([]);
    const ai = await page.context().newPage();
    await ai.goto(`/sw/ai/?tool=${app.id}`);
    await expect(ai).toHaveURL(new RegExp(`/sw/ai/\\?tool=${app.id}$`));
    await expect(ai.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status','not-accepted');
    await ai.close();
  }
  expect(failed).toEqual([]); expect(errors).toEqual([]); expect((await request.get('/sw/ai/')).ok()).toBe(true);
});
