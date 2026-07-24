const path = require('path');
const { test, expect } = require('@playwright/test');

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function rgb(value) {
  const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Unsupported computed color: ${value}`);
  return match.slice(1, 4).map(Number);
}

function contrast(foreground, background) {
  const luminance = color => {
    const [red, green, blue] = rgb(color).map(channel);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function computedPair(locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.color, background: style.backgroundColor };
  });
}

const cases = [
  {
    label: 'EN system dark',
    route: '/tools/paye-calculator/',
    width: 320,
    colorScheme: 'dark',
    manualTheme: null,
    country: 'GH',
    href: '/ghana/gh-paye',
    language: 'en',
    artifact: 'paye-directory-en-320-dark-final.png'
  },
  {
    label: 'FR system light',
    route: '/fr/tools/calculateur-paye/',
    width: 375,
    colorScheme: 'light',
    manualTheme: null,
    country: 'SN',
    href: '/fr/senegal/calculateur-salaire-net',
    language: 'fr',
    artifact: 'paye-directory-fr-375-light-final.png'
  },
  {
    label: 'EN manual light',
    route: '/tools/paye-calculator/',
    width: 768,
    colorScheme: 'dark',
    manualTheme: 'light',
    country: 'AO',
    href: '/angola/ao-paye',
    language: 'en'
  },
  {
    label: 'FR manual dark',
    route: '/fr/tools/calculateur-paye/',
    width: 768,
    colorScheme: 'light',
    manualTheme: 'dark',
    country: 'CM',
    href: '/fr/cameroun/calculateur-salaire-net',
    language: 'fr'
  }
];

for (const scenario of cases) {
  test(`${scenario.label}: enabled and unsupported states remain legible`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(`${request.method()} ${request.url()}`);
    });

    await page.emulateMedia({ colorScheme: scenario.colorScheme });
    await page.addInitScript(manualTheme => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      if (manualTheme) localStorage.setItem('aft_theme', manualTheme);
      else localStorage.removeItem('aft_theme');
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        window.__payeStorageWrites = (window.__payeStorageWrites || []).concat(String(key));
        return originalSetItem.call(this, key, value);
      };
    }, scenario.manualTheme);
    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.goto(scenario.route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.manualTheme || scenario.colorScheme);
    await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#paye-country')).toHaveValue('');
    if (scenario.language === 'fr') {
      await expect(page.locator('#paye-country option[value="GN"]')).toHaveText('Guinée');
    }

    await page.selectOption('#paye-country', scenario.country);
    const open = page.locator('#paye-country-open');
    await expect(open).toHaveAttribute('href', scenario.href);
    await expect(open).toBeVisible();
    const enabledPair = await computedPair(open);
    expect(contrast(enabledPair.color, enabledPair.background), enabledPair).toBeGreaterThanOrEqual(4.5);

    if (scenario.artifact) {
      await page.screenshot({
        path: path.join(process.cwd(), 'artifacts', scenario.artifact),
        fullPage: true
      });
    }

    await page.selectOption('#paye-country', 'GW');
    const result = page.locator('#paye-country-result');
    await expect(result).toContainText(scenario.language === 'fr' ? 'Aucun calculateur' : 'No source-backed');
    await expect(open).toBeHidden();
    const unsupportedPair = await computedPair(result);
    expect(contrast(unsupportedPair.color, unsupportedPair.background), unsupportedPair).toBeGreaterThanOrEqual(4.5);

    expect(await page.locator('input[type="number"]').count()).toBe(0);
    expect(await page.getByRole('button', { name: /pdf/i }).count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const storageWrites = await page.evaluate(() => window.__payeStorageWrites || []);
    expect(storageWrites.filter(key => /paye|salary|gross|country/i.test(key))).toEqual([]);
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
