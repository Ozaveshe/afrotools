const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/niger/ne-vat', 'Niger VAT calculator & invoice', 'Sources & verification', 'Report a calculation error'],
  ['/fr/niger/calculateur-tva', 'Calculateur TVA Niger & facture', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/niger/kikokotoo-vat/', 'Kikokotoo cha VAT Niger & ankara', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) test(`${route} shares the current evidence-gated engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
  await expect(page.locator('#nevGross')).toContainText(/11\D*900/);
  await page.locator('#nevRate').selectOption('confirmed-reduced-ten');
  await expect(page.locator('#nevResult')).not.toHaveClass(/on/);
  await page.locator('#nevEvidence').check();
  await expect(page.locator('#nevVat')).toContainText(/1\D*000/);
  await page.locator('#nevRate').selectOption('confirmed-reduced-five');
  await expect(page.locator('#nevResult')).not.toHaveClass(/on/);
  await page.locator('#nevEvidence').check();
  await expect(page.locator('#nevVat')).toContainText(/500/);
  await page.locator('#nevRate').selectOption('confirmed-article-322-exempt');
  await expect(page.locator('#nevResult')).not.toHaveClass(/on/);
  expect(errors).toEqual([]);
});

test('Niger invoice checks standard and evidenced 5% lines', async ({ page }) => {
  await page.goto('/niger/ne-vat');
  await page.locator('#nevLine1').fill('10000');
  await page.locator('#nevLine2').fill('5000');
  await page.locator('#nevLineEvidence').check();
  await page.locator('#nevInvoice button[type="submit"]').click();
  await expect(page.locator('#nevInvoiceVat')).toContainText(/2\D*150/);
  await expect(page.locator('#nevInvoiceGross')).toContainText(/17\D*150/);
});

test('Niger VAT supports mobile, zoom, system and manual dark', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/niger/ne-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Niger VAT exposes labels, status and keyboard focus', async ({ page }) => {
  await page.goto('/niger/ne-vat');
  await expect(page.getByLabel('Amount (XOF)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('VAT treatment', { exact: true })).toBeVisible();
  await expect(page.locator('#nevStatus')).toHaveAttribute('role', 'status');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Niger VAT downloads a real local PDF', async ({ page }) => {
  await page.goto('/niger/ne-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#nevPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('niger-vat-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Niger VAT calculator & invoice');
  expect(parsed.text).toMatch(/1[\s,.]*900/);
});

test('Niger VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-niger-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light' });
    const page = await context.newPage();
    await page.goto('/niger/ne-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `niger-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
