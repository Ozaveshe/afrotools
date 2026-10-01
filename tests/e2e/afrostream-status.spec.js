const { test, expect } = require('@playwright/test');

test('Stream hero counts describe visible rows and conflicting live checks are flagged', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afrostream/');
  await expect(page.locator('#heroStats')).toContainText('Creators shown');
  await expect(page.locator('#heroStats')).not.toContainText('2,606+');
  await expect(page.locator('th[data-sort="nw"]')).toHaveCount(0);
  await expect(page.locator('#topThree')).not.toContainText('Est. Net Worth');

  const result = await page.evaluate(() => {
    isStaticPreviewHost = () => false;
    const now = new Date().toISOString();
    const data = {
      creators: [{ country: 'NG' }],
      streams: { live: [], upcoming: [] },
      news: [{}]
    };
    const health = {
      automation: {
        sync: { fetched_at: now }, livecheck: { fetched_at: now }, news_monitor: { fetched_at: now }
      },
      snapshots: { age_days: 0 },
      creators: { published: 407 },
      streams: { live_now: 8, last_24h: 12, latest_updated_age_hours: 0 },
      news: { total_published: 1211, latest_age_hours: 0 }
    };
    renderHeroStats(data);
    return {
      stats: Array.from(document.querySelectorAll('#heroStats .as-hero-stat')).map((item) => ({
        value: item.querySelector('.as-hero-stat-val').textContent,
        label: item.querySelector('.as-hero-stat-label').textContent
      })),
      streamLane: buildSourceLanes(data, health, null).streams
    };
  });
  expect(result.stats[0]).toEqual({ value: '1', label: 'Creators shown' });
  expect(result.stats[1]).toEqual({ value: '0', label: 'Streams shown live' });
  expect(result.streamLane.status).toBe('stale');
  expect(result.streamLane.detail).toContain('0 live streams shown');
  expect(result.streamLane.detail).toContain('marked 8');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('creator-card gifts keep unavailable values distinct from a reported zero', async ({ page }) => {
  await page.goto('/tools/afrostream/');
  expect(await page.evaluate(() => [hydrateCreatorRuntimeMetrics({ _raw: {}, gifts: 0 }).gifts, hydrateCreatorRuntimeMetrics({ _raw: { gift_revenue: 0 } }).gifts])).toEqual([null, 0]);
});
