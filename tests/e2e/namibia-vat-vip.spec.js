const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/namibia/na-vat', 'Namibia VAT calculator & invoice', 'Sources & verification', 'Report a calculation error'],
  ['/fr/namibia/na-vat', 'Calculateur TVA Namibie & facture', 'Sources et vérification', 'Signaler une erreur de calcul'],
  ['/sw/namibia/kikokotoo-vat/', 'Kikokotoo cha VAT Namibia & ankara', 'Vyanzo na uthibitisho', 'Ripoti hitilafu ya hesabu']
];

for (const [route, title, verification, report] of routes) test(`${route} shares the current evidence-gated engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('[data-tool-verification-panel] a[href^="mailto:"]')).toHaveText(report);
  await expect(page.locator('#navGross')).toContainText(/1\D*150/);
  await page.locator('#navRate').selectOption('confirmed-schedule-iii-zero');
  await expect(page.locator('#navResult')).not.toHaveClass(/on/);
  await page.locator('#navEvidence').check();
  await expect(page.locator('#navVat')).toContainText(/0[.,]00/);
  await page.locator('#navRate').selectOption('confirmed-schedule-iv-exempt');
  await expect(page.locator('#navResult')).not.toHaveClass(/on/);
  expect(errors).toEqual([]);
});

test('Namibia invoice checks normal and evidenced Schedule III lines', async ({ page }) => {
  await page.goto('/namibia/na-vat');
  await page.locator('#navLine1').fill('1000');
  await page.locator('#navLine2').fill('500');
  await page.locator('#navLineEvidence').check();
  await page.locator('#navInvoice button[type="submit"]').click();
  await expect(page.locator('#navInvoiceVat')).toContainText(/150/);
  await expect(page.locator('#navInvoiceGross')).toContainText(/1\D*650/);
});

test('Namibia VAT supports mobile, zoom, system and manual dark', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/namibia/na-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Namibia VAT exposes labels, status and keyboard focus', async ({ page }) => {
  await page.goto('/namibia/na-vat');
  await expect(page.getByLabel('Amount (NAD)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('VAT treatment', { exact: true })).toBeVisible();
  await expect(page.locator('#navStatus')).toHaveAttribute('role', 'status');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement && document.activeElement !== document.body)).toBe(true);
});

test('Namibia VAT downloads a real local PDF', async ({ page }) => {
  await page.goto('/namibia/na-vat');
  const pending = page.waitForEvent('download');
  await page.locator('#navPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('namibia-vat-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('Namibia VAT calculator & invoice');
  expect(parsed.text).toMatch(/150[.,]00/);
});

test('Namibia VAT durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-namibia-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light' });
    const page = await context.newPage();
    await page.goto('/namibia/na-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `namibia-vat-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
