const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'serial' });

for (const scenario of [
  { width: 320, colorScheme: 'light' },
  { width: 375, colorScheme: 'dark' }
]) {
  test(`French malaria workflow is safe at ${scenario.width}px in ${scenario.colorScheme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.emulateMedia({ colorScheme: scenario.colorScheme });
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

    await page.goto('/fr/tools/risque-paludisme/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page).toHaveTitle(/Checklist de dépistage du paludisme/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('urgence du dépistage');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.colorScheme);

    await page.getByLabel('Séjour récent ou passage dans un lieu où le paludisme peut être présent').selectOption('yes');
    await page.getByLabel('Test de paludisme le plus récent pour ces symptômes').selectOption('none');
    await page.getByLabel(/Quand les symptômes actuels/).selectOption('today');
    await page.getByLabel('Fièvre ou sensation de fièvre').check();
    const submit = page.getByRole('button', { name: 'Vérifier l’urgence du dépistage' });
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Dépistage du paludisme aujourd’hui')).toBeVisible();
    await expect(page.getByText(/test parasitologique du paludisme/)).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger en TXT' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('urgence-depistage-paludisme.txt');
    const stream = await download.createReadStream();
    let report = '';
    for await (const chunk of stream) report += chunk.toString('utf8');
    expect(report).toContain('Dépistage du paludisme aujourd’hui');
    expect(report).toContain('aucun modèle géographique de prévalence');
    await page.evaluate(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.getByRole('button', { name: 'Imprimer ou enregistrer en PDF' }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);

    await page.getByLabel('Test de paludisme le plus récent pour ces symptômes').selectOption('negative');
    await page.getByLabel('Impossible de garder des liquides').check();
    await submit.click();
    await expect(page.getByText('Urgences maintenant')).toBeVisible();
    await expect(page.getByText(/même après un test négatif ou en attente/)).toBeVisible();

    const beforeTheme = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: beforeTheme === 'dark' ? 'Mode clair' : 'Mode sombre' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', beforeTheme);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const browserStorage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage)
    }));
    expect(overflow).toBeLessThanOrEqual(0);
    expect(browserStorage).toEqual({ local: [], session: [] });
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
