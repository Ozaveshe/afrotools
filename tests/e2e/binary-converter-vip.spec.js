const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/binary-converter/';

async function open(page) {
  await page.goto(route, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.AFROTOOLS_BINARY_CONVERTER_VIP === true);
  await expect(page.locator('#inputValue')).toBeVisible();
}

function output(page, label) {
  return page.locator('.base-label')
    .filter({ hasText: new RegExp(`^${label} \\(`) })
    .locator('..')
    .locator('.base-value');
}

test.describe('Binary Converter VIP', () => {
  test('converts binary, octal, decimal, hex and unsafe-range integers exactly', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await open(page);

    await page.locator('#inputBase').selectOption('2');
    await page.locator('#inputValue').fill('1010');
    await expect(output(page, 'Decimal')).toHaveText('10');
    await expect(output(page, 'Octal')).toHaveText('12');
    await expect(output(page, 'Hexadecimal')).toHaveText('A');

    await page.locator('#inputBase').selectOption('16');
    await page.locator('#inputValue').fill('FF');
    await expect(output(page, 'Decimal')).toHaveText('255');
    await expect(output(page, 'Binary')).toHaveText('1111 1111');

    await page.locator('#inputBase').selectOption('10');
    await page.locator('#inputValue').fill('9007199254740993');
    await expect(output(page, 'Decimal')).toHaveText('9,007,199,254,740,993');
    await expect(output(page, 'Hexadecimal')).toHaveText('20 0000 0000 0001');
    expect(runtimeErrors).toEqual([]);
  });

  test('labels exact and repeating fractions and rejects malformed input', async ({ page }) => {
    await open(page);
    await page.locator('#inputBase').selectOption('10');
    await page.locator('#inputValue').fill('10.625');
    await expect(output(page, 'Binary')).toHaveText('1010.101');
    await expect(page.locator('.output-box').filter({ hasText: 'Binary' }).locator('.precision-note'))
      .toHaveText('Exact representation');

    await page.locator('#inputValue').fill('0.1');
    await expect(output(page, 'Binary')).toHaveText('0.0(0011)');
    await expect(page.locator('.output-box').filter({ hasText: 'Binary' }).locator('.precision-note'))
      .toContainText('Repeating digits');

    await page.locator('#inputBase').selectOption('2');
    await page.locator('#inputValue').fill('2');
    await expect(page.locator('#errorMsg')).toContainText('not valid in base 2');

    await page.locator('#inputValue').fill('0b101');
    await expect(page.locator('#errorMsg')).toContainText('Choose the input base');

    await page.locator('#inputBase').selectOption('custom');
    await page.locator('#customBaseInput').fill('37');
    await expect(page.locator('#errorMsg')).toContainText('whole number from 2 to 36');
  });

  test('bounds two’s complement, IEEE, bitwise and large binary arithmetic honestly', async ({ page }) => {
    await open(page);
    await page.locator('#inputValue').fill('-128');
    await expect(page.locator('#twosGrid .twos-item').filter({ hasText: '8-bit' }).locator('.twos-val'))
      .toHaveText('1000 0000');

    await page.locator('#inputValue').fill('-129');
    await expect(page.locator('#twosGrid .twos-item').filter({ hasText: '8-bit' }).locator('.twos-val'))
      .toHaveText('Out of range');

    await page.locator('#ieeeInput').fill('3.14x');
    await expect(page.locator('#ieeeError')).toContainText('finite decimal number');
    await page.locator('#ieeeInput').fill('3.14');
    await expect(page.locator('#ieeeOutput .ieee-row')).toHaveCount(2);

    await page.locator('#bitA').fill('42x');
    await page.locator('#bitB').fill('27');
    await expect(page.locator('#bitwiseError')).toContainText('decimal integer');
    await page.locator('#bitA').fill('42');
    await expect(page.locator('.bitwise-result').filter({ hasText: 'AND' }).locator('.bitwise-dec'))
      .toHaveText('10');

    await page.locator('#arithA').fill('100000000000000000000000000000000000000000000000000001');
    await page.locator('#arithB').fill('1');
    await expect(page.locator('#arithOutput')).toContainText('decimal 9007199254740994');
  });

  test('downloads and prints a conversion summary without sending the input', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(request.url() + ' ' + (request.postData() || ''));
      }
    });
    await open(page);
    const fixture = '94729472';
    await page.locator('#inputValue').fill(fixture);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const contents = fs.readFileSync(await download.path(), 'utf8');
    expect(contents).toContain(`Input: ${fixture}`);
    expect(contents).toContain('arbitrary-precision BigInt math');

    await page.evaluate(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.locator('#printReportBtn').click();
    await expect.poll(() => page.evaluate(() => window.__printCalled)).toBe(true);
    expect(writes.every(write => !decodeURIComponent(write).includes(fixture))).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`reflows in real dark mode at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await open(page);
      await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
      await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
      await page.locator('#inputValue').fill('255');
      const layout = await page.evaluate(() => {
        const app = document.querySelector('.tool-main');
        const card = document.querySelector('.card');
        return {
          overflow: app.scrollWidth - app.clientWidth,
          theme: document.documentElement.dataset.theme,
          card: getComputedStyle(card).backgroundColor,
          text: getComputedStyle(card.querySelector('.card-title')).color,
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.theme).toBe('dark');
      expect(layout.card).not.toBe(layout.text);
    });
  }

  test('reflows at 375px and 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await open(page);
    await page.locator('#inputValue').fill('255');
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.body.style.zoom = '2';
    });
    const layout = await page.evaluate(() => ({
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      appOverflow: document.querySelector('.tool-main').scrollWidth
        - document.querySelector('.tool-main').clientWidth,
    }));
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    expect(layout.appOverflow).toBeLessThanOrEqual(1);
    await expect(page.locator('#printReportBtn')).toBeVisible();
  });

  test('provides accessible names for visible app controls', async ({ page }) => {
    await open(page);
    await page.locator('#inputBase').selectOption('custom');
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.tool-main input, .tool-main select, .tool-main button'),
    ).filter(element => {
      if (element.type === 'hidden') return false;
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      const wrapping = element.closest('label');
      return !element.getAttribute('aria-label')
        && !element.getAttribute('aria-labelledby')
        && !explicit
        && !wrapping
        && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});
