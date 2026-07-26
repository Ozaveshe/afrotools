const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/roman-numerals/';

async function openApp(page) {
  await page.goto(route, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.AFROTOOLS_ROMAN_NUMERALS_VIP === true);
}

test.describe('Roman Numeral Converter VIP', () => {
  test('converts both directions and shows its working', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await openApp(page);

    await page.locator('#input').fill('2024');
    await expect(page.locator('#resultValue')).toHaveText('MMXXIV');
    await expect(page.locator('#resultWorking')).toContainText('2000 → MM');
    await page.getByRole('button', { name: 'Swap direction' }).click();
    await expect(page.locator('#resultValue')).toHaveText('2024');
    await expect(page.locator('#resultSub')).toHaveText('MMXXIV = 2024');
    expect(runtimeErrors).toEqual([]);
  });

  test('rejects malformed and non-canonical values without partial parsing', async ({ page }) => {
    await openApp(page);
    for (const value of ['12abc', '12.5', '1e3', 'IIII', 'IC', '4000']) {
      await page.locator('#input').fill(value);
      await expect(page.locator('#resultValue')).toHaveText('Not converted');
    }
    await expect(page.locator('#resultStatus')).toContainText('1 to 3999');
  });

  test('keeps invalid batch rows visible', async ({ page }) => {
    await openApp(page);
    await page.getByRole('tab', { name: 'Batch' }).click();
    await page.locator('#batchInput').fill('42\nXLII\n12abc\n0');
    await page.getByRole('button', { name: 'Check list' }).click();
    await expect(page.locator('#batchResults .batch-row')).toHaveCount(4);
    await expect(page.locator('#batchStatus')).toContainText('2 invalid');
    await expect(page.locator('#batchResults')).toContainText('12abc');
    await expect(page.locator('#batchResults')).toContainText('Invalid');
  });

  test('quiz feedback remains until the learner requests the next question', async ({ page }) => {
    await openApp(page);
    await page.getByRole('tab', { name: 'Practice quiz' }).click();
    const expected = await page.evaluate(() => {
      const direction = document.querySelector('#quizDirection').textContent;
      const prompt = document.querySelector('#quizPrompt').textContent;
      return direction.includes('Roman')
        ? window.AfroTools.romanNumerals.toRoman(Number(prompt))
        : String(window.AfroTools.romanNumerals.fromRoman(prompt));
    });
    await page.locator('#quizAnswer').fill(expected);
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('#quizFeedback')).toHaveText('Correct.');
    await expect(page.getByRole('button', { name: 'Next question' })).toBeVisible();
    await page.waitForTimeout(2300);
    await expect(page.locator('#quizFeedback')).toHaveText('Correct.');
  });

  test('downloads a clear worksheet, invokes print, and does not send the entry', async ({ page }) => {
    const fixture = '3947';
    const requests = [];
    page.on('request', request => requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() || ''
    }));
    await openApp(page);
    await page.locator('#input').fill(fixture);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('3947 = MMMCMXLVII');
    expect(text).toContain('modern conventional Roman numerals');
    expect(text).toContain('Not supported: zero, negatives, fractions');

    await page.evaluate(() => {
      window.__romanPrintCalled = false;
      window.print = () => { window.__romanPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__romanPrintCalled)).toBe(true);
    await page.evaluate(() => document.body.classList.add('roman-print-result'));
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(10_000);

    const exposed = requests.filter(request => {
      const payload = decodeURIComponent(request.url + ' ' + request.body);
      return payload.includes(fixture);
    });
    expect(exposed).toEqual([]);
  });

  for (const width of [320, 360]) {
    test(`reflows controls without app overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await openApp(page);
      await page.locator('#input').fill('3999');
      const metrics = await page.evaluate(() => {
        const app = document.querySelector('.roman-vip');
        return { scrollWidth: app.scrollWidth, clientWidth: app.clientWidth };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
    });
  }

  test('inherits shared typography and remains usable in dark mode at 375px and 200%', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await openApp(page);
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.documentElement.style.fontSize = '200%';
    });
    await page.locator('#input').fill('3888');
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyFont: getComputedStyle(document.body).fontFamily,
      appFont: getComputedStyle(document.querySelector('.roman-vip')).fontFamily,
      cardColor: getComputedStyle(document.querySelector('#convertTab')).color,
      cardBackground: getComputedStyle(document.querySelector('#convertTab')).backgroundColor
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.appFont).toBe(metrics.bodyFont);
    expect(metrics.cardColor).not.toBe(metrics.cardBackground);
  });

  test('supports keyboard tabs and FAQ disclosure with named controls', async ({ page }) => {
    await openApp(page);
    await page.getByRole('tab', { name: 'Converter' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Batch' })).toHaveAttribute('aria-selected', 'true');

    const faq = page.locator('.faq-item').first();
    await faq.focus();
    await page.keyboard.press('Enter');
    await expect(faq).toHaveAttribute('aria-expanded', 'true');

    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.roman-vip input, .roman-vip textarea, .roman-vip select, .roman-vip button')
    ).filter(element => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !element.getAttribute('aria-label') && !labelledBy && !explicit && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});
