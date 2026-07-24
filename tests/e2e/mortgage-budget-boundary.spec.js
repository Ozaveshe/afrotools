const { test, expect } = require('@playwright/test');

async function installStorageProbe(page) {
  await page.addInitScript(() => {
    window.__mbStorageMutations = [];
    const original = {
      setItem: Storage.prototype.setItem,
      removeItem: Storage.prototype.removeItem,
      clear: Storage.prototype.clear
    };
    Storage.prototype.setItem = function (key, value) {
      window.__mbStorageMutations.push({ operation: 'setItem', key: String(key), value: String(value) });
      return original.setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      window.__mbStorageMutations.push({ operation: 'removeItem', key: String(key) });
      return original.removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      window.__mbStorageMutations.push({ operation: 'clear' });
      return original.clear.call(this);
    };
  });
}

async function openTool(page, route, width, colorScheme, manualTheme) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme });
  await installStorageProbe(page);
  await page.route((url) =>
    /^(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)$/.test(url.hostname) ||
    (url.hostname === 'www.google.com' && url.pathname.startsWith('/measurement/')),
  (request) => request.fulfill({ status: 204, body: '' }));
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(route, { waitUntil: 'networkidle' });
  const accept = page.getByRole('button', { name: /^(Accept|Accepter|Kubali)/i }).first();
  try {
    await accept.waitFor({ state: 'visible', timeout: 2500 });
    await accept.click();
    await expect(accept).toBeHidden();
  } catch (error) {
    if (await accept.isVisible().catch(() => false)) throw error;
  }
  if (manualTheme) await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, manualTheme);
  await page.evaluate(() => { window.__mbStorageMutations = []; });
  const nonGet = [];
  page.on('request', (request) => { if (request.method() !== 'GET') nonGet.push(request.method() + ' ' + request.url()); });
  return { consoleErrors, nonGet };
}

async function fillCase(page, budget, costs, cushion) {
  await page.locator('#mb-budget').fill(String(budget));
  await page.locator('#mb-costs').fill(String(costs));
  await page.locator('#mb-cushion').fill(String(cushion));
  await page.locator('#mb-confirm').check();
  await page.locator('#mb-form button[type="submit"]').click();
  await expect(page.locator('#mb-result')).toHaveClass(/on/);
}

async function download(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const item = await pending;
  const stream = await item.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function expectPrivate(page, proof) {
  const mutations = await page.evaluate(() => window.__mbStorageMutations);
  expect(mutations.filter((mutation) => mutation.key !== '_gcl_ls')).toEqual([]);
  expect(mutations.some((mutation) =>
    /mortgage|budget|boundary/i.test(mutation.key || '') ||
    /3000|150000/.test(mutation.value || '')
  )).toBe(false);
  expect(proof.nonGet).toEqual([]);
  expect(proof.consoleErrors).toEqual([]);
}

async function expectPageQuality(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const unnamed = await page.locator('#main input, #main select, #main button, #main a').evaluateAll((elements) =>
    elements.filter((element) => {
      if (element.matches('input,select')) return !element.labels?.length && !element.getAttribute('aria-label');
      return !((element.textContent || '').trim() || (element.getAttribute('aria-label') || '').trim());
    }).map((element) => element.outerHTML)
  );
  expect(unnamed).toEqual([]);
}

async function expectHeroCtaContrast(page, restore) {
  const modes = [
    { theme: null, colorScheme: 'light', label: 'system light' },
    { theme: null, colorScheme: 'dark', label: 'system dark' },
    { theme: 'light', colorScheme: 'dark', label: 'manual light' },
    { theme: 'dark', colorScheme: 'light', label: 'manual dark' }
  ];
  for (const mode of modes) {
    await page.emulateMedia({ colorScheme: mode.colorScheme });
    await page.evaluate((theme) => {
      if (theme) document.documentElement.dataset.theme = theme;
      else delete document.documentElement.dataset.theme;
    }, mode.theme);
    const results = await page.locator('.mb-hero .mb-pill').evaluateAll((elements) => {
      function rgb(value) {
        const match = value.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
        return match ? match.slice(1, 4).map(Number) : null;
      }
      function luminance(color) {
        return color.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      }
      return elements.map((element) => {
        const style = getComputedStyle(element);
        const foreground = rgb(style.color);
        const background = rgb(style.backgroundColor);
        const lighter = Math.max(luminance(foreground), luminance(background));
        const darker = Math.min(luminance(foreground), luminance(background));
        return {
          label: element.textContent.trim(),
          color: style.color,
          background: style.backgroundColor,
          ratio: (lighter + 0.05) / (darker + 0.05)
        };
      });
    });
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.ratio, `${mode.label}: ${result.label} ${result.color} on ${result.background}`).toBeGreaterThanOrEqual(4.5);
    }
  }
  await page.emulateMedia({ colorScheme: restore.colorScheme });
  await page.evaluate((theme) => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, restore.theme);
  await page.evaluate(() => { window.__mbStorageMutations = []; });
}

