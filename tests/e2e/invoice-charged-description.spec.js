const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const routes = { en: '/tools/invoice-generator/', fr: '/fr/tools/generateur-factures/', sw: '/sw/zana/kizalishaji-ankara/' };
const guidance = {
  en: 'Add a description to every charged line before downloading or printing the invoice.',
  fr: 'Ajoutez une description à chaque ligne facturée avant de télécharger ou d’imprimer la facture.',
  sw: 'Ongeza maelezo kwa kila kipengee chenye kiasi kabla ya kupakua au kuchapisha ankara.'
};
test.use({ trace: 'off', screenshot: 'off', video: 'off', storageState: { cookies: [], origins: [] } });
async function reveal(page, id) {
  const control = page.locator('#' + id);
  for (const detail of await control.locator('xpath=ancestor::details').all()) {
    if (await detail.getAttribute('open') === null) await detail.locator('summary').first().click();
  }
  return control;
}
for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} charged rows require descriptions before PDF and print`, async ({ page, baseURL }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const origin = new URL(baseURL).origin;
    // Serve actual application source; only external traffic is blocked.
    await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
    await page.addInitScript(() => { window.__invoicePrints = 0; window.print = () => window.__invoicePrints++; });
    await page.goto(route);
    const decline = page.locator('#afro-cc-decline');
    if (await decline.isVisible()) await decline.click();
    await page.locator('#companyName').fill('Synthetic seller');
    await page.locator('#clientName').fill('Synthetic buyer');
    await page.locator('#currency').selectOption('USD');
    await (await reveal(page, 'taxType')).selectOption('vat');
    await page.locator('#taxRate').fill('20');
    await page.locator('#discountPercent').fill('10');
    await page.locator('.li-desc').first().fill('Visible service');
    await page.locator('.li-qty').first().fill('1');
    await page.locator('.li-price').first().fill('100');
    await page.locator('#btnAddItem').click();
    await page.locator('.li-price').last().fill('50');
    // Literal oracle: 100+50=150; 10% discount=15; 20% of135=27; total162.
    await expect(page.locator('#sumTotal')).toContainText('162.00');
    await expect(page.locator('#invoiceLineDescriptionError')).toHaveText(guidance[locale]);
    await expect(page.locator('.li-desc').last()).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#invoiceReviewConfirm').check();
    let downloads = 0;
    page.on('download', () => downloads++);
    await page.locator('#btnPDF').click();
    await expect(page.locator('.li-desc').last()).toBeFocused();
    expect(downloads).toBe(0);
    await (await reveal(page, 'btnPrint')).click();
    expect(await page.evaluate(() => window.__invoicePrints)).toBe(0);
    await page.locator('.li-desc').last().fill('Réconciliation données');
    await expect(page.locator('#invoiceLineDescriptionError')).toBeHidden();
    await expect(page.locator('.li-desc').last()).toHaveAttribute('aria-invalid', 'false');
    await page.locator('#invoiceReviewConfirm').check();
    const pending = page.waitForEvent('download');
    await page.locator('#btnPDF').click();
    const download = await pending;
    const output = testInfo.outputPath(`${locale}-charged-invoice.pdf`);
    await download.saveAs(output);
    const text = (await pdfParse(new Uint8Array(fs.readFileSync(output)))).text;
    for (const value of ['Visible service', 'Réconciliation données', '150.00', '15.00', '27.00', '162.00']) expect(text).toContain(value);
    await (await reveal(page, 'btnPrint')).click();
    expect(await page.evaluate(() => window.__invoicePrints)).toBe(1);
  });
}
