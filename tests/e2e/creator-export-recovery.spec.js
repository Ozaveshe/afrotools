'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const locales = [
  { lang: 'en', analytics: '/tools/creator-analytics/app.html', team: '/tools/creator-team/app.html', split: '/tools/creator-split/app.html' },
  { lang: 'fr', analytics: '/fr/tools/stats-createur/app.html', team: '/fr/tools/equipe-du-createur/app.html', split: '/fr/tools/repartition-des-revenus-entre-createurs/app.html' },
  { lang: 'sw', analytics: '/sw/zana/takwimu-za-mtayarishi/app.html', team: '/sw/zana/timu-ya-watayarishi/', split: '/sw/zana/mgawanyo-wa-mapato-ya-watayarishi/' }
];

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin && route.request().method() === 'GET' && !/^\/(?:api\/|\.netlify\/)/.test(url.pathname)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"unavailable","data":[]}' });
  });
});

async function open(page, route) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route, { waitUntil: 'load' });
  return async () => {
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  };
}

async function downloaded(page, action) {
  const pending = page.waitForEvent('download');
  await action();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return fs.readFile(await download.path(), 'utf8');
}

async function clipboard(page, mode) {
  await page.evaluate(mode => {
    window.testCopyText = null;
    window.finishCreatorCopy = null;
    window.rejectCreatorCopy = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing' ? undefined : {
      writeText(text) {
        window.testCopyText = text;
        if (mode === 'throw') throw new Error('Synthetic clipboard denial');
        if (mode === 'reject') return Promise.reject(new Error('Synthetic clipboard denial'));
        if (mode === 'pending') return new Promise((resolve, reject) => { window.finishCreatorCopy = resolve; window.rejectCreatorCopy = reject; });
        return Promise.resolve();
      }
    } });
  }, mode);
}

async function finishCopy(page, rejected) {
  await page.evaluate(async rejected => {
    if (rejected) window.rejectCreatorCopy(new Error('Synthetic delayed denial'));
    else window.finishCreatorCopy();
    await new Promise(resolve => setTimeout(resolve, 0));
  }, rejected);
}

async function addPost(page, label = 'Synthetic creator post') {
  await page.locator('#caDate').fill('2026-10-09');
  await page.locator('#caLabel').fill(label);
  await page.locator('[data-creator-analytics-app] form button[type=submit]').click();
}

for (const [type, route] of [
  ['schedule', '/tools/creator-schedule/app.html'], ['schedule', '/fr/tools/planning-du-createur/app.html'], ['schedule', '/sw/zana/ratiba-ya-mtayarishi/'],
  ['team', locales[0].team], ['team', locales[1].team], ['team', locales[2].team],
  ['stock', '/tools/creator-stock/app.html'], ['stock', '/fr/tools/mediatheque-pour-createur/app.html']
]) {
  test(`${route} CSV downloads prefix formula-like text while JSON stays unchanged`, async ({ page }) => {
    const check = await open(page, route), scope = page.locator('[data-creator-' + type + '-native]');
    await scope.locator('[name=title]').fill('=1+1');
    await scope.locator('[name=note]').fill('+1+1');
    if (type === 'schedule') await scope.locator('[name=scheduled]').fill('2026-10-10T10:00');
    if (type === 'team') await scope.locator('[name=project]').fill('Synthetic project');
    if (type === 'stock') { await scope.locator('[name=sourceUrl]').fill('https://example.com/synthetic'); await scope.locator('[name=license]').fill('Synthetic review'); }
    await scope.locator('button[type=submit]').click();
    const data = JSON.parse(await downloaded(page, () => scope.locator('[data-json]').click()));
    const entry = (data.posts || data.tasks || data.assets)[0];
    expect(entry.title).toBe('=1+1'); expect(entry.note).toBe('+1+1');
    const csv = await downloaded(page, () => scope.locator('[data-csv]').click());
    expect(csv).toContain('"\'=1+1"'); expect(csv).toContain('"\'+1+1"');
    await check();
  });
}

