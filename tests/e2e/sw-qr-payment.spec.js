const { test, expect } = require('playwright/test');

const app = {
  id: 'qr-payment',
  english: '/tools/qr-payment/',
  swahili: '/sw/zana/gharama-za-malipo-ya-qr/'
};

const formula = {
  '#qr-currency': 'KES',
  '#qr-avg-txn': '5000',
  '#qr-daily-txns': '50',
  '#qr-days': '22',
  '#qr-rate': '0.5',
  '#qr-flat': '0',
  '#qr-pos-rate': '1.5',
  '#qr-pos-flat': '0',
  '#qr-mm-rate': '0.8',
  '#qr-mm-flat': '0',
  '#qr-cash-cost': '0.5'
};

const swContext = {
  '#qr-country': 'KE',
  '#qr-quote-date': '2026-08-02',
  '#qr-source': 'Ratiba ya ada ya tarehe 2026-08-02',
  '#qr-provider': 'QR ya Mfano',
  '#qr-pos-provider': 'POS ya Mfano',
  '#qr-mm-provider': 'Pesa za simu',
  '#qr-cash-label': 'Fedha taslimu'
};

const numericSelectors = [
  '#qr-monthly-fee', '#qr-monthly-vol', '#qr-per-txn', '#qr-effective-rate', '#qr-annual-fee',
  ...Array.from({ length: 4 }, (_, row) => [
    `#qr-compare .method-item:nth-child(${row + 1}) .method-fee`,
    `#qr-compare .method-item:nth-child(${row + 1}) .method-rate`
  ]).flat()
];

async function fill(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const node = page.locator(selector);
    if (await node.evaluate((element) => element.tagName === 'SELECT')) await node.selectOption(value);
    else await node.fill(value);
  }
}

async function texts(page, selectors) {
  return Promise.all(selectors.map((selector) => page.locator(selector).textContent()));
}

async function numericTexts(page, selectors) {
  return (await texts(page, selectors)).map((value) => value.replace(/[^\d.,-]/g, ''));
}

test('formula and fee ranking match the maintained English owner, with safe provider names', async ({ page }) => {
  await page.goto(app.english);
  await fill(page, formula);
  await page.locator('.btn-calc').click();
  await expect(page.locator('#qr-results')).toBeVisible();
  const oracle = await numericTexts(page, numericSelectors);
  const oracleClasses = await page.locator('#qr-compare .method-item').evaluateAll((nodes) => nodes.map((node) => node.className));

  await page.goto(app.swahili);
  await fill(page, { ...formula, ...swContext, '#qr-provider': 'QR <img src=x>', '#qr-pos-provider': 'POS & Kadi' });
  await page.locator('#qr-cash-cost').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#qr-error')).toBeEmpty();
  await expect(page.locator('#qr-results')).toBeVisible();
  expect(await numericTexts(page, numericSelectors)).toEqual(oracle);
  expect(await page.locator('#qr-compare .method-item').evaluateAll((nodes) => nodes.map((node) => node.className))).toEqual(oracleClasses);
  await expect(page.locator('#qr-compare .method-name').first()).toContainText('QR <img src=x>');
  await expect(page.locator('#qr-compare img')).toHaveCount(0);
  await expect(page.locator('#qr-monthly-fee')).toHaveText('KES 27,500.00');
});

test('stale and invalid states fail closed and no unowned export is advertised', async ({ page }) => {
  await page.goto(app.swahili);
  await fill(page, { ...formula, ...swContext });
  await page.locator('.btn-calc').click();
  await expect(page.locator('#qr-results')).toBeVisible();

  await page.locator('#qr-source').fill('Nukuu mpya');
  await expect(page.locator('#qr-results')).toBeHidden();
  await expect(page.locator('#qr-error')).toBeEmpty();
  await page.locator('#qr-days').fill('32');
  await page.locator('.btn-calc').click();
  await expect(page.locator('#qr-results')).toBeHidden();
  await expect(page.locator('#qr-error')).toContainText('siku 1 hadi 31');
  await expect(page.locator('[data-export], [data-sw-copy-result], [data-sw-download-result]')).toHaveCount(0);
  await expect(page.locator('a[download], button:has-text("Pakua"), button:has-text("Nakili")')).toHaveCount(0);
});

