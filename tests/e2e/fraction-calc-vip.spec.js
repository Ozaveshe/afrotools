const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/fraction-calc/';

function contrastRatio(foreground, background) {
  const channels = value => value.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number);
  const luminance = value => {
    const linear = channels(value).map(channel => {
      const normal = channel / 255;
      return normal <= 0.03928 ? normal / 12.92 : ((normal + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function fillFraction(page, left, right) {
  await page.locator('#w1').fill(left.whole || '');
  await page.locator('#n1').fill(left.numerator);
  await page.locator('#d1').fill(left.denominator);
  await page.locator('#w2').fill(right.whole || '');
  await page.locator('#n2').fill(right.numerator);
  await page.locator('#d2').fill(right.denominator);
}

test.describe('Fraction Calculator VIP', () => {
  test('calculates exact fractions, mixed numbers and rounded forms', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    await fillFraction(
      page,
      { whole: '-2', numerator: '1', denominator: '3' },
      { numerator: '1', denominator: '3' },
    );
    await page.locator('#calculateFraction').click();

    await expect(page.locator('#resSimp')).toHaveText('-2');
    await expect(page.locator('#resMixed')).toHaveText('-2');
    await expect(page.locator('#resDec')).toHaveText('-2');
    await expect(page.locator('#stepsContent')).toContainText('improper fraction -7/3');
    await expect(page.locator('#fractionStatus')).toContainText('Exact fractions');
    expect(errors).toEqual([]);
  });

  test('does not truncate invalid input or invent a blank denominator', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    await fillFraction(
      page,
      { numerator: '1.5', denominator: '2' },
      { numerator: '1', denominator: '2' },
    );
    await page.locator('#calculateFraction').click();
    await expect(page.locator('#fractionStatus')).toContainText('whole number');
    await expect(page.locator('#n1')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#resultBox')).toBeHidden();

    await page.locator('#n1').fill('1');
    await page.locator('#d1').fill('');
    await page.locator('#calculateFraction').click();
    await expect(page.locator('#fractionStatus')).toContainText('Enter First denominator');
    await expect(page.locator('#d1')).toBeFocused();
  });

  test('exports the chosen solution locally and invokes print', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push({ url: request.url(), body: request.postData() || '' });
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    await fillFraction(
      page,
      { numerator: '1', denominator: '3' },
      { numerator: '1', denominator: '6' },
    );
    await page.locator('#calculateFraction').click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#downloadFractionReport').click();
    const download = await downloadPromise;
    const contents = fs.readFileSync(await download.path(), 'utf8');
    expect(contents).toContain('Expression: 1/3 + 1/6');
    expect(contents).toContain('Simplified result: 1/2');
    expect(contents).toContain('Working:');

    await page.evaluate(() => {
      window.__fractionPrintCalled = false;
      window.print = () => { window.__fractionPrintCalled = true; };
    });
    await page.locator('#printFractionReport').click();
    await expect.poll(() => page.evaluate(() => window.__fractionPrintCalled)).toBe(true);
    expect(writes.every(request => {
      const payload = decodeURIComponent(request.url + ' ' + request.body);
      return !payload.includes('1/3 + 1/6') && !payload.includes('Simplified result: 1/2');
    })).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`fits the app controls at ${width}px in dark mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
      await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
      await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
      await fillFraction(
        page,
        { numerator: '-1', denominator: '2' },
        { numerator: '1', denominator: '4' },
      );
      await page.locator('#calculateFraction').click();

      const metrics = await page.evaluate(() => {
        const app = document.querySelector('.tool-main');
        const card = document.querySelector('.card');
        const input = document.querySelector('#n1');
        const guidance = document.querySelector('.info-text');
        return {
          overflow: app.scrollWidth - app.clientWidth,
          pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          text: getComputedStyle(card).color,
          surface: getComputedStyle(card).backgroundColor,
          inputText: getComputedStyle(input).color,
          inputSurface: getComputedStyle(input).backgroundColor,
          guidanceText: getComputedStyle(guidance).color,
          guidanceSurface: getComputedStyle(guidance.closest('.info-card')).backgroundColor,
        };
      });
      expect(metrics.overflow).toBeLessThanOrEqual(1);
      expect(metrics.pageOverflow).toBeLessThanOrEqual(1);
      expect(metrics.text).not.toBe(metrics.surface);
      expect(metrics.inputText).not.toBe(metrics.inputSurface);
      expect(metrics.guidanceText).not.toBe(metrics.guidanceSurface);
      expect(contrastRatio(metrics.inputText, metrics.inputSurface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(metrics.guidanceText, metrics.guidanceSurface)).toBeGreaterThanOrEqual(4.5);
      await expect(page.locator('#resSimp')).toHaveText('-1/4');
    });
  }

  test('remains usable at 375px and 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    await fillFraction(
      page,
      { numerator: '4', denominator: '6' },
      { numerator: '9', denominator: '10' },
    );
    await page.locator('#op').selectOption('mul');
    await page.evaluate(() => document.getElementById('calculateFraction').click());

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('#resSimp')).toHaveText('3/5');
    await expect(page.locator('#printFractionReport')).toBeVisible();
  });

  test('gives every visible app control an accessible name', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.tool-main input, .tool-main select, .tool-main button'),
    ).filter(element => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !element.getAttribute('aria-label') && !labelledBy && !explicit && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });

  test('inherits canonical self-hosted DM Sans without a page-local Google font request', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP === true);
    const typography = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      input: getComputedStyle(document.querySelector('#n1')).fontFamily,
      pageLocalGoogleFonts: Array.from(document.head.querySelectorAll('link[href]'))
        .map(link => link.href)
        .filter(url => url.includes('fonts.googleapis.com')),
    }));
    expect(typography.body).toMatch(/^"DM Sans"|^DM Sans/);
    expect(typography.input).toMatch(/^"DM Sans"|^DM Sans/);
    expect(typography.pageLocalGoogleFonts).toEqual([]);
  });
});
