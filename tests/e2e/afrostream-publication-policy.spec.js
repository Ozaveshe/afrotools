const { test, expect } = require('@playwright/test');

const prose = count => Array.from({ length: count }, (_, i) => 'word' + i).join(' ');
const original = { id: 42, slug: 'stable-story', external_id: 'stable-feed-id', title: 'Synthetic existing article', category: 'business', author: 'AfroStream Editorial', excerpt: 'Synthetic summary', body: prose(610), published_at: '2026-09-29T12:00:00Z', is_published: true };

// The release intentionally excludes the private admin HTML. Verify its
// deployment boundary and the shipped helper separately from the source form.
if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1') {
  for (const width of [1280, 390, 320]) {
    test(`artifact preserves private admin and serves the policy at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/tools/afrostream/admin.html');
      expect(response.status()).toBe(404);
      await expect(page.locator('#adminPanel')).toHaveCount(0);
      const helper = await page.request.get('/tools/afrostream/editorial-policy.js');
      expect(helper.status()).toBe(200);
      await page.addScriptTag({ url: '/tools/afrostream/editorial-policy.js' });
      const result = await page.evaluate(() => {
        const policy = window.AfroStreamEditorialPolicy;
        const row = { author: 'AfroStream Editorial', is_published: true, body: Array(599).fill('prose').join(' ') };
        return { minimum: policy.minWords, count: policy.wordCount(row.body), rejected: policy.publicationError(row), accepted: policy.publicationError({ ...row, body: row.body + ' prose' }), draft: policy.publicationError({ ...row, is_published: false }) };
      });
      expect(result).toEqual({ minimum: 600, count: 599, rejected: 'Article body needs at least 600 words before publishing (599 now). Drafts can be shorter.', accepted: null, draft: null });
    });
  }
} else for (const width of [1280, 390, 320]) {
  test(`admin drafts, minimum and edit preserve the article at ${width}px`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('afrostream_admin_token', 'synthetic-token'));
    await page.route('https://**/*', route => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/admin-session', route => route.fulfill({ json: { success: true } }));
    await page.route('**/api/admin/afrostream/**', async route => {
      const req = route.request();
      const url = new URL(req.url());
      const endpoint = url.pathname.replace('/api/admin/afrostream/', '');
      let data = [];
      if (req.method() !== 'GET') {
        const body = req.postDataJSON();
        writes.push({ method: req.method(), endpoint, body });
        data = [{ ...original, ...body, id: endpoint === 'news' ? 43 : 42 }];
      } else if (endpoint === 'news') data = [original];
      else if (endpoint === 'stats') data = {};
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto('/tools/afrostream/admin.html');
    await expect(page.locator('#adminPanel')).toBeVisible();
    await expect(page.locator('#newsList')).toContainText(original.title);
    const form = page.locator('#newsForm');
    await form.locator('[name="title"]').fill('Synthetic new report');
    await form.locator('[name="excerpt"]').fill('Synthetic summary');
    await form.locator('[name="body"]').fill(prose(599));
    await expect(page.locator('#newsWordCount')).toContainText('599 / 600');
    await form.getByRole('button', { name: 'Publish Article', exact: true }).click();
    await expect(page.getByText(/Article body needs at least 600 words/)).toBeVisible();
    expect(writes).toEqual([]);
    await form.getByRole('button', { name: 'Save Draft', exact: true }).click();
    await expect(page.getByText('Draft saved. It is not public.')).toBeVisible();
    expect(writes[0]).toMatchObject({ method: 'POST', endpoint: 'news', body: { is_published: false } });
    await page.locator('#newsList .as-admin-list-item').filter({ hasText: original.title }).getByRole('button', { name: 'Edit', exact: true }).click();
    expect(writes).toHaveLength(1);
    await expect(page.locator('#newsWordCount')).toContainText('610 / 600');
    await form.locator('[name="body"]').fill(prose(600));
    await form.getByRole('button', { name: 'Publish Article', exact: true }).click();
    await expect(page.getByText('Article published!')).toBeVisible();
    expect(writes[1]).toMatchObject({ method: 'PUT', endpoint: 'news/42', body: { is_published: true } });
    expect(writes.every(write => write.method !== 'DELETE')).toBe(true);
    expect(writes[1].body.slug).toBeUndefined();
    expect(writes[1].body.external_id).toBeUndefined();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
