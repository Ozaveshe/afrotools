const { test, expect } = require('@playwright/test');
const baseURL = process.env.LOCALIZED_PARITY_BASE_URL || 'http://127.0.0.1:4173';
const routes = [
  '/fr/agriculture/', '/fr/document-pdf/', '/fr/energy/', '/fr/ingenierie/', '/fr/health/', '/fr/salary-tax/', '/fr/trade/', '/fr/transport/',
  '/sw/kilimo/', '/sw/hati-na-pdf/', '/sw/nishati-na-huduma/', '/sw/ujenzi-na-uhandisi/', '/sw/afya/', '/sw/mshahara-na-kodi/', '/sw/biashara-ya-nje/', '/sw/usafiri-na-magari/'
];

test('representative localized category hubs retain mobile navigation and discovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ERR_BLOCKED_BY_RESPONSE\.NotSameSite/.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.localized-category-standard')).toBeVisible();
    await expect(page.locator('#localizedCategorySearch')).toBeVisible();
    await expect(page.locator('afro-navbar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route).toBe(true);
    expect(errors, route).toEqual([]);
  }
});

test('localized category method remains bounded at effective 200 percent', async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 900 });
  for (const route of ['/fr/ingenierie/', '/sw/nishati-na-huduma/']) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html{zoom:2}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route).toBe(true);
  }
});

// Synthetic returning-visitor preferences isolate appearance from the separately
// owned first-visit notice flow. Optional external services never receive data.
async function isolateAppearance(page) {
  const denied = [];
  const origin = new URL(baseURL).origin;
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('afro_pwa_dismissed', '1');
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) return route.abort('blockedbyclient');
    if (!['GET', 'HEAD'].includes(request.method())) {
      denied.push({ method: request.method(), path: url.pathname });
      return route.abort('blockedbyclient');
    }
    if (url.pathname === '/api/auth/session') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"user":null,"authenticated":false}' });
    }
    if (/^\/(?:api|\.netlify)(?:\/|$)/.test(url.pathname)) {
      denied.push({ method: request.method(), path: url.pathname });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  return denied;
}

const appearances = [
  { name: 'light', choice: 'light', system: 'dark', resolved: 'light' },
  { name: 'dark', choice: 'dark', system: 'light', resolved: 'dark' },
  { name: 'automatic light', choice: 'auto', system: 'light', resolved: 'light' },
  { name: 'automatic dark', choice: 'auto', system: 'dark', resolved: 'dark' }
];

async function appearanceAt(page, route, appearance) {
  await page.emulateMedia({ colorScheme: appearance.system });
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.AfroTools?.darkMode);
  // Exercise the maintained theme manager, including its system-preference path.
  // The separate local journey exercises the visible navbar toggle as a visitor.
  await page.evaluate((choice) => window.AfroTools.darkMode.set(choice), appearance.choice);
  await expect(page.locator('html')).toHaveAttribute('data-theme', appearance.resolved);
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice', appearance.choice);
}

async function doubleText(page, selector) {
  return page.locator(selector).evaluateAll((elements) => {
    const rows = elements.map((element) => ({ element, style: element.getAttribute('style'), size: parseFloat(getComputedStyle(element).fontSize) }));
    rows.forEach((row) => { row.element.style.fontSize = `${row.size * 2}px`; });
    return rows.map((row) => ({ before: row.size, after: parseFloat(getComputedStyle(row.element).fontSize) }));
  });
}

async function contrastOf(page, selectors) {
  return page.evaluate((selectors) => {
    const rgba = (value) => {
      const parts = value.match(/[\d.]+/g)?.map(Number);
      if (!parts || parts.length < 3) throw new Error('Unrecognized computed color');
      return [...parts.slice(0, 3), parts[3] ?? 1];
    };
    const over = (front, back) => [0, 1, 2].map((i) => front[i] * front[3] + back[i] * (1 - front[3]));
    const luminance = (rgb) => rgb.map((value) => {
      const v = value / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    return selectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, missing: true };
      const layers = [];
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== 'none') throw new Error(`Non-flat contrast background: ${selector}`);
        const color = rgba(style.backgroundColor);
        layers.push(color);
        if (color[3] === 1) break;
      }
      let background = [255, 255, 255];
      for (const layer of layers.reverse()) background = over(layer, background);
      const style = getComputedStyle(element);
      const foreground = over(rgba(style.color), background);
      const f = luminance(foreground), b = luminance(background);
      return { selector, color: style.color, background, ratio: (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05) };
    });
  }, selectors);
}

