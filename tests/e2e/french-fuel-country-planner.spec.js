const { test, expect } = require('@playwright/test');
const snapshot = require('../../data/fuel/latest.json');

for (const [code, slug] of [['TN', 'tunisia'], ['TG', 'togo'], ['ML', 'mali'], ['NE', 'niger']]) {
  test(`${slug}: mobile planner uses correct units, valid inputs and dated sources`, async ({ page, baseURL }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.origin === new URL(baseURL).origin ? route.continue() : route.abort();
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/fr/tools/suivi-carburant/${slug}/`);
    const panel = page.locator('[data-fr-fuel-planner]');
    const output = panel.locator('output');
    const quantity = panel.locator('[name="litres_per_day"]');
    const days = panel.getByLabel('Jours par mois');
    const type = panel.getByLabel('Type de carburant');
    const row = snapshot.countries.find(item => item.code === code);
    const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${row.last_updated}T00:00:00Z`));
    await expect(page.locator('.fuel-trust')).toContainText(date);
    if (!row.official_verified) await expect(page.locator('.fuel-trust')).toContainText('non vérifié par une source officielle');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', new RegExp(date));
    await type.selectOption('lpg');
    await expect(panel.getByLabel('Kilogrammes par jour')).toBeVisible();
    await quantity.fill('2');
    await days.fill('5');
    const expected = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(10 * row.lpg.price);
    await expect(output).toContainText(`${expected} ${row.currency}`);
    await expect(output).toContainText('2 kg/jour de GPL');
    await expect(output).not.toContainText('litres');
    await quantity.fill('0');
    await expect(output).toContainText(`0 ${row.currency} par mois`);
    for (const invalid of ['0', '32', '1.5', '']) {
      await days.fill(invalid);
      await expect(output).toContainText('nombre entier de jours entre 1 et 31');
      await expect(days).toHaveAttribute('aria-invalid', 'true');
    }
    await days.fill('26');
    for (const invalid of ['-1', '']) {
      await quantity.fill(invalid);
      await expect(output).toContainText('quantité positive ou nulle');
    }
    await quantity.fill('10');
    await type.selectOption('diesel');
    await expect(panel.getByLabel('Litres par jour')).toBeVisible();
    await expect(output).toContainText('10 L/jour de Diesel');
    await expect(quantity).toHaveAttribute('aria-invalid', 'false');
    await quantity.focus();
    await page.keyboard.press('Tab');
    await expect(days).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    if (slug === 'tunisia') await panel.screenshot({ path: testInfo.outputPath('tunisia-fuel-planner-390.png') });
  });
}
