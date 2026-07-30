const { test, expect } = require('@playwright/test');
const fixtures = require('../fixtures/poultry-roi-english-invariants.json');
const engine = require('../../engines/src/poultry-roi-engine');
const aiRouteMap = require('../../assets/js/ai/french-route-map.generated.js');

function watchFailures(page) {
  const failures = [];
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console:${message.text()}`);
  });
  page.on('pageerror', error => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      failures.push(`requestfailed:${request.url()}`);
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`);
  });
  return failures;
}

async function downloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test('all 15 accepted English Poultry ROI country controllers retain shared-engine behavior', async ({ page }) => {
  const failures = watchFailures(page);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  const countries = [...new Map(fixtures.cases.map(item => [
    item.input.countryCode,
    item.countryData.slug,
  ])).entries()];
  expect(countries).toHaveLength(15);
  for (const [countryCode, slug] of countries) {
    await page.goto(`/agriculture/poultry-roi/${slug}`);
    await page.fill('#inpFlock', '413');
    await page.selectOption('#selManagement', 'smallholder');
    await page.selectOption('#selOwnHouse', 'no');
    await page.selectOption('#selHousingType', 'semi_commercial');
    await page.getByRole('button', { name: 'Calculate Poultry Farm ROI' }).click();
    await expect(page.locator('#resultsPanel')).toHaveClass(/on/);
    const actual = await page.evaluate(country => {
      const data = window.AfroTools.PoultryCosts[country];
      return window.AfroTools.PoultryROIEngine.calculate({
        mode: 'broilers',
        countryCode: country,
        flockSize: 413,
        management: 'smallholder',
        cyclesPerYear: 4,
        ownHouse: false,
        housingType: 'semi_commercial',
      }, data, window.AfroTools.PoultryProduction);
    }, countryCode);
    const countryData = fixtures.cases.find(item => item.input.countryCode === countryCode).countryData;
    const production = await page.evaluate(() => window.AfroTools.PoultryProduction);
    expect(actual).toEqual(engine.calculate({
      mode: 'broilers',
      countryCode,
      flockSize: 413,
      management: 'smallholder',
      cyclesPerYear: 4,
      ownHouse: false,
      housingType: 'semi_commercial',
    }, countryData, production));
  }
  expect(failures).toEqual([]);
});

test('French Poultry ROI full physical-route acceptance', async ({ page, context }) => {
  const failures = watchFailures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/poultry-roi/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://afrotools.com/fr/agriculture/poultry-roi/'
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://afrotools.com/agriculture/poultry-roi/'
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://afrotools.com/fr/agriculture/poultry-roi/'
  );
  expect(
    (await page.locator('script[type="application/ld+json"]').first()
      .evaluate(element => JSON.parse(element.textContent))).inLanguage
  ).toBe('fr');
  expect(aiRouteMap.routes['/agriculture/poultry-roi/']).toBe('/fr/agriculture/poultry-roi/');
  await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
  await expect(page.getByText(/aucune donnée en direct/i)).toBeVisible();
  expect(
    await page.locator('.card').first().evaluate(element => getComputedStyle(element).backgroundColor)
  ).toBe('rgb(21, 34, 55)');

  await page.selectOption('#countryCode', 'SN');
  await page.selectOption('#mode', 'broilers');
  await page.fill('#flockSize', '413');
  await page.selectOption('#management', 'smallholder');
  await page.selectOption('#ownHouse', 'no');
  await page.selectOption('#housingType', 'semi_commercial');
  await page.fill('#cyclesPerYear', '5');
  const calculate = page.getByRole('button', { name: 'Calculer la rentabilité' });
  await calculate.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#resultPanel')).toBeVisible();
  const runtime = await page.evaluate(() => ({
    latest: window.__FR_AGRI_TEST__.latest,
    production: window.__FR_AGRI_TEST__.production,
    report: window.__FR_AGRI_TEST__.reportObject(),
  }));
  expect(runtime.latest.result).toEqual(engine.calculate(
    runtime.latest.input,
    runtime.latest.countryData,
    runtime.production
  ));
  expect(runtime.report.sources.donneesEnDirect).toBe(false);

  for (const item of [
    {
      name: 'Exporter en TXT',
      extension: '.txt',
      verify: value => expect(value.toString('utf8')).toContain('Confidentialité'),
    },
    {
      name: 'Exporter en CSV',
      extension: '.csv',
      verify: value => expect(value.toString('utf8')).toContain('profit_annuel'),
    },
    {
      name: 'Exporter en JSON',
      extension: '.json',
      verify: value => expect(JSON.parse(value.toString('utf8')).pays.code).toBe('SN'),
    },
    {
      name: 'Exporter en PDF',
      extension: '.pdf',
      verify: value => expect(value.subarray(0, 4).toString('ascii')).toBe('%PDF'),
    },
  ]) {
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await promise;
    expect(download.suggestedFilename().endsWith(item.extension)).toBe(true);
    item.verify(await downloadBuffer(download));
  }

  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  expect(JSON.parse(
    await page.evaluate(() => localStorage.getItem('afrotools:fr-agriculture:poultry-roi'))
  ).pays.code).toBe('SN');
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('rentabilité de l’élevage de volailles');

  await page.selectOption('#mode', 'compare');
  await page.getByRole('button', { name: 'Calculer la rentabilité' }).click();
  await expect(page.getByText('Comparaison', { exact: true })).toBeVisible();
  expect((await page.evaluate(() => window.__FR_AGRI_TEST__.latest.result)).mode).toBe('compare');

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor))
    .toBe('rgb(245, 248, 252)');
  await page.getByRole('button', { name: 'Thème sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )).toBe(true);
  }

  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await page.selectOption('#countryCode', '');
  await page.getByRole('button', { name: 'Calculer la rentabilité' }).click();
  await expect(page.getByRole('alert')).toContainText('Choisissez un pays');
  await expect(page.locator('#countryCode')).toBeFocused();
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return ids.filter((value, index) => ids.indexOf(value) !== index);
  })).toEqual([]);
  expect(failures).toEqual([]);
});
