const { test, expect } = require('@playwright/test');

const apps = [
  {
    id: 'sacco-calc', english: '/tools/sacco-calc/', swahili: '/sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/', art: [600, 400],
    values: { '#sc-currency': 'KES', '#sc-monthly': '7500', '#sc-years': '5', '#sc-div': '10', '#sc-bank-rate': '4', '#sc-loan-mult': '3' },
    result: '#sc-results', metrics: ['#sc-total', '#sc-principal', '#sc-dividend', '#sc-loan-cap', '#sc-bank-total', '#sc-advantage'], dirty: '#sc-div', invalid: '#sc-monthly'
  },
  {
    id: 'credit-score', english: '/tools/credit-score/', swahili: '/sw/zana/alama-ya-mkopo/', art: [800, 450],
    values: { '#cs-payment': '85', '#cs-utilization': '65', '#cs-age': '80', '#cs-mix': '60', '#cs-inquiries': '30' },
    result: '#cs-results', metrics: ['#cs-score', '#cs-factor-list .factor-item:nth-child(1) .factor-weight', '#cs-factor-list .factor-item:nth-child(5) .factor-weight'], dirty: '#cs-payment', invalid: '#cs-payment'
  }
];

async function fill(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const node = page.locator(selector);
    if (await node.evaluate((element) => element.tagName === 'SELECT')) await node.selectOption(value);
    else await node.fill(value);
  }
}

async function texts(page, selectors) { return Promise.all(selectors.map((selector) => page.locator(selector).textContent())); }

for (const app of apps) {
  test(`${app.id} matches its English owner and clears stale or invalid results`, async ({ page }) => {
    await page.goto(app.english);
    await fill(page, app.values);
    await page.locator('.btn-calc').click();
    await expect(page.locator(app.result)).toBeVisible();
    const oracle = await texts(page, app.metrics);
    const marker = app.id === 'credit-score' ? await page.locator('#cs-marker').evaluate((node) => node.style.left) : null;
    const factorCount = app.id === 'credit-score' ? await page.locator('#cs-factor-list .factor-item').count() : null;
    const tipCount = app.id === 'credit-score' ? await page.locator('#cs-tips .tip-item').count() : null;

    await page.goto(app.swahili);
    await fill(page, app.values);
    await page.locator('.btn-calc').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.form-error')).toBeEmpty();
    await expect(page.locator(app.result)).toBeVisible();
    expect(await texts(page, app.metrics)).toEqual(oracle);
    if (app.id === 'credit-score') {
      expect(await page.locator('#cs-marker').evaluate((node) => node.style.left)).toBe(marker);
      await expect(page.locator('#cs-factor-list .factor-item')).toHaveCount(factorCount);
      await expect(page.locator('#cs-tips .tip-item')).toHaveCount(tipCount);
    }

    if (app.id === 'credit-score') await page.locator(app.dirty).selectOption('100');
    else await page.locator(app.dirty).fill('14');
    await expect(page.locator(app.result)).toBeHidden();
    if (app.id === 'credit-score') {
      await page.locator(app.invalid).evaluate((node) => { const option = document.createElement('option'); option.value = '-1'; option.textContent = 'invalid'; node.appendChild(option); });
      await page.locator(app.invalid).selectOption('-1');
    } else {
      await page.locator(app.invalid).evaluate((node) => { node.min = '-100'; });
      await page.locator(app.invalid).fill('0');
    }
    await page.locator('.btn-calc').click();
    await expect(page.locator(app.result)).toBeHidden();
    await expect(page.locator('.form-error')).not.toBeEmpty();
    await expect(page.locator('[data-export]')).toHaveCount(0);
  });
}

function contrastProof() {
  function rgb(value) { return (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number); }
  function luminance(value) { const c = rgb(value).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function ratio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function background(node) { let current = node; while (current) { const value = getComputedStyle(current).backgroundColor; if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value; current = current.parentElement; } return 'rgb(255,255,255)'; }
  const badText = Array.from(document.querySelectorAll('body *')).filter((node) => { const style = getComputedStyle(node); const text = Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()); return text && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length; }).map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 60), value: ratio(getComputedStyle(node).color, background(node)) })).filter((item) => item.value + .01 < 4.5);
  const badBoundaries = Array.from(document.querySelectorAll('input,select,button,.ai-handoff')).filter((node) => getComputedStyle(node).display !== 'none').map((node) => { const style = getComputedStyle(node); return { tag: node.tagName, id: node.id, value: ratio(style.borderColor, background(node.parentElement)) }; }).filter((item) => item.value + .01 < 3);
  return { badText, badBoundaries };
}

test('community credit routes pass mobile, zoom, themes, a11y, metadata, privacy, network and scoped AI proof', async ({ page }) => {
  const failed = [], errors = [];
  page.on('requestfailed', (item) => failed.push(item.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  for (const app of apps) {
    const external = [], writes = [], badResources = [];
    const onRequest = (item) => { const url = new URL(item.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(item.url()); if (!['GET', 'HEAD'].includes(item.method())) writes.push(`${item.method()} ${item.url()}`); };
    const onResponse = (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); };
    page.on('request', onRequest); page.on('response', onResponse);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto(app.swahili, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
    for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveCount(1);
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate((img) => [img.naturalWidth, img.naturalHeight])).toEqual(app.art);
    await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', `/sw/ai/?tool=${app.id}`);
    await expect(page.locator('.source-box')).toContainText('Agosti 2026');
    await expect(page.locator('.source-box')).toContainText('Udhamini');
    await expect(page.locator('.privacy-box')).toContainText('ridhaa ya wazi');
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; node.dataset.themeChoice = value; }, theme);
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id}:${theme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id}:${theme} boundaries`).toEqual([]);
    }
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
      await page.locator('html').evaluate((node) => { delete node.dataset.theme; node.dataset.themeChoice = 'auto'; });
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id}:system-${scheme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id}:system-${scheme} boundaries`).toEqual([]);
    }
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return { tag: document.activeElement.tagName, width: parseFloat(style.outlineWidth), style: style.outlineStyle }; });
    expect(focus.tag).not.toBe('BODY'); expect(focus.width).toBeGreaterThanOrEqual(3); expect(focus.style).not.toBe('none');
    const unnamed = await page.locator('main input,main select,main button,main a').evaluateAll((nodes) => nodes.filter((node) => { if (node.tagName === 'A' || node.tagName === 'BUTTON') return !node.textContent.trim() && !node.getAttribute('aria-label'); return !node.labels?.length && !node.getAttribute('aria-label'); }).map((node) => node.outerHTML.slice(0, 160)));
    expect(unnamed).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    page.off('request', onRequest); page.off('response', onResponse);
    expect(external).toEqual([]); expect(writes).toEqual([]); expect(badResources).toEqual([]);
    const ai = await page.context().newPage();
    await ai.goto(`/sw/ai/?tool=${app.id}`);
    await expect(ai).toHaveURL(new RegExp(`/sw/ai/\\?tool=${app.id}$`));
    await expect(ai.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status', 'not-accepted');
    await ai.close();
  }
  expect(failed).toEqual([]); expect(errors).toEqual([]);
});
