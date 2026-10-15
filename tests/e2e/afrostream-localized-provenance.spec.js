const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const archived = { name: 'Fixture Archive', country: 'Nigeria', categories: 'Gaming', subscribers: 10, afro_score: 7, slug: 'fixture-archive', primary_platform: 'youtube', source_state: 'fallback', source_snapshot_label: 'April 2026 seed snapshot', source_reviewed_at: '2026-07-27', source_metrics_freshness: 'unverified', updated_at: '2026-10-13T00:00:00Z' };
const healthy = { name: 'Fixture API', country: 'Kenya', categories: 'Education', subscribers: 20, afro_score: 9, slug: 'fixture-api', primary_platform: 'youtube', updated_at: '2026-10-12T00:00:00Z' };
const locales = [
  { id: 'fr', route: '/fr/tools/afrostream-afrique-s-createur-streaming-hub/', status: '#afsStatus', freshness: '#afsFreshness', search: '#afsSearch', country: '#afsCountry', cards: '.afs-creator', json: '#afsExportJson', csv: '#afsExportCsv', warning: 'Les chiffres d’audience ne sont pas confirmés comme actuels', archiveState: 'archived', mixedState: 'mixed' },
  { id: 'sw', route: '/sw/zana/afrostream/', status: '[data-status]', freshness: '[data-freshness]', search: '[data-search]', country: '[data-country]', cards: '.swfa-result', json: '[data-export="json"]', csv: '[data-export="csv"]', warning: 'Takwimu za hadhira hazijathibitishwa kuwa za sasa', archiveState: 'snapshot ya kumbukumbu', mixedState: 'data ya API na kumbukumbu' }
];
async function fixtures(page, state) {
  await page.addInitScript(() => { localStorage.setItem('afrotools_cookie_consent', 'declined'); localStorage.setItem('aft_theme', 'light'); });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (url.pathname === '/data/afrostream/creators-fallback.json') {
      if (state.staticFailed) return route.fulfill({ status: 503, body: '{}' });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ creators: [healthy], source: { snapshot_label: 'Synthetic dated archive', reviewed_at: '2026-07-01', metrics_freshness: 'unverified' } }) });
    }
    if (url.pathname.startsWith('/api/afrostream/')) {
      state.apiRequests = (state.apiRequests || 0) + 1;
      if (state.failed) return route.fulfill({ status: 503, body: '{}' });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: url.pathname.endsWith('/creators') ? state.rows : [] }) });
    }
    return route.continue();
  });
}
async function download(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const file = await pending;
  return (await fs.readFile(await file.path())).toString('utf8');
}
function parseCsv(body) {
  // Export fields are quoted; retain commas, escaped quotes and embedded newlines.
  const rows = [], current = []; let cell = '', quoted = false;
  body = body.replace(/^\uFEFF/, '');
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '"') { if (quoted && body[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (char === ',' || char === '\n')) { current.push(cell.replace(/\r$/, '')); cell = ''; if (char === '\n') { rows.push(current.splice(0)); } }
    else cell += char;
  }
  current.push(cell.replace(/\r$/, '')); rows.push(current);
  return rows.slice(1).map(row => Object.fromEntries(rows[0].map((key, i) => [key, row[i]])));
}
for (const locale of locales) {
  test(locale.id + ' API archive provenance survives filtering and parsed JSON/CSV without changing metrics', async ({ page }) => {
    const state = { rows: [archived] }, errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await fixtures(page, state);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(locale.route);
    await expect(page.locator(locale.cards)).toHaveCount(1);
    await expect(page.locator(locale.status)).toContainText(locale.id === 'fr' ? 'Données archivées' : 'snapshot ya kumbukumbu');
    await expect(page.locator(locale.freshness)).toContainText('April 2026 seed snapshot');
    await expect(page.locator(locale.freshness)).toContainText('2026-07-27');
    await expect(page.locator(locale.freshness)).toContainText('unverified');
    await expect(page.locator(locale.freshness)).toContainText(locale.warning);
    await expect(page.locator(locale.cards)).toContainText(locale.warning);
    await expect(page.locator(locale.freshness)).toContainText(locale.id === 'fr' ? 'pas une mesure récente' : 'si kipimo cha sasa');
    await page.locator(locale.search).fill('absent');
    await expect(page.locator(locale.cards)).toHaveCount(0);
    await page.locator(locale.search).fill('Fixture');
    await expect(page.locator(locale.cards)).toHaveCount(1);
    const json = JSON.parse(await download(page, locale.json));
    expect(json.sourceState).toBe(locale.archiveState);
    expect(json.creators).toHaveLength(1);
    expect(json.creators[0]).toMatchObject({ followers: 10, afroScore: 7, sourceSlug: 'fixture-archive', source_state: 'fallback', source_snapshot_label: archived.source_snapshot_label, source_reviewed_at: archived.source_reviewed_at, source_metrics_freshness: 'unverified', recordUpdatedAt: archived.updated_at });
    const csv = parseCsv(await download(page, locale.csv));
    expect(csv).toHaveLength(1);
    expect(csv[0]).toMatchObject({ followers: '10', afroScore: '7', source_state: 'fallback', source_snapshot_label: archived.source_snapshot_label, source_reviewed_at: archived.source_reviewed_at, source_metrics_freshness: 'unverified', recordUpdatedAt: archived.updated_at });
    expect(state.apiRequests).toBe(4);
    await page.locator(locale.search).focus();
    await expect(page.locator(locale.search)).toBeFocused();
    for (const width of [320, 390, 768]) { await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(locale.freshness).screenshot({ path: test.info().outputPath(locale.id + '-archive-provenance-390.png') });
    expect(errors).toEqual([]);
  });
  test(locale.id + ' mixed sources retain row confidence when exports are narrowed to API or archive', async ({ page }) => {
    await fixtures(page, { rows: [archived, healthy] });
    await page.goto(locale.route);
    await expect(page.locator(locale.cards)).toHaveCount(2);
    const mixed = JSON.parse(await download(page, locale.json));
    expect(mixed.sourceState).toBe(locale.mixedState);
    expect(mixed.creators.map(row => row.source_state)).toEqual(['api', 'fallback']);
    await page.locator(locale.country).selectOption('Kenya');
    const api = JSON.parse(await download(page, locale.json));
    expect(api.sourceState).toBe(locale.id === 'fr' ? 'api' : 'data ya API ya umma');
    expect(api.creators).toHaveLength(1);
    expect(api.creators[0]).toMatchObject({ followers: 20, afroScore: 9, source_metrics_freshness: 'unknown' });
    await page.locator(locale.country).selectOption('Nigeria');
    const csv = parseCsv(await download(page, locale.csv));
    expect(csv[0]).toMatchObject({ source_state: 'fallback', followers: '10', afroScore: '7' });
    await expect(page.locator(locale.status)).toContainText(locale.id === 'fr' ? 'Sources API et archives' : 'API na kumbukumbu');
  });
  test(locale.id + ' unknown archive metadata stays unknown while healthy loading retains existing status', async ({ page }) => {
    const state = { rows: [{ ...archived, source_snapshot_label: null, source_reviewed_at: null, source_metrics_freshness: null, updated_at: null }] };
    await fixtures(page, state);
    await page.goto(locale.route);
    await expect(page.locator(locale.cards)).toHaveCount(1);
    const result = JSON.parse(await download(page, locale.json));
    expect(result.creators[0]).toMatchObject({ source_snapshot_label: 'unknown', source_reviewed_at: 'unknown', source_metrics_freshness: 'unknown', recordUpdatedAt: 'unknown' });
    await expect(page.locator(locale.freshness)).not.toContainText('2026-10-13');
    state.rows = [healthy];
    await page.reload();
    await expect(page.locator(locale.cards)).toHaveCount(1);
    await expect(page.locator(locale.status)).toHaveText(locale.id === 'fr' ? '1 profil affiché.' : '1 wasifu unaoonyeshwa · data ya API ya umma.');
    await expect(page.locator(locale.freshness)).not.toContainText(locale.warning);
  });
}
test('Swahili direct static archive keeps existing labels and carries its source metadata into exports', async ({ page }) => {
  const locale = locales[1];
  await fixtures(page, { failed: true });
  await page.goto(locale.route);
  await expect(page.locator(locale.status)).toContainText('snapshot ya kumbukumbu');
  await expect(page.locator(locale.freshness)).toContainText('fallback iliyohifadhiwa');
  await expect(page.locator(locale.freshness)).toContainText('Synthetic dated archive');
  const json = JSON.parse(await download(page, locale.json));
  expect(json.sourceState).toBe('snapshot ya kumbukumbu');
  expect(json.creators[0]).toMatchObject({ followers: 20, afroScore: 9, source_state: 'fallback', source_snapshot_label: 'Synthetic dated archive', source_reviewed_at: '2026-07-01', source_metrics_freshness: 'unverified' });
});
test('French checked-empty and unavailable remain distinct; Swahili both-paths unavailable remains closed', async ({ page }) => {
  const state = { rows: [], staticFailed: true };
  await fixtures(page, state);
  await page.goto(locales[0].route);
  await expect(page.locator('#afsStatus')).toHaveText('0 profils affichés.');
  await expect(page.locator('#afsExportJson')).toBeDisabled();
  state.failed = true;
  await page.reload();
  await expect(page.locator('#afsStatus')).toContainText('Les données AfroStream sont indisponibles');
  await page.goto(locales[1].route);
  await expect(page.locator('[data-status]')).toContainText('Hakuna wasifu wa kubuni');
  await expect(page.locator('[data-exports]')).toBeHidden();
});