function contrastProof() {
  function rgb(value) { return (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number); }
  function luminance(value) { const c = rgb(value).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function ratio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function background(node) { let current = node; while (current) { const value = getComputedStyle(current).backgroundColor; if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value; current = current.parentElement; } return 'rgb(255,255,255)'; }
  const badText = Array.from(document.querySelectorAll('body *')).filter((node) => { const style = getComputedStyle(node); const text = Array.from(node.childNodes).some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()); return text && style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length; }).map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 60), value: ratio(getComputedStyle(node).color, background(node)) })).filter((item) => item.value + .01 < 4.5);
  const badBoundaries = Array.from(document.querySelectorAll('main input,main select,main button,main .ai-handoff')).filter((node) => getComputedStyle(node).display !== 'none').map((node) => { const style = getComputedStyle(node); return { tag: node.tagName, id: node.id, value: ratio(style.borderColor, background(node.parentElement)) }; }).filter((item) => item.value + .01 < 3);
  return { badText, badBoundaries };
}

test('route passes mobile, 200 percent text, themes, a11y, metadata, privacy, network and scoped AI proof', async ({ page }) => {
  const failed = [], errors = [], external = [], writes = [], badResources = [];
  page.on('requestfailed', (item) => failed.push(item.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (item) => { const url = new URL(item.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(item.url()); if (!['GET', 'HEAD'].includes(item.method())) writes.push(`${item.method()} ${item.url()}`); });
  page.on('response', (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); });

  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto(app.swahili, { waitUntil: 'networkidle' });
  await fill(page, { ...formula, ...swContext });
  await page.locator('.btn-calc').click();
  await expect(page.locator('#qr-results')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
  for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveCount(1);
  await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
  expect(await page.locator('.hero-art').evaluate((img) => [img.naturalWidth, img.naturalHeight])).toEqual([800, 450]);
  await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', '/sw/ai/?tool=qr-payment');
  await expect(page.locator('.source-box')).toContainText('Agosti 2026');
  await expect(page.locator('.confidence-box')).toContainText('uhakika wa juu');
  await expect(page.locator('.privacy-box')).toContainText('Udhamini');
  await expect(page.locator('.privacy-box')).toContainText('ridhaa ya wazi');

  for (const theme of ['light', 'dark']) {
    await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; node.dataset.themeChoice = value; }, theme);
    const state = await page.evaluate(contrastProof);
    expect(state.badText, `${theme} text`).toEqual([]);
    expect(state.badBoundaries, `${theme} boundaries`).toEqual([]);
  }
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
    await page.locator('html').evaluate((node) => { delete node.dataset.theme; node.dataset.themeChoice = 'auto'; });
    const state = await page.evaluate(contrastProof);
    expect(state.badText, `system-${scheme} text`).toEqual([]);
    expect(state.badBoundaries, `system-${scheme} boundaries`).toEqual([]);
  }
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return { tag: document.activeElement.tagName, width: parseFloat(style.outlineWidth), style: style.outlineStyle }; });
  expect(focus.tag).not.toBe('BODY');
  expect(focus.width).toBeGreaterThanOrEqual(3);
  expect(focus.style).not.toBe('none');
  const unnamed = await page.locator('main input,main select,main button,main a').evaluateAll((nodes) => nodes.filter((node) => { if (node.tagName === 'A' || node.tagName === 'BUTTON') return !node.textContent.trim() && !node.getAttribute('aria-label'); return !node.labels?.length && !node.getAttribute('aria-label'); }).map((node) => node.outerHTML.slice(0, 160)));
  expect(unnamed).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.addStyleTag({ content: 'html{font-size:200%!important}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
  expect(badResources).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);

  const ai = await page.context().newPage();
  await ai.goto('/sw/ai/?tool=qr-payment');
  await expect(ai).toHaveURL(/\/sw\/ai\/\?tool=qr-payment$/);
  await expect(ai.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status', 'not-accepted');
  await ai.close();
});
