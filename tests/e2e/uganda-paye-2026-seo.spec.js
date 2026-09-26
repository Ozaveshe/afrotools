const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');

test.use({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
test('English Uganda PAYE table matches the current resident calculation', async ({ page }) => {
  await page.goto('/uganda/ug-paye');
  const bands = await page.locator('.ng-bands-table tbody tr').evaluateAll(rows =>
    rows.map(row => Array.from(row.cells, cell => cell.textContent.trim()).join(' '))
  );
  expect(bands).toEqual([
    '0 – 335,000 Nil',
    '335,001 – 410,000 20% of excess over 335,000',
    '410,001 – 485,000 15,000 + 25% of excess over 410,000',
    '485,001 – 10,000,000 33,750 + 30% of excess over 485,000',
    'Over 10,000,000 33,750 + 30% of excess over 485,000 + 10% of excess over 10,000,000'
  ]);
});
for (const route of ['/uganda/ug-paye', '/fr/uganda/ug-paye', '/sw/uganda/kikokotoo-kodi-mshahara/']) {
  test(`${route} revised PAYE and payroll parity`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('request', request => {
      if (['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname) &&
          !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(request.method() + ' ' + request.url());
      }
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await page.locator('#grossSalary').fill('500000');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toContainText(/436[\s,.]?750/);
    await page.locator('[data-tog="nonres"]').click();
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toContainText(/399[\s,.]?500/);
    const resident = page.locator('[data-tog="resident"]');
    if (await resident.count() && await resident.evaluate(element => element.tagName === 'BUTTON')) {
      await page.locator('[data-tog="resident"]').click();
    } else {
      await page.locator('[data-tog="nonres"]').click();
    }
    await page.locator('[data-tog="lst"]').click();
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toContainText(/415[\s,.]?000/);
    expect(await page.evaluate(() => ({ tax: RESULT.annualTax, net: RESULT.annualNet })))
      .toEqual({ tax: 450750, net: 5219250 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    if (!route.startsWith('/sw/')) {
      const downloaded = page.waitForEvent('download');
      await page.locator('.act-pdf').click();
      const download = await downloaded;
      const parsed = await pdfParse(fs.readFileSync(await download.path()));
      expect(parsed.text.replace(/[\s,]/g, '')).toContain('415000');
      expect(parsed.text.replace(/[\s,]/g, '')).toContain('5219250');
    } else {
      const opened = page.waitForEvent('popup');
      await page.locator('.act-pdf').click();
      const popup = await opened;
      await expect(popup.locator('body')).toContainText(/415[\s,.]?000/);
      await expect(popup.locator('body')).toContainText('1 Julai 2026');
      await popup.close();
    }
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
