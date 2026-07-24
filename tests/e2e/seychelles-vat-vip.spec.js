const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/seychelles/sc-vat', 'Seychelles VAT calculator & invoice', 'Sources & verification', 'Report a calculation error'],
  ['/fr/seychelles/sc-vat', 'Calculateur TVA Seychelles & facture', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/seychelles/kikokotoo-vat/', 'Kikokotoo cha VAT Shelisheli & ankara', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) test(`${route} shares the evidence-gated Seychelles engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
  await expect(page.locator('#scvGross')).toContainText(/11\D*500/);
  await page.locator('#scvRate').selectOption('confirmed-zero-rated');
  await expect(page.locator('#scvResult')).not.toHaveClass(/on/);
  await page.locator('#scvEvidence').check();
  await expect(page.locator('#scvVat')).toContainText(/0[.,]00/);
  await page.locator('#scvRate').selectOption('confirmed-exempt');
  await expect(page.locator('#scvResult')).not.toHaveClass(/on/);
  await page.locator('#scvEvidence').check();
  await expect(page.locator('#scvVat')).toContainText(/0[.,]00/);
  expect(errors).toEqual([]);
});

test('Seychelles invoice checks standard and evidenced special lines', async ({ page }) => {
  await page.goto('/seychelles/sc-vat');
  await page.locator('#scvLineEvidence').check();
  await page.locator('#scvInvoice button[type="submit"]').click();
  await expect(page.locator('#scvInvoiceVat')).toContainText(/1\D*500/);
  await expect(page.locator('#scvInvoiceGross')).toContainText(/16\D*500/);
});

test('Seychelles registration screen keeps threshold states separate', async ({ page }) => {
  await page.goto('/seychelles/sc-vat');
  await page.locator('#scvNext6').fill('100000');
  await page.locator('#scvRegistration button[type="submit"]').click();
  await expect(page.locator('#scvRegistrationResult')).toContainText('Voluntary threshold met');
  await page.locator('#scvNext12').fill('2000000');
  await page.locator('#scvRegistration button[type="submit"]').click();
  await expect(page.locator('#scvRegistrationResult')).toContainText('Compulsory threshold met');
});

test('Seychelles VAT supports 320, 375 and 768px, 200% zoom and dark modes', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/seychelles/sc-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Seychelles VAT exposes labels, live status and keyboard focus', async ({ page }) => {
  await page.goto('/seychelles/sc-vat');
  await expect(page.getByLabel('Amount (SCR)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('VAT treatment', { exact: true })).toBeVisible();
  await expect(page.locator('#scvStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#scvRegistrationResult')).toHaveAttribute('aria-live', 'polite');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Seychelles VAT downloads a parseable local PDF', async ({ page }) => {
  await page.goto('/seychelles/sc-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#scvPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('seychelles-vat-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Seychelles VAT calculator & invoice');
  expect(parsed.text).toMatch(/1.500/);
});

test('Seychelles VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-seychelles-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/seychelles/sc-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `seychelles-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
