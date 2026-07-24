const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/tools/markup-calc/', 'Markup and selling price calculator'],
  ['/fr/tools/calculateur-marge/', 'Calculateur de majoration et prix de vente'],
  ['/sw/zana/kikokotoo-markup/', 'Kikokotoo cha markup na bei ya kuuza'],
  ['/ha/kayan-aiki/karin-farashi/', 'Kalkuletan ƙarin farashi da farashin sayarwa']
];

async function overflow(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return [...document.querySelectorAll('body *')].map((node) => {
      const box = node.getBoundingClientRect();
      return { node: node.tagName + (node.id ? `#${node.id}` : '') + (node.classList.contains('skip-link') ? '.skip-link' : ''), left: box.left / zoom, right: box.right / zoom };
    }).filter((item) => !item.node.includes('skip-link') && (item.left < -1 || item.right > width + 1)).slice(0, 10);
  });
}

for (const [route, title] of routes) {
  test(`${route} has no defaults and clears stale results`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.mcv-hero h1')).toHaveText(title);
    await expect(page.locator('#mcCost')).toHaveValue('');
    await expect(page.locator('#mcPercentage')).toHaveValue('');
    await page.locator('#mcUnit').fill('USD');
    await page.locator('#mcCost').fill('100');
    await page.locator('#mcPercentage').fill('50');
    await page.locator('#mcForm button[type=submit]').click();
    await expect(page.locator('#mcSelling')).toContainText(/USD\s*150(?:\.|,)00/);
    await expect(page.locator('#mcMarkup')).toHaveText('50.00%');
    await expect(page.locator('#mcMargin')).toHaveText('33.33%');
    await page.locator('#mcCost').fill('');
    await expect(page.locator('#mcResult')).not.toHaveClass(/on/);
    await expect(page.locator('#mcSelling')).toHaveText('');
    expect(errors).toEqual([]);
  });
}

test('target margin, negative pricing, comparisons and formula-safe batch CSV work', async ({ page }) => {
  await page.goto('/tools/markup-calc/');
  await page.getByRole('button', { name: 'Target margin to price' }).click();
  await page.locator('#mcCost').fill('100');
  await page.locator('#mcPercentage').fill('20');
  await page.locator('#mcForm button[type=submit]').click();
  await expect(page.locator('#mcSelling')).toContainText('125.00');
  await expect(page.locator('#mcMarkup')).toHaveText('25.00%');
  await page.getByRole('button', { name: 'Markup to price' }).click();
  await page.locator('#mcCost').fill('100');
  await page.locator('#mcPercentage').fill('-25');
  await page.locator('#mcForm button[type=submit]').click();
  await expect(page.locator('#mcSelling')).toContainText('75.00');
  await expect(page.locator('#mcMargin')).toHaveText('-33.33%');
  await page.locator('#mcCompare').fill('10, 50, -20');
  await page.locator('#mcCompareButton').click();
  await expect(page.locator('#mcCompareTable tbody tr')).toHaveCount(3);
  await page.locator('#mcFile').setInputFiles({ name: 'products.csv', mimeType: 'text/csv', buffer: Buffer.from('Product Name,Cost\n\"=2+2\",100\nBread,50') });
  await page.locator('#mcBatchMarkup').fill('20');
  await page.locator('#mcBatchProcess').click();
  await expect(page.locator('#mcBatchTable tbody tr')).toHaveCount(2);
  const pending = page.waitForEvent('download');
  await page.locator('#mcBatchDownload').click();
  const download = await pending;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"\'=2+2"');
  expect(csv).toContain('"120"');
});

test('exports a parser-readable local PDF and CSV', async ({ page }) => {
  await page.goto('/tools/markup-calc/');
  await page.locator('#mcUnit').fill('USD');
  await page.locator('#mcCost').fill('100');
  await page.locator('#mcPercentage').fill('50');
  await page.locator('#mcForm button[type=submit]').click();
  let pending = page.waitForEvent('download');
  await page.locator('#mcPdf').click();
  let download = await pending;
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(bytes);
  expect(parsed.text).toContain('Markup and selling price calculator');
  expect(parsed.text).toContain('Selling price: 150');
  pending = page.waitForEvent('download');
  await page.locator('#mcCsv').click();
  download = await pending;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"Selling price","150"');
  expect(csv).toContain('"Margin","33.33%"');
});

test('mobile, dark, 200% zoom and keyboard paths stay usable', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 375 ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/markup-calc/');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await overflow(page), `overflow at ${width}`).toEqual([]);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('body').press('Home');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('dedicated widget uses the same validated engine contract', async ({ page }) => {
  await page.goto('/widgets/iframe/financial-markup-calc');
  await expect(page.locator('#aw-cost')).toHaveValue('');
  await page.locator('#aw-unit').fill('USD');
  await page.locator('#aw-cost').fill('100');
  await page.locator('#aw-markup').fill('50');
  await page.locator('#aw-calc').click();
  await expect(page.locator('#aw-res')).toContainText('USD 150.00');
  await expect(page.locator('#aw-res')).toContainText('33.33%');
  await page.locator('#aw-cost').fill('');
  await expect(page.locator('#aw-res')).toBeHidden();
  await expect(page.locator('#aw-status')).toContainText('greater than zero');
});

test('stores durable visual proof', async ({ browser }) => {
  const directory = path.resolve('artifacts/day3-markup-calc-20260723');
  fs.mkdirSync(directory, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/tools/markup-calc/');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(directory, `markup-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