for (const appearance of appearances) {
  test(`localized method contrast survives ${appearance.name} and doubled text`, async ({ page }) => {
    test.setTimeout(180000);
    const denied = await isolateAppearance(page);
    const selectors = [
      '.localized-category-standard h2', '.localized-category-standard__grid article h3',
      '.localized-category-standard__grid article p', '.localized-category-standard__search label',
      '.localized-category-standard__search input', '.localized-category-standard__faq summary',
      '.localized-category-standard__links a'
    ];
    for (const route of ['/fr/ingenierie/', '/sw/nishati-na-huduma/', '/sw/personal-finance/']) {
      for (const width of [1440, 375, 320]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 812 });
        await appearanceAt(page, route, appearance);
        for (const scale of [1, 2]) {
          if (scale === 2) {
            const rows = await doubleText(page, '.localized-category-standard h2,.localized-category-standard h3,.localized-category-standard p,.localized-category-standard label,.localized-category-standard input,.localized-category-standard button,.localized-category-standard summary,.localized-category-standard a');
            expect(rows.every((row) => Math.abs(row.after - row.before * 2) < 0.1)).toBe(true);
          }
          for (const row of await contrastOf(page, selectors)) {
            expect(row.missing, `${route} ${appearance.name} ${width} text${scale} ${row.selector}`).toBeFalsy();
            expect(row.ratio, `${route} ${appearance.name} ${width} text${scale} ${row.selector}`).toBeGreaterThanOrEqual(4.5);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} ${width} text${scale}`).toBe(true);
          await expect(page.locator('#localizedCategorySearch')).toBeVisible();
        }
      }
    }
    expect(denied).toEqual([]);
  });
}

test('hub native skip link stays above the navbar at mobile and doubled text sizes', async ({ page }) => {
  test.setTimeout(90000);
  const denied = await isolateAppearance(page);
  for (const width of [1440, 375, 320]) {
    for (const scale of [1, 2]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 812 });
      await appearanceAt(page, '/sw/personal-finance/', appearances[1]);
      if (scale === 2) await doubleText(page, '.swpf-hub h1,.swpf-hub h2,.swpf-hub h3,.swpf-hub p,.swpf-hub a');
      const skip = page.locator('.swpf-skip');
      expect(await skip.evaluate((element) => element.getBoundingClientRect().right <= 0)).toBe(true);
      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      const focused = await skip.evaluate((element) => {
        const box = element.getBoundingClientRect(), style = getComputedStyle(element);
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return { clear: hit === element || element.contains(hit), visible: element.matches(':focus-visible'), inside: box.x >= 0 && box.right <= innerWidth && box.y >= 0 && box.bottom <= innerHeight, outline: parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none' };
      });
      expect(focused, `${width}px text${scale}`).toEqual({ clear: true, visible: true, inside: true, outline: true });
      await page.keyboard.press('Enter');
      await expect(page.locator('#swpf-directory')).toBeFocused();
    }
  }
  expect(denied).toEqual([]);
});

for (const appearance of appearances) {
  test(`catalogue result and recovery contrast survives ${appearance.name}`, async ({ page }) => {
    test.setTimeout(180000);
    const denied = await isolateAppearance(page);
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 812 });
      await appearanceAt(page, '/sw/zana-zote/?q=film&category=personal-finance', appearance);
      const card = page.locator('#search-results-grid a.tool-card').filter({ hasText: 'Kiingereza tu' }).first();
      await expect(card).toHaveAttribute('href', '/tools/film-budget/');
      for (const scale of [1, 2]) {
        if (scale === 2) await doubleText(page, '#search-results-grid .tc-name,#search-results-grid .tc-desc,#search-results-grid .badge-soon,#search-results-grid .tc-cta');
        for (const row of await contrastOf(page, ['#search-results-grid .tc-name', '#search-results-grid .tc-desc', '#search-results-grid .badge-soon', '#search-results-grid .tc-cta'])) {
          expect(row.missing).toBeFalsy();
          expect(row.ratio, `${appearance.name} ${width}px text${scale} ${row.selector}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      await card.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/tools\/film-budget\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.goBack({ waitUntil: 'networkidle' });
      await page.locator('#sw-directory-clear-filters').click();
      await expect(page).toHaveURL(/\/sw\/zana-zote\/\?q=film$/);
      await expect(page.locator('#hero-search-query')).toHaveValue('film');
      await page.locator('#hero-search-query').fill('zzafrohubnomatch');
      await page.locator('#hero-search-query').press('Enter');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#search-results-grid .results-empty')).toContainText('Hakuna zana');
      for (const scale of [1, 2]) {
        if (scale === 2) await doubleText(page, '#search-results-grid .results-empty,#search-results-grid .results-empty strong');
        for (const row of await contrastOf(page, ['#search-results-grid .results-empty', '#search-results-grid .results-empty strong'])) {
          expect(row.missing).toBeFalsy();
          expect(row.ratio, `${appearance.name} no-match ${width}px text${scale}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      await page.locator('#hero-search-query').fill('bajeti');
      await page.locator('#hero-search-query').press('Enter');
      await page.waitForLoadState('networkidle');
      expect(await page.locator('#search-results-grid a.tool-card').count()).toBeGreaterThan(0);
    }
    expect(denied).toEqual([]);
  });
}
