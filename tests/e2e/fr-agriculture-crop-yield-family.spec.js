const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../../assets/js/ai/french-route-map.generated.js');

const ROWS = manifest.rows.filter((row) => row.family === 'crop-yield');
const COUNTRY_ROWS = ROWS.filter((row) => row.country);
const HUB = ROWS.find((row) => !row.country);

function watchFailures(page) {
  const failures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console:${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', (request) => failures.push(`requestfailed:${request.url()} ${request.failure() && request.failure().errorText}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`);
  });
  return failures;
}

async function streamToBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('crop-yield-estimator hub owns all 54 manifest country links and reflows', async ({ page }) => {
  const failures = watchFailures(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(HUB.french.route);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('rendement agricole');
  await expect(page.locator('.country-list a')).toHaveCount(54);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${HUB.french.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${HUB.english.route}`);
  expect(aiRouteMap.routes[HUB.english.routeKey]).toBe(HUB.french.routeKey);
  expect(failures).toEqual([]);
});

for (const row of COUNTRY_ROWS) {
  test(`${row.english.id} full route acceptance`, async ({ page, context }) => {
    const failures = watchFailures(page);
    const code = row.country.code;
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.french.route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(13, 22, 36)');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(code === 'CD' ? 'RDC' : row.country.frenchName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', code);
    await expect(page.locator('meta[name="afrotools-source-jurisdiction"]')).toHaveAttribute('content', code);
    await expect(page.locator('meta[name="afrotools-formula-jurisdiction"]')).toHaveAttribute('content', code);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.french.routeKey}`);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', `https://afrotools.com${row.french.routeKey}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english.routeKey}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.french.routeKey}`);
    const applicationSchema = await page.locator('script[type="application/ld+json"]').first().evaluate((element) => JSON.parse(element.textContent));
    expect(applicationSchema.inLanguage).toBe('fr');
    expect(aiRouteMap.routes[row.english.routeKey]).toBe(row.french.routeKey);

    await expect(page.getByText('Aucune saisie n’est envoyée à un serveur.')).toBeVisible();
    await expect(page.getByText(/Il ne s’agit pas de données en direct/)).toBeVisible();
    const controls = page.locator('input:not([type="hidden"]), select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }

    await page.getByRole('button', { name: 'Calculer l’estimation' }).focus();
    await expect(page.getByRole('button', { name: 'Calculer l’estimation' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    const runtime = await page.evaluate(() => ({
      countryCode: window.__FR_AGRI_TEST__.data.countryCode,
      currency: window.__FR_AGRI_TEST__.data.currency,
      result: window.__FR_AGRI_TEST__.latest.result,
    }));
    expect(runtime.countryCode).toBe(code);
    expect(runtime.result.revenueEstimate.currency).toBe(runtime.currency);
    expect(Number.isFinite(runtime.result.estimatedYieldPerHa)).toBe(true);

    const exportCases = [
      { name: 'Exporter en TXT', extension: '.txt', verify: (buffer) => expect(buffer.toString('utf8')).toContain('Confidentialité') },
      { name: 'Exporter en CSV', extension: '.csv', verify: (buffer) => expect(buffer.toString('utf8')).toContain('code_pays') },
      { name: 'Exporter en JSON', extension: '.json', verify: (buffer) => expect(JSON.parse(buffer.toString('utf8')).country.code).toBe(code) },
      { name: 'Exporter en PDF', extension: '.pdf', verify: (buffer) => expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF') },
    ];
    for (const exportCase of exportCases) {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: exportCase.name }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`${code.toLowerCase()}.*${exportCase.extension.replace('.', '\\.')}$`));
      exportCase.verify(await streamToBuffer(download));
    }

    await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
    const saved = await page.evaluate((countryCode) => localStorage.getItem(`afrotools:fr-agriculture:crop-yield:${countryCode}`), code);
    expect(JSON.parse(saved).country.code).toBe(code);
    await page.getByRole('button', { name: 'Copier' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('estimation de rendement');

    await page.emulateMedia({ colorScheme: 'light' });
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(245, 248, 252)');
    await page.getByRole('button', { name: 'Thème sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await page.getByLabel('Superficie de l’exploitation (hectares)').fill('0');
    await page.getByRole('button', { name: 'Calculer l’estimation' }).click();
    await expect(page.getByRole('alert')).toContainText('au moins 0,1 hectare');
    await expect(page.getByLabel('Superficie de l’exploitation (hectares)')).toBeFocused();

    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
    await expect(page.locator('a[href^="/"]:not([href^="/fr/"])')).toHaveCount(0);
    expect(failures).toEqual([]);
  });
}
