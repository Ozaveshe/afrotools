const { test, expect } = require('playwright/test');

const apps = {
  fire: { id: 'fire-calc', english: '/tools/fire-calc/', swahili: '/sw/zana/kikokotoo-fire/', result: '#fire-results', error: '#fire-error', art: [600, 400] },
  property: { id: 'property-vs-stocks', english: '/tools/property-vs-stocks/', swahili: '/sw/zana/mali-dhidi-ya-hisa/', result: '#pvs-results', error: '#pvs-error', art: [800, 450] },
  stocks: { id: 'stock-portfolio', english: '/tools/stock-portfolio/', swahili: '/sw/zana/ufuatiliaji-wa-hisa/', result: '#sp-results', error: '#sp-error', art: [600, 400] }
};

const fireValues = {
  '#fire-currency': 'NGN', '#fire-age': '30', '#fire-retire-age': '45', '#fire-expenses': '200000',
  '#fire-retire-expenses': '150000', '#fire-savings': '500000', '#fire-monthly-save': '80000',
  '#fire-return': '14', '#fire-inflation': '8', '#fire-withdrawal': '4'
};
const propertyValues = {
  '#pvs-currency': 'NGN', '#pv-price': '15000000', '#pv-down': '5', '#pv-rent': '120000',
  '#pv-appreciation': '8', '#pv-expenses': '2', '#pv-vacancy': '10', '#pv-sale-cost': '5',
  '#sv-return': '14', '#pv-years': '10'
};
const stockRows = [
  ['DANGOTE', '100', '200', '250'],
  ['SAFARICOM', '50', '20', '18'],
  ['MTN', '30', '100', '120']
];

async function fill(page, values) {
  for (const [selector, value] of Object.entries(values)) {
    const node = page.locator(selector);
    if (await node.evaluate((element) => element.tagName === 'SELECT')) await node.selectOption(value);
    else await node.fill(value);
  }
}

async function fillStocks(page, names = stockRows) {
  for (let row = 0; row < names.length; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      await page.locator(`#holdings-tbody tr:nth-child(${row + 1}) td:nth-child(${column + 1}) input`).fill(names[row][column]);
    }
  }
}

async function numericTexts(page, selectors) {
  return Promise.all(selectors.map(async (selector) => (await page.locator(selector).textContent()).replace(/[^\d.,+-]/g, '')));
}

test('FIRE formula matches the maintained English owner', async ({ page }) => {
  const selectors = ['#fire-number', '#fire-years', '#fire-retire-year', '#fire-portfolio-at-retire', '#fire-monthly-needed', '#fire-savings-rate', '#fire-swr3', '#fire-swr4', '#fire-swr5', '#fire-swr6'];
  await page.goto(apps.fire.english);
  await fill(page, fireValues);
  await page.locator('.btn-calc').click();
  const oracle = await numericTexts(page, selectors);
  await page.goto(apps.fire.swahili);
  await fill(page, fireValues);
  await page.locator('#fire-withdrawal').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(apps.fire.result)).toBeVisible();
  expect(await numericTexts(page, selectors)).toEqual(oracle);
  await expect(page.locator('#fire-number')).toContainText('142,747,610.14');
  await expect(page.locator('#fire-monthly-needed')).toContainText('248,947.07');
});

test('property and stock scenarios match the maintained English owner', async ({ page }) => {
  const selectors = ['#prop-value', '#stock-value', '#pvs-prop-roi', '#pvs-stock-roi', '#pvs-prop-income'];
  await page.goto(apps.property.english);
  await fill(page, propertyValues);
  await page.locator('.btn-calc').click();
  const oracle = await numericTexts(page, selectors);
  const classes = await page.locator('#prop-card,#stock-card').evaluateAll((nodes) => nodes.map((node) => node.className));
  await page.goto(apps.property.swahili);
  await fill(page, propertyValues);
  await page.locator('.btn-calc').click();
  await expect(page.locator(apps.property.result)).toBeVisible();
  expect(await numericTexts(page, selectors)).toEqual(oracle);
  expect(await page.locator('#prop-card,#stock-card').evaluateAll((nodes) => nodes.map((node) => node.className))).toEqual(classes);
  await expect(page.locator('#prop-value')).toContainText('40,724,681.21');
  await expect(page.locator('#stock-value')).toContainText('58,388,735.70');
});

test('stock portfolio totals, rows and safe dynamic controls match the maintained English owner', async ({ page }) => {
  const totals = ['#sp-total-value', '#sp-total-cost', '#sp-total-gain', '#sp-return-pct'];
  const rowNumbers = Array.from({ length: 3 }, (_, row) => Array.from({ length: 7 }, (_, offset) => `#sp-table-body tr:nth-child(${row + 1}) td:nth-child(${offset + 2})`)).flat();
  await page.goto(apps.stocks.english);
  await fillStocks(page);
  await page.locator('.btn-calc').click();
  const oracle = await numericTexts(page, [...totals, ...rowNumbers]);

  await page.goto(apps.stocks.swahili);
  const safeRows = stockRows.map((row) => [...row]);
  safeRows[0][0] = 'DANGOTE <img src=x>';
  await fillStocks(page, safeRows);
  await page.locator('.btn-calc').click();
  await expect(page.locator(apps.stocks.result)).toBeVisible();
  expect(await numericTexts(page, [...totals, ...rowNumbers])).toEqual(oracle);
  await expect(page.locator('#sp-total-value')).toContainText('29,500');
  await expect(page.locator('#sp-return-pct')).toHaveText('+22.9%');
  await expect(page.locator('#sp-table-body td').first()).toHaveText('DANGOTE <img src=x>');
  await expect(page.locator('#sp-table-body img')).toHaveCount(0);
  await page.locator('.btn-add').click();
  await expect(page.locator('#holdings-tbody tr')).toHaveCount(4);
  await expect(page.locator('#holdings-tbody tr').last().locator('input').first()).toHaveAttribute('aria-label', 'Nafasi 4 alama ya hisa');
  await expect(page.locator('#holdings-tbody tr').last().locator('.btn-del')).toHaveAttribute('aria-label', 'Futa nafasi 4');
  await page.locator('#holdings-tbody tr').last().locator('.btn-del').click();
  await expect(page.locator('#holdings-tbody tr')).toHaveCount(3);
});

