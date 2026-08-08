const { test, expect } = require('@playwright/test');

const app = {
  id: 'mobile-vs-bank',
  english: '/tools/mobile-vs-bank/',
  swahili: '/sw/zana/pesa-simu-dhidi-ya-benki/'
};

const formula = {
  '#mb-country': 'KE',
  '#mb-amount': '12000',
  '#mb-mm-fee': '30',
  '#mb-mm-pct': '1.5',
  '#mb-bank-fee': '80',
  '#mb-bank-pct': '0.5'
};

const swContext = {
  '#mb-quote-date': '2026-08-02',
  '#mb-mm-provider': 'M-Pesa',
  '#mb-mm-source': 'Ratiba ya ada ya M-Pesa ya 2026-08-02',
  '#mb-bank-provider': 'Benki ya Mfano',
  '#mb-bank-source': 'Nukuu ya benki ya 2026-08-02'
};

const numericSelectors = [
  '#mb-mm-total-fee', '#mb-bank-total-fee',
  ...Array.from({ length: 5 }, (_, row) => [1, 2, 3].map((column) => `#mb-table tr:nth-child(${row + 2}) td:nth-child(${column})`)).flat()
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

test('formula, fee ranking and safe provider names match the maintained English owner', async ({ page }) => {
  await page.goto(app.english);
  await fill(page, formula);
  await page.locator('.btn-calc').click();
  await expect(page.locator('#mb-results')).toBeVisible();
  const oracle = await texts(page, numericSelectors);
  const oracleClasses = await page.locator('#mb-mm-card,#mb-bank-card').evaluateAll((nodes) => nodes.map((node) => node.className));

  await page.goto(app.swahili);
  await fill(page, { ...formula, ...swContext, '#mb-mm-provider': 'M-Pesa <img src=x>', '#mb-bank-provider': 'Benki & Ushirika' });
  await page.locator('#mb-bank-pct').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mb-error')).toBeEmpty();
  await expect(page.locator('#mb-results')).toBeVisible();
  expect(await texts(page, numericSelectors)).toEqual(oracle);
  expect(await page.locator('#mb-mm-card,#mb-bank-card').evaluateAll((nodes) => nodes.map((node) => node.className))).toEqual(oracleClasses);
  await expect(page.locator('#mb-mm-name')).toHaveText('M-Pesa <img src=x>');
  await expect(page.locator('#mb-bank-name')).toHaveText('Benki & Ushirika');
  await expect(page.locator('#mb-table img')).toHaveCount(0);
  await expect(page.locator('[data-sw-result-actions]')).toBeVisible();
});

test('stale and invalid states fail closed, and every advertised local export reopens', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4309' });
  await page.goto(app.swahili);
  await fill(page, { ...formula, ...swContext });
  await page.locator('.btn-calc').click();
  await expect(page.locator('#mb-results')).toBeVisible();

  await page.locator('[data-sw-copy-result]').click();
  await expect(page.locator('[data-sw-result-status]')).toHaveText('Matokeo yamenakiliwa.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('M-Pesa');
  expect(copied).toContain('KES 210.00');
  expect(copied).toContain('Tarehe ya nukuu: 2026-08-02');

  const waitForDownload = page.waitForEvent('download');
  await page.locator('[data-sw-download-result]').click();
  const download = await waitForDownload;
  expect(download.suggestedFilename()).toBe('ulinganisho-pesa-simu-na-benki.txt');
  const stream = await download.createReadStream();
  let reopened = '';
  for await (const chunk of stream) reopened += chunk.toString('utf8');
  const lines = reopened.split(/\r?\n/);
  const metadata = new Map(lines.filter((line) => line.includes(': ')).slice(0, 7).map((line) => {
    const split = line.indexOf(': ');
    return [line.slice(0, split), line.slice(split + 2)];
  }));
  expect(metadata.get('Tarehe ya nukuu')).toBe('2026-08-02');
  expect(metadata.get('Huduma ya pesa za simu')).toBe('M-Pesa');
  expect(metadata.get('Benki')).toBe('Benki ya Mfano');
  expect(reopened).toContain('KES 140.00');
  expect(reopened).toContain('Kadirio la kupanga pekee');
  await expect(page.locator('[data-sw-result-status]')).toHaveText('Faili ya TXT imepakuliwa kwenye kifaa hiki.');

  await page.locator('[data-sw-save-marker]').click();
  const marker = await page.evaluate(() => JSON.parse(localStorage.getItem('afro_sw_mobile_bank_marker_v1')));
  expect(Object.keys(marker).sort()).toEqual(['route', 'savedAt', 'storesFinancialDetails', 'toolId']);
  expect(marker).toMatchObject({ toolId: 'mobile-vs-bank', route: app.swahili, storesFinancialDetails: false });
  expect(JSON.stringify(marker)).not.toContain('12000');
  expect(JSON.stringify(marker)).not.toContain('M-Pesa');

  await page.locator('#mb-mm-source').fill('Nukuu mpya');
  await expect(page.locator('#mb-results')).toBeHidden();
  await expect(page.locator('[data-sw-result-actions]')).toBeHidden();
  await page.locator('#mb-mm-pct').evaluate((node) => { node.max = '200'; });
  await page.locator('#mb-mm-pct').fill('101');
  await page.locator('.btn-calc').click();
  await expect(page.locator('#mb-results')).toBeHidden();
  await expect(page.locator('#mb-error')).toContainText('0% hadi 100%');
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
  page.on('requestfailed', (item) => { if (!['www.googletagmanager.com','www.google-analytics.com','pagead2.googlesyndication.com','www.google.com','cdn.jsdelivr.net'].includes(new URL(item.url()).hostname)) failed.push(item.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (item) => { const url = new URL(item.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname) && !['www.googletagmanager.com', 'www.google-analytics.com', 'pagead2.googlesyndication.com', 'www.google.com','cdn.jsdelivr.net'].includes(url.hostname)) external.push(item.url()); if (!['GET', 'HEAD'].includes(item.method()) && !['www.googletagmanager.com', 'www.google-analytics.com', 'pagead2.googlesyndication.com', 'www.google.com','cdn.jsdelivr.net'].includes(new URL(item.url()).hostname)) writes.push(`${item.method()} ${item.url()}`); });
  page.on('response', (response) => { if (response.status() >= 400) badResources.push(`${response.status()} ${response.url()}`); });

  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto(app.swahili, { waitUntil: 'networkidle' });
  await fill(page, { ...formula, ...swContext });
  await page.locator('.btn-calc').click();
  await expect(page.locator('#mb-results')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahili}`);
  for (const lang of ['en', 'fr', 'ha', 'sw', 'x-default']) await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveCount(1);
  await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
  expect(await page.locator('.hero-art').evaluate((img) => [img.naturalWidth, img.naturalHeight])).toEqual([800, 450]);
  await expect(page.locator('[data-shared-ai-handoff]')).toHaveAttribute('href', '/sw/ai/?tool=mobile-vs-bank');
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
  await ai.goto('/sw/ai/?tool=mobile-vs-bank');
  await expect(ai).toHaveURL(/\/sw\/ai\/\?tool=mobile-vs-bank$/);
  await expect(ai.locator('.ai-local-note')).toHaveAttribute('data-ai-tool-status', 'not-accepted');
  await ai.close();
});
