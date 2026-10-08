const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', video: 'off', screenshot: 'off' });

const routes = [
  { locale: 'en', route: '/tools/inventory/', json: 'Backup is not valid JSON.', version: 'version 2', record: 'Record 2:', number: 'finite non-negative number', required: 'Product name is required.' },
  { locale: 'fr', route: '/fr/tools/gestion-stocks/', json: 'La sauvegarde n’est pas un fichier JSON valide.', version: 'version 2', record: 'Enregistrement 2 :', number: 'nombre fini supérieur ou égal à zéro', required: 'Le nom du produit est obligatoire.' },
  { locale: 'sw', route: '/sw/zana/kifuatiliaji-inventory/', json: 'Faili la akiba si JSON halali.', version: 'toleo la 2', record: 'Rekodi 2:', number: 'namba halali isiyo hasi', required: 'Jina la bidhaa linahitajika.' }
];

for (const entry of routes) {
  test(`${entry.locale} inventory errors preserve localized record and field diagnostics`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto(entry.route);
    const status = page.locator('#invStatus');
    async function upload(text) {
      await page.locator('#invImport').setInputFiles({
        name: 'synthetic-invalid.json', mimeType: 'application/json', buffer: Buffer.from(text)
      });
    }
    await upload('{invalid');
    await expect(status).toHaveText(entry.json);
    await expect(status).toHaveAttribute('data-tone', 'error');
    await upload('{}');
    await expect(status).toContainText(entry.version);
    const good = { name: 'Synthetic', unitCost: 1, sellPrice: 2, quantity: 1, reorderPoint: 0 };
    const invalid = { schemaVersion: 2, tool: 'inventory', items: [good, { ...good, name: '', unitCost: -1 }] };
    await upload(JSON.stringify(invalid));
    await expect(status).toContainText(entry.record);
    await expect(status).toContainText(entry.number);
    await expect(status).toContainText(entry.required);
    const fieldLabel = await page.locator('#invCost').evaluate(field => field.closest('label').textContent.trim());
    await expect(status).toContainText(entry.locale === 'en' ? 'Unit cost' : fieldLabel);
    expect(await page.evaluate(() => window.AfroToolsInventoryApp.getItems().length)).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('afrotools_inventory_v2'))).toBeNull();
    if (entry.locale !== 'en') {
      await expect(status).not.toContainText('Product name is required.');
      await expect(status).not.toContainText('must be a finite');
    }
    const extra = {
      en: ['Record 1: item must be an object.', 'Record 1: text exceeds the allowed field length.', 'Inventory exceeds the 500 record limit.'],
      fr: ['Enregistrement 1 : Le produit doit être un objet JSON.', 'Enregistrement 1 : Le texte dépasse la longueur autorisée pour ce champ.', 'L’inventaire dépasse la limite de 500 produits.'],
      sw: ['Rekodi 1: Bidhaa lazima iwe kitu cha JSON (object).', 'Rekodi 1: Maandishi yamezidi urefu unaoruhusiwa kwa sehemu hii.', 'Orodha ya bidhaa imezidi kikomo cha rekodi 500.']
    }[entry.locale];
    for (const [index, items] of [[null], [{ name: 'x'.repeat(121) }], Array(501).fill(null)].entries()) {
      await upload(JSON.stringify({ schemaVersion: 2, tool: 'inventory', items }));
      await expect(status).toHaveText(extra[index]);
    }
    await upload('x'.repeat(1048577));
    await expect(status).toHaveText(await page.evaluate(() => window.INVENTORY_VIP_CONFIG.t.fileTooLarge));
    expect(await page.evaluate(() => localStorage.getItem('afrotools_inventory_v2'))).toBeNull();
    await page.locator('#invAdd').click();
    await page.locator('#invName').fill('   ');
    for (const id of ['invCost', 'invSell', 'invQty', 'invReorder']) await page.locator(`#${id}`).fill('1');
    await page.locator('#invForm button[type=submit]').click();
    await expect(page.locator('#invModalError')).toHaveText(entry.required);
    await page.locator('#invName').fill('Synthetic recovery');
    await page.locator('#invForm button[type=submit]').click();
    await expect(page.locator('#invModal')).not.toHaveClass(/open/);
    expect(await page.evaluate(() => window.AfroToolsInventoryApp.getItems().length)).toBe(1);
  });
}
