const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

function capture(page) {
  const errors = [];
  const writes = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.method() + ' ' + request.url()); });
  return { errors, writes };
}

async function generatedPdf(page, buttonId) {
  const bytes = await page.evaluate(async (id) => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      const array = new Uint8Array(await event.detail.blob.arrayBuffer());
      resolve({ bytes: Array.from(array), name: event.detail.fileName });
    }, { once: true }));
    document.getElementById(id).click();
    return generated;
  }, buttonId);
  const buffer = Buffer.from(bytes.bytes);
  return { buffer, name: bytes.name, text: (await pdfParse(buffer)).text };
}

test('English VAT flagship is custom-rate-first, local-only and mobile/dark safe', async ({ page }) => {
  const observed = capture(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', 'dark');
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/tools/vat-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#country option')).toHaveCount(55);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const darkColors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    card: getComputedStyle(document.querySelector('.vat-workspace')).backgroundColor,
    input: getComputedStyle(document.querySelector('.vat-input')).backgroundColor
  }));
  for (const color of Object.values(darkColors)) {
    const channels = color.match(/\d+/g).slice(0, 3).map(Number);
    expect(channels.reduce((sum, channel) => sum + channel, 0)).toBeLessThan(180);
  }

  await expect(page.locator('#rate')).toHaveValue('');
  await page.locator('#country').selectOption('GW');
  await expect(page.locator('#presetStatus')).toHaveAttribute('data-state', 'gap');
  await expect(page.locator('#usePreset')).toBeHidden();
  await expect(page.locator('#rate')).toHaveValue('');

  await page.locator('#country').selectOption('NG');
  await expect(page.locator('#presetStatus')).toHaveAttribute('data-state', 'available');
  await page.locator('#usePreset').click();
  await expect(page.locator('#rate')).toHaveValue('7.5');
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#singleResult')).toBeVisible();
  await expect(page.locator('#singleNet')).toHaveText('1,000.00');
  await expect(page.locator('#singleVat')).toHaveText('75.00');
  await expect(page.locator('#singleTotal')).toHaveText('1,075.00');
  await expect(page.locator('#singleSource')).toContainText('https://www.firs.gov.ng/');

  await page.locator('#shareCalculator').click();
  const shared = await page.evaluate(() => window.__sharedPayload);
  expect(shared.url).toMatch(/\/tools\/vat-calculator\/$/);
  expect(JSON.stringify(shared)).not.toContain('1000');
  expect(JSON.stringify(shared)).not.toContain('1075');

  const pdf = await generatedPdf(page, 'singlePdf');
  expect(pdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.buffer.length).toBeGreaterThan(1000);
  expect(pdf.name).toBe('afrotools-vat-planning-calculation.pdf');
  expect(pdf.text).toContain('VAT Planning Calculation');
  expect(pdf.text).toContain('Net amount');
  expect(pdf.text).toContain('1,075.00');
  expect(pdf.text).toContain('Planning estimate only');

  const privacy = await page.evaluate(() => ({
    vatKeys: Object.keys(localStorage).filter((key) => /vat/i.test(key)),
    amountInUrl: location.href.includes('1000') || location.href.includes('1075')
  }));
  expect(privacy.vatKeys).toEqual([]);
  expect(privacy.amountInUrl).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/vat-flagship-en-375-dark.png', fullPage: true });
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('English VAT flagship completes invoice, withholding, comparison and tab keyboard flows', async ({ page }) => {
  const observed = capture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.goto('/tools/vat-calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#country option')).toHaveCount(55);

  await page.locator('#tab-single').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-invoice')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-invoice')).toBeVisible();

  const firstLine = page.locator('.vat-line').first();
  await firstLine.locator('.line-desc').fill('Consulting');
  await firstLine.locator('.line-amount').fill('1000');
  await firstLine.locator('.line-rate').fill('15');
  await page.locator('#addInvoiceLine').click();
  const secondLine = page.locator('.vat-line').nth(1);
  await secondLine.locator('.line-desc').fill('User-classified exempt item');
  await secondLine.locator('.line-amount').fill('500');
  await secondLine.locator('.line-treatment').selectOption('exempt');
  await expect(secondLine.locator('.line-rate')).toBeDisabled();
  await page.locator('#calculateInvoice').click();
  await expect(page.locator('#invoiceSubtotal')).toHaveText('1,500.00');
  await expect(page.locator('#invoiceVat')).toHaveText('150.00');
  await expect(page.locator('#invoiceTotal')).toHaveText('1,650.00');

  const invoicePdf = await generatedPdf(page, 'invoicePdf');
  expect(invoicePdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(invoicePdf.text).toContain('VAT Invoice Planning Summary');
  expect(invoicePdf.text).toContain('Consulting');
  expect(invoicePdf.text).toContain('1,650.00');
  expect(invoicePdf.text).toContain('supplied by the user');

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
  await expect(page.locator('#compareSpread')).toHaveText('12.50 percentage points');
  await expect(page.locator('#compareMetrics')).not.toContainText(/saving|currency/i);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});

