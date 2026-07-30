const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/fr-agriculture-parity-manifest.json');

const PILOT = [
  { code: 'SN', route: '/fr/agriculture/crop-yield/senegal', country: 'Sénégal', yield: 0.63, currency: 'XOF' },
  { code: 'CI', route: '/fr/agriculture/crop-yield/cote-d-ivoire', country: 'Côte d’Ivoire', yield: 0.59, currency: 'XOF' },
  { code: 'CM', route: '/fr/agriculture/crop-yield/cameroon', country: 'Cameroun', yield: 0.61, currency: 'XAF' },
  { code: 'MA', route: '/fr/agriculture/crop-yield/morocco', country: 'Maroc', yield: 2.2, currency: 'MAD' },
  { code: 'CD', route: '/fr/agriculture/crop-yield/dr-congo', country: 'République démocratique du Congo', yield: 8.6, currency: 'CDF' },
];

test('pilot browser targets match the exact manifest canonicals', async () => {
  for (const pilot of PILOT) {
    const row = manifest.rows.find((candidate) => (
      candidate.family === 'crop-yield'
      && candidate.country
      && candidate.country.code === pilot.code
    ));
    expect(row).toBeTruthy();
    expect(`${pilot.route}/`).toBe(row.french.routeKey);
    expect(pilot.route.endsWith('.html')).toBe(false);
  }
});

async function collectBrowserFailures(page) {
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

for (const pilot of PILOT) {
  test(`${pilot.code} uses the accepted engine and native French runtime`, async ({ page, context }) => {
    const failures = await collectBrowserFailures(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(pilot.route);

    await expect(page).toHaveTitle(/Estimateur de rendement agricole/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(pilot.code === 'CD' ? 'RDC' : pilot.country);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', pilot.code);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${pilot.route}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', `https://afrotools.com${pilot.route}/`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${pilot.route.replace('/fr', '')}/`);
    await expect(page.getByText('Aucune saisie n’est envoyée à un serveur.')).toBeVisible();

    const controls = page.locator('input:not([type="hidden"]), select');
    const controlCount = await controls.count();
    for (let index = 0; index < controlCount; index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }

    await page.getByRole('button', { name: 'Calculer l’estimation' }).click();
    await expect(page.getByText('Estimation calculée localement.')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeVisible();
    const runtime = await page.evaluate(() => ({
      result: window.__FR_AGRI_TEST__.latest.result,
      countryCode: window.__FR_AGRI_TEST__.data.countryCode,
      currency: window.__FR_AGRI_TEST__.data.currency,
    }));
    expect(runtime.countryCode).toBe(pilot.code);
    expect(runtime.currency).toBe(pilot.currency);
    expect(runtime.result.estimatedYieldPerHa).toBe(pilot.yield);

    await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
    await expect(page.getByText('Résultat enregistré dans ce navigateur.')).toBeVisible();
    const saved = await page.evaluate((code) => localStorage.getItem(`afrotools:fr-agriculture:crop-yield:${code}`), pilot.code);
    expect(JSON.parse(saved).country.code).toBe(pilot.code);

    await page.getByRole('button', { name: 'Copier' }).click();
    await expect(page.getByText('Résultat copié.')).toBeVisible();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('estimation de rendement');

    const exportCases = [
      { name: 'Exporter en TXT', extension: '.txt', verify: (buffer) => expect(buffer.toString('utf8')).toContain('Confidentialité') },
      { name: 'Exporter en CSV', extension: '.csv', verify: (buffer) => expect(buffer.toString('utf8')).toContain('code_pays') },
      { name: 'Exporter en JSON', extension: '.json', verify: (buffer) => expect(JSON.parse(buffer.toString('utf8')).country.code).toBe(pilot.code) },
      { name: 'Exporter en PDF', extension: '.pdf', verify: (buffer) => expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF') },
    ];
    for (const exportCase of exportCases) {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: exportCase.name }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(pilot.code.toLowerCase());
      expect(download.suggestedFilename()).toMatch(new RegExp(`${exportCase.extension.replace('.', '\\.')}$`));
      exportCase.verify(await download.createReadStream().then(async (stream) => {
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
      }));
    }

    await page.getByRole('button', { name: 'Thème sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Thème clair' })).toBeFocused();

    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page.getByText('Aucun résultat n’est encore enregistré.')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeHidden();

    await page.getByLabel('Superficie de l’exploitation (hectares)').fill('0');
    await page.getByRole('button', { name: 'Calculer l’estimation' }).click();
    await expect(page.getByRole('alert')).toContainText('au moins 0,1 hectare');
    await expect(page.getByLabel('Superficie de l’exploitation (hectares)')).toBeFocused();

    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
    const englishInternalLinks = await page.locator('a[href^="/"]:not([href^="/fr/"])').count();
    expect(englishInternalLinks).toBe(0);
    expect(failures).toEqual([]);
  });

  test(`${pilot.code} reflows at 320px and at 200 percent`, async ({ page }) => {
    const failures = await collectBrowserFailures(page);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(pilot.route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    await expect(page.getByRole('button', { name: 'Calculer l’estimation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(failures).toEqual([]);
  });
}

test('system dark mode applies without overriding the stored preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/fr/agriculture/crop-yield/senegal');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
  const background = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe('rgb(13, 22, 36)');
});
