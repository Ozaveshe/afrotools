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
  const values = [];
  page.on('console', message => {
    if (message.type() === 'error') values.push(message.text());
  });
  page.on('pageerror', error => values.push(error.message));
  page.on('requestfailed', request => {
    if (new URL(request.url()).hostname === '127.0.0.1') values.push(request.url());
  });
  return values;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
const input = { currency: 'GHS', farmValue: 950000, premiumRate: 4.5, excess: 12 };

test('English Crop Insurance hub delegates the accepted generic formula to the shared engine', async ({ page }) => {
  await sentinel(page);
  const errors = failures(page);
  await page.goto('/agriculture/crop-insurance/');
  const result = await page.evaluate(value => ({
    actual: window.AfroTools.day6AgricultureFamilyCalculators.calculate('crop-insurance', value),
    expected: window.AfroTools.CropInsuranceHubEngine.formatEnglish(window.AfroTools.CropInsuranceHubEngine.calculate(value)),
  }), input);
  expect(result.actual).toBe(result.expected);
  expect(errors).toEqual([]);
});

test('French Crop Insurance hub physical route acceptance', async ({ page, context }) => {
  await sentinel(page);
  const errors = failures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/crop-insurance/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/crop-insurance/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/agriculture/crop-insurance/');
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/crop-insurance/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(ai.routes['/agriculture/crop-insurance/']).toBe('/fr/agriculture/crop-insurance/');
  await expect(page.locator('#directory [data-code]')).toHaveCount(15);
  await page.getByLabel('Filtrer les 15 pays du référentiel').fill('Sénégal');
  await expect(page.locator('#directory [data-code]')).toHaveCount(1);
  await page.locator('#directory [data-code="SN"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#countryContext')).toContainText('Aucun statut actuel');
  await page.selectOption('#currency', input.currency);
  await page.fill('#farmValue', String(input.farmValue));
  await page.fill('#premiumRate', String(input.premiumRate));
  await page.fill('#excess', String(input.excess));
  const calculate = page.getByRole('button', { name: 'Estimer la prime et la part à charge' });
  await calculate.focus();
  await page.keyboard.press('Enter');
  const result = await page.evaluate(value => ({
    latest: window.__FR_AGRI_TEST__.latest,
    expected: window.__FR_AGRI_TEST__.engine.calculate(value),
    report: window.__FR_AGRI_TEST__.reportObject(),
  }), input);
  expect({ ...result.latest, countryCode: undefined }).toEqual({ ...result.expected, countryCode: undefined });
  expect(result.latest.countryCode).toBe('SN');
  expect(result.report.sources.donneesEnDirect).toBe(false);
  for (const item of [
    { name: 'Exporter en TXT', extension: '.txt' },
    { name: 'Exporter en CSV', extension: '.csv' },
    { name: 'Exporter en JSON', extension: '.json' },
    { name: 'Exporter en PDF', extension: '.pdf' },
  ]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain(item.extension);
    expect((await buffer(download)).length).toBeGreaterThan(3);
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Sénégal');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: 'Thème sombre' }).click();
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('#empty')).toBeVisible();
  expect(errors).toEqual([]);
});
