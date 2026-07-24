const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

function observe(page) {
  const errors = [];
  const writes = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.method() + ' ' + request.url());
  });
  return { errors, writes };
}

async function generatedPdf(page, buttonId) {
  const generated = await page.evaluate(async (id) => {
    const event = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (detail) => {
      const bytes = new Uint8Array(await detail.detail.blob.arrayBuffer());
      resolve({ bytes: Array.from(bytes), name: detail.detail.fileName });
    }, { once: true }));
    document.getElementById(id).click();
    return event;
  }, buttonId);
  const buffer = Buffer.from(generated.bytes);
  return { buffer, name: generated.name, text: (await pdfParse(buffer)).text };
}

test('Hausa VAT sibling is native, custom-rate-first, private and mobile/dark safe', async ({ page }) => {
  const observed = observe(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', 'dark');
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/ha/kayan-aiki/kalkuletan-vat/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
  await expect(page.locator('h1')).toContainText('ƙimar VAT da ka tabbatar');
  await expect(page.locator('#country option')).toHaveCount(55);
  await expect(page.locator('#country option[value="NG"]')).toHaveText('Najeriya');
  expect(await page.evaluate(() => Object.keys(window.AfroToolsVatLocale.countryNames).length)).toBe(54);
  await expect(page.locator('#rate')).toHaveValue('');

  await page.locator('#country').selectOption('GW');
  await expect(page.locator('#presetStatus')).toHaveAttribute('data-state', 'gap');
  await expect(page.locator('#presetCopy')).toContainText('Babu kimar tsari');
  await expect(page.locator('#usePreset')).toBeHidden();
  await expect(page.locator('#rate')).toHaveValue('');

  await page.locator('#country').selectOption('NG');
  await expect(page.locator('#presetStatus')).toHaveAttribute('data-state', 'available');
  await page.locator('#usePreset').click();
  await expect(page.locator('#rate')).toHaveValue('7.5');
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#singleNet')).toHaveText('1,000.00');
  await expect(page.locator('#singleVat')).toHaveText('75.00');
  await expect(page.locator('#singleTotal')).toHaveText('1,075.00');
  await expect(page.locator('#singleSource')).toContainText('hanyar hukuma');

  await page.locator('#shareCalculator').click();
  const shared = await page.evaluate(() => window.__sharedPayload);
  expect(shared.title).toBe('Kalkuletan Tsara VAT na Afirka');
  expect(shared.url).toMatch(/\/ha\/kayan-aiki\/kalkuletan-vat\/$/);
  expect(JSON.stringify(shared)).not.toContain('1000');
  expect(JSON.stringify(shared)).not.toContain('1075');

  const pdf = await generatedPdf(page, 'singlePdf');
  expect(pdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.buffer.length).toBeGreaterThan(1000);
  expect(pdf.name).toBe('afrotools-lissafin-vat.pdf');
  expect(pdf.text).toContain('Lissafin Tsara VAT');
  expect(pdf.text).toContain('Jimilla');
  expect(pdf.text).toContain('1,075.00');
  expect(pdf.text).toContain('Tushen kima da iyakoki');
  expect(pdf.text).not.toContain('Rate provenance');

  const darkColors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    card: getComputedStyle(document.querySelector('.vat-workspace')).backgroundColor,
    input: getComputedStyle(document.querySelector('.vat-input')).backgroundColor
  }));
  for (const color of Object.values(darkColors)) {
    const channels = color.match(/\d+/g).slice(0, 3).map(Number);
    expect(channels.reduce((sum, channel) => sum + channel, 0)).toBeLessThan(180);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => ({
    vatKeys: Object.keys(localStorage).filter((key) => /vat/i.test(key)),
    amountInUrl: location.href.includes('1000') || location.href.includes('1075')
  }))).toEqual({ vatKeys: [], amountInUrl: false });
  await page.screenshot({ path: 'test-results/vat-flagship-ha-375-dark.png', fullPage: true });
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('Hausa VAT sibling completes invoice, withholding, comparison and keyboard tabs', async ({ page }) => {
  const observed = observe(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.goto('/ha/kayan-aiki/kalkuletan-vat/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#country option')).toHaveCount(55);

  await page.locator('#tab-single').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-invoice')).toHaveAttribute('aria-selected', 'true');
  const firstLine = page.locator('.vat-line').first();
  await expect(firstLine.locator('label').first()).toHaveText('Bayani');
  await firstLine.locator('.line-desc').fill('Aikin shawara');
  await firstLine.locator('.line-amount').fill('1000');
  await firstLine.locator('.line-rate').fill('15');
  await page.locator('#addInvoiceLine').click();
  const secondLine = page.locator('.vat-line').nth(1);
  await secondLine.locator('.line-desc').fill('Abin da mai amfani ya kebance');
  await secondLine.locator('.line-amount').fill('500');
  await secondLine.locator('.line-treatment').selectOption('exempt');
  await expect(secondLine.locator('.line-rate')).toBeDisabled();
  await page.locator('#calculateInvoice').click();
  await expect(page.locator('#invoiceSubtotal')).toHaveText('1,500.00');
  await expect(page.locator('#invoiceVat')).toHaveText('150.00');
  await expect(page.locator('#invoiceTotal')).toHaveText('1,650.00');

  const pdf = await generatedPdf(page, 'invoicePdf');
  expect(pdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.name).toBe('afrotools-tsarin-daftarin-vat.pdf');
  expect(pdf.text).toContain('Takaitaccen Tsarin Daftarin VAT');
  expect(pdf.text).toContain('Aikin shawara');
  expect(pdf.text).toContain('1,650.00');
  expect(pdf.text).toContain('ana harajanta da kimar da aka shigar');
  expect(pdf.text).not.toContain('standard');

  await page.locator('#tab-withholding').click();
  await page.locator('#withholdingAmount').fill('1000');
  await page.locator('#withholdingVatRate').fill('20');
  await page.locator('#withholdingPercent').fill('25');
  await page.locator('#calculateWithholding').click();
  await expect(page.locator('#withholdingVat')).toHaveText('200.00');
  await expect(page.locator('#withholdingRetained')).toHaveText('50.00');
  await expect(page.locator('#withholdingSupplier')).toHaveText('1,150.00');

  await page.locator('#tab-compare').click();
  await page.locator('#compareAmount').fill('1000');
  await page.locator('#scenarioRate1').fill('7.5');
  await page.locator('#scenarioRate2').fill('15');
  await page.locator('#scenarioRate3').fill('20');
  await page.locator('#calculateCompare').click();
  await expect(page.locator('#compareSpread')).toHaveText('12.50 maki na kaso');
  await expect(page.locator('#compareMetrics')).not.toContainText(/saving|currency|percentage points/i);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});