for (const locale of locales) {
  test(`${locale.lang} analytics native CSV and JSON retain their distinct text contracts`, async ({ page }) => {
    const check = await open(page, locale.analytics);
    await addPost(page, '=1+1');
    const data = JSON.parse(await downloaded(page, () => page.locator('#caJson').click()));
    expect(data.posts[0].label).toBe('=1+1');
    expect(await downloaded(page, () => page.locator('#caCsv').click())).toContain("'=1+1");
    await check();
  });

  test(`${locale.lang} analytics copy succeeds or downloads the same local brief`, async ({ page }) => {
    const check = await open(page, locale.analytics);
    await addPost(page);
    const brief = await page.locator('#caBrief').textContent();
    for (const mode of ['missing', 'throw', 'reject', 'success']) {
      await clipboard(page, mode);
      if (mode === 'success') {
        await page.locator('#caCopy').click();
        await expect(page.locator('#caStatus')).toContainText(/copied|copié|nakiliwa/i);
        expect(await page.evaluate(() => window.testCopyText)).toBe(brief);
      } else {
        expect(await downloaded(page, () => page.locator('#caCopy').click())).toBe(brief);
        await expect(page.locator('#caStatus')).toContainText(/TXT/);
      }
    }
    await check();
  });

  test(`${locale.lang} analytics pending copy cannot overwrite clear add or export feedback`, async ({ page }) => {
    const check = await open(page, locale.analytics), downloads = [];
    page.on('download', d => downloads.push(d.suggestedFilename()));
    for (const action of ['clear', 'add', 'export']) {
      for (const rejected of [false, true]) {
        if (await page.locator('#caPosts').textContent() === '0') await addPost(page);
        await clipboard(page, 'pending'); await page.locator('#caCopy').click();
        await page.waitForFunction(() => typeof window.finishCreatorCopy === 'function');
        if (action === 'clear') await page.locator('#caClear').click();
        if (action === 'add') await addPost(page, 'Synthetic newer post');
        if (action === 'export') await downloaded(page, () => page.locator('#caJson').click());
        const status = await page.locator('#caStatus').textContent(), count = downloads.length;
        await finishCopy(page, rejected);
        await expect(page.locator('#caStatus')).toHaveText(status);
        expect(downloads).toHaveLength(count);
      }
    }
    await check();
  });

  for (const mode of ['set', 'clear', 'delete']) {
    test(`${locale.lang} analytics ${mode} storage denial preserves an honest recoverable state`, async ({ page }) => {
      const check = await open(page, locale.analytics);
      if (mode !== 'set') await addPost(page);
      await page.evaluate(mode => {
        const key = 'afrotools.creatorAnalytics.local.v2';
        const method = mode === 'clear' ? 'removeItem' : 'setItem', original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...args) {
          if (name === key) throw new Error('Synthetic storage denial');
          return original.call(this, name, ...args);
        };
      }, mode);
      if (mode === 'set') await addPost(page);
      if (mode === 'clear') await page.locator('#caClear').click();
      if (mode === 'delete') await page.locator('[data-remove-post]').click();
      await expect(page.locator('#caError')).not.toHaveText('');
      await expect(page.locator('#caPosts')).toHaveText(mode === 'set' ? '1' : '0');
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('afrotools.creatorAnalytics.local.v2') || 'null'));
      if (mode === 'set') {
        expect(stored).toBeNull();
        const data = JSON.parse(await downloaded(page, () => page.locator('#caJson').click()));
        expect(data.posts).toHaveLength(1); expect(data.posts[0].label).toBe('Synthetic creator post');
      } else {
        expect(stored.posts || stored).toHaveLength(1);
        await expect(page.locator('#caJson')).toBeDisabled();
      }
      await check();
    });
  }

  test(`${locale.lang} analytics deletion keeps keyboard focus on the remaining task`, async ({ page }) => {
    const check = await open(page, locale.analytics);
    await addPost(page, 'Synthetic first'); await addPost(page, 'Synthetic second');
    const remove = page.locator('[data-remove-post]');
    await remove.first().focus(); await page.keyboard.press('Enter');
    await expect(remove).toHaveCount(1); await expect(remove).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(remove).toHaveCount(0); await expect(page.locator('#caLabel')).toBeFocused();
    await check();
  });

  test(`${locale.lang} creator team deletion retains useful keyboard focus`, async ({ page }) => {
    const check = await open(page, locale.team), scope = page.locator('[data-creator-team-native]');
    for (const title of ['Synthetic first', 'Synthetic second']) {
      await scope.locator('[name=project]').fill('Synthetic project'); await scope.locator('[name=title]').fill(title);
      await scope.locator('button[type=submit]').click();
    }
    const remove = scope.locator('[data-remove]');
    await remove.first().focus(); await page.keyboard.press('Enter');
    await expect(remove).toHaveCount(1); await expect(remove).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(remove).toHaveCount(0); await expect(scope.locator('[name=title]')).toBeFocused();
    await check();
  });

  test(`${locale.lang} creator split edits invalidate old exports and recalculation uses new values`, async ({ page }) => {
    const check = await open(page, locale.split), scope = page.locator('[data-creator-split]');
    for (const action of ['revenue', 'project', 'member', 'add', 'remove']) {
      await scope.locator('button[type=submit]').click();
      await expect(scope.locator('[data-actions]')).toBeVisible();
      if (action === 'revenue') await scope.locator('[name=revenue]').fill('2000');
      if (action === 'project') await scope.locator('[name=project]').fill('Synthetic amended project');
      if (action === 'member') await scope.locator('[name=member-share]').first().fill('40');
      if (action === 'add') { await scope.locator('[data-add-member]').click(); await expect(scope.locator('[name=member-name]').last()).toBeFocused(); }
      if (action === 'remove') {
        await scope.locator('[data-add-member]').click(); await scope.locator('button[type=submit]').click();
        await scope.locator('.cs-calc-remove').last().click();
        await expect(scope.locator('[name=member-name]').last()).toBeFocused();
      }
      await expect(scope.locator('[data-actions]')).toBeHidden(); await expect(scope.locator('[data-output]')).toBeHidden();
      if (action === 'member') await scope.locator('[name=member-share]').first().fill('50');
      if (action === 'add') await scope.locator('.cs-calc-remove').last().click();
      await scope.locator('button[type=submit]').click();
      const data = JSON.parse(await downloaded(page, () => scope.locator('[data-json]').click()));
      expect(data.totalPercentage).toBe(100); expect(data.shares).toHaveLength(2);
      expect(data.revenue).toBe(2000);
      if (action !== 'revenue') expect(data.project).toBe('Synthetic amended project');
    }
    if (await scope.locator('[data-reset]').count()) {
      await scope.locator('[data-reset]').click();
      await expect(scope.locator('[data-actions]')).toBeHidden(); await expect(scope.locator('[data-output]')).toBeHidden();
    }
    await check();
  });

  test(`${locale.lang} creator split clipboard failures recover through a matching TXT download`, async ({ page }) => {
    const check = await open(page, locale.split), scope = page.locator('[data-creator-split]');
    await scope.locator('button[type=submit]').click();
    await clipboard(page, 'success'); await scope.locator('[data-copy]').click();
    const text = await page.evaluate(() => window.testCopyText);
    expect(text).toBeTruthy(); await expect(scope.locator('[data-status]')).toContainText(/copied|copié|nakiliwa/i);
    for (const mode of ['missing', 'throw', 'reject']) {
      await clipboard(page, mode);
      expect(await downloaded(page, () => scope.locator('[data-copy]').click())).toBe(text);
      await expect(scope.locator('[data-status]')).toContainText(/downloaded|téléchargé|imepakuliwa/i);
    }
    await check();
  });

  test(`${locale.lang} creator split late clipboard completion cannot replace a newer result`, async ({ page }) => {
    const check = await open(page, locale.split), scope = page.locator('[data-creator-split]'), downloads = [];
    page.on('download', d => downloads.push(d.suggestedFilename()));
    for (const rejected of [false, true]) {
      await scope.locator('button[type=submit]').click();
      await clipboard(page, 'pending'); await scope.locator('[data-copy]').click();
      await page.waitForFunction(() => typeof window.finishCreatorCopy === 'function');
      await scope.locator('[name=project]').fill('Synthetic newer ' + rejected);
      await scope.locator('button[type=submit]').click();
      const status = await scope.locator('[data-status]').textContent();
      await finishCopy(page, rejected);
      await expect(scope.locator('[data-status]')).toHaveText(status); expect(downloads).toHaveLength(0);
      await expect(scope.locator('[data-output]')).toBeVisible();
      const result = JSON.parse(await downloaded(page, () => scope.locator('[data-json]').click()));
      expect(result.project).toBe('Synthetic newer ' + rejected);
      downloads.length = 0;
    }
    await check();
  });
}

for (const route of ['/tools/creator-stock/app.html', '/fr/tools/mediatheque-pour-createur/app.html']) {
  test(`${route} long source and rights notes stay readable at small widths and zoom`, async ({ page }) => {
    const check = await open(page, route), scope = page.locator('[data-creator-stock-native]');
    const source = 'https://example.com/' + 'synthetic-source-'.repeat(18);
    await scope.locator('[name=title]').fill('Synthetic rights ledger');
    await scope.locator('[name=sourceUrl]').fill(source);
    await scope.locator('[name=license]').fill('SyntheticLicense'.repeat(12));
    await scope.locator('button[type=submit]').click();
    const link = scope.locator('[data-list] a');
    await expect(link).toHaveAttribute('href', source);
    for (const width of [320, 390, 640]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(({ width, theme }) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.zoom = width === 640 ? '2' : '';
      }, { width, theme });
      await link.focus(); await expect(link).toBeFocused();
      expect(await scope.locator('[data-list]').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
      await check();
    }
  });
}
