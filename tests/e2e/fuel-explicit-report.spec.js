const { test, expect } = require('@playwright/test');
const fs = require('fs');
const parsePdf = require('pdf-parse');
const routes = { en: '/tools/fuel-tracker/', fr: '/fr/tools/suivi-carburant/', sw: '/sw/zana/ufuatiliaji-bei-za-mafuta/' };

async function save(page, button) {
  const pending = page.waitForEvent('download');
  await button.click();
  return fs.readFileSync(await (await pending).path(), 'utf8');
}
async function open(page, baseURL, locale) {
  await page.route('**/*', route => route.request().url().startsWith(baseURL) ? route.continue() : route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(routes[locale]);
  const decline = page.locator('#afro-cc-decline');
  if (await decline.isVisible()) await decline.click();
  await expect(page.locator('#fuel-country')).toBeEnabled();
}
async function printReport(page, info, filename) {
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Imprimer', exact: true }).click();
  const bytes = await page.pdf();
  fs.writeFileSync(info.outputPath(filename), bytes);
  return (await parsePdf(new Uint8Array(bytes))).text;
}

for (const locale of Object.keys(routes)) {
  test(`${locale}: manual fill report preserves output without unrelated market provenance`, async ({ page, baseURL }, info) => {
    await open(page, baseURL, locale);
    await page.locator('#fuel-price').fill('2');
    await page.locator('#fuel-currency').fill('XOF');
    await page.locator('#fuel-quantity').fill('10');
    await page.locator('#fuel-fill-calc').focus();
    await page.keyboard.press('Enter');
    const json = await save(page, page.locator('#fuel-fill-json'));
    const report = JSON.parse(json);
    expect(report.calculation.totalCost).toBe(20);
    expect(report.market).toBeNull();
    expect(report.priceBasis).toBe('manual');
    fs.writeFileSync(info.outputPath('manual.json'), json);
    expect(await page.evaluate(() => {
      const report = AfroTools.fuelFillReport();
      report.calculation.totalCost = 999;
      report.inputs.currency = 'USD';
      return AfroTools.fuelFillReport().calculation.totalCost;
    })).toBe(20);
    if (locale === 'fr') {
      const csv = await save(page, page.getByRole('button', { name: 'Télécharger le CSV', exact: true }));
      expect(csv).toContain('"Coût estimé du plein";"20 XOF"');
      expect(csv).toContain('Prix saisi manuellement');
      expect(csv).toContain('Essence');
      expect(csv).not.toContain('Dernière vérification');
      expect(csv).not.toContain('Nigeria');
      fs.writeFileSync(info.outputPath('manual.csv'), csv);
      const text = await printReport(page, info, 'manual.pdf');
      expect(text).toContain('20 XOF');
      expect(text).toContain('Prix saisi manuellement');
      expect(text).not.toContain('Nigeria');
      expect(text).not.toContain('Dernière vérification');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#fuel-price').fill('3');
    expect(await page.evaluate(() => AfroTools.fuelFillReport())).toBeNull();
    await expect(page.locator('#fuel-fill-json')).toBeDisabled();
    if (locale === 'fr') {
      await page.getByRole('button', { name: 'Télécharger le CSV', exact: true }).click();
      await expect(page.locator('.fr-finance-export-status')).toContainText('actualisez');
    }
  });
}

test('fr: market-backed gallons and tank reports preserve source context and expire safely', async ({ page, baseURL }, info) => {
  await page.clock.install({ time: new Date('2026-09-26T12:00:00Z') });
  const fixture = {
    schema_version: 1, stale_after_days: 45, markets: [{
      market_id: 'sn-synthetic', country_code: 'SN', country_name: 'Senegal', locality_name: 'Synthetic market',
      latitude: 14.4974, longitude: -14.4524, granularity: 'national', coverage_note: 'Synthetic fixture only.',
      fuels: ['petrol', 'diesel'].map(fuel_type => ({ fuel_type, price: 2, currency: 'XOF', unit: 'litre',
        effective_date: '2026-09-26', last_verified_at: '2026-09-26', source_name: 'Synthetic source',
        source_url: 'https://example.org/fuel-fixture', confidence: 'low', notes: 'Synthetic only.' }))
    }]
  };
  // Install after the broad local-only route so the specific fixture handler wins.
  await page.route('**/*', route => route.request().url().startsWith(baseURL) ? route.continue() : route.abort());
  await page.route('**/data/fuel/markets.json', route => route.fulfill({ json: fixture }));
  await page.goto(routes.fr);
  if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
  await expect(page.locator('#fuel-country')).toBeEnabled();
  await page.locator('#fuel-type').selectOption('diesel');
  await page.locator('#fuel-unit').selectOption('gallon');
  await page.locator('#fuel-quantity').fill('2');
  await page.locator('#fuel-fill-calc').click();
  let report = JSON.parse(await save(page, page.locator('#fuel-fill-json')));
  expect(report.calculation.totalCost).toBeCloseTo(15.141647136, 10);
  expect(report.calculation.litres).toBeCloseTo(7.570823568, 10);
  expect(report.market.countryName).toBe('Sénégal');
  let csv = await save(page, page.getByRole('button', { name: 'Télécharger le CSV', exact: true }));
  for (const value of ['15.141647136 XOF', '7.570823568 L', '2 gallons US', 'Sénégal', 'Gazole', 'Référence nationale', '2026-09-26', 'https://example.org/fuel-fixture']) expect(csv).toContain(value);
  fs.writeFileSync(info.outputPath('market-gallons.csv'), csv);
  const text = await printReport(page, info, 'market-gallons.pdf');
  expect(text).toContain('15.141647136 XOF');
  expect(text).toContain('Sénégal');
  expect(text).toContain('https://example.org/fuel-fixture');
  await page.locator('#fuel-fill-mode').selectOption('tank');
  await page.locator('#fuel-unit').selectOption('litre');
  await page.locator('#fuel-tank-size').fill('40');
  await page.locator('#fuel-current-level').fill('25');
  await page.locator('#fuel-fill-calc').click();
  report = JSON.parse(await save(page, page.locator('#fuel-fill-json')));
  expect(report.calculation.totalCost).toBe(60);
  csv = await save(page, page.getByRole('button', { name: 'Télécharger le CSV', exact: true }));
  for (const value of ['60 XOF', '40 L', '25 %', '30 L', 'Compléter le réservoir']) expect(csv).toContain(value);
  fs.writeFileSync(info.outputPath('market-tank.csv'), csv);
  await page.clock.setSystemTime(new Date('2026-11-20T12:00:00Z'));
  await page.getByRole('button', { name: 'Télécharger le CSV', exact: true }).click();
  await expect(page.locator('.fr-finance-export-status')).toContainText('actualisez');
  await expect(page.locator('#fuel-fill-json')).toBeDisabled();
  expect(await page.evaluate(() => AfroTools.fuelFillReport())).toBeNull();
});

test('fr: national snapshot labels distinguish LPG kilograms from liquid litres', async ({ page, baseURL }) => {
  await open(page, baseURL, 'fr');
  await page.locator('[data-fuel=lpg]').click();
  await expect(page.locator('#tableSection .section-sub')).toContainText('USD / kg');
  const first = page.locator('#fuelTable tbody tr').filter({ hasText: 'Algérie' });
  await expect(first).toContainText('Algérie');
  await expect(first).toContainText('Afrique du Nord');
  await expect(first).toContainText('DZD / kg');
  await expect(first).toContainText('$0.11 / kg');
  await page.locator('[data-fuel=diesel]').click();
  await expect(page.locator('#tableSection .section-sub')).toContainText('USD / L');
  await expect(page.locator('#fuelTable tbody')).not.toContainText('/ kg');
});
