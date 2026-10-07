const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const routes = { en: '/tools/invoice-generator/', fr: '/fr/tools/generateur-factures/', sw: '/sw/zana/kizalishaji-ankara/', ha: '/ha/kayan-aiki/kirkiro-invoice/' };
test.use({ trace: 'off', screenshot: 'off', video: 'off', actionTimeout: 15000, storageState: { cookies: [], origins: [] } });

async function reveal(page, id) {
  const control = page.locator('#' + id);
  for (const detail of await control.locator('xpath=ancestor::details').all()) {
    if (await detail.getAttribute('open') === null) await detail.locator('summary').first().click();
  }
  return control;
}
async function prepare(page, route, baseURL) {
  const failures = [];
  page.on('pageerror', () => failures.push('pageerror'));
  const origin = new URL(baseURL).origin;
  await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
  await page.addInitScript(() => {
    window.__prints = 0; window.__shares = []; window.__copies = [];
    window.print = () => window.__prints++;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => window.__shares.push(data) });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => window.__copies.push(value) } });
  });
  await page.goto(route);
  const decline = page.locator('#afro-cc-decline');
  if (await decline.isVisible()) await decline.click();
  await page.waitForFunction(() => window.AfroInvoiceState && window.AfroInvoiceState.__enhanced);
  return failures;
}
async function fill(page) {
  await page.locator('#companyName').fill('Émetteur synthétique');
  await page.locator('#clientName').fill('Client synthétique');
  await page.locator('#invoiceNumber').fill('SYN-ONLY-42');
  await page.locator('#currency').selectOption('GHS');
  await page.locator('.li-desc').first().fill('Prestation synthétique');
  await page.locator('.li-price').first().fill('100');
  await (await reveal(page, 'bankDetails')).fill('Référence synthétique');
  await (await reveal(page, 'amountPaid')).fill('12');
  await (await reveal(page, 'withholdingPercent')).fill('5');
}
const syntheticLogo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/L9sAAAAASUVORK5CYII=', 'base64');
async function download(page, id) {
  const pending = page.waitForEvent('download');
  await (await reveal(page, id)).click();
  return fs.readFileSync(await (await pending).path());
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} invoice guards review, private sharing and printable output`, async ({ page, baseURL }) => {
    test.setTimeout(90000);
    const failures = await prepare(page, route, baseURL);
    let downloads = 0;
    page.on('download', () => downloads++);
    // A route-only share must omit entered invoice data and the current URL payload.
    await page.locator('#btnShare').click();
    expect(await page.evaluate(() => window.__shares.length)).toBe(1);
    expect(new URL(await page.evaluate(() => window.__shares[0].url)).search).toBe('');
    await fill(page);
    for (const id of ['btnPDF', 'btnExportJson', 'btnPrint', 'btnReminder', 'btnPDFMobile']) {
      if (id === 'btnPDFMobile') await page.setViewportSize({ width: 390, height: 844 });
      await (await reveal(page, id)).click();
      await expect(page.locator('#invoiceReviewConfirm')).toBeFocused();
    }
    expect(downloads).toBe(0);
    expect(await page.evaluate(() => window.__prints)).toBe(0);
    expect(await page.evaluate(() => window.__copies.length)).toBe(0);
    await page.locator('#includeInvoiceDataInLink').check();
    await page.locator('#btnShare').click();
    expect(await page.evaluate(() => window.__shares.length)).toBe(1);
    await expect(page.locator('#invoiceReviewConfirm')).toBeFocused();
    await page.locator('#invoiceReviewConfirm').check();
    await page.locator('#btnShare').click();
    const sharedUrl = await page.evaluate(() => window.__shares[1].url);
    const shared = JSON.parse(Buffer.from(new URL(sharedUrl).searchParams.get('invoice'), 'base64url').toString());
    expect(shared).toMatchObject({ cu: 'GHS', in: 'SYN-ONLY-42', ap: '12', wh: '5' });
    await (await reveal(page, 'btnPrint')).click();
    expect(await page.evaluate(() => window.__prints)).toBe(1);
    await (await reveal(page, 'btnReminder')).click();
    expect(await page.evaluate(() => window.__copies.length)).toBe(1);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#invoicePreview')).toBeVisible();
    await expect(page.locator('#pCompany')).toHaveText('Émetteur synthétique');
    await expect(page.locator('.inv-form-col')).toBeHidden();
    for (const selector of ['.mobile-primary-bar', '.invoice-starter', '.inv-hero', '.faq-sec', 'afro-navbar', 'afro-footer', '#fav-btn']) await expect(page.locator(selector).first()).toBeHidden();
    const printed = await pdfParse(await page.pdf({ format: 'A4' }));
    expect(printed.text).toContain('Prestation synthétique');
    expect(printed.text).toContain('Émetteur synthétique');
    expect(printed.text).not.toContain(locale === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.emulateMedia({ media: 'screen' });
    await page.locator('#companyName').fill('');
    await page.locator('#invoiceReviewConfirm').check();
    await expect(page.locator('#btnPDF')).toBeDisabled();
    await expect(page.locator('#btnPDFMobile')).toBeDisabled();
    for (const id of ['btnPrint', 'btnShare', 'btnReminder']) {
      await (await reveal(page, id)).click();
      await expect(page.locator('#companyName')).toBeFocused();
    }
    expect(downloads).toBe(0);
    expect(await page.evaluate(() => window.__prints)).toBe(1);
    expect(await page.evaluate(() => window.__shares.length)).toBe(2);
    await page.locator('#companyName').fill('Émetteur synthétique');
    await page.locator('.li-price').first().fill('-1');
    await page.locator('#invoiceReviewConfirm').check();
    await (await reveal(page, 'btnPrint')).click();
    await expect(page.locator('.li-price').first()).toBeFocused();
    expect(await page.evaluate(() => window.__prints)).toBe(1);
    await page.locator('.li-price').first().fill('100');
    await page.locator('#invoiceReviewConfirm').check();
    const pdf = await pdfParse(await download(page, 'btnPDF'));
    for (const text of ['Émetteur synthétique', 'Prestation synthétique', 'GHS', 'SYN-ONLY-42']) expect(pdf.text).toContain(text);
    expect(downloads).toBe(1);
    expect(failures).toEqual([]);
  });
}

for (const locale of ['en', 'fr']) {
  test(`${locale} invoice JSON and signed-out local drafts recover without corrupt imports`, async ({ page, baseURL }) => {
    const failures = await prepare(page, routes[locale], baseURL);
    await fill(page);
    await (await reveal(page, 'logoInput')).setInputFiles({ name: 'synthetic-logo.png', mimeType: 'image/png', buffer: syntheticLogo });
    await expect(page.locator('#previewLogo')).toBeVisible();
    await page.locator('#invoiceReviewConfirm').check();
    let downloads = 0;
    page.on('download', () => downloads++);
    const backup = await download(page, 'btnExportJson');
    expect(downloads).toBe(1); // The inline fallback and enhancement must not both download.
    const expected = JSON.parse(backup.toString('utf8'));
    expect(expected.logo).toMatch(/^data:image\/png;base64,/);
    for (const invalid of ['{', '{}', '[]', JSON.stringify({ ...expected, cn: 'Must not apply', items: [null] }), JSON.stringify({ ...expected, logo: 'https://example.test/private-logo.png' }), JSON.stringify({ ...expected, cu: 'INVALID' })]) {
      const before = await page.evaluate(() => JSON.stringify(window.AfroInvoiceState.gatherState()));
      await page.locator('#importJsonInput').setInputFiles({ name: 'synthetic-invalid.json', mimeType: 'application/json', buffer: Buffer.from(invalid) });
      await expect(page.locator('#invoiceActionHint')).toContainText(locale === 'fr' ? 'fichier de facture JSON valide' : 'valid invoice JSON file');
      expect(await page.evaluate(() => JSON.stringify(window.AfroInvoiceState.gatherState()))).toBe(before);
    }
    await page.locator('#companyName').fill('Changed synthetic');
    await page.locator('#invoiceReviewConfirm').check();
    await page.locator('#importJsonInput').setInputFiles({ name: 'synthetic-backup.json', mimeType: 'application/json', buffer: backup });
    await expect(page.locator('#companyName')).toHaveValue(expected.cn);
    await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
    await page.locator('#btnSaveInvoice').click();
    await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
    await page.locator('#companyName').fill('Changed synthetic');
    await page.locator('.invoice-saved-card').click();
    await expect(page.locator('#companyName')).toHaveValue(expected.cn);
    await expect(page.locator('#bankDetails')).toHaveValue(expected.bd);
    await page.locator('#companyName').fill('Recovered signed-out draft');
    await page.locator('#bankDetails').fill('Recovered local payment instructions');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afro_invoice_draft') || '{}').state?.cn)).toBe('Recovered signed-out draft');
    await page.reload();
    await expect(page.locator('#companyName')).toHaveValue('Recovered signed-out draft');
    await expect(page.locator('#bankDetails')).toHaveValue('Recovered local payment instructions');
    await expect(page.locator('#amountPaid')).toHaveValue('12');
    await expect(page.locator('#currency')).toHaveValue('GHS');
    await expect(page.locator('#previewLogoImg')).toHaveAttribute('src', expected.logo);
    await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
    await expect(page.locator('#includeInvoiceDataInLink')).not.toBeChecked();
    await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
    // Explicitly shared data wins over this browser's different local draft.
    await page.goto(routes[locale] + '?invoice=' + Buffer.from(JSON.stringify(expected)).toString('base64url'));
    await expect(page.locator('#companyName')).toHaveValue(expected.cn);
    await expect(page.locator('#bankDetails')).toHaveValue(expected.bd);
    await page.locator('#companyName').fill('Invalid shared link recovery');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afro_invoice_draft') || '{}').state?.cn)).toBe('Invalid shared link recovery');
    // An invalid link must not wipe the draft on navigation or subsequent reload.
    await page.goto(routes[locale] + '?invoice=e30');
    await expect(page.locator('#companyName')).toHaveValue('Invalid shared link recovery');
    await page.reload();
    await expect(page.locator('#companyName')).toHaveValue('Invalid shared link recovery');
    page.once('dialog', dialog => dialog.accept());
    await (await reveal(page, 'btnNewInvoice')).click();
    await expect(page.locator('#companyName')).toHaveValue('');
    await expect(page.locator('#bankDetails')).toHaveValue('');
    await expect(page.locator('#previewLogo')).toBeHidden();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afro_invoice_draft') || '{}').state?.cn)).toBe('');
    await page.reload();
    await expect(page.locator('#companyName')).toHaveValue('');
    await page.locator('.invoice-saved-card').click();
    await expect(page.locator('#companyName')).toHaveValue(expected.cn);
    await expect(page.locator('#previewLogoImg')).toHaveAttribute('src', expected.logo);
    expect(failures).toEqual([]);
  });
}

test('French invoice cookie refusal stays reachable at 390 and 320 pixels', async ({ browser }) => {
  // The usual owner-test server replaces lazy-analytics, which also owns consent
  // loading. Exercise the real loader on an isolated server with external traffic blocked.
  const port = await new Promise(resolve => {
    const probe = net.createServer().listen(0, '127.0.0.1', () => {
      const value = probe.address().port;
      probe.close(() => resolve(value));
    });
  });
  const server = spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: path.resolve(__dirname, '../..'), windowsHide: true,
    env: { ...process.env, PORT: String(port), AFROTOOLS_TEST_DISABLE_ANALYTICS: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Consent proof server did not start')), 10000);
      server.stdout.on('data', () => { clearTimeout(timer); resolve(); });
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', () => { clearTimeout(timer); reject(new Error('Consent proof server exited')); });
    });
    for (const width of [390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block', storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    const origin = 'http://127.0.0.1:' + port;
    await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
    await page.goto(origin + routes.fr);
    await expect(page.locator('.mobile-primary-bar')).toBeVisible();
    await expect(page.locator('#afro-cc-decline')).toBeVisible();
    await expect(page.locator('#afro-cc-decline')).toHaveAccessibleName('Refuser l’analyse');
    await page.locator('#afro-cc-decline').click();
    await expect(page.locator('#afro-cc-decline')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('#btnPDFMobile')).toHaveAccessibleName(/PDF/);
    const favourite = await page.locator('#fav-btn').boundingBox();
    const bar = await page.locator('.mobile-primary-bar').boundingBox();
    expect(favourite.y + favourite.height).toBeLessThanOrEqual(bar.y);
    await context.close();
    }
  } finally {
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  }
});
