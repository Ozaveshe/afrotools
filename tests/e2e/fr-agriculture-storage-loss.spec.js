const { test, expect } = require('@playwright/test');
const ai = require('../../assets/js/ai/french-route-map.generated.js');

async function sentinel(page) {
  const response = await page.request.get('/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).toContain('worktree=7e83');
  expect(text).toContain('root=C:\\Users\\Oza\\.codex\\worktrees\\7e83\\afrotools');
}
function failures(page) {
  const found = [];
  page.on('console', message => {
    if (message.type() === 'error') found.push(`console:${message.text()}`);
  });
  page.on('pageerror', error => found.push(`pageerror:${error.message}`));
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) found.push(`requestfailed:${request.url()}`);
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (response.status() >= 400 && ['127.0.0.1', 'localhost'].includes(url.hostname)) {
      found.push(`http:${response.status()} ${response.url()}`);
    }
  });
  return found;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const input = {
  crop: 'maize',
  countryCode: 'SN',
  methodKey: 'traditional_granary',
  quantityTonnes: 5,
  durationMonths: 9,
  pricePerTonne: 120000,
};

test('accepted English Storage Loss workflow delegates to the shared engine', async ({ page }) => {
  await sentinel(page);
  const found = failures(page);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.goto('/agriculture/storage-loss/');
  await page.selectOption('#crop-select', input.crop);
  await page.selectOption('#country-select', input.countryCode);
  await page.fill('#quantity-input', String(input.quantityTonnes));
  await page.selectOption('#method-select', input.methodKey);
  await page.fill('#duration-input', String(input.durationMonths));
  await page.fill('#price-input', String(input.pricePerTonne));
  await page.getByRole('button', { name: /Calculate My Storage Losses/ }).click();
  const runtime = await page.evaluate(value => ({
    latest: window.STORAGE_LOSS_LAST_RESULT,
    expected: window.AfroTools.StorageLossEngine.calculate(value, window.STORAGE_DATA),
  }), input);
  expect(runtime.latest).toEqual(runtime.expected);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#impact-grid')).toContainText(String(runtime.expected.bagsNeeded));
  expect(found).toEqual([]);
});

test('French Storage Loss physical-route acceptance', async ({ page, context }) => {
  await sentinel(page);
  const found = failures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/storage-loss/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/storage-loss/');
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/storage-loss/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(ai.routes['/agriculture/storage-loss/']).toBe('/fr/agriculture/storage-loss/');
  await expect(page.getByText(/aucune saisie envoyée à un serveur/i)).toBeVisible();
  expect(await page.locator('.card').first().evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(21, 34, 55)');

  await page.selectOption('#crop', input.crop);
  await page.selectOption('#country', input.countryCode);
  await page.fill('#quantity', String(input.quantityTonnes));
  await page.selectOption('#method', input.methodKey);
  await page.fill('#duration', String(input.durationMonths));
  await page.fill('#price', String(input.pricePerTonne));
  const button = page.getByRole('button', { name: 'Estimer les pertes' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#resultPanel')).toBeVisible();
  const runtime = await page.evaluate(value => ({
    latest: window.__FR_AGRI_TEST__.latest,
    expected: window.__FR_AGRI_TEST__.engine.calculate(value, window.__FR_AGRI_TEST__.data),
    report: window.__FR_AGRI_TEST__.reportObject(),
  }), input);
  expect(runtime.latest).toEqual(runtime.expected);
  expect(runtime.report.sources.donneesEnDirect).toBe(false);
  expect(runtime.report.resultat.risqueAflatoxines).toBe(true);

  for (const item of [
    { name: 'Exporter en TXT', ext: '.txt', verify: value => expect(value.toString('utf8')).toContain('Confidentialité') },
    { name: 'Exporter en CSV', ext: '.csv', verify: value => expect(value.toString('utf8')).toContain('perte_actuelle_pct') },
    { name: 'Exporter en JSON', ext: '.json', verify: value => expect(JSON.parse(value.toString('utf8')).entrees.countryCode).toBe('SN') },
    { name: 'Exporter en PDF', ext: '.pdf', verify: value => expect(value.subarray(0, 4).toString('ascii')).toBe('%PDF') },
  ]) {
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await promise;
    expect(download.suggestedFilename().endsWith(item.ext)).toBe(true);
    item.verify(await buffer(download));
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('afrotools:fr-agriculture:storage-loss'))).entrees.countryCode).toBe('SN');
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Pertes après récolte');
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(245, 248, 252)');
  await page.getByRole('button', { name: 'Thème sombre' }).click();
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('#empty')).toBeVisible();
  await page.fill('#quantity', '0');
  await page.evaluate(() => window.__FR_AGRI_TEST__.calculate());
  await expect(page.getByRole('alert')).toContainText('quantité');
  await expect(page.locator('#quantity')).toBeFocused();
  expect(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    return ids.filter((value, index) => ids.indexOf(value) !== index);
  })).toEqual([]);
  expect(found).toEqual([]);
});
