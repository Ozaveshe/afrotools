const { test, expect } = require('@playwright/test');
const data = require('../../data/agriculture/farm-budget-data.json');
const engine = require('../../engines/src/farm-budget-engine');
const aiRouteMap = require('../../assets/js/ai/french-route-map.generated.js');

function watchFailures(page) {
  const failures = [];
  page.on('console', message => { if (message.type() === 'error') failures.push(`console:${message.text()}`); });
  page.on('pageerror', error => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') failures.push(`requestfailed:${request.url()}`);
  });
  page.on('response', response => { if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`); });
  return failures;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('accepted English Farm Budget behavior delegates to the shared engine', async ({ page }) => {
  const failures = watchFailures(page);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.goto('/agriculture/farm-budget/');
  await page.selectOption('#country-sel', 'NG');
  await page.selectOption('.crop-sel', 'maize');
  await page.fill('.crop-area', '1');
  await page.getByRole('button', { name: 'Plan my budget' }).click();
  const actual = await page.evaluate(() => window.FARM_BUDGET_LAST_RESULT);
  const farmCosts = await page.evaluate(() => window.AfroTools.farmCosts);
  expect(actual).toEqual(engine.calculate({
    countryCode: 'NG', crops: [{ crop: 'maize', area: 1 }], landMode: 'own',
    laborMode: 'family', mechanizationMode: 'manual', financeMode: 'cash',
    startMonth: 4, rentOverride: '', loanRate: '', loanTerm: '6',
  }, { data, farmCosts }));
  await expect(page.locator('#results')).toBeVisible();
  expect(failures).toEqual([]);
});

test('French Farm Budget full physical-route acceptance', async ({ page, context }) => {
  const failures = watchFailures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/farm-budget/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/farm-budget/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/farm-budget/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/agriculture/farm-budget/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(aiRouteMap.routes['/agriculture/farm-budget/']).toBe('/fr/agriculture/farm-budget/');
  await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
  await expect(page.getByText(/aucune donnée en direct/i)).toBeVisible();
  expect(await page.locator('.card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(21, 34, 55)');
  await page.selectOption('#countryCode', 'SN');
  await page.selectOption('#crop0', 'groundnut');
  await page.fill('#area0', '2.5');
  await page.getByRole('button', { name: 'Ajouter une culture' }).click();
  await page.selectOption('#crop1', 'millet');
  await page.fill('#area1', '1');
  await page.getByLabel('Location').check();
  await page.fill('#rentOverride', '30000');
  await page.getByLabel('Mixte').check();
  await page.getByLabel('Traction animale').check();
  await page.getByLabel('Prêt').check();
  await page.fill('#loanRate', '9');
  await page.fill('#loanTerm', '6');
  await page.selectOption('#startMonth', '6');
  const calculate = page.getByRole('button', { name: 'Calculer le budget' });
  await calculate.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#resultPanel')).toBeVisible();
  const runtime = await page.evaluate(() => ({
    result: window.__FR_AGRI_TEST__.latest.result,
    report: window.__FR_AGRI_TEST__.reportObject(),
    farmCosts: window.AfroTools.farmCosts,
  }));
  expect(runtime.result).toEqual(engine.calculate({
    countryCode: 'SN', crops: [{ crop: 'groundnut', area: 2.5 }, { crop: 'millet', area: 1 }],
    landMode: 'rent', rentOverride: '30000', laborMode: 'mixed', mechanizationMode: 'ox',
    financeMode: 'loan', loanRate: '9', loanTerm: '6', startMonth: 6,
  }, { data, farmCosts: runtime.farmCosts }));
  expect(runtime.report.sources.donneesEnDirect).toBe(false);
  const cases = [
    { name: 'Exporter en TXT', ext: '.txt', verify: value => expect(value.toString('utf8')).toContain('Confidentialité') },
    { name: 'Exporter en CSV', ext: '.csv', verify: value => expect(value.toString('utf8')).toContain('culture') },
    { name: 'Exporter en JSON', ext: '.json', verify: value => expect(JSON.parse(value.toString('utf8')).pays.code).toBe('SN') },
    { name: 'Exporter en PDF', ext: '.pdf', verify: value => expect(value.subarray(0, 4).toString('ascii')).toBe('%PDF') },
  ];
  for (const item of cases) {
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await promise;
    expect(download.suggestedFilename().endsWith(item.ext)).toBe(true);
    item.verify(await buffer(download));
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('afrotools:fr-agriculture:farm-budget'))).pays.code).toBe('SN');
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('budget d’exploitation agricole');
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(245, 248, 252)');
  await page.getByRole('button', { name: 'Thème sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await page.selectOption('#countryCode', '');
  await page.getByRole('button', { name: 'Calculer le budget' }).click();
  await expect(page.getByRole('alert')).toContainText('Choisissez un pays');
  await expect(page.locator('#countryCode')).toBeFocused();
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  })).toEqual([]);
  expect(failures).toEqual([]);
});
