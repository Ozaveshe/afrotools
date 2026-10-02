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
    await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
    await expect(page.locator('[data-snapshot-election-id="ss-president-2026"] time')).toHaveAttribute('datetime', '2026-12');
    await expect(page.locator('#searchInput')).toBeDisabled();
    const noJsNote = await page.locator('main noscript p').evaluate((node) => ({
      text: node.textContent,
      height: node.getBoundingClientRect().height
    }));
    expect(noJsNote.text).toContain('Search and filters require JavaScript.');
    expect(noJsNote.height).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: /Upcoming as of/ })).toBeVisible();
    const first = page.locator('[data-snapshot-election-id]').first();
    await first.locator('summary').click();
    const firstRecordId = await first.getAttribute('data-snapshot-election-id');
    const firstRecord = tracker.elections.find((record) => record.id === firstRecordId);
    const sourceLinks = first.locator('a[href^="https://"]');
    await expect(sourceLinks).toHaveCount(firstRecord.sources.filter((source) => source.type === 'official').length);
    for (const link of await sourceLinks.all()) await expect(link).toBeVisible();
    const countryLink = page.locator('.et-country-records a[href^="#election-"]').last();
    const target = (await countryLink.getAttribute('href')).slice(1);
    await countryLink.click();
    await expect(page.locator('#' + target)).toBeVisible();
  } finally {
    await context.close();
  }
});

test('failed JSON fetch keeps the published snapshot and disabled filters', async ({ page }) => {
  await page.route('**/data/government/africa-election-tracker.json', (route) => route.abort());
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#errorBox')).toContainText('published snapshot below may be older');
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
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
  await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('.et-metrics')).toHaveCount(0);
});

test('a valid-looking but mismatched ledger cannot replace the published snapshot', async ({ page }) => {
  const changed = JSON.parse(JSON.stringify(tracker));
  changed.elections[0].notes += ' A later record revision.';
  await page.route('**/data/government/africa-election-tracker.json', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(changed) }));
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#errorBox')).toContainText('did not match the published snapshot');
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(tracker.elections.length);
  await expect(page.locator('#searchInput')).toBeDisabled();
  await expect(page.locator('.et-country-records a[href^="#election-"]')).toHaveCount(tracker.elections.length);
});

test('successful JSON fetch enhances the snapshot with working filters', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 840 });
  await page.goto('/tools/africa-election-tracker/');
  await expect(page.locator('#searchInput')).toBeEnabled();
  await expect(page.locator('[data-snapshot-election-id]')).toHaveCount(0);
  await expect(page.locator('#upcomingOnly')).toBeChecked();
  await expect(page.locator('#election-ng-ekiti-governor-2026')).toHaveCount(0);
  await expect(page.locator('#election-cv-president-2026')).toBeVisible();
  await expect(page.locator('#electionList article').first()).toBeVisible();
  const southSudanDate = page.locator('#reviewQueue .et-side-item').filter({ hasText: 'South Sudan' }).locator('span').first();
  await expect(southSudanDate).toContainText('Dec 2026');
  await expect(southSudanDate).not.toContainText('22 Dec');
  await page.locator('.et-country-records a[href="#election-ng-ekiti-governor-2026"]').click();
  await expect(page.locator('#upcomingOnly')).not.toBeChecked();
  await expect(page.locator('#election-ng-ekiti-governor-2026')).toBeVisible();
  await expect(page).toHaveURL(/#election-ng-ekiti-governor-2026$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test('a direct record anchor remains valid after the calendar is enhanced', async ({ page }) => {
  await page.goto('/tools/africa-election-tracker/#election-ng-osun-governor-2026');
  await expect(page.locator('#searchInput')).toBeEnabled();
  await expect(page.locator('#election-ng-osun-governor-2026')).toBeVisible();
  await expect(page.locator('#election-ng-osun-governor-2026')).toContainText('Osun State');
  await expect(page.locator('#upcomingOnly')).not.toBeChecked();
});

test('a malformed record hash cannot disable a valid ledger', async ({ page }) => {
  await page.goto('/tools/africa-election-tracker/#election-%');
  await expect(page.locator('#searchInput')).toBeEnabled();
  await expect(page.locator('#errorBox')).toBeEmpty();
  await expect(page.locator('#upcomingOnly')).toBeChecked();
});
