const { test, expect } = require('@playwright/test');

const route = '/tools/word-counter/';

test.describe('Word Counter VIP', () => {
  for (const width of [320, 360]) {
    test(`reflows without app-level overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AFROTOOLS_WORD_COUNTER_VIP === true);
      await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
      await page.evaluate(() => { window.AfroTools.darkMode.set('dark'); });
      await page.locator('#textInput').fill('A concise assignment draft for mobile layout verification.');
      await page.locator('#goalToggle').click();

      const overflow = await page.evaluate(() => {
        const app = document.querySelector('.tool-main');
        return app.scrollWidth - app.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('#minimumWords')).toBeVisible();
      await expect(page.locator('#downloadReportBtn')).toBeVisible();
    });
  }

  test('counts Unicode text and checks assignment limits', async ({ page }) => {
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await expect(page.locator('#textInput')).toBeVisible();
    await page.waitForFunction(() => window.AFROTOOLS_WORD_COUNTER_VIP === true);
    await page.locator('#textInput').fill('L’étudiant écrit un résumé. Ọmọ-ilé learns 2 languages.');

    await expect(page.locator('#wordCount')).toHaveText('8');
    await expect(page.locator('#sentenceCount')).toHaveText('2');

    await page.locator('#goalToggle').click();
    await page.locator('#minimumWords').fill('10');
    await page.locator('#maximumWords').fill('12');
    await expect(page.locator('#limitResult')).toContainText('2 words needed');

    await page.locator('#minimumWords').fill('');
    await page.locator('#maximumWords').fill('5');
    await expect(page.locator('#limitResult')).toContainText('3 words over');
    await expect(page.locator('#limitResult')).toHaveAttribute('data-state', 'over');
    expect(runtimeErrors).toEqual([]);
  });

  test('exports a summary without draft text and invokes print', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push({ method: request.method(), url: request.url(), body: request.postData() || '' });
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    await expect(page.locator('#textInput')).toBeVisible();
    await page.waitForFunction(() => window.AFROTOOLS_WORD_COUNTER_VIP === true);
    const sensitiveFixture = 'Synthetic private essay marker 9472.';
    await page.locator('#textInput').fill(sensitiveFixture);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#downloadReportBtn').click();
    const download = await downloadPromise;
    const path = await download.path();
    const contents = require('node:fs').readFileSync(path, 'utf8');
    expect(contents).toContain('Words: 5');
    expect(contents).toContain('draft text is intentionally excluded');
    expect(contents).not.toContain(sensitiveFixture);

    await page.evaluate(() => {
      window.__printCalled = false;
      window.print = () => { window.__printCalled = true; };
    });
    await page.locator('#printReportBtn').click();
    await expect.poll(() => page.evaluate(() => window.__printCalled)).toBe(true);
    expect(writes.every(request => {
      const payload = decodeURIComponent(request.url + ' ' + request.body);
      return !payload.includes(sensitiveFixture) && !payload.includes('Synthetic private essay');
    })).toBe(true);
  });

  test('is usable in dark mode at narrow widths and 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'commit' });
    await expect(page.locator('#textInput')).toBeVisible();
    await page.waitForFunction(() => window.AFROTOOLS_WORD_COUNTER_VIP === true);
    await page.locator('#goalToggle').click();
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.body.style.zoom = '2';
    });
    await page.locator('#textInput').fill('A focused draft has enough text to test the narrow layout and controls.');

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      textColor: getComputedStyle(document.querySelector('.card-title')).color,
      surfaceColor: getComputedStyle(document.querySelector('.card')).backgroundColor,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.textColor).not.toBe(metrics.surfaceColor);
    await expect(page.locator('#minimumWords')).toBeVisible();
    await expect(page.locator('#printReportBtn')).toBeVisible();
  });

  test('gives visible app controls accessible names', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_WORD_COUNTER_VIP === true);
    await page.locator('#goalToggle').click();
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.tool-main input, .tool-main textarea, .tool-main button'),
    ).filter(element => {
      if (element.type === 'hidden') return false;
      const labelledBy = element.getAttribute('aria-labelledby');
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !element.getAttribute('aria-label') && !labelledBy && !explicit && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});
