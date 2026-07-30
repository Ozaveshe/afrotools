const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../../assets/js/ai/french-route-map.generated.js');
const ROWS = manifest.rows.filter((row) => row.family === 'cassava-processing');
const COUNTRY_ROWS = ROWS.filter((row) => row.country);
const HUB = ROWS.find((row) => !row.country);
function watchFailures(page) { const failures = []; page.on('console', (m) => { if (m.type() === 'error') failures.push(`console:${m.text()}`); }); page.on('pageerror', (e) => failures.push(`pageerror:${e.message}`)); page.on('requestfailed', (r) => failures.push(`requestfailed:${r.url()} ${r.failure() && r.failure().errorText}`)); page.on('response', (r) => { if (r.status() >= 400) failures.push(`http:${r.status()} ${r.url()}`); }); return failures; }
async function buffer(download) { const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk); return Buffer.concat(chunks); }

test('cassava-processing hub owns all 15 manifest country links', async ({ page }) => {
  const failures = watchFailures(page); await page.setViewportSize({ width: 320, height: 900 }); await page.goto(HUB.french.route);
  await expect(page.locator('.country-list a')).toHaveCount(15); await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(aiRouteMap.routes[HUB.english.routeKey]).toBe(HUB.french.routeKey); expect(failures).toEqual([]);
});

for (const row of COUNTRY_ROWS) {
  test(`${row.english.id} full route acceptance`, async ({ page, context }) => {
    const code = row.country.code; const failures = watchFailures(page); await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark' }); await page.setViewportSize({ width: 375, height: 900 }); await page.goto(row.french.route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr'); await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(code === 'CD' ? 'Congo-Kinshasa' : row.country.frenchName);
    expect(await page.locator('body').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(13, 22, 36)');
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', code);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.french.routeKey}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english.routeKey}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.french.routeKey}`);
    expect((await page.locator('script[type="application/ld+json"]').first().evaluate((e) => JSON.parse(e.textContent))).inLanguage).toBe('fr');
    expect(aiRouteMap.routes[row.english.routeKey]).toBe(row.french.routeKey);
    await expect(page.getByText('aucune saisie envoyée à un serveur')).toBeVisible(); await expect(page.getByText(/aucune donnée en direct/i)).toBeVisible();
    const controls = page.locator('input:not([type="hidden"]), select'); for (let index = 0; index < await controls.count(); index += 1) { const id = await controls.nth(index).getAttribute('id'); await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1); }
    const calculate = page.getByRole('button', { name: 'Calculer le bénéfice' }); await calculate.focus(); await expect(calculate).toBeFocused(); await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    const runtime = await page.evaluate(() => ({ result: window.__FR_AGRI_TEST__.latest.result, report: window.__FR_AGRI_TEST__.reportObject() }));
    expect(runtime.report.pays.code).toBe(code); expect(runtime.result.outputKg).toBeGreaterThan(0); expect(runtime.report.comparaison.length).toBeGreaterThan(0);
    const cases = [
      { name: 'Exporter en TXT', ext: '.txt', verify: (v) => expect(v.toString('utf8')).toContain('Confidentialité') },
      { name: 'Exporter en CSV', ext: '.csv', verify: (v) => expect(v.toString('utf8')).toContain('resultat_lot') },
      { name: 'Exporter en JSON', ext: '.json', verify: (v) => expect(JSON.parse(v.toString('utf8')).pays.code).toBe(code) },
      { name: 'Exporter en PDF', ext: '.pdf', verify: (v) => expect(v.subarray(0, 4).toString('ascii')).toBe('%PDF') },
    ];
    for (const item of cases) { const promise = page.waitForEvent('download'); await page.getByRole('button', { name: item.name }).click(); const download = await promise; const filename = download.suggestedFilename().toLowerCase(); expect(filename.includes(code.toLowerCase())).toBe(true); expect(filename.endsWith(item.ext)).toBe(true); item.verify(await buffer(download)); }
    await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
    expect(JSON.parse(await page.evaluate((c) => localStorage.getItem(`afrotools:fr-agriculture:cassava-processing:${c}`), code)).pays.code).toBe(code);
    await page.getByRole('button', { name: 'Copier' }).click(); await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('transformation du manioc');
    await page.emulateMedia({ colorScheme: 'light' }); expect(await page.locator('body').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(245, 248, 252)');
    await page.getByRole('button', { name: 'Thème sombre' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.setViewportSize({ width: 320, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 }); await page.evaluate(() => { document.body.style.zoom = '2'; }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Réinitialiser' }).click(); await page.getByLabel('Manioc frais par lot (tonnes)').fill('0'); await page.getByRole('button', { name: 'Calculer le bénéfice' }).click();
    await expect(page.getByRole('alert')).toContainText('au moins 0,1 tonne'); await expect(page.getByLabel('Manioc frais par lot (tonnes)')).toBeFocused();
    expect(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); return ids.filter((id, index) => ids.indexOf(id) !== index); })).toEqual([]);
    await expect(page.locator('a[href^="/"]:not([href^="/fr/"])')).toHaveCount(0); expect(failures).toEqual([]);
  });
}
