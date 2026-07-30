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

test('English Export Documents hub delegates appended registry groups to the pure directory engine', async ({ page }) => {
  await sentinel(page);
  const errors = failures(page);
  await page.goto('/agriculture/export-docs/');
  const result = await page.evaluate(() => ({
    directory: window.EXPORT_DOCS_DIRECTORY,
    expected: window.AfroTools.ExportDocsDirectoryEngine.buildDirectory(
      window.AfroTools.countryIndex,
      window.AfroTools.regionLabels,
      ['west_africa', 'east_africa', 'central_africa', 'southern_africa', 'north_africa', 'island_nations'],
    ),
    cardCount: document.querySelectorAll('#hubMain .country-card').length,
  }));
  expect(result.directory).toEqual(result.expected);
  expect(result.directory.count).toBe(54);
  expect(result.cardCount).toBe(108);
  expect(errors).toEqual([]);
});

test('French Export Documents hub has native local directory UX and complete acceptance proof', async ({ page, context }) => {
  await sentinel(page);
  const errors = failures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/export-docs/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/export-docs/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/agriculture/export-docs/');
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/export-docs/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(ai.routes['/agriculture/export-docs/']).toBe('/fr/agriculture/export-docs/');
  await expect(page.locator('#directory [data-code]')).toHaveCount(54);
  await page.getByLabel('Rechercher un pays, un code ou une culture').fill('Sénégal');
  await expect(page.locator('#directory [data-code]')).toHaveCount(1);
  const choice = page.locator('#directory [data-code="SN"]');
  await choice.focus();
  await page.keyboard.press('Enter');
  const result = await page.evaluate(() => ({
    latest: window.__FR_AGRI_TEST__.latest,
    expected: window.__FR_AGRI_TEST__.engine.select(window.__FR_AGRI_TEST__.directory, 'SN').country,
    report: window.__FR_AGRI_TEST__.reportObject(),
  }));
  expect(result.latest).toEqual(result.expected);
  expect(result.latest.code).toBe('SN');
  expect(result.report.sources.donneesEnDirect).toBe(false);
  expect(result.report.limitations.join(' ')).toContain('non officiel');
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
