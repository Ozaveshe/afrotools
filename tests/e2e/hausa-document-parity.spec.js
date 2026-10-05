const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

// This suite exercises the first-visit consent controls, including decline.
// Do not inherit the optional global pre-declined analytics fixture.
test.use({ storageState: { cookies: [], origins: [] } });

async function reveal(page, id) {
  const control = page.locator('#' + id);
  for (const parent of await control.locator('xpath=ancestor::details').all()) {
    if (await parent.getAttribute('open') === null) await parent.locator('summary').first().click();
  }
  return control;
}

test('Hausa CV preserves exact text in preview and TXT and validates required fields', async ({ page }) => {
  const errors = [], sent = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if ((request.postData() || '').includes('Ɗanladi')) sent.push(request.url()); });
  await page.goto('/ha/kayan-aiki/gina-cv/');
  await page.locator('#name').fill('Ɗanladi Ƙwarai');
  await page.locator('#skills').fill('<img src=x onerror="window.__injected=true"> Kula da bayanai');
  await page.getByRole('button', { name: 'Gina daftarin CV' }).click();
  await expect(page.locator('#cvResult strong')).toHaveText('Ɗanladi Ƙwarai');
  await expect(page.locator('#cvResult')).toContainText('<img src=x');
  await expect(page.locator('#cvResult img')).toHaveCount(0);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sauke takaitaccen CV na TXT' }).click();
  const file = await pending;
  const text = fs.readFileSync(await file.path(), 'utf8');
  expect(text).toContain('Suna: Ɗanladi Ƙwarai');
  expect(text).not.toContain('undefined');
  await page.locator('#name').fill('');
  await page.getByRole('button', { name: 'Gina daftarin CV' }).click();
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('#cvResult')).toHaveText('Saka sunanka kafin gina daftarin CV.');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
  expect(sent).toEqual([]);
});

test('Hausa invoice keeps tax, requires review, shares by consent and exports Unicode locally', async ({ page }) => {
  test.setTimeout(90000);
  const errors = [], leaks = [], downloads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('download', file => downloads.push(file));
  page.on('request', request => {
    if (/HA-PRIVATE-42/.test(request.url() + (request.postData() || ''))) leaks.push(request.url());
  });
  await page.addInitScript(() => {
    window.__copies = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => window.__copies.push(value) } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ha/kayan-aiki/kirkiro-invoice/');
  // The fixed PDF action must not hide the equally available consent refusal.
  await page.locator('#afro-cc-decline').click();
  await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
  await page.locator('#companyName').fill('Ƙungiyar Gwaji HA-PRIVATE-42');
  await page.locator('#clientName').fill('Ɗanladi Ƙwarai');
  await (await reveal(page, 'businessAddress')).fill('<img src=x onerror="window.__injected=true">');
  await expect(page.locator('#pBizDetail')).toContainText('<img src=x');
  await expect(page.locator('#pBizDetail img')).toHaveCount(0);
  await page.locator('#businessAddress').fill('Adireshin gwaji');
  await page.locator('.li-desc').first().fill('Ƙwarewar gwaji');
  await page.locator('.li-qty').first().fill('3');
  await page.locator('.li-price').first().fill('19.99');
  await (await reveal(page, 'taxRate')).fill('9');
  await page.locator('#currency').selectOption('KES');
  await expect(page.locator('#taxRate')).toHaveValue('9');
  await expect(page.locator('.li-price').first()).toHaveValue('19.99');
  await page.locator('#discountPercent').fill('10');
  await page.locator('#taxRate').fill('7.5');
  await (await reveal(page, 'amountPaid')).fill('10');
  await (await reveal(page, 'withholdingPercent')).fill('5');
  await (await reveal(page, 'bankDetails')).fill('Umarnin gwaji HA-PRIVATE-42');
  await expect(page.locator('#sumBalance')).toContainText('45.32');
  await expect(page.locator('#previewStatus')).toHaveText('An biya wani ɓangare');
  await page.locator('#btnPDF').click();
  await expect(page.locator('#invoiceReviewConfirm')).toBeFocused();
  expect(downloads).toHaveLength(0);
  await page.locator('#invoiceReviewConfirm').check();
  await page.locator('.li-desc').first().fill('Ƙwarewar gwaji da aka duba');
  await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
  await page.locator('#invoiceReviewConfirm').check();
  const jsonPending = page.waitForEvent('download');
  await (await reveal(page, 'btnExportJson')).click();
  const json = fs.readFileSync(await (await jsonPending).path());
  expect(JSON.parse(json.toString('utf8'))).toMatchObject({ cu: 'KES', ap: '10', wh: '5' });
  await page.locator('#clientName').fill('Changed');
  await page.locator('#importJsonInput').setInputFiles({ name: 'synthetic.json', mimeType: 'application/json', buffer: json });
  await expect(page.locator('#clientName')).toHaveValue('Ɗanladi Ƙwarai');
  await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
  await page.locator('#invoiceReviewConfirm').check();
  const pdfPending = page.waitForEvent('download');
  await page.locator('#btnPDF').click();
  const pdf = await pdfPending;
  const text = (await pdfParse(fs.readFileSync(await pdf.path()))).text;
  for (const value of ['Ɗanladi Ƙwarai', 'Ƙwarewar gwaji da aka duba', 'TAKARDAR KUƊI', 'Ragowar biya', 'KES 45.32']) expect(text).toContain(value);
  await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
  await page.locator('#btnShare').click();
  await expect.poll(() => page.evaluate(() => window.__copies.length)).toBe(1);
  expect(new URL(await page.evaluate(() => window.__copies[0])).search).toBe('');
  await page.locator('#includeInvoiceDataInLink').check();
  await page.locator('#btnShare').click();
  await expect.poll(() => page.evaluate(() => window.__copies.length)).toBe(2);
  const url = new URL(await page.evaluate(() => window.__copies[1]));
  expect(JSON.parse(Buffer.from(url.searchParams.get('invoice'), 'base64url').toString('utf8'))).toMatchObject({ cl: 'Ɗanladi Ƙwarai' });
  await page.locator('#btnSaveInvoice').click();
  await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
  await page.locator('.invoice-saved-card').click();
  await expect(page.locator('#clientName')).toHaveValue('Ɗanladi Ƙwarai');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
  expect(leaks).toEqual([]);
});
