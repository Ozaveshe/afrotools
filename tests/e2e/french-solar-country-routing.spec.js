const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const dataset = require('../../data/energy/solar-roi-country-dataset');
const countries = Object.values(dataset.countries);

for (const width of [1365, 390, 320]) {
  test(`French Solar country continuations and brief links remain French at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/fr/tools/roi-solaire/', { waitUntil: 'domcontentloaded' });
    const select = page.locator('#solarRootCountrySelect');
    await expect(select).toHaveAccessibleName('Sélectionner un pays');
    await expect(page.locator('#solarRootCountrySearch')).toHaveAccessibleName('Rechercher un pays');
    for (const country of countries) {
      await select.selectOption(country.slug);
      await expect(page.locator('#solarRootCountryOpen')).toHaveAttribute('href', `/fr/tools/roi-solaire/${country.slug}/`);
      await expect(page.locator('#solarRootCountryOpen')).toHaveText(/^Ouvrir le calculateur \(.+\)$/);
      await expect(page.locator('#solarRootCountryStatus')).toHaveText(/^Pays sélectionné : .+ — [A-Z]{3}$/);
      await expect(page.locator(`[data-country-slug="${country.slug}"]`)).toHaveAttribute('href', `/fr/tools/roi-solaire/${country.slug}/`);
    }
    await page.locator('#solarRootCountrySearch').fill('Sénégal');
    await expect(select).toHaveValue('senegal');
    await expect(page.locator('[data-country-slug="senegal"]')).toBeVisible();
    await expect(page.locator('#solarRootCountryOpen')).toHaveText('Ouvrir le calculateur (Sénégal)');
    await expect(page.locator('#solarRootCountryList option[value="Sénégal"]')).toHaveCount(1);
    await select.selectOption('kenya');
    const download = page.waitForEvent('download');
    await page.locator('#solarRootDownloadBrief').click();
    const brief = JSON.parse(fs.readFileSync(await (await download).path(), 'utf8'));
    expect(brief.route).toBe('/fr/tools/roi-solaire/kenya/');
    expect(brief.brief).toContain('/fr/tools/roi-solaire/kenya/');
    await page.locator('#solarRootCountryOpen').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/fr\/tools\/roi-solaire\/kenya\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const countrySelect = page.locator('#solarCountryPageSelect');
    for (const country of countries) {
      await countrySelect.selectOption(country.slug);
      await expect(page.locator('#solarCountryPageOpen')).toHaveAttribute('href', `/fr/tools/roi-solaire/${country.slug}/`);
      await expect(page.locator('#solarCountryPageOpen')).toHaveText(/^Ouvrir le calculateur \(.+\)$/);
      await expect(page.locator('#solarCountryPageStatus')).toHaveText(/^Pays sélectionné : .+ — [A-Z]{3}$/);
    }
    await page.locator('#solarCountryPageSearch').fill('Sénégal');
    await expect(countrySelect).toHaveValue('senegal');
    await expect(page.locator('#solarCountryPageOpen')).toHaveText('Ouvrir le calculateur (Sénégal)');
    await page.locator('#solarCountryPageSearch').fill('unknown-country!!!');
    await expect(page.locator('#solarCountryPageStatus')).toHaveText('Aucun pays trouvé. Continuez à saisir ou utilisez la liste.');
    await page.locator('#solarCountryPageSearch').fill('Ghana');
    await page.locator('#solarCountryPageSearch').press('Enter');
    await expect(page).toHaveURL(/\/fr\/tools\/roi-solaire\/ghana\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await page.goto('/fr/tools/roi-solaire/', { waitUntil: 'domcontentloaded' });
    await page.locator('#solarRootCountrySearch').fill('Ghana');
    await page.locator('#solarRootCountrySearch').press('Enter');
    await expect(page).toHaveURL(/\/fr\/tools\/roi-solaire\/ghana\/$/);
    await page.goto('/fr/tools/roi-solaire/', { waitUntil: 'domcontentloaded' });
    await select.selectOption('senegal');
    await page.locator('[data-country-slug="senegal"]').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/fr\/tools\/roi-solaire\/senegal\/$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    expect(errors).toEqual([]);
  });
}
