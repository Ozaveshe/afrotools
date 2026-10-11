const { test, expect } = require('@playwright/test');

for (const width of [320, 390, 1280]) {
  test(`country card images retain width across card variants at ${width}px`, async ({ page }) => {
    await page.route('**/*', route => {
      const host = new URL(route.request().url()).hostname;
      return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
    });
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto('/sw/benin/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-country-tool-search]').waitFor();
    const examples = await page.evaluate(() => {
      const live = AFRO_TOOLS.filter(t => ['live', 'new'].includes(t.status));
      const pick = predicate => {
        const row = live.find(predicate);
        if (!row) throw new Error('Missing card variant fixture');
        return { id: row.id, href: row.href, image: getToolCardImagePath(row), lang: row.lang || 'en', country: row.countries.includes('ALL') ? 'BJ' : row.countries[0] };
      };
      return [
        pick(t => t.id === 'creator-kit'),
        pick(t => t.id === 'zana-media-kit-ya-mtayarishi-sw'),
        pick(t => t.status === 'new' && !!getToolCardImagePath(t)),
        pick(t => !t.countries.includes('ALL') && !!getToolCardImagePath(t)),
        pick(t => /\.svg$/.test(getToolCardImagePath(t) || '')),
        pick(t => !getToolCardImagePath(t))
      ];
    });
    for (const row of examples) {
      await page.evaluate(({ country, lang }) => {
        document.documentElement.lang = lang;
        renderToolGrid('tool-grid', country, { locale: lang });
      }, row);
      await page.locator('[data-country-tool-search]').fill(row.id);
      const card = page.locator(`.country-tool-card[data-tool-id="${row.id}"]`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveAttribute('href', row.href);
      const media = card.locator('.country-tool-card-media');
      const box = await media.boundingBox();
      expect(box.width, row.id).toBeGreaterThan(100);
      expect(box.height, row.id).toBeGreaterThan(0);
      if (row.image) {
        const img = media.locator('img');
        await img.evaluate(image => image.decode());
        const frames = await img.evaluate(async image => {
          const result = [];
          for (let n = 0; n < 3; n++) {
            await new Promise(requestAnimationFrame);
            const rect = image.getBoundingClientRect();
            result.push({ naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: rect.width, height: rect.height });
          }
          return result;
        });
        for (const frame of frames) for (const value of Object.values(frame)) expect(value, row.id).toBeGreaterThan(0);
      } else {
        await expect(media.locator('.country-tool-card-icon')).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), row.id).toBe(false);
    }
  });
}
