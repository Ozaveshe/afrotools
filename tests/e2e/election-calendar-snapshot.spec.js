const { test, expect } = require('@playwright/test');
const tracker = require('../../data/government/africa-election-tracker.json');

test('calendar is source-readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    javaScriptEnabled: false,
    serviceWorkers: 'block',
    viewport: { width: 375, height: 840 }
  });
  try {
    const page = await context.newPage();
    await page.goto('/tools/africa-election-tracker/');
    await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(tracker.elections.length);
    await expect(page.locator('[data-snapshot-election-id="ss-president-2026"] time')).toHaveAttribute('datetime', '2026-12');
    await expect(page.locator('#searchInput')).toBeDisabled();
    const noJsNote = await page.locator('main noscript p').evaluate((node) => ({
      text: node.textContent,
      height: node.getBoundingClientRect().height
    }));
    expect(noJsNote.text).toContain('Filters require JavaScript.');
    expect(noJsNote.height).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: /Upcoming as of/ })).toBeVisible();
    const first = page.locator('[data-snapshot-election-id]').first();
    await first.locator('summary').click();
    await expect(first.locator('a[href^="https://"]')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('failed JSON fetch keeps the published snapshot and disabled filters', async ({ page }) => {
  await page.route('**/data/government/africa-election-tracker.json', (route) => route.abort());
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#errorBox')).toContainText('published snapshot below may be older');
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('#searchInput')).toBeDisabled();
  await expect(page.locator('#resultCount')).toContainText('live filters unavailable');
});

test('malformed JSON cannot leave active filters over the snapshot', async ({ page }) => {
  const malformed = {
    generatedAt: tracker.generatedAt,
    reviewCadenceDays: 7,
    elections: [{ country: 'Test', office: 'President', electionDate: '2026-11-01' }]
  };
  await page.route('**/data/government/africa-election-tracker.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(malformed) }));
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#errorBox')).toContainText('published snapshot below may be older');
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('#searchInput')).toBeDisabled();
  await expect(page.locator('#metricRecords')).toHaveText('—');
});

test('successful JSON fetch enhances the snapshot with working filters', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 840 });
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#searchInput')).toBeEnabled();
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(0);
  await expect(page.locator('#electionList article').first()).toBeVisible();
  const southSudanDate = page.locator('#reviewQueue .et-side-item').filter({ hasText: 'South Sudan' }).locator('span').first();
  await expect(southSudanDate).toContainText('Dec 2026');
  await expect(southSudanDate).not.toContainText('22 Dec');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
