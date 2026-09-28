const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function download(page, name) {
  const [artifact] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name, exact: true }).click()]);
  return fs.readFileSync(await artifact.path(), 'utf8').replace(/^\uFEFF/, '');
}

for (const scenario of [
  { name: 'aggregate with contingency and VAT', subtotal: '250000', contingency: '10', vat: '16', grand: 319000 },
  { name: 'zero subtotal', subtotal: '0', contingency: '10', vat: '16', grand: 0 }
]) {
  test(`Swahili BOQ landing to native app preserves ${scenario.name}`, async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
    await page.setViewportSize({ width: 320, height: 820 });
    await page.goto('/sw/zana/mjenzi-boq/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/mjenzi-boq/');
    await expect(page.getByLabel('Jumla ndogo ya vipengele', { exact: true })).toBeVisible();
    await expect(page.getByLabel('VAT au kodi (%)', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Sarafu', { exact: true })).toBeVisible();
    await page.locator('[name="subtotal"]').fill(scenario.subtotal);
    await page.locator('[name="contingency"]').fill(scenario.contingency);
    await page.locator('[name="vat"]').fill(scenario.vat);
    await page.locator('[name="currency"]').fill('KES');
    await page.getByRole('button', { name: 'Kokotoa makadirio', exact: true }).click();
    const summary = page.locator('[data-sw-build-result]');
    await expect(summary).toContainText(`Jumla ya upangaji: KES ${scenario.grand.toLocaleString('en-US')}`);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const cta = page.getByRole('link', { name: 'Fungua programu kamili ya BOQ kwa Kiswahili', exact: true });
    await expect(cta).toHaveAttribute('href', '/sw/zana/orodha-vifaa/');
    await cta.click();
    await page.waitForURL('**/sw/zana/orodha-vifaa/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/orodha-vifaa/');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Futa yote', exact: true }).click();
    await page.getByRole('button', { name: '+ Ongeza Kipengele', exact: true }).click();
    await page.getByLabel('Elezea kipengele', { exact: true }).fill('Jumla ya majaribio');
    await page.getByLabel('Kiasi cha kipengele', { exact: true }).fill('1');
    await page.locator('#boqBody [data-field="price"]').fill(scenario.subtotal);
    await page.locator('#projectCurrency').selectOption('KES');
    await page.locator('#contingencyRate').fill(scenario.contingency);
    await page.locator('#vatRate').fill(scenario.vat);
    await page.locator('#markupRate').fill('0');
    await page.locator('#markupRate').press('Tab');
    await expect(page.locator('#grandTotal')).toHaveText(`KES ${scenario.grand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const json = JSON.parse(await download(page, 'Pakua JSON'));
    expect(json.currency).toBe('KES');
    expect(json.items.filter(item => item.type === 'item')).toHaveLength(1);
    expect(json.totals).toMatchObject({ subtotal: Number(scenario.subtotal), markup: 0, grand: scenario.grand });
    const csv = await download(page, 'Pakua CSV');
    expect(csv).toContain('#,Kipengele,Kiasi,Kipimo,Bei ya Kitengo,Jumla');
    expect(csv).toContain(`"Jumla kuu (KES)",${scenario.grand.toFixed(2)}`);
    expect(csv).toContain('Jumla ya majaribio');
    expect(errors).toEqual([]);
  });
}
