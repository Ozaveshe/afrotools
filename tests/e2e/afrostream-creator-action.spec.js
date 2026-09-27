const { test, expect } = require('@playwright/test');

const creator = {
  id: 42,
  slug: 'test-creator',
  name: 'Test Creator',
  country: 'NG',
  bio: 'A published creator profile used for a synthetic browser test.',
  categories: 'Education',
  primary_platform: 'youtube',
  youtube_url: 'https://www.youtube.com/@testcreator',
  total_followers: 1200,
  is_published: true
};

async function mockCreatorApi(page, row = creator) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/afrostream/creator') {
      const found = url.searchParams.get('slug') === row.slug;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(found
        ? { success: true, data: { creator: row, streams: [], similar: [], snapshots: [], supporters: [], news: [], coverage: {} } }
        : { success: false, data: null }) });
    }
    if (url.pathname === '/api/afrostream/creators') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [row] }) });
    }
    if (url.pathname.startsWith('/api/afrostream/')) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

test('creator profile opens a real platform and rejects an unknown creator', async ({ page }) => {
  await mockCreatorApi(page);
  await page.goto('/tools/afrostream/creator.html?id=test-creator');
  await expect(page.locator('#profileName')).toHaveText('Test Creator');
  await expect(page).toHaveURL(/\/tools\/afrostream\/creator\?id=test-creator$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/tools\/afrostream\/creator\?id=test-creator$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('#followPlatformBtn')).toHaveText('Follow on YouTube');
  await expect(page.locator('#followPlatformBtn')).toHaveAttribute('href', creator.youtube_url);
  await expect(page.locator('#platformFollowNote')).toContainText('platform link');
  await expect(page.locator('#followBtn')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#followPlatformBtn').focus();
  await expect(page.locator('#followPlatformBtn')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/tools/afrostream/creator.html?id=unknown-creator');
  await expect(page.getByRole('heading', { name: 'Creator profile unavailable' })).toBeVisible();
  await expect(page.locator('#profileName')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('creator profile does not open an untrusted platform URL', async ({ page }) => {
  await mockCreatorApi(page, { ...creator, youtube_url: 'https://youtube.com.attacker.example/@testcreator' });
  await page.goto('/tools/afrostream/creator.html?id=test-creator');
  await expect(page.locator('#profileName')).toHaveText('Test Creator');
  await expect(page.locator('#followPlatformBtn')).toBeHidden();
  await expect(page.locator('#platformFollowNote')).toContainText('not available');
  await expect(page.locator('#profilePlatforms a')).toHaveCount(0);
});
