const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdf = require('pdf-parse');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const routes = [
  ['en', '/tools/job-offer-evaluator/', 'Currency / unit:', 'no recommendation is made'],
  ['fr', '/fr/tools/evaluateur-offre-emploi/', 'Devise / unité :', 'aucune recommandation'],
  ['sw', '/sw/zana/tathmini-ya-ofa-ya-kazi/', 'Sarafu / kitengo:', 'hakuna pendekezo']
];
for (const [locale, route, unitLabel, method] of routes) {
  test(`${locale} PDF wraps long offer names and uses localized explanations`, async ({ page }, info) => {
    await page.goto(route);
    await page.locator('[name=currency]').fill('TESTUNIT');
    const offers = page.locator('[data-offer]');
    const label = 'W'.repeat(80);
    await offers.nth(0).locator('[name=label]').fill(label);
    await offers.nth(1).locator('[name=label]').fill('Synthetic second offer');
    for (const box of [offers.nth(0), offers.nth(1)]) {
      await box.locator('[name=monthlyPay]').fill('99999999');
      for (const name of ['roleFit', 'learning', 'flexibility', 'stability', 'team']) await box.locator(`[name=${name}]`).fill('7');
    }
    await page.locator('#joe-calc').click();
    const pending = page.waitForEvent('download');
    await page.locator('#joe-pdf').click();
    const download = await pending;
    const file = info.outputPath('synthetic-offers.pdf');
    await download.saveAs(file);
    const outside = [];
    const parsed = await pdf(fs.readFileSync(file), { pagerender: async pdfPage => {
      const content = await pdfPage.getTextContent();
      const viewport = pdfPage.getViewport(1);
      for (const item of content.items) {
        if (!item.str.trim()) continue;
        const x = item.transform[4], y = item.transform[5];
        if (x < 35 || x + item.width > viewport.width - 35 || y < 30 || y > viewport.height - 25) outside.push({ page: pdfPage.pageNumber, x, y, width: item.width });
      }
      return content.items.map(item => item.str).join('\n');
    } });
    fs.writeFileSync(info.outputPath('pdf-bounds.json'), JSON.stringify({ locale, pages: parsed.numpages, outside }, null, 2));
    expect(outside).toEqual([]);
    expect(parsed.text.replace(/\s/g, '')).toContain(label);
    expect(parsed.text).toContain(unitLabel);
    expect(parsed.text.toLowerCase().replace(/\s+/g, ' ')).toContain(method);
  });
}
