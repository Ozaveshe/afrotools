const { test, expect } = require('@playwright/test');
const data = require('../../data/agriculture/fertilizer-calc-data.json');
const engine = require('../../engines/src/fertilizer-calc-engine');
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

test('accepted English Fertilizer Calculator behavior uses the shared engine', async ({ page }) => {
  const failures = watchFailures(page);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.goto('/tools/fertilizer-calc/');
  await page.selectOption('#crop', 'cassava');
  await page.fill('#area', '2.75');
  await page.selectOption('#soil', 'laterite');
  await page.selectOption('#yieldTarget', 'high');
  await page.selectOption('#currency', 'GHS');
  const actual = await page.evaluate(() => window.calculate());
  expect(actual).toEqual(engine.calculate({
    cropId: 'cassava', area: 2.75, soil: 'laterite', target: 'high', currency: 'GHS',
  }, data));
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#summaryCards')).toContainText(String(actual.totals.n));
  await expect(page.locator('#costCards')).toContainText(String(actual.bags.npk15));
  expect(failures).toEqual([]);
});

test('French Fertilizer Calculator full physical-route acceptance', async ({ page, context }) => {
  const failures = watchFailures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'rejected');
    if (!localStorage.getItem('aft_theme')) localStorage.setItem('aft_theme', 'dark');
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/tools/calculateur-engrais/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/calculateur-engrais/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/fertilizer-calc/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/tools/calculateur-engrais/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(aiRouteMap.routes['/tools/fertilizer-calc/']).toBe('/fr/tools/calculateur-engrais/');
  await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
  await expect(page.getByText(/aucune donnée en direct/i)).toBeVisible();
  expect(await page.locator('.fert-card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(21, 34, 56)');
  for (const control of ['crop', 'currency', 'area', 'soil', 'yieldTarget']) {
    await expect(page.locator(`label[for="${control}"]`)).toHaveCount(1);
  }
  await page.selectOption('#crop', 'cassava');
  await page.fill('#area', '2.75');
  await page.selectOption('#soil', 'laterite');
  await page.selectOption('#yieldTarget', 'high');
  await page.selectOption('#currency', 'GHS');
  const calculate = page.getByRole('button', { name: 'Calculer les besoins' });
  await calculate.focus();
  await expect(calculate).toBeFocused();
  await page.keyboard.press('Enter');
  const runtime = await page.evaluate(() => ({
    result: window.__FR_AGRI_TEST__.latest.result,
    report: window.__FR_AGRI_TEST__.reportObject(),
  }));
  expect(runtime.result).toEqual(engine.calculate({
    cropId: 'cassava', area: 2.75, soil: 'laterite', target: 'high', currency: 'GHS',
  }, data));
  expect(runtime.report.sources.donneesEnDirect).toBe(false);
  const cases = [
    { name: 'Exporter en TXT', ext: '.txt', verify: value => expect(value.toString('utf8')).toContain('Confidentialité') },
    { name: 'Exporter en CSV', ext: '.csv', verify: value => expect(value.toString('utf8')).toContain('culture_id') },
    { name: 'Exporter en JSON', ext: '.json', verify: value => expect(JSON.parse(value.toString('utf8')).outil).toBe('calculateur-engrais') },
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
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('afrotools:fr-agriculture:fertilizer-calc'))).outil).toBe('calculateur-engrais');
  await page.getByRole('button', { name: 'Copier', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('calculateur d’engrais');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => { localStorage.setItem('aft_theme', 'light'); location.reload(); });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('.fert-card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.evaluate(() => { localStorage.setItem('aft_theme', 'dark'); location.reload(); });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.fill('#area', '0');
  await page.getByRole('button', { name: 'Calculer les besoins' }).click();
  await expect(page.getByRole('alert')).toContainText('supérieure à zéro');
  await expect(page.locator('#area')).toBeFocused();
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  })).toEqual([]);
  expect(failures).toEqual([]);
});
