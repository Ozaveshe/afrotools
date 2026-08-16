const { test, expect } = require('@playwright/test');

test.describe('French search growth hotspots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('fuel country page is native French, interactive, and mobile-safe', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/tools/suivi-carburant/senegal/');
    await expect(page.locator('h1')).toHaveText('Prix du carburant — Sénégal');
    await expect(page.locator('meta[name="afrotools-source-owner"]')).toHaveAttribute('content', 'scripts/build-french-fuel-country-pages.js');
    await expect(page.locator('[data-language-fallback-notice], [data-explicit-language-fallback]')).toHaveCount(0);
    await expect(page.locator('.fuel-faq details')).toHaveCount(6);

    await page.locator('[name="litres_per_day"]').fill('12');
    await page.locator('[name="days_per_month"]').fill('20');
    await page.locator('[name="fuel_type"]').selectOption('diesel');
    await expect(page.locator('[data-fuel-planner-output]')).toContainText('carburant (Diesel)');
    await expect(page.locator('[data-fuel-planner-output]')).toContainText('Vérifiez le prix local');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test('Orange Money guide renders official-source comparison without mobile overflow', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/fr/blog/frais-orange-money-guide-2026/');
    await expect(page.locator('h1')).toContainText('Frais de retrait Orange Money 2026');
    await expect(page.locator('.article-body table')).toHaveCount(4);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://orangemoney.orange.cm/fr/tarification-orange-money.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0"]').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/plus de 30 millions|Western Union.*2 500/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(consoleErrors).toEqual([]);
  });

  test('mobile-money comparison stays native French and contains wide tables safely', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/blog/mobile-money-fees-africa-compared/');
    await expect(page.locator('h1')).toHaveText('Frais mobile money en Afrique : comparatif par pays');
    await expect(page.locator('meta[name="afrotools-source-owner"]')).toHaveAttribute('content', 'scripts/build-french-mobile-money-editorial.js');
    await expect(page.locator('[data-language-fallback-notice], [data-explicit-language-fallback]')).toHaveCount(0);
    await expect(page.locator('.article-body table')).toHaveCount(2);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://www.mtn.co.ug/tariffs/mobile-money-tariffs/"]').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/By Equipe|Published Mar|Compare transfer cost/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('Wave and Orange guide exposes corrected tariffs and sources without mobile overflow', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/blog/wave-vs-orange-money-senegal-2026/');
    await expect(page.locator('h1')).toHaveText('Wave vs Orange Money au Sénégal : quels frais en 2026 ?');
    await expect(page.locator('.article-body table')).toHaveCount(2);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://www.wave.com/fr/"]').first()).toBeVisible();
    await expect(page.locator('a[href="https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0"]').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Wave affiche les dépôts et retraits sans frais/i);
    await expect(page.locator('body')).not.toContainText(/transferts entre comptes Wave sont entièrement gratuits/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('Senegal IRPP guide exposes seven bands and calculator limits on mobile', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/blog/guide-irpp-senegal-2026/');
    await expect(page.locator('h1')).toHaveText('IRPP au Sénégal en 2026 : barème, parts et salaire net');
    await expect(page.locator('.article-body table tbody tr')).toHaveCount(7);
    await expect(page.locator('.faq-section details')).toHaveCount(4);
    await expect(page.locator('a[href="https://www.dgid.sn/simulateur-part/"]').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/ne calcule pas la réduction pour charges de famille/i);
    await expect(page.locator('body')).not.toContainText(/Marié\(e\) sans enfant[\s\S]*2 parts/i);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('teacher salary snippet promise resolves to a working mobile calculator', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/tools/salaire-enseignant/');
    await expect(page.locator('h1')).toHaveText('Calculateur de salaire enseignant');
    await expect(page.locator('body')).toContainText(/sans inventer de barème national/i);
    await page.getByRole('button', { name: 'Calculer et vérifier' }).click();
    await expect(page.locator('[data-education-result]')).toHaveClass(/show/);
    await expect(page.locator('[data-education-metrics] .metric')).toHaveCount(4);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('Burkina VAT blocks the reduced rate until Article 317 evidence is confirmed', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/burkina-faso/calculateur-tva');
    await expect(page.locator('h1')).toContainText('Calculateur de TVA');
    await page.locator('#amount').fill('100000');
    await page.locator('#rate').selectOption('0.10');
    await expect(page.locator('#rateError')).toContainText(/Confirmez l'hébergement ou la restauration/i);
    await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);

    await page.locator('#rateConfirmed').check();
    await expect(page.locator('#resultsCard')).toHaveClass(/on/);
    await expect(page.locator('#resAmount')).toContainText(/110.?000/);
    await expect(page.locator('#resContent')).toContainText('TVA (10%)');
    await expect(page.locator('a[href="https://dgi.bf/verification/CGI"]').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('Algeria salary page calculates reviewed IRG locally without salary transmission', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    const sensitiveRequests = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });
    page.on('request', (request) => {
      const payload = request.postData() || '';
      if (/ai-advisor|pdf-leads/i.test(request.url()) || /gross_salary|2000000/.test(payload)) {
        sensitiveRequests.push(request.url());
      }
    });

    await page.goto('/fr/algerie/calculateur-salaire-net');
    await expect(page.locator('h1')).toContainText('Calculateur de salaire net');
    await page.locator('#grossSalary').fill('2000000');
    await page.getByRole('button', { name: /Calculer mon salaire net/ }).click();
    await expect(page.locator('#resultsCard')).toHaveClass(/on/);
    await expect(page.locator('.res-hero-label')).toHaveText('Salaire net annuel');
    await expect(page.locator('#resAmount')).toContainText(/1.?395.?200/);
    await expect(page.locator('#resContent')).toContainText('Abattements salariaux DGI');
    await expect(page.locator(`a[href="https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires"]`)).toBeVisible();
    await expect(page.locator(`a[href="https://cnas.dz/fr/employeur/"]`)).toBeVisible();

    await page.getByRole('button', { name: 'Net → Brut' }).click();
    await page.locator('#grossSalary').fill('1000000');
    await page.getByRole('button', { name: /Calculer mon salaire net/ }).click();
    await expect(page.locator('.res-hero-label')).toHaveText('Brut annuel requis');
    await expect(page.locator('#resGross')).toContainText('/an');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(sensitiveRequests).toEqual([]);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('RDC salary guide compares an offer to the official SMIG without invented ranges', async ({ page }) => {
    const consoleErrors = [];
    const missingResources = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await page.goto('/fr/blog/salaire-moyen-rdc-2026/');
    await expect(page.locator('h1')).toContainText('Salaire moyen en RDC 2026');
    await page.locator('#salary').fill('1000000');
    await page.locator('#days').fill('26');
    await page.locator('#coefficient').fill('100');
    await expect(page.locator('#range-output')).toContainText(/559.?000/);
    await expect(page.locator('#position-output')).toContainText(/441.?000/);

    await page.locator('#coefficient').fill('200');
    await expect(page.locator('#range-output')).toContainText(/1.?118.?000/);
    await expect(page.locator('#position-output')).toContainText(/-118.?000/);
    await expect(page.locator('#decision-output')).toContainText('Sous la référence saisie');
    await expect(page.locator('a[href*="decret-n-25-22-du-30-mai-2025"]').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(missingResources).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
