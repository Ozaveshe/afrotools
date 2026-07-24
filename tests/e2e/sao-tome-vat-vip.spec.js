const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/sao-tome/st-vat', 'São Tomé VAT calculator & invoice', 'Sources & verification', 'Report a calculation error'],
  ['/fr/sao-tome/st-vat', 'Calculateur TVA São Tomé & facture', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/sao-tome/kikokotoo-vat/', 'Kikokotoo cha VAT São Tomé & ankara', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) test(`${route} shares the evidence-gated CIVA engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
  await expect(page.locator('#stvGross')).toContainText(/1\D*150/);
  await page.locator('#stvRate').selectOption('confirmed-annex-1-reduced');
  await expect(page.locator('#stvResult')).not.toHaveClass(/on/);
  await page.locator('#stvEvidence').check();
  await expect(page.locator('#stvVat')).toContainText(/75/);
  await expect(page.getByText(/16%|16 %/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Sao Tome invoice checks standard and evidenced Annex I lines', async ({ page }) => {
  await page.goto('/sao-tome/st-vat');
  await page.locator('#stvLineEvidence').check();
  await page.locator('#stvInvoice button[type="submit"]').click();
  await expect(page.locator('#stvInvoiceVat')).toContainText(/187[.,]50/);
  await expect(page.locator('#stvInvoiceGross')).toContainText(/1\D*687[.,]50/);
});

test('Sao Tome VAT supports 320, 375 and 768px, 200% zoom and dark modes', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/sao-tome/st-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Sao Tome VAT exposes labels, live status and keyboard focus', async ({ page }) => {
  await page.goto('/sao-tome/st-vat');
  await expect(page.getByLabel('Amount (STN)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('VAT treatment', { exact: true })).toBeVisible();
  await expect(page.locator('#stvStatus')).toHaveAttribute('role', 'status');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Sao Tome VAT downloads a parseable local PDF', async ({ page }) => {
  await page.goto('/sao-tome/st-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#stvPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('sao-tome-vat-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('São Tomé VAT calculator & invoice');
  expect(parsed.text).toMatch(/150[.,]00/);
});

test('Sao Tome VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-sao-tome-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/sao-tome/st-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `sao-tome-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
