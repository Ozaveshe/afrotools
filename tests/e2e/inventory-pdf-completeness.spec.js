const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test.use({ trace: 'off', video: 'off', screenshot: 'off' });

const routes = [
  ['en', '/tools/inventory/'],
  ['fr', '/fr/tools/gestion-stocks/'],
  ['sw', '/sw/zana/kifuatiliaji-inventory/']
];

for (const [locale, route] of routes) {
  test(`${locale} inventory PDF retains all low-stock records and wrapped text`, async ({ page }, info) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.method());
    });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(route);
    const items = Array.from({ length: 35 }, (_, index) => ({
      id: `synthetic-${index}`,
      name: `SYNTHETIC_ROW_${String(index + 1).padStart(3, '0')} ${'longname '.repeat(9).trim()}`,
      sku: `TEST-${index}`, category: 'Synthetic', unitCost: 10, sellPrice: 15,
      quantity: 1, reorderPoint: 2, targetStock: 5
    }));
    await page.locator('#invImportMode').selectOption('replace');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#invImport').setInputFiles({
      name: 'synthetic-inventory.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 2, tool: 'inventory', displayUnit: 'USD', items }))
    });
    await expect(page.locator('#invBody tr')).toHaveCount(35);
    const labels = await page.evaluate(() => ['invQty', 'invReorder'].map(id =>
      document.getElementById(id).closest('label').textContent.trim()));
    const pending = page.waitForEvent('download');
    await page.locator('#invPdf').click();
    const download = await pending;
    const file = info.outputPath('synthetic-inventory.pdf');
    await download.saveAs(file);
    const pages = [];
    const pdf = await pdfParse(fs.readFileSync(file), {
      pagerender: async pdfPage => {
        const content = await pdfPage.getTextContent();
        pages.push({ view: pdfPage.view, items: content.items });
        return content.items.map(item => item.str).join(' ');
      }
    });
    const text = pdf.text.replace(/\s+/g, ' ');
    for (let index = 1; index <= 35; index++) {
      const marker = `SYNTHETIC_ROW_${String(index).padStart(3, '0')}`;
      expect(text.split(marker).length - 1).toBe(1);
    }
    for (const label of labels) expect(text).toContain(label);
    expect(pdf.numpages).toBeGreaterThan(1);
    const outside = pages.flatMap((pdfPage, index) => pdfPage.items
      .filter(item => item.str.trim() && (item.transform[4] < 36 || item.transform[5] < 36
        || item.transform[4] + item.width > pdfPage.view[2] - 36
        || item.transform[5] + item.height > pdfPage.view[3] - 30))
      .map(() => ({ page: index + 1 })));
    expect(outside).toEqual([]);
    expect(writes).toEqual([]);
  });
}
