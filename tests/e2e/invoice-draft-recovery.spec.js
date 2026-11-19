const { test, expect } = require('@playwright/test');

const routes = {
  en: '/tools/invoice-generator/',
  fr: '/fr/tools/generateur-factures/',
  sw: '/sw/zana/kizalishaji-ankara/'
};
async function fill(page, id, text) {
  const field = page.locator('#' + id);
  await field.evaluate(el => {
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
  });
  await field.fill(text);
}
async function verify(page, name, taxId) {
  await expect(page.locator('#clientName')).toHaveValue(name);
  await expect(page.locator('#recipientTaxId')).toHaveValue(taxId);
}

for (const [locale, route] of Object.entries(routes)) {
  test(locale + ' signed-out drafts survive refresh, reopen and an inactive invoice tab', async ({ page, context }) => {
    test.setTimeout(120000);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await fill(page, 'invoiceNumber', 'TEST-A');
    await fill(page, 'clientName', 'Synthetic buyer A');
    await fill(page, 'recipientTaxId', '0001-A');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await verify(page, 'Synthetic buyer A', '0001-A');
    await page.locator('#btnSaveInvoice').click();
    const stale = await context.newPage();
    await stale.goto(route, { waitUntil: 'domcontentloaded' });
    await verify(stale, 'Synthetic buyer A', '0001-A');
    await fill(page, 'invoiceNumber', 'TEST-B');
    await fill(page, 'clientName', 'Synthetic buyer B');
    await fill(page, 'recipientTaxId', '0002-B');
    await page.locator('#btnSaveInvoice').click();
    await page.goto('about:blank');
    await stale.goto('about:blank');
    const reopened = await context.newPage();
    await reopened.goto(route, { waitUntil: 'domcontentloaded' });
    await verify(reopened, 'Synthetic buyer B', '0002-B');
    for (const [name, tax] of [['Synthetic buyer A', '0001-A'], ['Synthetic buyer B', '0002-B']]) {
      await reopened.locator('.invoice-saved-card').filter({ hasText: name }).click();
      await verify(reopened, name, tax);
    }
    await reopened.goto('about:blank');
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const draft = JSON.parse(localStorage.getItem('afro_invoice_draft'));
      delete draft.state.recipientTaxId;
      localStorage.setItem('afro_invoice_draft', JSON.stringify(draft));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await verify(page, 'Synthetic buyer B', '');
  });
}
