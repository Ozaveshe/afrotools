const { test, expect } = require('@playwright/test');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
const savedKey = 'afrotools-saved-cover-letter';
const draftKey = 'afrotools-cover-letter-current-v2';
const routes = [['en', '/tools/cover-letter-generator/app.html'], ['fr', '/fr/tools/generateur-lettre-motivation/app.html'], ['sw', '/sw/zana/barua-ombi/']];
async function open(page, baseURL, route, initial = {}) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(initial => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    if (!sessionStorage.getItem('cover-fixture-ready')) {
      Object.entries(initial).forEach(([key, value]) => localStorage.setItem(key, value));
      sessionStorage.setItem('cover-fixture-ready', 'yes');
    }
  }, initial);
  await page.route('**/*', r => new URL(r.request().url()).origin === new URL(baseURL).origin ? r.continue() : r.abort());
  await page.goto(route);
  await page.waitForFunction(() => document.querySelector('#letterText').value.length > 0);
}
async function seed(page, count) {
  return page.evaluate(({ count, savedKey, draftKey }) => {
    const data = JSON.parse(localStorage.getItem(draftKey));
    const raw = JSON.stringify(Array.from({ length: count }, (_, i) => ({ id: 'synthetic-' + i, title: 'Synthetic letter ' + i, data, thumbnail: null, createdAt: i + 1, updatedAt: i + 1 })));
    localStorage.setItem(savedKey, raw); return raw;
  }, { count, savedKey, draftKey });
}
async function deny(page, key) {
  await page.evaluate(key => {
    const set = Storage.prototype.setItem; window.coverWriteAttempts = 0;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) { window.coverWriteAttempts++; throw new DOMException('Synthetic storage denial', 'QuotaExceededError'); }
      return set.call(this, name, value);
    };
    window.restoreCoverWrites = () => { Storage.prototype.setItem = set; };
  }, key);
}
for (const [locale, route] of routes) {
  test('cover save fails atomically and can retry: ' + locale, async ({ page, baseURL }) => {
    const errors = []; page.on('pageerror', () => errors.push('pageerror'));
    await open(page, baseURL, route); const before = await seed(page, 2); await deny(page, savedKey);
    await page.locator('[data-action=save]').click();
    await expect(page.locator('#storageStatus')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe(before);
    expect(await page.evaluate(() => window.coverWriteAttempts)).toBe(1);
    expect(new URL(page.url()).searchParams.has('id')).toBe(false);
    await expect(page.locator('#toast')).not.toHaveText(/^(Saved\.|Enregistré\.|Imehifadhiwa\.)$/);
    await page.evaluate(() => window.restoreCoverWrites()); await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey)).toBe(3);
    await expect(page.locator('#storageStatus')).toBeHidden();
    await page.reload(); expect(await page.locator('.saved-item').count()).toBe(3); expect(errors).toEqual([]);
  });
  test('cover damaged saved collection is preserved: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route, { [savedKey]: '{broken' });
    await page.locator('[data-action=save]').click();
    await expect(page.locator('#storageStatus')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe('{broken');
    expect(new URL(page.url()).searchParams.has('id')).toBe(false);
    await page.reload(); expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe('{broken');
  });
  test('cover invalid duplicate saved IDs are preserved: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); await seed(page, 2);
    const before = await page.evaluate(key => { const rows = JSON.parse(localStorage.getItem(key)); rows[1].id = rows[0].id; const raw = JSON.stringify(rows); localStorage.setItem(key, raw); return raw; }, savedKey);
    await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe(before);
    await expect(page.locator('#storageStatus')).toBeVisible();
  });
  test('cover wrong current schema is preserved: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route, { [draftKey]: '{"unexpected":true}' });
    await page.locator('#fullName').fill('Synthetic session draft');
    expect(await page.evaluate(key => localStorage.getItem(key), draftKey)).toBe('{"unexpected":true}');
    await expect(page.locator('#storageStatus')).toBeVisible();
  });
  test('cover session-only draft can download a local backup: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); await deny(page, draftKey);
    await page.locator('#tab-draft').click(); await page.locator('#letterText').fill('Synthetic local recovery text');
    await expect(page.locator('#storageStatus')).toContainText({en:'only in this tab',fr:'reste dans cet onglet',sw:'kwenye kichupo hiki tu'}[locale]);
    await expect(page.locator('#exportReviewConfirm')).not.toBeChecked();
    const event = page.waitForEvent('download'); await page.locator('[data-action=json]').click();
    const download = await event, stream = await download.createReadStream(), parts = [];
    for await (const part of stream) parts.push(part);
    expect(JSON.parse(Buffer.concat(parts).toString('utf8')).letterText).toBe('Synthetic local recovery text');
    await expect(page.locator('#storageStatus')).toBeVisible();
  });
  test('cover wrong saved schema is preserved: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route, { [savedKey]: '{"items":[]}' });
    await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe('{"items":[]}');
    await expect(page.locator('#storageStatus')).toBeVisible();
  });
  test('cover storage read failure does not erase saved letters: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); const before = await seed(page, 2);
    await page.evaluate(key => { const get = Storage.prototype.getItem; window.originalCoverGet = key => get.call(localStorage, key); Storage.prototype.getItem = function(name) { if (name === key) throw Error('Synthetic denial'); return get.call(this, name); }; }, savedKey);
    await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => window.originalCoverGet(key), savedKey)).toBe(before);
    await expect(page.locator('#storageStatus')).toBeVisible();
    expect(new URL(page.url()).searchParams.has('id')).toBe(false);
  });
  test('cover damaged current draft stays intact while editing: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route, { [draftKey]: '{broken' });
    await page.locator('#fullName').fill('Synthetic draft');
    expect(await page.evaluate(key => localStorage.getItem(key), draftKey)).toBe('{broken');
    await expect(page.locator('#storageStatus')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.emulateMedia({ media: 'print' }); await expect(page.locator('#storageStatus')).toBeHidden();
  });
  test('cover autosave denial is visible and recovers: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); const before = await page.evaluate(key => localStorage.getItem(key), draftKey);
    await deny(page, draftKey); await page.locator('#fullName').fill('Synthetic unsaved draft');
    await expect(page.locator('#storageStatus')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), draftKey)).toBe(before);
    await page.evaluate(() => window.restoreCoverWrites()); await page.locator('#fullName').fill('Synthetic recovered draft');
    await expect(page.locator('#storageStatus')).toBeHidden(); await page.reload();
    await expect(page.locator('#fullName')).toHaveValue('Synthetic recovered draft');
  });
  test('cover failed deletion keeps saved row and selected ID: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); await page.locator('[data-action=save]').click();
    const before = await page.evaluate(key => localStorage.getItem(key), savedKey), url = page.url();
    await page.locator('#tab-job').click(); await deny(page, savedKey); await page.locator('[data-delete]').first().click();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe(before); expect(page.url()).toBe(url);
    await expect(page.locator('.saved-item')).toHaveCount(1); await expect(page.locator('#storageStatus')).toBeVisible();
    await page.evaluate(() => window.restoreCoverWrites()); await page.locator('[data-delete]').first().click();
    await expect(page.locator('.saved-item')).toHaveCount(0); expect(new URL(page.url()).searchParams.has('id')).toBe(false);
    await expect(page.locator('#storageStatus')).toBeHidden();
  });
  test('cover saved capacity retains all records and allows update: ' + locale, async ({ page, baseURL }) => {
    await open(page, baseURL, route); const before = await seed(page, 20);
    await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => localStorage.getItem(key), savedKey)).toBe(before);
    await expect(page.locator('#storageStatus')).toBeVisible(); expect(new URL(page.url()).searchParams.has('id')).toBe(false);
    await page.reload(); await page.locator('#tab-job').click(); await page.locator('[data-load]').first().click();
    await page.locator('[data-action=save]').click();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey)).toBe(20);
    await expect(page.locator('#storageStatus')).toBeHidden();
  });
}
