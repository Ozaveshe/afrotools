const { test, expect } = require('@playwright/test');

const routes = {
  en: '/tools/invoice-generator/',
  fr: '/fr/tools/generateur-factures/',
  sw: '/sw/zana/kizalishaji-ankara/',
  ha: '/ha/kayan-aiki/kirkiro-invoice/'
};

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale}: JSON restore keeps attributes inert and preserves zero quantity`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(route);
    await page.waitForFunction(() => window.AfroInvoiceState && window.AfroInvoiceState.gatherState);
    const initial = await page.evaluate(() => window.AfroInvoiceState.gatherState());
    const probe = '0" data-import-probe="yes"><img data-import-probe>';
    for (const field of ['d', 'q', 'p', 't']) {
      const item = { d: 'Synthetic "quoted" & literal <text>', q: '2', p: '12.34', t: '5' };
      item[field] = probe;
      const state = { ...initial, cl: `Synthetic restore ${field}`, items: [item] };
      await page.locator('#importJsonInput').setInputFiles({
        name: 'synthetic-invoice.json', mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(state))
      });
      await expect(page.locator('#clientName')).toHaveValue(state.cl);
      await expect(page.locator('[data-import-probe]')).toHaveCount(0);
      await expect(page.locator('#lineItemsBody img')).toHaveCount(0);
      await expect(page.locator('.li-desc').first()).toHaveValue(item.d);
    }
    await page.locator('#importJsonInput').setInputFiles({
      name: 'synthetic-zero.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ ...initial, cl: 'Synthetic zero', items: [{ d: 'Zero quantity', q: 0, p: 12.34, t: 0 }] }))
    });
    await expect(page.locator('#clientName')).toHaveValue('Synthetic zero');
    await expect(page.locator('.li-qty').first()).toHaveValue('0');
    await expect(page.locator('.li-price').first()).toHaveValue('12.34');
    expect(await page.evaluate(() => window.AfroInvoiceState.gatherState().items[0].q)).toBe('0');
    expect(errors).toEqual([]);
  });
}
