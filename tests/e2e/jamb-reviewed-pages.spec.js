const { test, expect } = require('@playwright/test');
const path = require('node:path');
const artifactRoot = process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1' ? '../../dist' : '../..';
const bank = require(path.resolve(__dirname, artifactRoot, 'data/jamb/pools/practice-pool.json'));

const routes = [
  '/jamb/commerce/1997/', '/jamb/english/2000/', '/jamb/english/2009/', '/jamb/mathematics/1987/'
];

for (const width of [390, 1440]) {
  for (const route of routes) {
    const [, , subject, year] = route.split('/');
    const expected = bank.questions.filter(q => q.subject === subject && String(q.year) === year);
    test(`JAMB review page remains usable at ${width}px: ${route}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', expected.length ? 'index, follow' : 'noindex, follow');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + route);
      await expect(page.locator('[data-reviewed-question]')).toHaveCount(expected.length);
      expect((await page.locator('[data-reviewed-question]').evaluateAll(nodes => nodes.map(n => n.dataset.reviewedQuestion))).sort()).toEqual(expected.map(q => q.id).sort());
      expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(n => JSON.parse(n.textContent)).filter(s => s['@type'] === 'Question').length)).toBe(Math.min(expected.length, 50));
      if (expected.length) {
        await expect(page.getByRole('heading', { name: 'This paper is under review' })).toHaveCount(0);
        await expect(page.locator('[data-reviewed-question] details[open]')).toHaveCount(0);
        const first = expected.find(q => !q.image);
        if (first) {
          const card = page.locator('[data-reviewed-question="' + first.id + '"]');
          await expect(card.locator('.qcard-text')).toHaveText(first.question);
          await card.locator('summary').click();
          await expect(card.locator('details')).toHaveAttribute('open', '');
          await expect(card.getByText(first.explanation, { exact: true })).toBeVisible();
        }
      } else {
        await expect(page.getByRole('heading', { name: 'This paper is under review' })).toBeVisible();
      }
      const planner = page.getByRole('link', { name: 'Plan your study week' });
      await expect(planner).toBeVisible();
      await planner.focus();
      await expect(planner).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      if (route === routes[0]) await page.screenshot({ path: testInfo.outputPath(`review-${width}.png`), fullPage: true });
      await planner.press('Enter');
      await expect(page).toHaveURL(/\/tools\/study-planner\/?$/);
      expect(errors).toEqual([]);
    });
  }
}
