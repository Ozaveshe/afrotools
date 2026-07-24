const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/tunisia/tn-vat', 'Tunisia VAT calculator', 'What this calculator does'],
  ['/fr/tunisie/calculateur-tva', 'Calculateur TVA Tunisie', 'Ce que fait ce calculateur'],
  ['/sw/tunisia/kikokotoo-vat/', 'Kikokotoo cha VAT Tunisia', 'Kikokotoo hiki kinafanya nini']
];

async function overflowReport(page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    return [...document.querySelectorAll('body *')].map(node => {
      const rect = node.getBoundingClientRect();
      const left = rect.left / zoom;
      const right = rect.right / zoom;
      return {
        node: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${node.classList.length ? `.${[...node.classList].join('.')}` : ''}`,
        left: Math.round(left * 10) / 10,
        right: Math.round(right * 10) / 10,
        width: Math.round((rect.width / zoom) * 10) / 10,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth
      };
    }).filter(item => !item.node.includes('skip-link') && (item.right > limit + 1 || item.left < -1 || item.left + item.scrollWidth > limit + 1)).slice(0, 20);
  });
}

for (const [route, title, boundaryHeading] of routes) {
  test(`${route} calculates fixed 19% VAT with accessible local controls`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('.gnv-hero h1')).toHaveText(title);
    await expect(page.getByRole('heading', { name: boundaryHeading })).toBeVisible();
    await expect(page.locator('#tnVatAmount')).toHaveAttribute('name', 'amount');
    await expect(page.locator('#tnVatAmount')).toHaveValue('1000');
    await expect(page.locator('#tnVatTax')).toContainText('190');
    await expect(page.locator('#tnVatGross')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*190/);
    await page.getByRole('button', { name: /Extract VAT|Extraire la TVA|Toa VAT/ }).click();
    await page.locator('#tnVatAmount').fill('1190');
    await expect(page.locator('#tnVatNet')).toContainText(/1(?:,|\.|\s|\u00a0|\u202f)*000/);
    await expect(page.locator('#tnVatTax')).toContainText('190');
    await expect(page.locator('input[type="number"]')).toHaveCount(1);
    await expect(page.locator('[data-tool-verification-panel] a[href*="finances.gov.tn"]')).toHaveCount(3);
    await expect(page.locator('body')).not.toContainText('13%');
    await expect(page.locator('body')).not.toContainText('7%');
    expect(errors).toEqual([]);
  });
}

test('Tunisia VAT supports mobile, 200% zoom, system/manual dark, reduced motion and keyboard', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 375 ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.goto('/tunisia/tn-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const overflow = await overflowReport(page);
    expect(overflow, `Overflowing nodes at ${width}px${width === 320 ? ' and 200% zoom' : ''}: ${JSON.stringify(overflow)}`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1';
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('body').press('Home');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add VAT' })).toBeFocused();
});

test('Tunisia VAT generates a real parseable local PDF without sharing the amount', async ({ page }) => {
  await page.goto('/tunisia/tn-vat');
  await page.locator('#tnVatAmount').fill('1000');
  const pending = page.waitForEvent('download');
  await page.locator('#tnVatPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('tunisia-vat-19-percent-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Tunisia VAT calculator');
  expect(parsed.text).toContain('Official general rate: 19%');
  expect(parsed.text).toContain('TND');
  const href = await page.locator('#tnVatShare').evaluate(node => {
    navigator.share = undefined;
    navigator.clipboard.writeText = value => { window.__sharedUrl = value; return Promise.resolve(); };
    node.click();
    return new Promise(resolve => setTimeout(() => resolve(window.__sharedUrl), 0));
  });
  expect(href).toMatch(/\/tunisia\/tn-vat$/);
  expect(href).not.toContain('1000');
});

test('Tunisia VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-tunisia-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [
    { width: 320, theme: 'system-dark' },
    { width: 375, theme: 'light' },
    { width: 768, theme: 'manual-dark' }
  ]) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: 900 },
      colorScheme: item.theme === 'system-dark' ? 'dark' : 'light',
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await page.goto('/tunisia/tn-vat');
    if (item.theme === 'manual-dark') {
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    }
    await page.screenshot({ path: path.join(dir, `tunisia-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
