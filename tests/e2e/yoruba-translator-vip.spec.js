const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

function contrastRatio(foreground, background) {
  function rgb(value) {
    return (value.match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
  }
  function luminance(value) {
    return rgb(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) =>
      sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  }
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

test.describe('Yoruba translator independent VIP gate', () => {
  test('local inventory, exports, consent and uncached fail-closed cloud flow work', async ({ page }) => {
    const requests = [];
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.route('**/api/translate', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        body: JSON.stringify({
          translatedText: 'Àbájáde àdánwò',
          provider: 'review-fixture',
          unchanged: false,
          fallbackUsed: false,
        }),
      });
    });

    await page.goto('/tools/yoruba-translator/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-vip-inventory]')).toHaveText('175');
    await expect(page.locator('[data-df-upgrade], [data-df-form], .df-faq')).toHaveCount(0);
    await expect(page.getByText('unreviewed app-local draft', { exact: false }).first()).toBeVisible();

    const search = page.getByLabel('Search English or Yoruba phrases');
    await search.fill('Cough');
    await expect(page.locator('#phrases')).toContainText('Ikọ');
    await expect(page.locator('#countBadge')).toHaveText('1 phrases');
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');

    const txtPromise = page.waitForEvent('download');
    await page.locator('#downloadPhrasebookTxt').click();
    const txt = await (await txtPromise).createReadStream();
    let txtContent = '';
    for await (const chunk of txt) txtContent += chunk.toString('utf8');
    expect(txtContent).toContain('175 embedded starter records from an unreviewed app-local draft');
    expect(txtContent).toContain('Cough\tIkọ');
    expect(txtContent).toContain('Browser listen buttons are not pronunciation authority');

    await search.fill('');
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('Yoruba Translator & Phrasebook');
    expect(pdfText).toContain('Coverage and orthography boundary');
    expect(pdfText).toContain('Cough');

    const raw = 'Private synthetic Yoruba fixture';
    await page.locator('#translateInput').fill(raw);
    await page.locator('#translateInput').press('Enter');
    expect(requests).toHaveLength(0);
    await expect(page.locator('[data-external-translation-status]')).toContainText('opt in');

    await page.locator('[data-external-translation-accept]').check();
    await page.locator('#translateBtn').click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]).toMatchObject({
      text: raw,
      source: 'en',
      target: 'yo',
      allowFallback: false,
    });
    await expect(page.locator('#translateOutput')).toHaveText('Àbájáde àdánwò');
    await expect(page.locator('#translateStatus')).toContainText('uncached');

    await page.locator('[data-external-translation-accept]').uncheck();
    await expect(page.locator('#translateOutput')).toContainText('after you opt in');
    await page.locator('[data-external-translation-accept]').check();
    await page.locator('#translateBtn').click();
    await expect.poll(() => requests.length).toBe(2);

    const privacy = await page.evaluate(async (value) => ({
      local: Object.keys(localStorage).some((key) => String(localStorage.getItem(key)).includes(value)),
      session: Object.keys(sessionStorage).some((key) => String(sessionStorage.getItem(key)).includes(value)),
      url: location.href.includes(value) || location.href.includes(encodeURIComponent(value)),
      databases: (await indexedDB.databases()).filter((entry) => String(entry.name).includes(value)),
    }), raw);
    expect(privacy).toEqual({ local: false, session: false, url: false, databases: [] });
    expect(consoleErrors).toEqual([]);
  });

  test('cloud errors fail closed and leave the local phrasebook available', async ({ page }) => {
    await page.route('**/api/translate', (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'provider unavailable' }),
    }));
    await page.goto('/tools/yoruba-translator/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-external-translation-accept]').check();
    await page.locator('#translateInput').fill('Synthetic text');
    await page.locator('#translateBtn').click();
    await expect(page.locator('#translateOutput')).toContainText('local phrasebook above still works');
    await expect(page.locator('#translateStatus')).toContainText('provider unavailable');
    await expect(page.locator('.phrase')).toHaveCount(175);
  });

  test('genuine system dark, mobile, 200 percent and keyboard contracts pass', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/yoruba-translator/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const colors = await page.evaluate(() => {
      function pair(foregroundSelector, backgroundSelector) {
        return {
          foreground: getComputedStyle(document.querySelector(foregroundSelector)).color,
          background: getComputedStyle(document.querySelector(backgroundSelector)).backgroundColor,
        };
      }
      return [
        pair('.card', '.card'),
        pair('.tone-guide', '.tone-guide'),
        pair('.cat-btn:not(.active)', '.cat-btn:not(.active)'),
        pair('.vip-boundary', '.vip-boundary'),
        pair('.vip-cloud-grid label', '#liveTranslateCard'),
        pair('#translateInput', '#translateInput'),
      ];
    });
    for (const pair of colors) {
      expect(contrastRatio(pair.foreground, pair.background)).toBeGreaterThanOrEqual(4.5);
    }

    const search = page.getByLabel('Search English or Yoruba phrases');
    await search.focus();
    await expect(search).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