async function captureFullPage(page, path) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const navbar = document.querySelector('afro-navbar');
    if (navbar) navbar.style.setProperty('position', 'static', 'important');
    Array.from(document.body.querySelectorAll('*')).forEach((element) => {
      if (getComputedStyle(element).position === 'fixed') {
        element.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  });
  await page.screenshot({ path, fullPage: true });
}

test('EN 320 system dark: private budget boundary, bounds, TXT and PDF', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/tools/mortgage-affordability/', 320, 'dark');
  await expectHeroCtaContrast(page, { theme: null, colorScheme: 'dark' });
  await fillCase(page, 3000, 450, 300);
  await expect(page.locator('#mb-boundary')).toContainText('2,250');
  await expect(page.locator('#mb-warning')).toContainText('not a loan amount');
  const links = await page.locator('.mb-links .mb-link').evaluateAll((items) => items.map((item) => new URL(item.href).pathname));
  expect(links).toEqual(['/tools/mortgage-calculator/','/tools/first-home-buyer/','/tools/home-loan-eligibility/','/tools/loan-compare/','/tools/property-transfer-cost/']);
  const text = (await download(page, '#mb-download')).toString('utf8');
  expect(text).toContain('Monthly payment boundary');
  expect(text).toContain('2,250');
  expect(text).toContain('not a loan amount');
  const pdf = await download(page, '#mb-pdf');
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(3_000);
  await page.locator('#mb-budget').fill('1000');
  await page.locator('#mb-costs').fill('800');
  await page.locator('#mb-cushion').fill('400');
  await page.locator('#mb-form button[type="submit"]').click();
  await expect(page.locator('#mb-boundary')).toContainText('0');
  await expect(page.locator('#mb-warning')).toContainText('exceed');
  await expectPageQuality(page);
  await captureFullPage(page, testInfo.outputPath('mortgage-budget-en-320-dark.png'));
  await expectPrivate(page, proof);
});

test('FR 375 light: localized boundary and export', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/fr/tools/capacite-emprunt/', 375, 'light');
  await expectHeroCtaContrast(page, { theme: null, colorScheme: 'light' });
  await fillCase(page, 1500, 150, 100);
  await expect(page.locator('#mb-boundary')).toContainText('1');
  await expect(page.locator('#mb-boundary')).toContainText('250');
  const text = (await download(page, '#mb-download')).toString('utf8');
  expect(text).toContain('Plafond de mensualité');
  expect(text).toContain('Budget logement choisi');
  const links = await page.locator('.mb-links .mb-link').evaluateAll((items) => items.map((item) => new URL(item.href).pathname));
  expect(links).toEqual(['/fr/tools/calculateur-hypothecaire/','/fr/tools/premier-achat-immobilier/','/fr/tools/eligibilite-pret-immobilier/','/fr/tools/comparateur-prets/','/fr/tools/frais-transfert-propriete/']);
  await expectPageQuality(page);
  await captureFullPage(page, testInfo.outputPath('mortgage-budget-fr-375-light.png'));
  await expectPrivate(page, proof);
});

test('SW 768 manual dark: localized boundary stays non-advisory', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/sw/zana/uwezo-wa-mkopo-wa-nyumba/', 768, 'light', 'dark');
  await expectHeroCtaContrast(page, { theme: 'dark', colorScheme: 'light' });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(9, 17, 31)');
  await fillCase(page, 150000, 20000, 10000);
  await expect(page.locator('#mb-boundary')).toContainText('120,000');
  await expect(page.locator('#mb-warning')).toContainText('Si kiasi cha mkopo');
  const links = await page.locator('.mb-links .mb-link').evaluateAll((items) => items.map((item) => new URL(item.href).pathname));
  expect(links).toEqual(['/sw/zana/kikokotoo-mkopo-wa-nyumba/','/sw/zana/mnunuzi-wa-kwanza-wa-nyumba/','/sw/zana/ustahiki-wa-mkopo-wa-nyumba/','/sw/zana/kilinganisha-mikopo/','/sw/zana/gharama-za-uhamisho-wa-mali/']);
  await expectPageQuality(page);
  await captureFullPage(page, testInfo.outputPath('mortgage-budget-sw-768-dark.png'));
  await expectPrivate(page, proof);
});
