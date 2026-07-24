const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const routes = [
  ['/sierra-leone/sl-vat', 'Sierra Leone GST calculator & invoice', 'Sources & verification'],
  ['/fr/sierra-leone/sl-vat', 'Calculateur GST Sierra Leone & facture', 'Sources et vérification'],
  ['/sw/sierra-leone/kikokotoo-vat/', 'Kikokotoo cha GST Sierra Leone & ankara', 'Vyanzo na uthibitisho']
];

for (const [route, title, verification] of routes) test(`${route} shares the evidence-gated GST engine`, async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('.gnv-hero h1')).toHaveText(title);
  await expect(page.locator('[data-tool-verification-panel] h2').last()).toHaveText(verification);
  await expect(page.locator('#slgGross')).toContainText(/11\D*500/);
  await page.locator('#slgRate').selectOption('confirmed-zero-rated');
  await expect(page.locator('#slgResult')).not.toHaveClass(/on/);
  await page.locator('#slgEvidence').check();
  await expect(page.locator('#slgTax')).toContainText(/0[.,]00/);
  await page.locator('#slgRate').selectOption('confirmed-exempt');
  await expect(page.locator('#slgResult')).not.toHaveClass(/on/);
  await page.locator('#slgEvidence').check();
  expect(errors).toEqual([]);
});

test('Sierra Leone GST invoice and registration boundaries work', async ({ page }) => {
  await page.goto('/sierra-leone/sl-vat');
  await page.locator('#slgLineEvidence').check();
  await page.locator('#slgInvoice button[type="submit"]').click();
  await expect(page.locator('#slgInvoiceTax')).toContainText(/1\D*500/);
  await page.locator('#slgPast4').fill('166666.66');
  await page.locator('#slgRegistration button[type="submit"]').click();
  await expect(page.locator('#slgRegistrationResult')).toContainText('Below');
  await page.locator('#slgPast4').fill('166666.67');
  await page.locator('#slgRegistration button[type="submit"]').click();
  await expect(page.locator('#slgRegistrationResult')).toContainText('Compulsory threshold met');
});

test('Sierra Leone GST is responsive, dark-mode safe, accessible and creates a real PDF', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/sierra-leone/sl-vat');
    if (width === 320) await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.locator('.gnv-card').first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await expect(page.getByLabel('Amount (SLE / NLe)', { exact: true })).toBeVisible();
  await expect(page.locator('#slgStatus')).toHaveAttribute('aria-live', 'polite');
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const pending = page.waitForEvent('download');
  await page.locator('#slgPdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('sierra-leone-gst-estimate.pdf');
  const buffer = fs.readFileSync(await download.path());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect((await pdfParse(buffer)).text).toContain('Sierra Leone GST calculator & invoice');
});

test('Sierra Leone GST durable visual proof', async ({ browser }) => {
  const dir = path.resolve('artifacts/day3-vat-sierra-leone-20260723');
  fs.mkdirSync(dir, { recursive: true });
  for (const item of [{ width: 320, theme: 'system-dark' }, { width: 375, theme: 'light' }, { width: 768, theme: 'manual-dark' }]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: 900 }, colorScheme: item.theme === 'system-dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/sierra-leone/sl-vat');
    if (item.theme === 'manual-dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: path.join(dir, `sierra-leone-gst-${item.width}-${item.theme}.png`), fullPage: true });
    await context.close();
  }
});
