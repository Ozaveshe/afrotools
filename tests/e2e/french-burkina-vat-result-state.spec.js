const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

async function openCalculator(page) {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/fr/burkina-faso/calculateur-tva');
  await page.waitForFunction(() => window.TVAEngine && window.AfroTools?.localVatPdf);
}

test('French VAT keeps zero, invalidation and recovery distinct in both modes', async ({ page }) => {
  await openCalculator(page);
  await page.locator('#amount').fill('100000');
  expect(await page.evaluate(() => RESULT.totalInclusive)).toBe(118000);
  await page.locator('#amount').fill('0');
  expect(await page.evaluate(() => RESULT)).toMatchObject({ netAmount: 0, vatAmount: 0, totalInclusive: 0 });
  await expect(page.locator('#resultsCard')).toHaveClass(/\bon\b/);
  await page.getByRole('button', { name: 'Retirer la TVA', exact: true }).click();
  expect(await page.evaluate(() => RESULT)).toMatchObject({ netAmount: 0, vatAmount: 0, totalInclusive: 0 });

  for (const input of ['-1', '']) {
    await page.locator('#amount').fill(input);
    expect(await page.evaluate(() => RESULT)).toBeNull();
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#amountError')).toHaveText('Saisissez un montant de 0 ou plus.');
    await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#resContent')).toHaveText('');
    await expect(page.locator('#resAmount')).toHaveText('—');
  }
  await page.locator('#amount').fill('118000');
  expect(await page.evaluate(() => RESULT.netAmount)).toBeCloseTo(100000, 6);
  await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('#amountError')).toHaveText('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('reduced-rate confirmation still applies to zero and clears a revoked result', async ({ page }) => {
  await openCalculator(page);
  await page.locator('#amount').fill('100000');
  await page.locator('#rate').selectOption('0.10');
  expect(await page.evaluate(() => RESULT)).toBeNull();
  await expect(page.locator('#rateError')).toContainText('Confirmez');
  await page.locator('#rateConfirmed').check();
  expect(await page.evaluate(() => RESULT.totalInclusive)).toBeCloseTo(110000, 6);
  await page.locator('#amount').fill('0');
  expect(await page.evaluate(() => RESULT.totalInclusive)).toBe(0);
  await page.locator('#rateConfirmed').uncheck();
  expect(await page.evaluate(() => RESULT)).toBeNull();
  await expect(page.locator('#resContent')).toHaveText('');
  await expect(page.locator('#rateError')).toContainText('Confirmez');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
});

test('zero exports a parseable French PDF without carrying the previous amount', async ({ page }) => {
  await openCalculator(page);
  await page.locator('#amount').fill('999000');
  await page.locator('#amount').fill('0');
  await expect(page.locator('#resultsCard')).toHaveClass(/\bon\b/);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /Télécharger le PDF/i }).click();
  const download = await pending;
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(bytes);
  expect(parsed.text).toContain('Montant HT');
  expect(parsed.text).toMatch(/0\s*FCFA/);
  expect(parsed.text.replace(/\s/g, '')).not.toContain('999000');
  await expect(page.locator('afro-email-gate')).toHaveCount(0);
  await page.locator('#amount').fill('-1');
  const invalidExport = await page.evaluate(() => {
    let called = false;
    window.AfroTools.localVatPdf = () => { called = true; };
    exportPdf();
    return called;
  });
  expect(invalidExport).toBe(false);
});
