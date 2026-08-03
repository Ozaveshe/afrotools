const { test, expect } = require('@playwright/test');

const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');

const ROWS = manifest.rows.filter((row) => row.family === 'seed-rate');
const SENTINEL = [
  'family=seed-rate',
  'worktree=sw-agriculture-seed-rate-source-repair-8354-20260802',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-agriculture-seed-rate-source-repair-8354-20260802\\afrotools',
  'branch=codex/sw-agriculture-seed-rate-source-repair-8354-20260802',
  'base=8354e321ff34caf60a33a3393cd0dcddfb00c023',
].join('\n');
const FAO_TOMATO = 'https://www.fao.org/land-water/databases-and-software/crop-information/tomato/en/';
const ENGLISH_SOURCE_FRAGMENT = /Data sources|Tomato planning parameters also reference|also reference|FAO crop information|crop guidance|national agricultural authority|World Bank/i;

function watchRuntime(page) {
  const state = { errors: [], writes: [], external: [] };
  page.on('console', (message) => { if (message.type() === 'error') state.errors.push(message.text()); });
  page.on('pageerror', (error) => state.errors.push(error.message));
  page.on('requestfailed', (request) => state.errors.push(`${request.url()} ${request.failure() && request.failure().errorText}`));
  page.on('response', (response) => { if (response.status() >= 400) state.errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', (request) => {
    if (request.method() !== 'GET') state.writes.push(`${request.method()} ${request.url()}`);
    if (/^https?:/i.test(request.url()) && !/^https?:\/\/127\.0\.0\.1:4391\//i.test(request.url())) {
      state.external.push(request.url());
    }
  });
  return state;
}

async function proveSourceLinkContrast(page, trust, label) {
  for (const mode of ['light', 'dark', 'system-light', 'system-dark']) {
    const colorScheme = mode.endsWith('dark') ? 'dark' : 'light';
    const rootTheme = mode.startsWith('system-') ? 'system' : mode;
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.evaluate(({ theme, scheme }) => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = scheme;
    }, { theme: rootTheme, scheme: colorScheme });
    const links = trust.locator('a[href^="https://"]');
    for (let index = 0; index < await links.count(); index += 1) {
      const link = links.nth(index);
      await link.evaluate((target) => {
        const focusables = [...document.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled)')]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rectangle = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rectangle.width > 0 && rectangle.height > 0;
          });
        const targetIndex = focusables.indexOf(target);
        if (targetIndex < 1) throw new Error('Linked source has no preceding keyboard focus target.');
        focusables[targetIndex - 1].focus();
      });
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      const proof = await link.evaluate((target, selectedMode) => {
      function channels(value) {
        const match = value.match(/[\d.]+/g);
        return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
      }
      function luminance(color) {
        return color.map((value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      }
      function ratio(first, second) {
        const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
        return (values[0] + 0.05) / (values[1] + 0.05);
      }
      function background(element) {
        for (let current = element; current; current = current.parentElement) {
          const value = getComputedStyle(current).backgroundColor;
          if (!/rgba\([^)]*,\s*0\)$/.test(value) && value !== 'transparent') return channels(value);
        }
        return selectedMode.endsWith('dark') ? [13, 22, 36] : [245, 248, 252];
      }
        const style = getComputedStyle(target);
        const surface = background(target.parentElement);
        return {
          text: ratio(channels(style.color), surface),
          focus: style.outlineStyle === 'none' || Number.parseFloat(style.outlineWidth) < 2
            ? 0
            : ratio(channels(style.outlineColor), surface),
        };
      }, mode);
      expect(proof.text, `${label} ${mode} linked source text`).toBeGreaterThanOrEqual(4.5);
      expect(proof.focus, `${label} ${mode} linked source focus`).toBeGreaterThanOrEqual(3);
    }
  }
}

