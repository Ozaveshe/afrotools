const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const routes = [
  ['/tools/inventory/', 'Inventory calculator and tracker', 'Add product'],
  ['/fr/tools/gestion-stocks/', 'Calculateur d’inventaire et suivi des stocks', 'Ajouter un produit'],
  ['/sw/zana/kifuatiliaji-inventory/', 'Kikokotoo cha inventory na ufuatiliaji wa stock', 'Ongeza bidhaa']
];

for (const [route, heading, add] of routes) {
  test(`${route} is native, safe, responsive and keyboard accessible`, async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('afrotools_cookie_consent', 'accepted'); });
    await page.goto(route);
    const skip = page.locator('.skip-link'); expect((await skip.boundingBox()).y).toBeLessThan(0);
    await page.keyboard.press('Tab'); await expect(skip).toBeFocused(); await expect(skip).toBeInViewport(); await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await page.getByRole('button', { name: add }).click();
    await page.locator('#invName').fill('<b id="probe">Soap</b>');
    await page.locator('#invSku').fill('=FORMULA');
    await page.locator('#invCost').fill('12'); await page.locator('#invSell').fill('8'); await page.locator('#invQty').fill('2.5'); await page.locator('#invReorder').fill('2.5'); await page.locator('#invTarget').fill('10');
    await page.locator('#invForm button[type=submit]').click();
    expect(await page.locator('#probe').count()).toBe(0);
    await expect(page.locator('#invBody')).toContainText('<b id="probe">Soap</b>');
    await expect(page.locator('#invMetrics')).toContainText('-10');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('button', { name: new RegExp(add) }).click(); await page.keyboard.press('Escape'); await expect(page.locator('#invModal')).not.toHaveClass(/open/);
    await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('migration, strict import and local exports keep exact contracts', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear(); localStorage.setItem('afrotools_cookie_consent', 'accepted');
    localStorage.setItem('afro_inventory', JSON.stringify([{ name: 'Legacy', cost: 10, sell: 15, stock: 4, minStock: 4 }]));
    localStorage.setItem('sw-sme-inventory-v1', JSON.stringify([{ name: 'Legacy', cost: 10, sell: 15, qty: 4, low: 4 }]));
  });
  await page.goto('/tools/inventory/');
  await expect(page.locator('#invStatus')).toContainText('1 legacy records');
  expect(await page.evaluate(() => localStorage.getItem('afro_inventory') !== null && localStorage.getItem('sw-sme-inventory-v1') !== null)).toBe(true);
  const csvEvent = page.waitForEvent('download'); await page.locator('#invCsv').click(); const csvStream = await (await csvEvent).createReadStream(); let csv = ''; for await (const chunk of csvStream) csv += chunk;
  expect(csv).toContain('"Stock cost value"');
  const pdfEvent = page.waitForEvent('download'); await page.locator('#invPdf').click(); const pdfStream = await (await pdfEvent).createReadStream(); const chunks = []; for await (const chunk of pdfStream) chunks.push(chunk); const parsed = await pdfParse(Buffer.concat(chunks));
  expect(parsed.text).toContain('Stock cost value = sum(unit cost x quantity on hand)');
  expect(parsed.text).toContain('This is not COGS');
});
