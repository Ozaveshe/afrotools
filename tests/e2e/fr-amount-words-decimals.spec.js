'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
// Optional reviewed English checkout for an isolated localization lane. Only
// these two English HTML owners are served from it; product files stay untouched.
const englishRoot = process.env.FR_AMOUNT_WORDS_EN_ROOT || root;
const rows = [
  { id: 'naira-to-words', fr: 'naira-en-lettres', action: '#ngn-form button[type=submit]',
    enWords: '#result', frWords: '#english-output', enFigure: '#formatted', frFigure: '#numeric-output',
    copy: '#copy-result', txt: '#download-result', baseline: ['2500.75', '7800.50'], currency: 'NGN' },
  { id: 'amount-words-gh', fr: 'montant-lettres-gh', action: '#wordsForm button[type=submit]',
    enWords: '#wordsResult', frWords: '#wordsOutput', enFigure: '#fmtResult', frFigure: '#invoiceOutput',
    copy: '#copyBtn', txt: '#downloadBtn', baseline: ['1450.50', '9250.25'], currency: 'GHS' }
];
test.use({ viewport: { width: 390, height: 844 }, trace: 'off' });
test.beforeEach(async ({ context, baseURL }) => {
  await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    const row = rows.find(item => url.pathname === `/tools/${item.id}/`);
    if (row) return route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(englishRoot, 'tools', row.id, 'index.html'), 'utf8') });
    return route.continue();
  });
  expect(fs.readFileSync(path.join(englishRoot, 'assets/js/engines/amount-words-input.js'), 'utf8').replace(/\r\n/g, '\n'))
    .toBe(fs.readFileSync(path.join(root, 'assets/js/engines/amount-words-input.js'), 'utf8').replace(/\r\n/g, '\n'));
});
async function words(page, selector) {
  return page.locator(selector).evaluate(node => {
    const copy = node.cloneNode(true);
    copy.querySelector('.currency-label')?.remove();
    return copy.textContent.toLowerCase().replace(/[.,]+$/g, '').replace(/\s+/g, ' ').trim();
  });
}
async function downloadText(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
for (const row of rows) {
  test(`${row.id}: same-fixture words, exact figures and parsed copy/JSON/TXT`, async ({ page, context }) => {
    const en = await context.newPage();
    await en.goto(`/tools/${row.id}/`);
    await page.goto(`/fr/tools/${row.fr}/`);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const scenarios = [
      ...row.baseline.map(value => [value, value, value]),
      ['1.005', '1.005', '1.01'], ['0.005', '0.005', '0.01'],
      ['2.675', '2.675', '2.68'], ['999.995', '999.995', '1000.00'],
      ['1,250.75', '1,250.75', '1250.75'], ['0', '0', '0.00'], ['1', '1', '1.00'],
      ['1 250,75', '1250.75', '1250.75'], ['1250,75', '1250.75', '1250.75'],
      ['999999999999.99', '999999999999.99', '999999999999.99']
    ];
    for (const [frenchInput, englishInput, canonical] of scenarios) {
      await en.locator('#amount').fill(englishInput);
      await page.locator('#amount').fill(frenchInput);
      await page.locator(row.action).click();
      const englishWords = await words(en, row.enWords);
      expect(await words(page, row.frWords), frenchInput).toBe(englishWords);
      const figure = canonical.replace(/\B(?=(\d{3})+\.)/g, ',');
      await expect(en.locator(row.enFigure)).toContainText(figure);
      await expect(page.locator(row.frFigure)).toContainText(figure);
      const jsonDownload = page.waitForEvent('download');
      await page.locator('[data-native-export=json]').click();
      const json = JSON.parse(await downloadText(await jsonDownload));
      expect(json.amount).toBe(frenchInput);
      expect((json.englishWords || json.words).toLowerCase().replace(/[.,]+$/g, '').trim()).toBe(englishWords);
      expect(json.numeric || json.invoice).toContain(figure);
      const txtDownload = page.waitForEvent('download');
      await page.locator(row.txt).click();
      const txt = await downloadText(await txtDownload);
      expect(txt).toContain(figure);
      expect(txt.toLowerCase()).toContain(englishWords);
      await page.locator(row.copy).click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied).toContain(figure);
      expect(copied.toLowerCase()).toContain(englishWords);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await en.close();
  });

  test(`${row.id}: malformed input and cap carry clear exports, then recover`, async ({ page, context }) => {
    await page.goto(`/fr/tools/${row.fr}/`);
    let downloads = 0;
    page.on('download', () => downloads++);
    for (const value of ['-1', 'abc', '1.2.3', '1,250', '1,005', '12 50,75', '999999999999.995', '1000000000000', '']) {
      await page.locator('#amount').fill('1.005');
      await page.locator(row.action).click();
      await page.locator('#amount').fill(value);
      await page.locator(row.action).click();
      await expect(page.locator(row.frWords)).toBeEmpty();
      await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
      await page.evaluate(() => navigator.clipboard.writeText('unchanged'));
      await page.locator(row.copy).click();
      await page.locator(row.txt).click();
      await page.locator('[data-native-export=json]').click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('unchanged');
      expect(downloads).toBe(0);
      await page.locator('#amount').fill('1.005');
      await page.locator(row.action).click();
      await expect(page.locator(row.frFigure)).toContainText('1.01');
      await expect(page.locator('#amount')).not.toHaveAttribute('aria-invalid', 'true');
    }
    const en = await context.newPage();
    await en.goto(`/tools/${row.id}/`);
    await en.locator('#amount').fill('999999999999.995');
    await page.locator('#amount').fill('999999999999.995');
    await page.locator(row.action).click();
    await expect(page.locator(row.frWords)).toBeEmpty();
    if (row.id === 'naira-to-words') {
      // Documented domain difference: the French renderer retains its smaller
      // maximum, while the English owner supports trillions.
      await expect(en.locator(row.enFigure)).toContainText('1,000,000,000,000.00');
    } else {
      await expect(en.locator(row.enWords)).toBeEmpty();
      await expect(en.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
    }
    await en.close();
  });
}
