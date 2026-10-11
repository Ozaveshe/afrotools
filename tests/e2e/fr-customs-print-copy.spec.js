const { test, expect } = require('@playwright/test');

async function auditControls(page, selectors) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async include => (await axe.run({ include }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations, selectors);
}

const route = '/fr/tools/cout-rendu/';
const values = { destCountry: 'NG', fobUSD: '10000', freightUSD: '900', insuranceUSD: '100', dutyRate: '20', fxRate: '1500', quantity: '10', brokerFeeLocal: '100000', handlingLocal: '50000', haulageLocal: '75000', sellPriceLocal: '4000000' };

async function openTool(page, theme = 'light') {
  await page.route('**/*', request => ['127.0.0.1', 'localhost'].includes(new URL(request.request().url()).hostname) ? request.continue() : request.abort());
  await page.addInitScript(value => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', value);
    window.__customsPrintCalls = 0;
    window.print = () => { window.__customsPrintCalls += 1; };
  }, theme);
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  for (const [name, value] of Object.entries(values)) {
    const field = page.locator(`[name="${name}"]`);
    if (await field.evaluate(node => node.tagName === 'SELECT')) await field.selectOption(value);
    else await field.fill(value);
  }
  await page.locator('[data-trade-form]').evaluate(form => form.requestSubmit());
  await expect(page.locator('[data-trade-result]')).toBeVisible();
  await expect(page.locator('[data-trade-result]')).toContainText('NGN');
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.__customsErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect(page.__customsErrors).toEqual([]);
});

for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`customs copy/print controls at ${width}px in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openTool(page, theme);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(await auditControls(page, ['[data-trade-result]', '[data-trade-status]'])).toEqual([]);
    const table = page.getByRole('table', { name: 'Détail du coût rendu', exact: true });
    await table.focus();
    await expect(table).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => table.evaluate(node => node.scrollLeft + node.parentElement.scrollLeft)).toBeGreaterThan(0);
    const print = page.getByRole('button', { name: 'Imprimer le résultat', exact: true });
    await print.focus();
    await expect(print).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.__customsPrintCalls)).toBe(1);
    await expect(page.locator('[data-trade-status]')).toContainText('impression demandée');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-trade-form]')).toBeHidden();
    await expect(page.locator('[data-trade-result]')).toBeVisible();
    expect(await page.locator('[data-trade-result]').evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }))).toEqual({ color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)' });
  });
}

test('customs report is copied through the actual browser clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openTool(page);
  const txtDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'TXT', exact: true }).click();
  const download = await txtDownload;
  const expected = require('node:fs').readFileSync(await download.path(), 'utf8');
  await page.getByRole('button', { name: 'Copier le résultat', exact: true }).click();
  await expect(page.locator('[data-trade-status]')).toContainText('Résultat copié localement');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replace(/\r\n/g, '\n')).toBe(expected.replace(/\r\n/g, '\n'));
});

test('keyboard calculation keeps its new result when the edited field blurs', async ({ page }) => {
  await openTool(page);
  const amount = page.locator('[name="sellPriceLocal"]');
  await amount.fill('4500000');
  await expect(page.locator('[data-trade-result]')).toBeHidden();
  await amount.press('Enter');
  await expect(page.locator('[data-trade-result]')).toBeVisible();
  await page.getByRole('button', { name: 'Copier le résultat', exact: true }).focus();
  await expect(page.locator('[data-trade-result]')).toBeVisible();
});

for (const mode of ['missing', 'reject', 'throw']) {
  test(`customs manual copy remains accessible when clipboard is ${mode}`, async ({ page }) => {
    await openTool(page, 'dark');
    await page.evaluate(value => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: value === 'missing' ? undefined : { writeText() { if (value === 'throw') throw Error('Synthetic clipboard denial'); return Promise.reject(Error('Synthetic clipboard denial')); } } }), mode);
    await page.getByRole('button', { name: 'Copier le résultat', exact: true }).click();
    const fallback = page.getByLabel('Résultat à copier manuellement', { exact: true });
    await expect(fallback).toBeVisible();
    await expect(fallback).toBeFocused();
    await expect(fallback).toHaveJSProperty('readOnly', true);
    const selection = await fallback.evaluate(node => ({ start: node.selectionStart, end: node.selectionEnd, length: node.value.length, text: node.value }));
    expect(selection.start).toBe(0);
    expect(selection.end).toBe(selection.length);
    expect(selection.text).toContain('NGN');
    expect(selection.text).toMatch(/estimation|hypothèse|indicatif/i);
    expect(await auditControls(page, ['.fr-trade-manual-copy'])).toEqual([]);
    await page.emulateMedia({ media: 'print' });
    await expect(fallback).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
    await page.locator('[name="fobUSD"]').fill('12000');
    await expect(page.locator('[data-trade-result]')).toBeHidden();
    await expect(fallback).toHaveCount(0);
  });
}

for (const action of ['input', 'reset']) for (const completion of ['resolve', 'reject']) {
  test(`late clipboard ${completion} cannot restore a customs result after ${action}`, async ({ page }) => {
    await openTool(page);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText() { return new Promise((resolve, reject) => { window.__finishCustomsCopy = { resolve, reject }; }); } } }));
    await page.getByRole('button', { name: 'Copier le résultat', exact: true }).click();
    if (action === 'input') await page.locator('[name="fobUSD"]').fill('15000');
    else await page.locator('[data-trade-form]').evaluate(form => form.reset());
    await expect(page.locator('[data-trade-result]')).toBeHidden();
    if (action === 'reset') await expect(page.locator('[data-trade-status]')).toHaveText('Formulaire réinitialisé.');
    const before = await page.locator('[data-trade-status]').textContent();
    await page.evaluate(async value => { window.__finishCustomsCopy[value](value === 'reject' ? Error('Synthetic late failure') : undefined); await Promise.resolve(); await Promise.resolve(); }, completion);
    await expect(page.locator('[data-trade-status]')).toHaveText(before);
    await expect(page.locator('.fr-trade-manual-copy')).toHaveCount(0);
    await expect(page.locator('[data-trade-result]')).toBeHidden();
  });
}

for (const format of ['copy', 'print', 'json', 'txt', 'csv', 'pdf']) {
  test(`customs ${format} rejects programmatically stale inputs`, async ({ page }) => {
    const downloads = [];
    page.on('download', download => downloads.push(download.suggestedFilename()));
    await openTool(page);
    await page.locator('[name="fobUSD"]').evaluate(node => { node.value = '20000'; });
    await page.locator(`[data-export="${format}"]`).click();
    await expect(page.locator('[data-trade-result]')).toBeHidden();
    await expect(page.locator('[data-trade-status]')).toContainText('Calculez d’abord');
    expect(downloads).toEqual([]);
    expect(await page.evaluate(() => window.__customsPrintCalls)).toBe(0);
    await expect(page.locator('.fr-trade-manual-copy')).toHaveCount(0);
  });
}

test('customs print denial provides local export recovery', async ({ page }) => {
  await openTool(page);
  await page.evaluate(() => { window.print = () => { throw Error('Synthetic print denial'); }; });
  await page.getByRole('button', { name: 'Imprimer le résultat', exact: true }).click();
  await expect(page.locator('[data-trade-status]')).toContainText('PDF ou TXT');
  await expect(page.locator('[data-trade-result]')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'TXT', exact: true }).click();
  expect(require('node:fs').readFileSync(await (await download).path(), 'utf8')).toContain('NGN');
});
