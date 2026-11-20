const { test, expect } = require('@playwright/test');

const nativeInvoice = '/yo/awon-ise/kiriiro-invoice/';
for (const route of ['/yo/', '/yo/awon-ise/']) {
  test('Yoruba invoice link works without JavaScript on ' + route, async ({ browser, baseURL }) => {
    const page = await browser.newPage({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const link = page.getByRole('navigation', { name: 'Iṣẹ́ ìwé owó' })
        .getByRole('link', { name: 'Ṣẹ̀dá ìwé owó ní Yorùbá' });
      await expect(link).toHaveAttribute('href', nativeInvoice);
      await link.click();
      await expect(page).toHaveURL(new URL(nativeInvoice, baseURL).href);
      await expect(page.locator('html')).toHaveAttribute('lang', 'yo');
    } finally {
      await page.close();
    }
  });
}
