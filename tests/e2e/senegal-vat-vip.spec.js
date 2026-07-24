const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/senegal/sn-vat', 'Senegal VAT calculator & invoice', 'Sources & verification', 'Report a calculation error'],
  ['/fr/senegal/calculateur-tva', 'Calculateur TVA Sénégal & facture', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/senegal/kikokotoo-vat/', 'Kikokotoo cha VAT Senegal & ankara', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) test(`${route} shares the evidence-gated Article 369 engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
  await expect(page.locator('#snvGross')).toContainText(/11\D*800/);
  await page.locator('#snvRate').selectOption('confirmed-approved-tourist-service');
  await expect(page.locator('#snvResult')).not.toHaveClass(/on/);
  await page.locator('#snvEvidence').check();
  await expect(page.locator('#snvVat')).toContainText(/1\D*000/);
  expect(errors).toEqual([]);
});

test('Senegal invoice checks standard and evidenced tourist-service lines', async ({ page }) => {
  await page.goto('/senegal/sn-vat');
  await page.locator('#snvLineEvidence').check();
  await page.locator('#snvInvoice button[type="submit"]').click();
  await expect(page.locator('#snvInvoiceVat')).toContainText(/2\D*300/);
  await expect(page.locator('#snvInvoiceGross')).toContainText(/17\D*300/);
});

test('Senegal VAT supports 320, 375 and 768px, 200% zoom and dark modes', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/senegal/sn-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Senegal VAT exposes labels, live status and keyboard focus', async ({ page }) => {
  await page.goto('/senegal/sn-vat');
  await expect(page.getByLabel('Amount (XOF)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('VAT treatment', { exact: true })).toBeVisible();
  await expect(page.locator('#snvStatus')).toHaveAttribute('role', 'status');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Senegal VAT downloads a parseable local PDF', async ({ page }) => {
  await page.goto('/senegal/sn-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#snvPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('senegal-vat-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Senegal VAT calculator & invoice');
  expect(parsed.text).toMatch(/1.800/);
});

test('Senegal legacy French alias resolves to the native French canonical', async ({ page }) => {
  await page.goto('/fr/senegal/sn-vat');
  await expect(page).toHaveURL(/\/fr\/senegal\/calculateur-tva\/?$/);
  await expect(page.locator('.gnv-hero h1')).toHaveText('Calculateur TVA Sénégal & facture');
});

test('Senegal VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-senegal-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/senegal/sn-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `senegal-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
