const { test, expect } = require('@playwright/test');

const sharedRoutes = [
  '/tools/swahili-translator/',
  '/tools/yoruba-translator/',
  '/tools/hausa-translator/',
  '/tools/igbo-translator/',
  '/tools/amharic-translator/',
  '/tools/zulu-translator/',
  '/tools/french-african/',
];

const legacyKeys = [
  'afro_translate_cache_sw',
  'afro_translate_cache_yo',
  'afro_translate_cache_ha',
  'afro_translate_cache_ig',
  'afro_translate_cache_am',
  'afro_translate_cache_zu',
  'afro_translate_cache_fr',
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(({ keys }) => {
    keys.forEach((key) => localStorage.setItem(key, JSON.stringify({
      raw: 'Synthetic legacy private fixture',
      translated: 'Synthetic legacy output',
    })));
  }, { keys: legacyKeys });
});

test('shared phrasebooks stay local until route-specific cloud consent', async ({ page }) => {
  const requests = [];
  await page.route('**/api/translate', async (route) => {
    const request = route.request();
    requests.push({
      url: request.url(),
      headers: request.headers(),
      body: request.postDataJSON(),
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      body: JSON.stringify({
        translatedText: '<img src=x onerror=alert(1)> synthetic translation',
        provider: 'test-provider',
        characters: 31,
        unchanged: false,
        fallbackUsed: false,
      }),
    });
  });

  for (const route of sharedRoutes) {
    const requestStart = requests.length;
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-external-translation-notice]')).toBeVisible();
    await expect(page.locator('#phrases')).not.toBeEmpty();
    await expect(page.locator('#liveTranslateCard')).toContainText('local phrasebook');

    const fixture = 'Synthetic cloud fixture for ' + route;
    await page.locator('#translateInput').fill(fixture);
    await page.locator('#translateInput').press('Enter');
    await expect.poll(() => requests.length).toBe(requestStart);
    await expect(page.locator('[data-external-translation-status]')).toContainText('opt in');

    await page.locator('[data-external-translation-accept]').check();
    await expect(page.locator('#translateBtn')).toBeEnabled();
    await page.locator('#translateBtn').click();
    await expect.poll(() => requests.length).toBe(requestStart + 1);
    await expect(page.locator('#translateOutput')).toContainText('<img src=x onerror=alert(1)>');
    await expect(page.locator('#translateOutput img')).toHaveCount(0);

    const sent = requests[requestStart];
    expect(sent.headers['x-afrotools-external-translation-consent']).toBe('accepted');
    expect(sent.headers['x-afrotools-translation-fallback-consent']).toBeUndefined();
    expect(sent.body.text).toBe(fixture);
    expect(sent.body.allowFallback).toBe(false);

    const browserState = await page.evaluate(({ keys, raw }) => ({
      legacy: keys.map((key) => localStorage.getItem(key)),
      localContainsRaw: Object.keys(localStorage).some((key) => String(localStorage.getItem(key)).includes(raw)),
      sessionContainsRaw: Object.keys(sessionStorage).some((key) => String(sessionStorage.getItem(key)).includes(raw)),
      urlContainsRaw: location.href.includes(encodeURIComponent(raw)) || location.href.includes(raw),
    }), { keys: legacyKeys, raw: fixture });
    expect(browserState.legacy.every((value) => value === null)).toBe(true);
    expect(browserState.localContainsRaw).toBe(false);
    expect(browserState.sessionContainsRaw).toBe(false);
    expect(browserState.urlContainsRaw).toBe(false);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-external-translation-accept]')).not.toBeChecked();
    await expect(page.locator('#translateBtn')).toBeDisabled();
  }
});

test('Pidgin cloud mode uses the same consent boundary while phrasebook data stays local', async ({ page }) => {
  const requests = [];
  await page.route('**/api/translate', async (route) => {
    requests.push({
      headers: route.request().headers(),
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        translatedText: 'How you dey?',
        provider: 'test-provider',
        characters: 12,
        unchanged: false,
        fallbackUsed: false,
      }),
    });
  });

  await page.goto('/tools/pidgin-translator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#phrases')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Translate', exact: true }).first().click();
  await expect(page.locator('[data-external-translation-notice]')).toBeVisible();

  const fixture = 'How are you?';
  await page.locator('#srcText').fill(fixture);
  await page.locator('#srcText').press('Enter');
  await expect.poll(() => requests.length).toBe(0);
  await expect(page.locator('#translateStatus')).toContainText('explicit opt-in');

  await page.locator('[data-external-translation-accept]').check();
  await expect(page.locator('#translateBtn')).toBeEnabled();
  await page.locator('#translateBtn').click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator('#tgtOutput')).toHaveText('How you dey?');
  expect(requests[0].headers['x-afrotools-external-translation-consent']).toBe('accepted');
  expect(requests[0].body.text).toBe(fixture);
  expect(requests[0].body.allowFallback).toBe(false);

  const storage = await page.evaluate(({ keys, raw }) => ({
    legacy: keys.map((key) => localStorage.getItem(key)),
    rawPersisted: Object.keys(localStorage).some((key) => String(localStorage.getItem(key)).includes(raw)),
    learnedStatePresent: localStorage.getItem('pidgin_learned') !== null,
  }), { keys: legacyKeys, raw: fixture });
  expect(storage.legacy.every((value) => value === null)).toBe(true);
  expect(storage.rawPersisted).toBe(false);
  expect(typeof storage.learnedStatePresent).toBe('boolean');
});
