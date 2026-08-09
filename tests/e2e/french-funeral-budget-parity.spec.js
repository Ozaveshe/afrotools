const { test, expect } = require('@playwright/test');

const ROUTE = '/fr/tools/cout-funerailles/';

async function fillBudget(page) {
  const values = {
    '#fb-care': '1000',
    '#fb-venue': '2000',
    '#fb-food': '3000',
    '#fb-transport': '4000',
    '#fb-documents': '500',
    '#fb-other': '500',
    '#fb-buffer': '10',
    '#fb-fund': '2000',
    '#fb-benefit': '1000',
    '#fb-contributors': '7',
    '#fb-days': '7'
  };
  await page.locator('#fb-currency').fill('XOF');
  for (const [selector, value] of Object.entries(values)) await page.locator(selector).fill(value);
}

test.describe('French funeral budget parity', () => {
  test('formula, invalid state, reset, JSON/TXT export and JSON reopen stay local', async ({ page }) => {
    const consoleErrors = [];
    const workflowNetwork = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(ROUTE);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    page.on('request', request => {
      if (['xhr', 'fetch'].includes(request.resourceType())) workflowNetwork.push(request.url());
    });

    await fillBudget(page);
    await page.getByRole('button', { name: 'Calculer le plan' }).click();
    await expect(page.locator('#fb-primary-value')).toHaveText(/12[\s\u202f]?100 XOF/);
    await expect(page.locator('#fb-result-list')).toContainText(/9[\s\u202f]?100 XOF/);
    await expect(page.locator('#fb-result-list')).toContainText(/1[\s\u202f]?300 XOF/);
    await expect(page.locator('#fb-status')).toHaveText('Plan calculé sur cet appareil.');

    const jsonDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger JSON' }).click();
    const json = await (await jsonDownload).createReadStream();
    const jsonChunks = [];
    for await (const chunk of json) jsonChunks.push(chunk);
    const jsonText = Buffer.concat(jsonChunks).toString('utf8');
    const saved = JSON.parse(jsonText);
    expect(saved.schemaVersion).toBe(1);
    expect(saved.methodology).toBe('user-entered-funeral-budget');
    expect(saved.result.total).toBe(12100);
    expect(saved.result.gap).toBe(9100);

    const txtDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    const txt = await (await txtDownload).createReadStream();
    const txtChunks = [];
    for await (const chunk of txt) txtChunks.push(chunk);
    const txtText = Buffer.concat(txtChunks).toString('utf8');
    expect(txtText).toContain('Total du plan');
    expect(txtText).toContain('Besoin de financement');
    expect(txtText).toContain('sans prix moyen');

    await page.locator('#fb-care').fill('99');
    await expect(page.locator('#fb-primary-value')).toHaveText('—');
    await page.locator('#fb-import').setInputFiles({
      name: 'budget-funeraire-familial.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonText)
    });
    await expect(page.locator('#fb-care')).toHaveValue('1000');
    await expect(page.locator('#fb-primary-value')).toHaveText(/12[\s\u202f]?100 XOF/);
    await expect(page.locator('#fb-status')).toHaveText('Budget JSON rouvert et recalculé.');

    await page.locator('#fb-care').fill('-1');
    await page.getByRole('button', { name: 'Calculer le plan' }).click();
    await expect(page.locator('#fb-error')).toHaveText('Saisissez une valeur valide dans chaque champ.');
    await expect(page.locator('#fb-care')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#fb-care')).toBeFocused();
    await expect(page.locator('#fb-primary-value')).toHaveText('—');

    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page.locator('#fb-care')).toHaveValue('0');
    await expect(page.locator('#fb-currency')).toHaveValue('XOF');
    await expect(page.locator('#fb-error')).toBeEmpty();
    await expect(page.locator('#fb-primary-value')).toHaveText('—');
    await expect(page.locator('#fb-status')).toHaveText('Le formulaire et les résultats ont été réinitialisés.');

    expect(workflowNetwork).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('320px, 375px and 200% reflow avoid horizontal overflow', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTE);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, width + 'px overflow').toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(ROUTE);
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(zoomOverflow, '200% reflow overflow').toBeLessThanOrEqual(1);
  });

  test('themes, keyboard labels, metadata, hreflang, schema and artwork are valid', async ({ page }) => {
    await page.goto(ROUTE);
    const light = await page.locator('.rm-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const dark = await page.locator('.rm-card').first().evaluate(element => getComputedStyle(element).backgroundColor);
    expect(dark).not.toBe(light);

    const controls = page.locator('#fb-form input:not([hidden]), #fb-form button');
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index);
      await expect(control).toHaveAccessibleName(/\S/);
    }
    await page.locator('#fb-currency').focus();
    await expect(page.locator('#fb-currency')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#fb-care')).toBeFocused();

    await expect(page).toHaveTitle('Estimateur coût funérailles Afrique | AfroTools');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/cout-funerailles/');
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/burial-cost/');
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/cout-funerailles/');
    await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/gharama-za-mazishi/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/burial-cost.webp');
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = schemas.map(text => JSON.parse(text));
    expect(parsed.some(schema => schema['@type'] === 'WebApplication' && schema.inLanguage === 'fr')).toBe(true);
    expect(parsed.some(schema => schema['@type'] === 'FAQPage' && schema.inLanguage === 'fr')).toBe(true);
  });
});
