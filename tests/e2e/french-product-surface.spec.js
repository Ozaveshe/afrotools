const { test, expect } = require('@playwright/test');

const forbiddenImplementationCopy = /Version française premium|Moteur source conservé|localisation DOM|SEO plus propre|Canonical, hreflang|routes? wrapper/i;

test.describe('French product surface', () => {
  test('homepage is French, static-first, and registry-backed', async ({ page }) => {
    await page.goto('/fr/');
    await expect(page.locator('h1')).toHaveText('Le bon outil, pour le bon pays et la bonne décision.');
    await expect(page.locator('[data-registry-count="tools.live_experiences"]')).toHaveText(/2[\s\u202f]?606\+/);
    await expect(page.locator('[data-registry-count="countries.published"]')).toHaveText('54');
    await expect(page.locator('[data-registry-count="categories.published"]')).toHaveText('32');
    await expect(page.locator('[data-registry-count="languages.site_published"]')).toHaveText('5');
    await expect(page.locator('body')).not.toContainText(/Nigeria PAYE Calculator|Suggestions, examples|Fonctionne en 2G/);
    await expect(page.locator('main')).not.toContainText(forbiddenImplementationCopy);
    await expect(page.getByRole('link', { name: 'Lire les conditions d’utilisation' })).toHaveAttribute('href', '/fr/terms-of-use/');
  });

  test('directory renders only genuine French registry records and filters them', async ({ page }) => {
    await page.goto('/fr/all-tools/');
    await expect(page.locator('#statLive')).toHaveText('1152');
    await expect(page.locator('#resultsCount')).toContainText('1 152 outils');
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
    await page.locator('#tokenAmount').fill('5000');
    await page.locator('#calcBtn').click();
    await expect(page.locator('#results')).toHaveClass(/on/);
    await expect(page.locator('#rDays')).toContainText('Jours estimés');
    await expect(page.locator('main')).not.toContainText(/Recharge Amount|Units Received|Estimated Days|Disclaimer:/);

    await page.goto('/fr/tools/roi-solaire/madagascar/');
    await expect(page.locator('h1')).toContainText('Madagascar');
    await expect(page.locator('main')).not.toContainText(/Installationation|peak sun (?:hrs|hours)|starts with grid bills|>Save</);

    await page.goto('/fr/tools/ng-pension/');
    await expect(page.locator('main')).not.toContainText(forbiddenImplementationCopy);
    await expect(page.locator('main')).not.toContainText(/moteur source|SEO local/i);
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.locator('#frPenBasic').fill('350000');
    await page.locator('#frPensionForm button[type="submit"]').click();
    await expect(page.locator('#frPensionResult')).toBeVisible();
    await expect(page.locator('#frPenTotal')).toContainText('NGN');
  });

  test('French blog is manifest-bounded and its selected article remains French', async ({ page }) => {
    await page.goto('/fr/blog/');
    await expect(page.locator('h1')).toHaveText('Guides AfroTools en français');
    await expect(page.locator('#blogStatus')).toHaveText('8 guides en français');
    await expect(page.locator('#blogGrid .article-card')).toHaveCount(8);
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
    await expect(noJsPage.locator('[data-registry-count="tools.live_experiences"]')).toHaveText(/2[\s\u202f]?606\+/);
    await expect(noJsPage.getByRole('link', { name: 'Parcourir tous les outils' })).toBeVisible();
    await noJsPage.goto('/fr/all-tools/');
    expect(await noJsPage.locator('#toolsGrid > a').count()).toBeGreaterThanOrEqual(4);
    await expect(noJsPage.getByRole('link', { name: /Calculateur (?:PAYE|Salaire Net)/ }).first()).toBeVisible();
    await noJs.close();

    const blocked = await browser.newContext();
    const blockedPage = await blocked.newPage();
    await blockedPage.route(/tool-registry|registry-counts/, (route) => route.abort());
    await blockedPage.goto('/fr/all-tools/');
    await expect(blockedPage.locator('#statLive')).toHaveText('1152');
    expect(await blockedPage.locator('#toolsGrid > a').count()).toBeGreaterThanOrEqual(4);
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
