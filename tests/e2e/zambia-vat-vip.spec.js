const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/zambia/zm-vat', 'Zambia VAT calculator', 'What this calculator does'],
  ['/fr/zambia/zm-vat', 'Calculateur TVA Zambie', 'Ce que fait ce calculateur'],
  ['/sw/zambia/kikokotoo-vat/', 'Kikokotoo cha VAT Zambia', 'Kikokotoo hiki kinafanya nini']
];

async function overflowReport(page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return [...document.querySelectorAll('body *')].map(node => {
      const rect = node.getBoundingClientRect();
      return {
        node: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${node.classList.length ? `.${[...node.classList].join('.')}` : ''}`,
        left: rect.left / zoom, right: rect.right / zoom, scrollWidth: node.scrollWidth
      };
    }).filter(item => !item.node.includes('skip-link') && (item.right > limit + 1 || item.left < -1 || item.left + item.scrollWidth > limit + 1)).slice(0, 20);
  });
}

for (const [route, title, boundaryHeading] of routes) {
  test(`${route} calculates fixed 16% VAT with sourced local controls`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.gnv-hero h1')).toHaveText(title);
    await expect(page.getByRole('heading', { name: boundaryHeading })).toBeVisible();
    await expect(page.locator('#zmVatAmount')).toHaveValue('1000');
    await expect(page.locator('#zmVatTax')).toContainText(/160/);
    await expect(page.locator('#zmVatGross')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*160/);
    await page.getByRole('button', { name: /Extract VAT|Extraire la TVA|Toa VAT/ }).click();
    await page.locator('#zmVatAmount').fill('1160');
    await expect(page.locator('#zmVatNet')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*000/);
    await expect(page.locator('#zmVatTax')).toContainText(/160/);
    await expect(page.locator('input[type="number"]')).toHaveCount(1);
    await expect(page.locator('[data-tool-verification-panel] a')).toHaveCount(4);
    await expect(page.locator('body')).not.toContainText('Tourist services');
    await expect(page.locator('body')).not.toContainText('Basic foodstuffs');
    expect(errors).toEqual([]);
  });
}

test('Zambia VAT supports mobile, 200% zoom, dark modes, reduced motion and keyboard', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 375 ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.goto('/zambia/zm-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await overflowReport(page), `overflow at ${width}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('body').press('Home');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add VAT' })).toBeFocused();
});

test('Zambia VAT generates a parseable local PDF and safe share URL', async ({ page }) => {
  await page.goto('/zambia/zm-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#zmVatPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('zambia-vat-16-percent-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Zambia VAT calculator');
  expect(parsed.text).toContain('Official standard rate: 16%');
  expect(parsed.text).toContain('ZMW');
  const href = await page.locator('#zmVatShare').evaluate(node => {
    navigator.share = undefined;
    navigator.clipboard.writeText = value => { window.__sharedUrl = value; return Promise.resolve(); };
    node.click();
    return new Promise(resolve => setTimeout(() => resolve(window.__sharedUrl), 0));
  });
  expect(href).toMatch(/\/zambia\/zm-vat$/);
  expect(href).not.toContain('1000');
});

test('Zambia VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-zambia-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/zambia/zm-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `zambia-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
