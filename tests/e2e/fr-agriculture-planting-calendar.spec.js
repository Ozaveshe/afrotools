const { test, expect } = require('@playwright/test');
const data = require('../../data/agriculture/planting-calendar-data.json');
const aiRouteMap = require('../../assets/js/ai/french-route-map.generated.js');

function watchFailures(page) {
  const failures = [];
  let intentionalReloadActive = false;
  Object.defineProperty(failures, 'allowIntentionalReload', {
    enumerable: false,
    value() {
      intentionalReloadActive = true;
    },
  });
  page.on('load', () => {
    intentionalReloadActive = false;
  });
  page.on('console', (message) => { if (message.type() === 'error') failures.push(`console:${message.text()}`); });
  page.on('pageerror', (error) => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      const errorText = request.failure() && request.failure().errorText;
      if (!(intentionalReloadActive && /ERR_ABORTED/i.test(errorText || ''))) {
        failures.push(`requestfailed:${request.url()} ${errorText}`);
      }
    }
  });
  page.on('response', (response) => { if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`); });
  return failures;
}

async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('accepted English Planting Calendar behavior is preserved by the shared engine controller', async ({ page }) => {
  const failures = watchFailures(page);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.goto('/tools/planting-calendar/');
  await page.selectOption('#zone', 'forest');
  await page.selectOption('#rainfall', 'bimodal');
  const runtime = await page.evaluate(() => {
    const result = window.generate();
    return {
      result,
      rows: document.querySelectorAll('#calendarGrid .crop-name').length,
      cells: [...document.querySelectorAll('#calendarGrid .cell')].map(cell => ({
        status: cell.className.split(' ').pop(),
        text: cell.textContent,
      })),
    };
  });
  expect(runtime.result.crops.map(crop => crop.id)).toEqual(Object.keys(data.zones.forest));
  expect(runtime.result.crops.map(crop => crop.months.map(month => month.value)))
    .toEqual(Object.values(data.zones.forest));
  expect(runtime.rows).toBe(Object.keys(data.zones.forest).length);
  expect(runtime.cells).toHaveLength(Object.keys(data.zones.forest).length * 12);
  expect(failures).toEqual([]);
});

test('French Planting Calendar full physical-route acceptance', async ({ page, context }) => {
  const failures = watchFailures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/tools/calendrier-semis/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/calendrier-semis/');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/planting-calendar/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/tools/calendrier-semis/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(aiRouteMap.routes['/tools/planting-calendar/']).toBe('/fr/tools/calendrier-semis/');
  await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
  await expect(page.getByText(/aucune donnée en direct/i)).toBeVisible();
  expect(await page.locator('.planting-card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(17, 28, 45)');

  for (const control of ['plantingCountry', 'plantingZone', 'plantingRainfall']) {
    await expect(page.locator(`label[for="${control}"]`)).toHaveCount(1);
  }
  const calculate = page.getByRole('button', { name: 'Générer le calendrier' });
  await calculate.focus();
  await expect(calculate).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#plantingResults')).toBeVisible();
  const runtime = await page.evaluate(() => ({
    result: window.__FR_AGRI_TEST__.latest.result,
    report: window.__FR_AGRI_TEST__.reportObject(),
  }));
  expect(runtime.result.zone).toBe('guinea');
  expect(runtime.result.crops.map(crop => crop.id)).toEqual(Object.keys(data.zones.guinea));
  expect(runtime.report.sources.donneesEnDirect).toBe(false);
  expect(runtime.report.confidentialite).toContain('aucune saisie envoyée');

  const cases = [
    { name: 'Exporter en TXT', ext: '.txt', verify: value => expect(value.toString('utf8')).toContain('Confidentialité') },
    { name: 'Exporter en CSV', ext: '.csv', verify: value => expect(value.toString('utf8')).toContain('culture_id') },
    { name: 'Exporter en JSON', ext: '.json', verify: value => expect(JSON.parse(value.toString('utf8')).outil).toBe('calendrier-semis') },
    { name: 'Exporter en PDF', ext: '.pdf', verify: value => expect(value.subarray(0, 4).toString('ascii')).toBe('%PDF') },
  ];
  for (const item of cases) {
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await promise;
    expect(download.suggestedFilename().toLowerCase().endsWith(item.ext)).toBe(true);
    item.verify(await buffer(download));
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('afrotools:fr-agriculture:planting-calendar'))).outil).toBe('calendrier-semis');
  await page.getByRole('button', { name: 'Copier', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('calendrier de semis');

  await page.emulateMedia({ colorScheme: 'light' });
  failures.allowIntentionalReload();
  await page.evaluate(() => { localStorage.setItem('aft_theme', 'light'); location.reload(); });
  await page.waitForLoadState('domcontentloaded');
  expect(await page.locator('.planting-card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  failures.allowIntentionalReload();
  await page.evaluate(() => { localStorage.setItem('aft_theme', 'dark'); location.reload(); });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  const reflow = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll('body *')].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
    }).slice(0, 12).map(element => ({
      tag: element.tagName,
      className: element.className,
      id: element.id,
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    })),
  }));
  expect(reflow, JSON.stringify(reflow)).toMatchObject({ fits: true });

  await page.evaluate(() => { localStorage.setItem('aft_theme', 'light'); });
  failures.allowIntentionalReload();
  await page.reload();
  await page.selectOption('#plantingZone', '');
  await page.getByRole('button', { name: 'Générer le calendrier' }).click();
  await expect(page.getByRole('alert')).toContainText('Sélectionnez une zone');
  await expect(page.locator('#plantingZone')).toBeFocused();
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  })).toEqual([]);
  expect(failures).toEqual([]);
});
