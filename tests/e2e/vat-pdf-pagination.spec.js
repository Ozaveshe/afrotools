const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const routes = {
  en: '/tools/vat-calculator/',
  fr: '/fr/tools/calculateur-tva/',
  sw: '/sw/zana/kikokotoo-vat/'
};

for (const [locale, route] of Object.entries(routes)) {
  for (const scenario of ['many-rows', 'long-description']) {
    test(`${locale} VAT PDF keeps ${scenario} and totals inside page margins`, async ({ page }, info) => {
      const writes = [];
      page.on('request', request => {
        if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.method());
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#country option')).toHaveCount(55);
      await page.locator('#tab-invoice').click();
      const count = scenario === 'many-rows' ? 35 : 1;
      for (let index = 0; index < count; index++) {
        if (index) await page.locator('#addInvoiceLine').click();
        const row = page.locator('.vat-line').nth(index);
        const description = scenario === 'many-rows'
          ? `SYNTHETIC_ROW_${String(index + 1).padStart(2, '0')}`
          : `SYNTHETIC_START ${'description '.repeat(700)}SYNTHETIC_END`;
        await row.locator('.line-desc').fill(description);
        await row.locator('.line-amount').fill('100');
        await row.locator('.line-rate').fill('10');
      }
      await page.locator('#calculateInvoice').click();
      const displayedTotal = (await page.locator('#invoiceTotal').innerText()).replace(/[\u00a0\u202f]/g, ' ');
      const pendingDownload = page.waitForEvent('download');
      await page.locator('#invoicePdf').click();
      const download = await pendingDownload;
      const file = info.outputPath('synthetic-vat-invoice.pdf');
      await download.saveAs(file);
      const bytes = fs.readFileSync(file);
      const pages = [];
      const parsed = await pdfParse(bytes, {
        pagerender: async pdfPage => {
          const content = await pdfPage.getTextContent();
          pages.push({
            view: pdfPage.view,
            items: content.items.map(item => ({
              text: item.str, x: item.transform[4], y: item.transform[5],
              width: item.width, height: item.height
            }))
          });
          return content.items.map(item => item.str).join(' ');
        }
      });
      // Include the full nominal font height within a half-inch printable margin.
      // The existing 18pt heading has a higher top edge than the body text.
      const minimumMargin = 36;
      const escapedText = pages.flatMap((pdfPage, pageIndex) => pdfPage.items
        .filter(item => item.text.trim() && (item.x < minimumMargin || item.y < minimumMargin
          || item.x + item.width > pdfPage.view[2] - minimumMargin
          || item.y + item.height > pdfPage.view[3] - minimumMargin))
        .map(item => ({ page: pageIndex + 1, x: item.x, y: item.y, width: item.width, height: item.height })));
      expect(escapedText, 'Every text item must stay inside the printable page').toEqual([]);
      expect(parsed.numpages).toBeGreaterThan(1);
      expect(parsed.text).toContain(displayedTotal);
      if (scenario === 'many-rows') {
        expect(parsed.numpages).toBe(2);
        for (let index = 1; index <= 35; index++) {
          expect(parsed.text.match(new RegExp(`SYNTHETIC_ROW_${String(index).padStart(2, '0')}`, 'g'))).toHaveLength(1);
        }
      } else {
        expect(parsed.text).toContain('SYNTHETIC_START');
        expect(parsed.text).toContain('SYNTHETIC_END');
        expect(parsed.text.match(/description/g)).toHaveLength(700);
      }
      expect(writes).toEqual([]);
    });
  }
}
