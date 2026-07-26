const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/scientific-calc/';

async function pressExpression(page, expression) {
  await page.waitForFunction(() => typeof window.calcEvaluate === 'function' &&
    window.AfroTools && window.AfroTools.scientificEngine);
  await page.keyboard.type(expression);
  await page.keyboard.press('Enter');
}

test.describe('Scientific Calculator VIP', () => {
  test('evaluates arithmetic, powers and explicit angle modes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await pressExpression(page, '2+3*(4-1)');
    await expect(page.locator('#resultDisplay')).toContainText('11');

    await page.getByRole('button', { name: 'AC', exact: true }).click();
    await page.getByRole('button', { name: 'sin', exact: true }).click();
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: ')', exact: true }).click();
    await page.getByRole('button', { name: '=', exact: true }).click();
    await expect(page.locator('#resultDisplay')).toContainText('0.5');

    await page.locator('#modeBtn').click();
    await expect(page.locator('#modeBtn')).toHaveText('RAD');
    expect(errors).toEqual([]);
  });

  test('reports syntax and real-domain boundaries instead of guessing', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => typeof window.calcEvaluate === 'function');
    await page.getByRole('button', { name: 'tan', exact: true }).click();
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: '0', exact: true }).click();
    await page.getByRole('button', { name: ')', exact: true }).click();
    await page.getByRole('button', { name: '=', exact: true }).click();
    await expect(page.locator('#resultDisplay')).toContainText('Error');
    await expect(page.locator('#calcActionStatus')).toContainText('undefined');

    await page.getByRole('button', { name: 'AC', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await page.getByRole('button', { name: 'pi', exact: true }).click();
    await page.getByRole('button', { name: '=', exact: true }).click();
    await expect(page.locator('#calcActionStatus')).toContainText('explicit operator');
  });

  test('keeps history local and supports TXT, copy, print and PDF', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(request.url() + ' ' + (request.postData() || ''));
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    const fixture = '9472+8143';
    await pressExpression(page, fixture);
    await expect(page.locator('.hist-item')).toHaveCount(1);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain(fixture + ' = 17615');

    await page.evaluate(() => {
      window.__scientificPrintCalled = false;
      window.print = () => { window.__scientificPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__scientificPrintCalled)).toBe(true);
    expect(writes.every(payload => !decodeURIComponent(payload).includes(fixture))).toBe(true);

    const pdf = await page.pdf({ printBackground: true });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(10000);
  });

  for (const width of [320, 360]) {
    test(`reflows without document overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: 'commit' });
      await pressExpression(page, '5!');
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
    });
  }

  test('uses canonical self-hosted DM Sans and remains usable in dark mode at 200% text', async ({ page }) => {
    const fontRequests = [];
    page.on('request', request => {
      if (/font|googleapis|gstatic/i.test(request.url())) fontRequests.push(request.url());
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('button', { name: '7', exact: true }).click();
    await page.getByRole('button', { name: 'Factorial' }).click();
    await page.getByRole('button', { name: '=', exact: true }).click();
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      family: getComputedStyle(document.body).fontFamily,
      card: getComputedStyle(document.querySelector('.calc-wrap')).backgroundColor
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.family).toContain('DM Sans');
    expect(metrics.card).not.toBe('rgb(255, 255, 255)');
    expect(fontRequests.some(url => url.includes('/assets/fonts/dm-sans/'))).toBe(true);
    const head = await page.locator('head').innerHTML();
    expect(head).not.toMatch(/fonts\.googleapis|fonts\.gstatic/i);
  });

  test('gives every visible calculator control an accessible name', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('.calc-wrap button, .calc-wrap input, .calc-wrap textarea')
    ).filter(element => {
      if (element.type === 'hidden') return false;
      const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') &&
        !explicit && !element.textContent.trim();
    }).map(element => element.id || element.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});
