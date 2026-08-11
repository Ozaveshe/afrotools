const { test, expect } = require('@playwright/test');
const wave = require('../../data/content/blog-multilingual-wave-2026-08.json');

const routeFor = (locale, slug) => locale === 'en'
  ? `/blog/${slug}/`
  : locale === 'fr'
    ? `/fr/blog/${slug}/`
    : `/sw/blogu/${slug}/`;

for (const locale of ['en', 'fr', 'sw']) {
  test(`${locale} multilingual blog wave renders at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const topic of wave.topics) {
      const article = topic.locales[locale];
      await page.goto(routeFor(locale, article.slug));
      await expect(page.getByRole('heading', { level: 1, name: article.title })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${routeFor(locale, article.slug)}`);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `${locale}/${article.slug} should not overflow horizontally`).toBe(false);
    }
  });
}

test('language hubs list every new article and the recovered English cards', async ({ page }) => {
  for (const locale of ['en', 'fr', 'sw']) {
    const hub = locale === 'en' ? '/blog/' : locale === 'fr' ? '/fr/blog/' : '/sw/blogu/';
    await page.goto(hub);
    for (const topic of wave.topics) {
      const article = topic.locales[locale];
      expect(await page.locator(`a[href="${routeFor(locale, article.slug)}"]`).count()).toBeGreaterThan(0);
    }
  }

  await page.goto('/blog/');
  for (const article of wave.existingEnglishHubCards) {
    expect(await page.locator(`a[href="/blog/${article.slug}/"]`).count()).toBeGreaterThan(0);
  }
});
