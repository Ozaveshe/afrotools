const { test, expect } = require('@playwright/test');
const server = require('../../netlify/functions/afrostream-article');

const report = {
  slug: 'layout-report', title: 'An African creator report with a longer headline for the article layout',
  category: 'gaming', author: 'AfroStream editorial', source_name: 'Original source',
  source_url: 'https://example.com/source', published_at: '2026-09-29T12:00:00Z',
  image_url: '/fixtures/portrait.svg', excerpt: 'A synthetic excerpt for layout verification.',
  body: 'Our original reporting.\n\n## What this means\n\n' + Array(130).fill('context').join(' ')
};

for (const kind of ['report', 'brief']) {
  for (const width of [1440, 1024, 390, 320]) {
    test(`${kind}: source sidebar starts at the story top on desktop and follows it at ${width}px`, async ({ page }, testInfo) => {
      const row = kind === 'report' ? report : { ...report, slug: 'layout-brief', author: 'A publisher', source_name: 'A publisher', body: 'Their feed excerpt.', excerpt: 'Their feed excerpt.' };
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.route('https://**/*', route => route.fulfill({ status: 204, body: '' }));
      await page.route('**/fixtures/portrait.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#dde5f7"/></svg>' }));
      await page.route('**/api/afrostream/**', route => route.fulfill({ json: { success: true, data: [] } }));
      await page.route('**/tools/afrostream/article.html?**', route => route.fulfill({ contentType: 'text/html', body: server.__test.articlePage(row) }));
      await page.goto(`/tools/afrostream/article.html?slug=${row.slug}`);
      await expect(page.locator('.scene-article-header h1')).toHaveText(row.title);
      await expect(page.locator('.as-story-media')).toHaveClass(/as-media-portrait/);
      const geometry = await page.evaluate(() => {
        const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        return { header: box('.scene-article-header'), main: box('.scene-article-main'), sidebar: box('.scene-article-sidebar'), overflow: document.documentElement.scrollWidth - innerWidth };
      });
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      if (width > 760) {
        expect(Math.abs(geometry.sidebar.top - geometry.header.top)).toBeLessThanOrEqual(1);
        expect(geometry.sidebar.left).toBeGreaterThan(geometry.main.right);
      } else {
        expect(geometry.sidebar.top).toBeGreaterThanOrEqual(geometry.main.bottom);
      }
      if (kind === 'brief') {
        await expect(page.locator('.scene-article-body')).toContainText('Continue at A publisher');
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
      } else {
        await expect(page.locator('.scene-article-body')).toContainText('Our original reporting.');
        await expect(page.locator('.scene-article-body .scene-button')).toHaveCount(0);
      }
      expect(errors).toEqual([]);
      if (kind === 'brief' && width === 1440) await page.screenshot({ path: testInfo.outputPath('article-sidebar-aligned.png'), fullPage: true });
    });
  }
}
