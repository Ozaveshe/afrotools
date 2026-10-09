const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const route = '/yo/awon-ise/naira-si-oro/';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.copiedValues = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => window.copiedValues.push(value)
    } });
  });
});

test('TXT contains exact Yoruba and opaque user text followed by a real newline', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(route);
  await page.locator('#amount').fill('125000.75');
  await page.locator('#purpose').fill('Ìsanwó fún ìpèsè');
  const opaque = 'Ọlá <&>'.normalize('NFD');
  await page.locator('#payee').fill(opaque);
  const line = await page.locator('#docLine').textContent();
  const words = (await page.locator('#words').innerText()).replace('Ọ̀rọ̀ Naira', '').trim();
  expect(line).toContain(opaque);
  await page.locator('#copyWords').focus();
  await page.keyboard.press('Enter');
  await page.locator('#copyLine').click();
  expect(await page.evaluate(() => window.copiedValues)).toEqual([words, line]);
  const downloaded = page.waitForEvent('download');
  await page.locator('#downloadLine').click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('naira-si-oro.txt');
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.toString('utf8')).toBe(line + '\n');
  expect(bytes.at(-1)).toBe(10);
  expect(errors).toEqual([]);
  if (process.env.AFROTOOLS_ROTATION_SCREENSHOT) {
    await page.screenshot({ path: process.env.AFROTOOLS_ROTATION_SCREENSHOT, fullPage: true });
  }
});

test('copy denial and missing clipboard have accessible feedback and allow recovery', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  const status = page.locator('#exportStatus');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await page.locator('#copyLine').click();
  await expect(status).toHaveText('A ti dàkọ.');
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new DOMException('Synthetic denial', 'NotAllowedError'); };
  });
  await page.locator('#copyWords').click();
  await expect(status).toContainText('Kò ṣeé dàkọ');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await page.locator('#copyLine').click();
  await expect(status).toContainText('Kò ṣeé dàkọ');
  const downloaded = page.waitForEvent('download');
  await page.locator('#downloadLine').click();
  await downloaded;
  await expect(status).toHaveText('A ti gba TXT.');
  await page.locator('#purpose').fill('Àkọsílẹ̀ tuntun');
  await expect(status).toBeEmpty();
  expect(errors).toEqual([]);
});

test('small-width export workflow preserves fallback and route contracts', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('lang', 'yo');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + route);
  await expect(page.locator('meta[name="afrotools-locale-coverage"]')).toHaveAttribute('content', 'english-fallback');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await page.locator('link[rel="alternate"]').count()).toBe(0);
  await expect(page.locator('[data-yoruba-fallback] a')).toHaveAttribute('href', '/tools/naira-to-words/');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const id of ['copyWords', 'copyLine', 'downloadLine']) {
      expect((await page.locator('#' + id).boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
  }
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await window.axe.run('#main-content', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
  })).violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) })));
  expect(violations).toEqual([]);
});
