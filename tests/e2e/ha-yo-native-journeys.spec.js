const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const ha = '/ha/kayan-aiki/tazarar-riba/';
const yo = '/yo/awon-ise/naira-si-oro/';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});
async function gross(page, revenue = '150', cogs = '100') {
  await page.locator('#pmRevenue').fill(revenue);
  await page.locator('#pmCogs').fill(cogs);
  await page.locator('#pmForm button[type=submit]').click();
}
test('Hausa three margin modes, invalid recovery, zero costs, loss and reset', async ({ page }) => {
  await page.goto(ha);
  await gross(page);
  await expect(page.locator('#pmMargin')).toHaveText('33.33%');
  await page.locator('[data-mode=operating]').click();
  await page.locator('#pmOpex').fill('10');
  await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmProfit')).toHaveText('40.00');
  await page.locator('[data-mode=net]').click();
  for (const id of ['pmInterest', 'pmTax', 'pmOther']) await page.locator('#' + id).fill('5');
  await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmProfit')).toHaveText('25.00');
  await page.locator('[data-mode=gross]').click();
  await gross(page, '100', '140');
  await expect(page.locator('#pmMargin')).toHaveText('-40.00%');
  await page.locator('#pmCogs').fill('0');
  await expect(page.locator('#pmMarkup')).toHaveText('Ba a ayyana ba');
  await page.locator('#pmRevenue').fill('0');
  await page.locator('#pmForm button[type=submit]').click();
  await expect(page.locator('#pmRevenue')).toBeFocused();
  await expect(page.locator('#pmRevenue')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#pmResult')).not.toHaveClass(/on/);
  await page.locator('#pmRevenue').fill('150');
  await expect(page.locator('#pmResult')).toHaveClass(/on/);
  await page.locator('#pmReset').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pmRevenue')).toBeFocused();
  await expect(page.locator('#pmRevenue')).toHaveValue('');
  await expect(page.locator('#pmResult')).not.toHaveClass(/on/);
  await expect(page.locator('#pmStatus')).toHaveText('An sake saita filayen.');
});
test('Hausa PDF round trips real letters and CSV prevents formula evaluation', async ({ page }) => {
  await page.goto(ha);
  await page.locator('#pmUnit').fill('=1+1');
  await gross(page);
  let wait = page.waitForEvent('download');
  await page.locator('#pmCsv').click();
  let file = await wait;
  expect(fs.readFileSync(await file.path(), 'utf8')).toContain('"Awo","\'=1+1"');
  await expect(page.locator('#pmStatus')).toHaveText('An sauke CSV.');
  wait = page.waitForEvent('download');
  await page.locator('#pmPdf').click();
  file = await wait;
  const parsed = await pdfParse(fs.readFileSync(await file.path()));
  expect(parsed.text).toContain('Kuɗin shiga: 150');
  expect(parsed.text).toContain('Ƙarin farashi kan farashin kaya: 50%');
  expect(parsed.info.Subject).toContain('ƙimomin mai amfani');
  await expect(page.locator('#pmStatus')).toHaveText('An sauke PDF.');
});
test('Hausa font failure is local, retryable, and stale PDF is cancelled after reset', async ({ page }) => {
  await page.route('**/NotoSans-Regular.ttf', route => route.fulfill({ status: 503, body: '' }));
  await page.goto(ha); await gross(page);
  await page.locator('#pmPdf').click();
  await expect(page.locator('#pmStatus')).toContainText('Sake gwadawa');
  await expect(page.locator('#pmPdf')).toBeEnabled();
  await page.unroute('**/NotoSans-Regular.ttf');
  const fonts = [];
  await page.route('**/NotoSans-Regular.ttf', route => { fonts.push(route); });
  await page.locator('#pmPdf').click();
  await expect.poll(() => fonts.length).toBe(1);
  let downloads = 0; page.on('download', () => downloads++);
  await page.locator('#pmReset').click();
  await fonts[0].continue();
  await expect(page.locator('#pmPdf')).toBeEnabled();
  expect(downloads).toBe(0);
  await expect(page.locator('#pmStatus')).toHaveText('An sake saita filayen.');
});
test('Yoruba decimal validation rejects malformed inputs, preserves cents and resets', async ({ page }) => {
  await page.goto(yo);
  await expect(page.locator('#amount')).toHaveValue('');
  await expect(page.locator('#downloadLine')).toBeDisabled();
  await expect(page.locator('[data-yo-p1-planner],input[type=file]')).toHaveCount(0);
  for (const amount of ['-1', 'abc', '1,2', '1e3', '1.999', '1000000000000', '']) {
    await page.locator('#amount').fill(amount);
    await page.locator('#convert').click();
    await expect(page.locator('#amount')).toBeFocused();
    await expect(page.locator('#amountError')).not.toBeEmpty();
    await expect(page.locator('#docLine')).toBeEmpty();
    await expect(page.locator('#downloadLine')).toBeDisabled();
  }
  for (const [amount, naira, kobo] of [['0', '₦0', '00'], ['1.99', '₦1', '99'], ['125,000.75', '₦125,000', '75'], ['999999999999.99', '₦999,999,999,999', '99']]) {
    await page.locator('#amount').fill(amount);
    await expect(page.locator('#nairaPart')).toHaveText(naira);
    await expect(page.locator('#koboPart')).toHaveText(kobo);
    await expect(page.locator('#amountError')).toBeEmpty();
    await expect(page.locator('#downloadLine')).toBeEnabled();
  }
  await page.locator('#clear').click();
  await expect(page.locator('#amount')).toBeFocused();
  await expect(page.locator('#docLine')).toBeEmpty();
  await expect(page.locator('#amountError')).toBeEmpty();
  await expect(page.locator('#downloadLine')).toBeDisabled();
});
for (const route of [ha, yo]) test(`${route} accessible mobile journey and private local exports`, async ({ page }) => {
  const errors = [], transmissions = [];
  const syntheticPrivate = 'SyntheticLocalOnlyMarker173';
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') transmissions.push({url:request.url(),body:request.postData()||''}); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('.skip-link').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await axe.run('#main-content', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
  })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
  expect(violations).toEqual([]);
  if (route === ha) await gross(page); else {
    await page.locator('#amount').fill('125000.75');
    await page.locator('#payee').fill(syntheticPrivate);
  }
  // Shared consent-mode telemetry may send metadata-only pings. No form content
  // or same-origin write/API request is permitted by these local workflows.
  expect(errors).toEqual([]);
  expect(transmissions.filter(item=>item.url.startsWith(test.info().project.use.baseURL))).toEqual([]);
  expect(transmissions.some(item=>(item.url+item.body).includes(syntheticPrivate))).toBe(false);
  if(route===yo)await page.locator('#payee').fill('');
  if (process.env.HA_YO_EVIDENCE_DIR) {
    fs.mkdirSync(process.env.HA_YO_EVIDENCE_DIR, { recursive: true });
    await page.setViewportSize({ width: 320, height: 844 });
    // Only synthetic numeric inputs are shown; personal text fields stay blank.
    await page.screenshot({ path: path.join(process.env.HA_YO_EVIDENCE_DIR, route === ha ? 'ha-320.png' : 'yo-320.png'), fullPage: true });
  }
});
