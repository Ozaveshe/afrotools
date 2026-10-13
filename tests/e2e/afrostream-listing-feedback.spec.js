const { test, expect } = require('@playwright/test');

// Synthetic rows only; every non-local request is blocked, including analytics.
const rows = [
  { id: 1, slug: 'fixture-alpha', name: 'Fixture Alpha', country: 'NG', categories: 'Gaming', afro_score: 80, subscribers: 1200, primary_platform: 'youtube', avatar: '/fixture-broken-avatar.png' },
  { id: 2, slug: 'fixture-beta', name: 'Fixture Beta', country: 'KE', categories: 'Gaming', afro_score: 70, subscribers: 1000, primary_platform: 'youtube' },
  { id: 3, slug: 'fixture-gamma', name: 'Fixture Gamma', country: 'NG', categories: 'Music', afro_score: 60, subscribers: 900, primary_platform: 'youtube' },
  { id: 4, slug: 'fixture-delta', name: 'Fixture Delta', country: 'NG', categories: 'Gaming', afro_score: 50, subscribers: 800, primary_platform: 'youtube' }
];
function healthySource() {
  const now = new Date().toISOString();
  return { automation: { sync: { fetched_at: now }, livecheck: { fetched_at: now }, news_monitor: { fetched_at: now } }, snapshots: { age_days: 0 }, creators: { published: rows.length }, streams: { live_now: 0, latest_updated_age_hours: 0 }, news: { latest_age_hours: 0 } };
}
async function fixtureApi(page, state) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (url.pathname === '/fixture-broken-avatar.png') return route.fulfill({ status: 404, body: '' });
    if (!url.pathname.startsWith('/api/afrostream/')) return route.continue();
    let data = [];
    if (url.pathname.endsWith('/creators')) {
      state.requests = (state.requests || 0) + 1;
      if (state.gate) await state.gate;
      if (state.failed) return route.fulfill({ status: 503, body: 'Synthetic unavailable response' });
      data = state.rows;
    } else if (url.pathname.endsWith('/health')) {
      if (state.healthFailed) return route.fulfill({ status: 503, body: 'Synthetic unavailable response' });
      data = healthySource();
    } else if (url.pathname.endsWith('/creator')) {
      const creator = rows.find(row => row.slug === url.searchParams.get('slug'));
      data = { creator, streams: [], similar: [], snapshots: [], supporters: [], news: [], coverage: {} };
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
}
async function open(page, state) {
  await fixtureApi(page, state);
  await page.goto('/tools/afrostream/?live-preview=1');
}

test('archived date and unverified metrics are visible beside listings with freshness disclosure closed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { rows: rows.map(row => ({ ...row, source_state: 'fallback', source_snapshot_label: 'April 2026 seed snapshot' })), healthFailed: true });
  const status = page.locator('#asCreatorStatus');
  await expect(status).toContainText('Stale');
  await expect(status).toContainText('April 2026 seed snapshot');
  await expect(status).toContainText('Audience metrics are not freshness-verified');
  await expect(status).toBeVisible();
  await expect(page.locator('details:has(#asSourceRail)')).not.toHaveAttribute('open', '');
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(3);
  await expect(page.locator('#topThree .as-avatar-fallback').first()).toHaveText('F');
  await expect(page.locator('#topThree .as-avatar-fallback img')).toHaveCount(0);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator('#topThree .as-creator-card').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('#rankings').screenshot({ path: test.info().outputPath('archived-listings-390.png') });
});

test('loading and retry are single-flight and an empty response removes previous archived rows', async ({ page }) => {
  let release;
  const state = { rows, gate: new Promise(resolve => { release = resolve; }) };
  await open(page, state);
  await expect(page.locator('#asCreatorStatus')).toHaveText('Loading creator listings…');
  await expect(page.locator('#rankings')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#asRetryListings')).toBeDisabled();
  await page.evaluate(() => { init(); init(); });
  expect(state.requests).toBe(1);
  release();
  state.gate = null;
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(3);
  await expect(page.locator('#asRetryListings')).toBeEnabled();
  state.rows = [];
  await page.locator('#asRetryListings').click();
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(0);
  await expect(page.locator('#asCreatorStatus')).toContainText('No published creators returned');
  await expect(page.locator('#asCreatorStatus')).not.toContainText('could not be loaded');
  expect(state.requests).toBe(2);
});

test('unavailable response supports retry without retaining previous rows or claiming fresh data', async ({ page }) => {
  const state = { rows, failed: true, healthFailed: true };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, state);
  await expect(page.locator('#asCreatorStatus')).toContainText('Unavailable');
  await expect(page.locator('#topThree')).toContainText('Current creator rankings could not be checked');
  state.failed = false;
  await page.locator('#asRetryListings').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(3);
  await expect(page.locator('#asCreatorStatus')).toContainText('Data loaded, but we could not confirm how fresh it is');
  state.failed = true;
  await page.locator('#asRetryListings').click();
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(0);
  await expect(page.locator('#asRetryListings')).toBeFocused();
  expect(errors).toEqual([]);
});

test('search, country, keyboard category filters and clearing use the same creator set', async ({ page }) => {
  await open(page, { rows });
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(3);
  await page.locator('#countryFilter [data-val="Nigeria"]').click();
  await page.locator('#asSearch').fill('Beta');
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(0);
  await page.locator('#topThree').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('#asSearch')).toHaveValue('');
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(3);
  await page.locator('#asSearch').fill('Alpha');
  await page.locator('#countryFilter [data-val="Kenya"]').click();
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(0);
  await page.locator('#countryFilter [aria-checked="true"]').press('Home');
  await expect(page.locator('#countryFilter [data-val="All"]')).toBeFocused();
  await expect(page.locator('#topThree .as-creator-card')).toHaveCount(1);
  await page.locator('#catFilter [data-val="All"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#catFilter [aria-checked="true"]')).toBeFocused();
  await expect(page.locator('#catFilter [aria-checked="true"]')).toHaveAttribute('tabindex', '0');
  await page.keyboard.press('Home');
  await expect(page.locator('#topThree')).toContainText('Fixture Alpha');
});

test('keyboard profile navigation works from the same synthetic listing set', async ({ page }) => {
  await open(page, { rows });
  await expect(page.locator('#rankBody tr[role="link"]')).toHaveCount(1);
  await page.locator('details:has(#rankTable) summary').click();
  await page.locator('#rankBody tr[role="link"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#profileName')).toHaveText('Fixture Delta');
  await expect(page).toHaveURL(/creator\?id=fixture-delta$/);
});
