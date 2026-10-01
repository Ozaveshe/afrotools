const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

async function openCalculator(page) {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/sw/burkina-faso/kikokotoo-vat/');
  await page.waitForFunction(() => window.TVAEngine && window.AfroTools?.localVatPdf);
}

test('Swahili VAT clears invalid results and accepts zero in both modes', async ({ page }) => {
  await openCalculator(page);
  await page.locator('#amount').fill('100000');
  expect(await page.evaluate(() => RESULT.totalInclusive)).toBe(118000);
  await page.locator('#amount').fill('0');
  expect(await page.evaluate(() => RESULT)).toMatchObject({ netAmount: 0, vatAmount: 0, totalInclusive: 0 });
  await expect(page.locator('#results')).toHaveClass(/\bon\b/);
  await page.locator('#modeRemove').click();
  expect(await page.evaluate(() => RESULT)).toMatchObject({ netAmount: 0, vatAmount: 0, totalInclusive: 0 });
  for (const input of ['-1', '']) {
    await page.locator('#amount').fill(input);
    expect(await page.evaluate(() => RESULT)).toBeNull();
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#formError')).toHaveText('Ingiza kiasi cha sifuri au zaidi.');
    await expect(page.locator('#results')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#heroAmount')).toHaveText('—');
    await expect(page.locator('#formulaText')).toHaveText('');
    await expect(page.locator('#whResults')).toHaveText('Kokotoa VAT kwanza.');
  }
  await page.locator('#amount').fill('118000');
  expect(await page.evaluate(() => RESULT.netAmount)).toBeCloseTo(100000, 6);
  await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('#formError')).toHaveText('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('Swahili invalid and unavailable results cannot export or share stale values', async ({ page }) => {
  await openCalculator(page);
  await page.locator('#amount').fill('100000');
  await page.locator('#amount').fill('-1');
  const sends = await page.evaluate(() => {
    const calls = [];
    window.AfroTools.localVatPdf = () => calls.push('pdf');
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => calls.push('share') });
    downloadPdfResult();
    shareResult();
    return calls;
  });
  expect(sends).toEqual([]);
  await page.locator('#amount').fill('100000');
  await page.evaluate(() => {
    window.__savedVatEngine = window.TVAEngine;
    window.TVAEngine = null;
    calculate();
  });
  expect(await page.evaluate(() => RESULT)).toBeNull();
  await expect(page.locator('#results')).not.toHaveClass(/\bon\b/);
  await expect(page.locator('#formError')).toHaveText('Engine ya VAT haikupatikana. Pakia ukurasa tena.');
  await page.evaluate(() => { window.TVAEngine = window.__savedVatEngine; calculate(); });
  expect(await page.evaluate(() => RESULT.totalInclusive)).toBe(118000);
});

test('Swahili zero PDF is parseable, local and free with native result labels', async ({ page }) => {
  const failures = [];
  const writes = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => {
    if (request.method() !== 'GET' && /^http:\/\/127\.0\.0\.1:\d+\//.test(request.url())) writes.push(request.method());
  });
  await openCalculator(page);
  await page.locator('#amount').fill('999000');
  await page.locator('#amount').fill('0');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /Pakua PDF/i }).click();
  const bytes = fs.readFileSync(await (await pending).path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await pdfParse(bytes);
  expect(parsed.text).toContain('Kiasi bila VAT');
  expect(parsed.text).toContain('Jumla na VAT');
  expect(parsed.text.replace(/\s/g, '')).not.toContain('999000');
  expect(parsed.text).toMatch(/CFA\s*0/);
  await expect(page.locator('afro-email-gate')).toHaveCount(0);
  expect(writes).toEqual([]);
  expect(failures).toEqual([]);
});