for (const row of ROWS) {
  test(`${row.english.id}: complete native named-source and freshness proof`, async ({ page }) => {
    const runtime = watchRuntime(page);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey, { waitUntil: 'load' });
    const sentinel = await page.evaluate(async () => (
      await (await fetch('/tests/fixtures/sw-seed-rate-source-repair-sentinel.txt')).text()
    ));
    expect(sentinel.trim()).toBe(SENTINEL);

    if (!row.country) {
      const trust = page.locator('#planningTitle').locator('..');
      await expect(trust.getByText('Vyanzo', { exact: true })).toBeVisible();
      await expect(trust.getByText('Data ilivyopitiwa', { exact: true })).toBeVisible();
      await expect(trust.getByText('Uhakika', { exact: true })).toBeVisible();
      await expect(trust.getByText(/yamesasishwa mwaka 2026; si data ya moja kwa moja/)).toBeVisible();
      await expect(trust.getByRole('link', { name: 'Taarifa za FAO kuhusu zao la nyanya' })).toHaveAttribute('href', FAO_TOMATO);
      await expect(trust.getByRole('link', { name: 'CGIAR' })).toHaveAttribute('href', 'https://www.cgiar.org/');
      await expect(trust.getByRole('link', { name: 'Benki ya Dunia' })).toHaveAttribute('href', 'https://data.worldbank.org/');
      expect(await trust.innerText()).not.toMatch(ENGLISH_SOURCE_FRAGMENT);
      await proveSourceLinkContrast(page, trust, row.english.id);
    } else {
      const trust = page.locator('#trustTitle').locator('..');
      const sourceItem = trust.locator('.trust-item').first();
      await expect(sourceItem.getByRole('link', { name: 'Taarifa za FAO kuhusu zao la nyanya' })).toHaveAttribute('href', FAO_TOMATO);
      await expect(trust.getByText(/Rejea tuli ya ukurasa wa Kiingereza, iliyoonyeshwa kuwa imesasishwa mwaka 2026/)).toBeVisible();
      await expect(trust.getByText(/Makadirio ya kupanga tu/)).toBeVisible();
      const visibleSource = (await sourceItem.innerText()).replace(/\s+/g, ' ').trim();
      expect(visibleSource).not.toMatch(ENGLISH_SOURCE_FRAGMENT);
      expect(visibleSource).toContain('Mwongozo wa mazao wa FAO');
      expect(visibleSource).toContain('Benki ya Dunia');
      expect(visibleSource).toContain('Vigezo vya kupanga nyanya pia vinarejelea Taarifa za FAO kuhusu zao la nyanya.');
      if (row.country.code === 'NG') {
        expect(visibleSource).toContain('Baraza la Taifa la Mbegu za Kilimo la Nigeria (NASC)');
        expect(visibleSource).toContain('IITA');
        expect(visibleSource).toContain('Ofisi ya Taifa ya Takwimu ya Nigeria');
      } else {
        expect(visibleSource).toContain(`mamlaka ya kitaifa ya kilimo ya ${row.country.swahiliName}`);
      }
      const config = await page.evaluate(() => window.__SW_AGRI_PAGE__);
      expect(config.sourceLabel).not.toMatch(ENGLISH_SOURCE_FRAGMENT);
      expect(config.sourceLabel).toContain('Taarifa za FAO kuhusu zao la nyanya.');
      expect(config.sourceLinks).toEqual([{ href: FAO_TOMATO, label: 'Taarifa za FAO kuhusu zao la nyanya' }]);
      await page.getByRole('button', { name: 'Kokotoa kiasi' }).click();
      const report = await page.evaluate(() => window.__SW_AGRI_TEST__.reportObject());
      expect(report.sources.label).toBe(config.sourceLabel);
      expect(report.sources.reviewed).toBe('2026');
      expect(report.sources.live).toBe(false);
      await proveSourceLinkContrast(page, trust, row.english.id);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    expect(runtime.writes).toEqual([]);
    expect(runtime.external).toEqual([]);
    expect(runtime.errors).toEqual([]);
  });
}
