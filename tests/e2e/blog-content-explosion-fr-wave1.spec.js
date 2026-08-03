const { test, expect } = require('@playwright/test');

const ROUTES = [
  '/fr/blog/calcul-cout-employeur-cote-divoire/',
  '/fr/blog/calcul-cout-employeur-senegal/',
  '/fr/blog/calcul-cout-employeur-cameroun/',
  '/fr/blog/calcul-tva-cote-divoire-ht-ttc/',
  '/fr/blog/prevision-tresorerie-pme-afrique/',
  '/fr/blog/calcul-marge-mini-importation-afrique/',
  '/fr/blog/rentabilite-agent-mobile-money-pos/',
  '/fr/blog/calcul-frais-marketplace-afrique/',
  '/fr/blog/calcul-roi-solaire-cote-divoire/',
  '/fr/blog/comparer-forfaits-internet-cote-divoire/'
];

for (const route of ROUTES) {
  test(`l’article français est utilisable à 375 px sur ${route}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response && response.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.article-body')).toBeVisible();
    await expect(page.locator('.article-cta .btn')).toBeVisible();
    await expect(page.locator('.article-utility-bar')).toBeVisible();
    await expect(page.locator('.article-toc a').first()).toHaveAttribute('href', /^#.+/);
    await expect(page.locator('.faq-item')).toHaveCount(5);

    const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(pageOverflows).toBe(false);
    expect(pageErrors).toEqual([]);
  });
}

test('le hub français présente et filtre les dix nouveaux guides', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  const response = await page.goto('/fr/blog/', { waitUntil: 'domcontentloaded' });

  expect(response && response.ok()).toBe(true);
  await expect(page.locator('#blogGrid .article-card')).toHaveCount(18);
  await expect(page.locator('a[href="/fr/blog/calcul-roi-solaire-cote-divoire/"]')).toBeVisible();
  await page.locator('#blogSearchInput').fill('trésorerie');
  await expect(page.locator('#blogStatus')).toContainText('guide');
  await expect(page.locator('#blogGrid .article-card:not([hidden])')).toHaveCount(1);
  const pageOverflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(pageOverflows).toBe(false);
  expect(pageErrors).toEqual([]);
});
