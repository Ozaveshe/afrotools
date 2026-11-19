const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const parsePdf = require('pdf-parse');

const buyer = '007-TEST-BUYER';
const routes = {
  en: '/tools/invoice-generator/',
  fr: '/fr/tools/generateur-factures/',
  sw: '/sw/zana/kizalishaji-ankara/',
  ha: '/ha/kayan-aiki/kirkiro-invoice/'
};

async function field(page, id) {
  const input = page.locator('#' + id);
  await input.evaluate(el => {
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
  });
  return input;
}

async function download(page, id) {
  const pending = page.waitForEvent('download');
  await (await field(page, id)).click();
  return fs.readFile(await (await pending).path());
}

for (const [locale, route] of Object.entries(routes)) {
  test(locale + ' preserves the buyer ID and due date on a ZAR invoice', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 844 });
    const leaks = [];
    page.on('request', req => {
      if ((req.url() + (req.postData() || '')).includes(buyer)) leaks.push(req.method());
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async text => { window.testShare = text; }
      } });
    });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    for (const [id, value] of Object.entries({
      companyName: 'Test seller', clientName: 'Test buyer', taxID: 'TEST-SELLER',
      recipientTaxId: buyer, invoiceDate: '2026-11-01', invoiceNumber: 'TEST-ZA-01'
    })) await (await field(page, id)).fill(value);
    await (await field(page, 'currency')).selectOption('ZAR');
    await (await field(page, 'paymentTerms')).selectOption('net-7');
    // Hausa uses a manually entered due date.
    if (locale === 'ha') await (await field(page, 'dueDate')).fill('2026-11-08');
    await page.locator('.li-desc').first().fill('Synthetic service');
    await page.locator('.li-price').first().fill('6000');
    await (await field(page, 'taxType')).selectOption('vat');
    await (await field(page, 'taxRate')).fill('15');
    await expect(page.locator('#pRecipientTaxId')).toContainText(buyer);
    await (await field(page, 'btnSaveInvoice')).click();
    await (await field(page, 'recipientTaxId')).fill('CHANGED');
    await page.locator('.invoice-saved-card').first().click();
    await expect(page.locator('#recipientTaxId')).toHaveValue(buyer);
    await (await field(page, 'invoiceReviewConfirm')).check();
    const state = JSON.parse(await download(page, 'btnExportJson'));
    expect(state).toMatchObject({ recipientTaxId: buyer, ti: 'TEST-SELLER', cu: 'ZAR', pt: 'net-7', dd: '2026-11-08' });
    const pdf = (await parsePdf(await download(page, 'btnPDF'))).text;
    for (const token of [buyer, state.ti, state.dd]) expect(pdf).toContain(token);
    await (await field(page, 'includeInvoiceDataInLink')).check();
    await (await field(page, 'invoiceReviewConfirm')).check();
    await (await field(page, 'btnShare')).click();
    await expect.poll(() => page.evaluate(() => Boolean(window.testShare))).toBe(true);
    const shared = new URL(await page.evaluate(() => window.testShare));
    expect(Buffer.from(shared.searchParams.get('invoice'), 'base64url').toString()).not.toContain(buyer);
    for (const backup of [{ ...state, recipientTaxId: undefined }, state]) {
      await page.locator('#importJsonInput').setInputFiles({
        name: 'synthetic.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))
      });
      await expect(page.locator('#recipientTaxId')).toHaveValue(backup.recipientTaxId || '');
      await expect(page.locator('#pRecipientTaxId')).toHaveText(backup.recipientTaxId ? new RegExp(buyer) : '');
      await expect(page.locator('#dueDate')).toHaveValue(state.dd);
    }
    expect(leaks).toEqual([]);
  });
}

test('Yoruba print preview omits a blank buyer ID', async ({ page }) => {
  await page.goto('/yo/awon-ise/kiriiro-invoice/', { waitUntil: 'domcontentloaded' });
  await page.locator('#recipientTaxId').fill(buyer);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#paper')).toContainText(buyer);
  await page.emulateMedia({ media: 'screen' });
  await page.locator('#recipientTaxId').fill('');
  await expect(page.locator('#paper')).not.toContainText(buyer);
});