test('French VAT flagship is a native four-workflow parity port', async ({ page }) => {
  const observed = capture(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', 'dark');
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/fr/tools/calculateur-tva/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('#country option')).toHaveCount(55);
  await expect(page.locator('h1')).toContainText('taux de TVA');
  await expect(page.locator('#country option[value="NG"]')).toHaveText('Nigéria');
  await expect(page.locator('#country option[value="ZA"]')).toHaveText('Afrique du Sud');

  await page.locator('#country').selectOption('GW');
  await expect(page.locator('#presetTitle')).toContainText('nécessite un taux personnalisé');
  await expect(page.locator('#usePreset')).toBeHidden();
  await page.locator('#country').selectOption('NG');
  await page.locator('#usePreset').click();
  await expect(page.locator('#singleStatus')).toContainText('Taux de planification chargé');
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#singleVat')).toContainText('75,00');
  await expect(page.locator('#singleTotal')).toHaveText(/1.*075,00/);
  await expect(page.locator('#singleSource')).toContainText("l'administration");
  await page.locator('#shareCalculator').click();
  const shared = await page.evaluate(() => window.__sharedPayload);
  expect(shared.title).toContain('TVA panafricain');
  expect(shared.url).toMatch(/\/fr\/tools\/calculateur-tva\/$/);
  expect(JSON.stringify(shared)).not.toContain('1000');

  const singlePdf = await generatedPdf(page, 'singlePdf');
  expect(singlePdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(singlePdf.text).toContain('Calcul de TVA');
  expect(singlePdf.text).toContain('1 075,00');
  expect(singlePdf.text).toContain('Provenance du taux');

  await page.locator('#tab-invoice').click();
  const line = page.locator('.vat-line').first();
  await expect(line.locator('.line-treatment option').first()).toHaveText('Taxable au taux saisi');
  await line.locator('.line-desc').fill('Conseil');
  await line.locator('.line-amount').fill('1000');
  await line.locator('.line-rate').fill('15');
  await page.locator('#calculateInvoice').click();
  await expect(page.locator('#invoiceTotal')).toHaveText(/1.*150,00/);
  const invoicePdf = await generatedPdf(page, 'invoicePdf');
  expect(invoicePdf.text).toContain('projet de facture TVA');
  expect(invoicePdf.text).toContain('Conseil');
  expect(invoicePdf.text).toContain("fourni par l'utilisateur");

  await page.locator('#tab-withholding').click();
  await page.locator('#withholdingAmount').fill('1000');
  await page.locator('#withholdingVatRate').fill('20');
  await page.locator('#withholdingPercent').fill('25');
  await page.locator('#calculateWithholding').click();
  await expect(page.locator('#withholdingRetained')).toHaveText('50,00');
  await expect(page.locator('#withholdingSupplier')).toHaveText(/1.*150,00/);

  await page.locator('#tab-compare').click();
  await page.locator('#compareAmount').fill('1000');
  await page.locator('#scenarioRate1').fill('7.5');
  await page.locator('#scenarioRate2').fill('15');
  await page.locator('#scenarioRate3').fill('20');
  await page.locator('#calculateCompare').click();
  await expect(page.locator('#compareSpread')).toHaveText('12.50 points de pourcentage');
  await expect(page.locator('#compareMetrics')).toContainText('TVA 75,00');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /vat/i.test(key)))).toEqual([]);
  await page.screenshot({ path: 'test-results/vat-flagship-fr-375-dark.png', fullPage: true });
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});
