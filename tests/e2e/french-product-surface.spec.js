const { test, expect } = require('@playwright/test');
const blogManifest = require('../../data/localization/fr-blog-manifest.json');

const forbiddenImplementationCopy = /Version française premium|Moteur source conservé|localisation DOM|SEO plus propre|Canonical, hreflang|routes? wrapper/i;

test.describe('French product surface', () => {
  test('homepage is French, static-first, and registry-backed', async ({ page }) => {
    await page.goto('/fr/');
    await expect(page.locator('h1')).toHaveText('Le bon outil, pour le bon pays et la bonne décision.');
    const liveExperienceText = await page.locator('[data-registry-count="tools.live_experiences"]').textContent();
    expect(Number(liveExperienceText.replace(/\D/g, ''))).toBeGreaterThanOrEqual(2600);
    await expect(page.locator('[data-registry-count="countries.published"]')).toHaveText('54');
    await expect(page.locator('[data-registry-count="categories.published"]')).toHaveText('32');
    await expect(page.locator('[data-registry-count="languages.site_published"]')).toHaveText('5');
    await expect(page.locator('body')).not.toContainText(/Nigeria PAYE Calculator|Suggestions, examples|Fonctionne en 2G/);
    await expect(page.locator('main')).not.toContainText(forbiddenImplementationCopy);
    await expect(page.getByRole('link', { name: 'Lire les conditions d’utilisation' })).toHaveAttribute('href', '/fr/terms-of-use/');
  });

  test('directory renders only genuine French registry records and filters them', async ({ page }) => {
    await page.goto('/fr/all-tools/');
    const publishedFrenchCount = Number(await page.locator('#statLive').textContent());
    expect(publishedFrenchCount).toBeGreaterThanOrEqual(1257);
    const resultsText = await page.locator('#resultsCount').textContent();
    const directoryMatch = resultsText.match(/sur\s+([\d\s\u202f]+)\s+outils/i);
    expect(directoryMatch).not.toBeNull();
    const directoryFrenchCount = Number(directoryMatch[1].replace(/\D/g, ''));
    expect(directoryFrenchCount).toBeGreaterThanOrEqual(1257);
    expect(publishedFrenchCount).toBe(directoryFrenchCount);
    await page.locator('#searchInput').fill('transfert');
    // The canonical tool remains; its retired duplicate registry ID must not add a second card.
    await expect(page.locator('#toolsGrid a[href="/fr/tools/transfert-argent/"]')).toHaveCount(1);
    await page.locator('#searchInput').fill('');
    const hrefs = await page.locator('#toolsGrid > a').evaluateAll((nodes) => nodes.slice(0, 50).map((node) => node.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(10);
    expect(hrefs.every((href) => href && href.startsWith('/fr/'))).toBeTruthy();
    await page.locator('#searchInput').fill('PDF');
    await expect(page.locator('#resultsCount')).toContainText(/outil/);
    await expect(page.locator('#toolsGrid > a').first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/African Car Price Directory|AI Business Planner|Business Registration Checklist/);
  });

  test('representative tax, utility, solar, and pension pages hide implementation copy', async ({ page }) => {
    await page.goto('/fr/tools/gh-wht/');
    await expect(page.locator('h1')).toContainText('retenue à la source');
    await expect(page.locator('body')).not.toContainText(forbiddenImplementationCopy);
    await expect(page.locator('body')).not.toContainText('.gh-seo,.gh-faq');

    await page.goto('/fr/tools/compteur-prepaye/central-african-republic/');
    await expect(page.locator('h1')).toContainText('République centrafricaine');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('main a[href="/fr/tools/compteur-prepaye/"]').first()).toBeVisible();
    await page.goto('/fr/tools/compteur-prepaye/');
    await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
    await page.locator('#electricityCountry').selectOption('GH');
    await page.locator('#electricityCustomRate').fill('2.5');
    await page.locator('#electricityCustomFixed').fill('10');
    await page.locator('#electricityCustomTax').fill('10');
    await page.locator('#electricityAmount').fill('66');
    await page.locator('.electricity-button').click();
    await expect(page.locator('#electricityPrimary')).toContainText('20 kWh');
    await expect(page.locator('#electricitySourceTitle')).toContainText(/personnalisé/i);
    await expect(page.locator('main')).not.toContainText(/Recharge Amount|Units Received|Estimated Days|Disclaimer:/);

    await page.goto('/fr/tools/roi-solaire/madagascar/');
    await expect(page.locator('h1')).toContainText('Madagascar');
    await expect(page.locator('main')).not.toContainText(/Installationation|peak sun (?:hrs|hours)|starts with grid bills|>Save</);

    await page.goto('/fr/tools/ng-pension/');
    await expect(page.locator('main')).not.toContainText(forbiddenImplementationCopy);
    await expect(page.locator('main')).not.toContainText(/moteur source|SEO local/i);
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.locator('#np-emoluments').fill('350000');
    await page.locator('#np-return').fill('5');
    await page.locator('#np-source').fill('PRA 2014, article 4');
    await page.locator('#np-source-date').fill('2026-07-30');
    await page.locator('#np-return-source').fill('Hypothèse de planification');
    await page.locator('#np-return-date').fill('2026-07-30');
    await page.locator('#np-form button[type="submit"]').click();
    await expect(page.locator('#np-results')).toBeVisible();
    await expect(page.locator('#np-balance-result')).toContainText('NGN');
  });

  test('French blog is manifest-bounded and its selected article remains French', async ({ page }) => {
    await page.goto('/fr/blog/');
    await expect(page.locator('h1')).toHaveText('Guides pratiques pour l’argent, le travail et les décisions du quotidien');
    await expect(page.locator('#blogStatus')).toContainText(String(blogManifest.articles.length));
    await expect(page.locator('[data-blog-card]')).toHaveCount(blogManifest.articles.length);
    await expect(page.locator('body')).not.toContainText(/Published guides|Tool-led articles|All Articles|Read article/);
    await page.goto('/fr/blog/tva-maroc-taux-calcul/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText(/TVA.*Maroc/i);
    await expect(page.locator('body')).not.toContainText(forbiddenImplementationCopy);
  });

  test('legal and contact journeys keep a French destination', async ({ page }) => {
    await page.goto('/fr/terms-of-use/');
    await expect(page.locator('h1')).toHaveText('Conditions d’utilisation');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/terms-of-use/');
    await page.goto('/fr/terms/');
    await page.waitForURL('**/fr/terms-of-use/');
    await page.goto('/fr/privacy/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveText('Politique de confidentialité');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('main')).toContainText('Calculateur local');
    await expect(page.locator('main')).not.toContainText(/Privacy Policy|Data We Collect|Your Rights|Contact us/);
    await page.goto('/fr/contact/');
    await expect(page.locator('h1')).toContainText(/Contact/i);
    await expect(page.locator('body')).not.toContainText(forbiddenImplementationCopy);
    await page.goto('/fr/auth/?mode=login&next=%2Ffr%2Fdashboard%2F');
    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.getByLabel('Adresse e-mail').first()).toBeVisible();
    await page.goto('/fr/dashboard/');
    await expect(page.locator('main')).toContainText('Les applications avancées restent partiellement en anglais.');
  });

  test('initial HTML remains useful without JavaScript or registry requests', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJs.newPage();
    await noJsPage.goto('/fr/');
    const noJsLiveText = await noJsPage.locator('[data-registry-count="tools.live_experiences"]').textContent();
    expect(Number(noJsLiveText.replace(/\D/g, ''))).toBeGreaterThanOrEqual(2600);
    await expect(noJsPage.getByRole('link', { name: 'Parcourir tous les outils' })).toBeVisible();
    await noJsPage.goto('/fr/all-tools/');
    expect(await noJsPage.locator('#toolsGrid [data-directory-record]').count()).toBeGreaterThanOrEqual(1257);
    await expect(noJsPage.getByRole('link', { name: /Calculateur (?:PAYE|Salaire Net)/ }).first()).toBeVisible();
    await noJs.close();

    const blocked = await browser.newContext();
    const blockedPage = await blocked.newPage();
    await blockedPage.route(/tool-registry|registry-counts/, (route) => route.abort());
    await blockedPage.goto('/fr/all-tools/');
    const blockedFrenchCount = Number(await blockedPage.locator('#statLive').textContent());
    expect(blockedFrenchCount).toBeGreaterThanOrEqual(1257);
    expect(await blockedPage.locator('#toolsGrid [data-directory-record]').count()).toBe(blockedFrenchCount);
    await blocked.close();
  });

  test('mobile homepage preserves one semantic tree and usable navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/fr/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.fr-search input')).toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    const menu = page.getByRole('button', { name: /menu/i }).first();
    if (await menu.count()) {
      await menu.click();
      await expect(page.getByRole('link', { name: /Salaire & Impôts/i }).first()).toBeVisible();
    }
  });
});
