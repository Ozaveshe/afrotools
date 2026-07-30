const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../../assets/js/ai/french-route-map.generated.js');
const rows = manifest.rows.filter((row) => row.family === 'irrigation');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);

function watch(page) {
  const failures = [];
  page.on('console', (message) => { if (message.type() === 'error') failures.push(`console:${message.text()}`); });
  page.on('pageerror', (error) => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', (request) => failures.push(`request:${request.url()}`));
  page.on('response', (response) => { if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`); });
  return failures;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('irrigation-calculator hub acceptance', async ({ page }) => {
  const failures = watch(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(hub.french.route);
  await expect(page.locator('.country-list a')).toHaveCount(54);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(ai.routes[hub.english.routeKey]).toBe(hub.french.routeKey);
  expect(failures).toEqual([]);
});

for (const row of countries) {
  test(`${row.english.id} full route acceptance`, async ({ page, context }) => {
    const code = row.country.code;
    const failures = watch(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.french.route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(code === 'CD' ? 'RDC' : row.country.frenchName);
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(13, 22, 36)');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://afrotools.com${row.french.routeKey}`);
    await expect(page.locator('link[hreflang=en]')).toHaveAttribute('href', `https://afrotools.com${row.english.routeKey}`);
    const schema = await page.locator('script[type="application/ld+json"]').first().evaluate((element) => JSON.parse(element.textContent));
    expect(schema.inLanguage).toBe('fr');
    expect(ai.routes[row.english.routeKey]).toBe(row.french.routeKey);
    await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
    const controls = page.locator('input,select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const controlId = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${controlId}"]`)).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Calculer les besoins en eau' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    const runtime = await page.evaluate(() => ({
      code: window.__FR_AGRI_TEST__.data.countryCode,
      result: window.__FR_AGRI_TEST__.latest.result,
      report: window.__FR_AGRI_TEST__.reportObject(),
    }));
    expect(runtime.code).toBe(code);
    expect(runtime.result.error).toBe(false);
    expect(runtime.report.pays.code).toBe(code);
    const exports = [
      { name: 'Exporter en TXT', extension: '.txt', verify: (value) => expect(value.toString('utf8')).toContain('Confidentialité') },
      { name: 'Exporter en CSV', extension: '.csv', verify: (value) => expect(value.toString('utf8')).toContain('eau_totale_m3') },
      { name: 'Exporter en JSON', extension: '.json', verify: (value) => expect(JSON.parse(value.toString('utf8')).pays.code).toBe(code) },
      { name: 'Exporter en PDF', extension: '.pdf', verify: (value) => expect(value.subarray(0, 4).toString('ascii')).toBe('%PDF') },
    ];
    for (const item of exports) {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: item.name }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(code.toLowerCase());
      expect(download.suggestedFilename().endsWith(item.extension)).toBe(true);
      item.verify(await buffer(download));
    }
    await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
    const saved = await page.evaluate((countryCode) => localStorage.getItem(`afrotools:fr-agriculture:irrigation:${countryCode}`), code);
    expect(JSON.parse(saved).pays.code).toBe(code);
    await page.getByRole('button', { name: 'Copier' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('estimation d’irrigation');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.getByRole('button', { name: 'Thème sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await page.getByLabel('Superficie de l’exploitation (hectares)').fill('0');
    await page.getByRole('button', { name: 'Calculer les besoins en eau' }).click();
    await expect(page.getByRole('alert')).toContainText('au moins 0,1 hectare');
    await expect(page.getByLabel('Superficie de l’exploitation (hectares)')).toBeFocused();
    await expect(page.locator('a[href^="/"]:not([href^="/fr/"])')).toHaveCount(0);
    expect(failures).toEqual([]);
  });
}