test('every route clears stale results, rejects invalid input and advertises no unowned export', async ({ page }) => {
  await page.goto(apps.fire.swahili); await fill(page, fireValues); await page.locator('.btn-calc').click();
  await page.locator('#fire-source').fill('Chanzo kipya'); await expect(page.locator(apps.fire.result)).toBeHidden();
  await page.locator('#fire-retire-age').fill('20'); await page.locator('.btn-calc').click();
  await expect(page.locator(apps.fire.error)).toContainText('lazima uwe mkubwa'); await expect(page.locator(apps.fire.result)).toBeHidden();

  await page.goto(apps.property.swahili); await fill(page, propertyValues); await page.locator('.btn-calc').click();
  await page.locator('#pvs-source').fill('Chanzo kipya'); await expect(page.locator(apps.property.result)).toBeHidden();
  await page.locator('#pv-price').evaluate((node) => { node.min = '0'; }); await page.locator('#pv-price').fill('0'); await page.locator('.btn-calc').click();
  await expect(page.locator(apps.property.error)).toContainText('Kagua kiasi'); await expect(page.locator(apps.property.result)).toBeHidden();

  await page.goto(apps.stocks.swahili); await fillStocks(page); await page.locator('.btn-calc').click();
  await page.locator('#sp-broker').fill('Dalali mpya'); await expect(page.locator(apps.stocks.result)).toBeHidden();
  await page.locator('#sp-first-shares').fill('0'); await page.locator('.btn-calc').click();
  await expect(page.locator(apps.stocks.error)).toContainText('Kila mstari'); await expect(page.locator(apps.stocks.result)).toBeHidden();

  for (const app of Object.values(apps)) {
    await page.goto(app.swahili);
    await expect(page.locator('[data-export], [data-sw-copy-result], [data-sw-download-result], a[download]')).toHaveCount(0);
    await expect(page.locator('button:has-text("Pakua"), button:has-text("Nakili")')).toHaveCount(0);
  }
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

async function calculate(page, id) {
  if (id === 'fire-calc') await fill(page, fireValues);
  if (id === 'property-vs-stocks') await fill(page, propertyValues);
  if (id === 'stock-portfolio') await fillStocks(page);
  await page.locator('.btn-calc').click();
}

test('all physical routes pass mobile, 200 percent text, themes, a11y, metadata, privacy, network and scoped AI proof', async ({ page }) => {
  const failed = [], errors = [], external = [], writes = [], badResources = [];
  page.on('requestfailed', (item) => failed.push(item.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (item) => { const url = new URL(item.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(item.url()); if (!['GET', 'HEAD'].includes(item.method())) writes.push(`${item.method()} ${item.url()}`); });
  page.on('response', (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); });

  for (const app of Object.values(apps)) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto(app.swahili, { waitUntil: 'networkidle' });
    await calculate(page, app.id);
    await expect(page.locator(app.result)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
    for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveCount(1);
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate((img) => [img.naturalWidth, img.naturalHeight])).toEqual(app.art);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', String(app.art[0]));
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', String(app.art[1]));
    await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', `/sw/ai/?tool=${app.id}`);
    await expect(page.locator('.source-box')).toContainText('Agosti 2026');
    await expect(page.locator('.confidence-box')).toContainText('uhakika wa juu');
    await expect(page.locator('.privacy-box')).toContainText('Udhamini');
    await expect(page.locator('.privacy-box')).toContainText('ridhaa ya wazi');

    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((node, value) => { node.dataset.theme = value; node.dataset.themeChoice = value; }, theme);
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id} ${theme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id} ${theme} boundaries`).toEqual([]);
    }
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
      await page.locator('html').evaluate((node) => { delete node.dataset.theme; node.dataset.themeChoice = 'auto'; });
      const state = await page.evaluate(contrastProof);
      expect(state.badText, `${app.id} system-${scheme} text`).toEqual([]);
      expect(state.badBoundaries, `${app.id} system-${scheme} boundaries`).toEqual([]);
    }
    await page.locator(app.result).focus();
    await page.keyboard.press('Shift+Tab');
    const focus = await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return { tag: document.activeElement.tagName, width: parseFloat(style.outlineWidth), style: style.outlineStyle }; });
    expect(focus.tag).not.toBe('BODY'); expect(focus.width).toBeGreaterThanOrEqual(3); expect(focus.style).not.toBe('none');
    const unnamed = await page.locator('main input,main select,main button,main a').evaluateAll((nodes) => nodes.filter((node) => { if (node.tagName === 'A' || node.tagName === 'BUTTON') return !node.textContent.trim() && !node.getAttribute('aria-label'); return !node.labels?.length && !node.getAttribute('aria-label'); }).map((node) => node.outerHTML.slice(0, 160)));
    expect(unnamed).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const ai = await page.context().newPage();
    await ai.goto(`/sw/ai/?tool=${app.id}`);
    await expect(ai).toHaveURL(new RegExp(`/sw/ai/\\?tool=${app.id}$`));
    await expect(ai.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status', 'not-accepted');
    await ai.close();
  }
  expect(external).toEqual([]); expect(writes).toEqual([]); expect(badResources).toEqual([]); expect(failed).toEqual([]); expect(errors).toEqual([]);
});
