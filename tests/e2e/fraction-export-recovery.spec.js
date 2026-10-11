const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function calculate(page) {
  await page.locator('#calculateFraction').click();
  await expect(page.locator('#resultBox')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/fraction-calc/', { waitUntil: 'commit' });
  await page.waitForFunction(() => window.AFROTOOLS_FRACTION_VIP);
  for (const [id, value] of Object.entries({ w1: '', n1: '1', d1: '2', w2: '', n2: '1', d2: '4' })) {
    await page.locator('#' + id).fill(value);
  }
  await calculate(page);
  await expect(page.locator('#resSimp')).toHaveText('3/4');
});

for (const event of ['input', 'change']) {
  test(`all operands invalidate exports on ${event}`, async ({ page }) => {
    const downloads = [];
    page.on('download', item => downloads.push(item));
    await page.evaluate(() => {
      window.__copies = [];
      window.__prints = 0;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: text => { window.__copies.push(text); return Promise.resolve(); }
      } });
      window.print = () => { window.__prints++; };
    });
    for (const id of ['w1', 'n1', 'd1', 'w2', 'n2', 'd2']) {
      await page.locator('#' + id).evaluate((field, type) => {
        field.value = '2';
        field.dispatchEvent(new Event(type, { bubbles: true }));
      }, event);
      await expect(page.locator('#resultBox')).toBeHidden();
      await expect(page.locator('#stepsBox')).toBeHidden();
      for (const action of ['copy', 'download', 'print']) {
        await page.locator('#' + action + 'FractionReport').click();
        await expect(page.locator('#fractionStatus')).toContainText('Calculate a fraction before');
      }
      await calculate(page);
    }
    expect(await page.evaluate(() => ({ copies: window.__copies, prints: window.__prints })))
      .toEqual({ copies: [], prints: 0 });
    expect(downloads).toEqual([]);
  });
}

test('changing operation requires recalculation and exports the new answer', async ({ page }) => {
  await page.locator('#op').selectOption('mul');
  await expect(page.locator('#resultBox')).toBeHidden();
  await page.locator('#downloadFractionReport').click();
  await expect(page.locator('#fractionStatus')).toContainText('Calculate a fraction before');
  await calculate(page);
  await expect(page.locator('#resSimp')).toHaveText('1/8');
  const pending = page.waitForEvent('download');
  await page.locator('#downloadFractionReport').click();
  const downloaded = await pending;
  expect(fs.readFileSync(await downloaded.path(), 'utf8')).toContain('Simplified result: 1/8');
});

for (const mode of ['rejected', 'throws', 'missing', 'false']) {
  test(`clipboard ${mode} failure is visible, cleaned up and retryable`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluate(mode => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'missing'
        ? undefined : { writeText: () => {
          if (mode === 'throws') throw new Error('denied');
          return Promise.reject(new Error('denied'));
        } } });
      document.execCommand = () => {
        if (mode === 'false') return false;
        throw new Error('denied');
      };
    }, mode);
    await page.locator('#copyFractionReport').click();
    await expect(page.locator('#fractionStatus')).toHaveText('Copy failed. Download the TXT solution instead.');
    await expect(page.locator('.copy-fallback')).toHaveCount(0);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: text => { window.__copied = text; return Promise.resolve(); }
    } }));
    await page.locator('#copyFractionReport').click();
    await expect(page.locator('#fractionStatus')).toHaveText('Solution copied.');
    expect(await page.evaluate(() => window.__copied)).toContain('Simplified result: 3/4');
    expect(errors).toEqual([]);
  });
}
