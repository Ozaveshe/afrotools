const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');
const routes = [
  ['/zimbabwe/zw-vat', 'Zimbabwe VAT calculator', 'What this calculator does'],
  ['/fr/zimbabwe/zw-vat', 'Calculateur TVA Zimbabwe', 'Ce que fait ce calculateur'],
  ['/sw/zimbabwe/kikokotoo-vat/', 'Kikokotoo cha VAT Zimbabwe', 'Kikokotoo hiki kinafanya nini']
];
async function overflowReport(page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return [...document.querySelectorAll('body *')].map(node => {
      const rect = node.getBoundingClientRect();
      return { node: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${node.classList.length ? `.${[...node.classList].join('.')}` : ''}`, left: rect.left / zoom, right: rect.right / zoom, scrollWidth: node.scrollWidth };
    }).filter(item => !item.node.includes('skip-link') && (item.right > limit + 1 || item.left < -1 || item.left + item.scrollWidth > limit + 1)).slice(0, 20);
  });
}
for (const [route, title, boundaryHeading] of routes) {
  test(`${route} calculates fixed 15.5% in explicit ZWG or USD`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.gnv-hero h1')).toHaveText(title);
    await expect(page.getByRole('heading', { name: boundaryHeading })).toBeVisible();
    await expect(page.locator('#zwVatCurrency')).toHaveValue('ZWG');
    await expect(page.locator('#zwVatTax')).toContainText(/155/);
    await expect(page.locator('#zwVatGross')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*155/);
    await page.locator('#zwVatCurrency').selectOption('USD');
    await expect(page.locator('#zwVatTax')).toContainText(/USD/);
    await page.getByRole('button', { name: /Extract VAT|Extraire la TVA|Toa VAT/ }).click();
    await page.locator('#zwVatAmount').fill('1155');
    await expect(page.locator('#zwVatNet')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*000/);
    await expect(page.locator('#zwVatTax')).toContainText(/155/);
    await expect(page.locator('#zwVatCurrency option')).toHaveCount(2);
    await expect(page.locator('[data-tool-verification-panel] a')).toHaveCount(5);
    await expect(page.locator('body')).not.toContainText('Zero-rated exports');
    await expect(page.locator('body')).not.toContainText('Basic food');
    expect(errors).toEqual([]);
  });
}
test('Zimbabwe VAT supports mobile, 200% zoom, dark modes, reduced motion and keyboard', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 375 ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.goto('/zimbabwe/zw-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await overflowReport(page), `overflow at ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('body').press('Home'); await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused(); await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused(); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add VAT' })).toBeFocused();
});
test('Zimbabwe VAT generates parseable currency-correct PDF and safe share URL', async ({ page }) => {
  await page.goto('/zimbabwe/zw-vat');
  await page.locator('#zwVatCurrency').selectOption('USD');
  const pending = page.waitForEvent('download'); await page.locator('#zwVatPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('zimbabwe-vat-15-5-percent-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Zimbabwe VAT calculator');
  expect(parsed.text).toContain('Official standard rate: 15.5%');
  expect(parsed.text).toContain('Currency: USD');
  const href = await page.locator('#zwVatShare').evaluate(node => {
    navigator.share = undefined; navigator.clipboard.writeText = value => { window.__sharedUrl = value; return Promise.resolve(); };
    node.click(); return new Promise(resolve => setTimeout(() => resolve(window.__sharedUrl), 0));
  });
  expect(href).toMatch(/\/zimbabwe\/zw-vat$/); expect(href).not.toContain('1000'); expect(href).not.toContain('USD');
});
test('Zimbabwe VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-zimbabwe-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage(); await page.goto('/zimbabwe/zw-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `zimbabwe-vat-${item.width}-${item.theme}.png`), fullPage: true }); await context.close();
  }
});
