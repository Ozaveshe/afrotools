const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

function capture(page) {
  const errors = [];
  const writes = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    requests.push(request.url());
    if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.method() + ' ' + request.url());
  });
  return { errors, writes, requests };
}

async function generatedPdf(page, buttonId) {
  const output = await page.evaluate(async (id) => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve({ bytes: Array.from(new Uint8Array(await event.detail.blob.arrayBuffer())), name: event.detail.fileName });
    }, { once: true }));
    document.getElementById(id).click();
    return generated;
  }, buttonId);
  const buffer = Buffer.from(output.bytes);
  return { buffer, name: output.name, text: (await pdfParse(buffer)).text };
}

test('Swahili VAT flagship delivers four native, local-only workflows at 375px dark', async ({ page }) => {
  const observed = capture(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', 'dark');
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/sw/zana/kikokotoo-vat/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('h1')).toContainText('kiwango cha VAT');
  await expect(page.locator('#country option')).toHaveCount(55);
  await expect(page.locator('#country option[value="ZA"]')).toHaveText('Afrika Kusini');
  await expect(page.locator('#country option[value="EG"]')).toHaveText('Misri');

  const unlabeled = await page.locator('input,select,button').evaluateAll((elements) => elements.filter((element) => {
    if (element.type === 'hidden' || element.getClientRects().length === 0) return false;
    return !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.textContent.trim() && !document.querySelector(`label[for="${element.id}"]`);
  }).map((element) => element.id || element.outerHTML.slice(0, 80)));
  expect(unlabeled).toEqual([]);
  await page.locator('#tab-single').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-invoice')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.locator('#tab-single')).toHaveAttribute('aria-selected', 'true');

  await page.locator('#country').selectOption('GW');
  await expect(page.locator('#presetTitle')).toContainText('inahitaji kiwango chako');
  await expect(page.locator('#usePreset')).toBeHidden();
  await page.locator('#country').selectOption('NG');
  await page.locator('#usePreset').click();
  await expect(page.locator('#singleStatus')).toContainText('Kiwango cha mipango kimewekwa');
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#singleNet')).toHaveText('1,000.00');
  await expect(page.locator('#singleVat')).toHaveText('75.00');
  await expect(page.locator('#singleTotal')).toHaveText('1,075.00');
  await expect(page.locator('#singleSource')).toContainText('kiungo cha mamlaka');

  await page.locator('#shareCalculator').click();
  const shared = await page.evaluate(() => window.__sharedPayload);
  expect(shared.title).toContain('Mipango ya VAT Afrika');
  expect(shared.url).toMatch(/\/sw\/zana\/kikokotoo-vat\/$/);
  expect(JSON.stringify(shared)).not.toContain('1000');
  expect(JSON.stringify(shared)).not.toContain('1075');

  const singlePdf = await generatedPdf(page, 'singlePdf');
  expect(singlePdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(singlePdf.buffer.length).toBeGreaterThan(1000);
  expect(singlePdf.name).toBe('afrotools-hesabu-ya-vat.pdf');
  expect(singlePdf.text).toContain('Hesabu ya Mipango ya VAT');
  expect(singlePdf.text).toContain('Kiasi kabla ya VAT');
  expect(singlePdf.text).toContain('1,075.00');
  expect(singlePdf.text).toContain('Chanzo cha kiwango na mipaka');

  await page.locator('#tab-invoice').click();
  const firstLine = page.locator('.vat-line').first();
  await expect(firstLine.locator('.line-treatment option').first()).toHaveText('Inatozwa kwa kiwango kilichowekwa');
  await firstLine.locator('.line-desc').fill('Ushauri');
  await firstLine.locator('.line-amount').fill('1000');
  await firstLine.locator('.line-rate').fill('15');
  await page.locator('#addInvoiceLine').click();
  const secondLine = page.locator('.vat-line').nth(1);
  await secondLine.locator('.line-desc').fill('Bidhaa yenye msamaha');
  await secondLine.locator('.line-amount').fill('500');
  await secondLine.locator('.line-treatment').selectOption('exempt');
  await expect(secondLine.locator('.line-rate')).toBeDisabled();
  await page.locator('#calculateInvoice').click();
  await expect(page.locator('#invoiceSubtotal')).toHaveText('1,500.00');
  await expect(page.locator('#invoiceVat')).toHaveText('150.00');
  await expect(page.locator('#invoiceTotal')).toHaveText('1,650.00');
  const invoicePdf = await generatedPdf(page, 'invoicePdf');
  expect(invoicePdf.name).toBe('afrotools-mpango-wa-ankara-vat.pdf');
  expect(invoicePdf.text).toContain('Muhtasari wa Mpango wa Ankara ya VAT');
  expect(invoicePdf.text).toContain('Ushauri');
  expect(invoicePdf.text).toContain('imewekwa na mtumiaji');

  await page.locator('#tab-withholding').click();
  await page.locator('#withholdingAmount').fill('1000');
  await page.locator('#withholdingVatRate').fill('20');
  await page.locator('#withholdingPercent').fill('25');
  await page.locator('#calculateWithholding').click();
  await expect(page.locator('#withholdingVat')).toHaveText('200.00');
  await expect(page.locator('#withholdingRetained')).toHaveText('50.00');
  await expect(page.locator('#withholdingRemaining')).toHaveText('150.00');
  await expect(page.locator('#withholdingSupplier')).toHaveText('1,150.00');

  await page.locator('#tab-compare').click();
  await page.locator('#compareAmount').fill('1000');
  await page.locator('#scenarioRate1').fill('7.5');
  await page.locator('#scenarioRate2').fill('15');
  await page.locator('#scenarioRate3').fill('20');
  await page.locator('#calculateCompare').click();
  await expect(page.locator('#compareSpread')).toHaveText('pointi 12.50 za asilimia');
  await expect(page.locator('#compareMetrics')).toContainText('VAT 75.00');
  await expect(page.locator('#compareMetrics')).not.toContainText(/akiba|sarafu/i);

  const darkColors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    workspace: getComputedStyle(document.querySelector('.vat-workspace')).backgroundColor,
    input: getComputedStyle(document.querySelector('.vat-input')).backgroundColor,
    motion: matchMedia('(prefers-reduced-motion: reduce)').matches
  }));
  expect(darkColors.motion).toBe(true);
  for (const color of [darkColors.body, darkColors.workspace, darkColors.input]) {
    const channels = color.match(/\d+/g).slice(0, 3).map(Number);
    expect(channels.reduce((sum, channel) => sum + channel, 0)).toBeLessThan(180);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /vat|amount|invoice/i.test(key)))).toEqual([]);
  expect(page.url()).not.toContain('1000');
  expect(observed.requests.filter((url) => /ai|email/i.test(new URL(url).pathname))).toEqual([]);
  expect(observed.requests.some((url) => /1000|1075|1650/.test(url))).toBe(false);
  await page.screenshot({ path: 'test-results/vat-flagship-sw-375-dark.png', fullPage: true });
  expect(observed.writes).toEqual([]);
  expect(observed.errors).toEqual([]);
});
