const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { PDFDocument, StandardFonts, rgb } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const locales = [
  { lang: 'en', route: '/tools/cv-builder/', heading: 'Summary', loaded: 'text loaded', empty: 'No selectable text', failed: 'File parsing failed' },
  { lang: 'fr', route: '/fr/tools/generateur-cv/', heading: 'Profil professionnel', loaded: 'chargé', empty: 'Aucun texte sélectionnable', failed: 'a échoué' },
  { lang: 'sw', route: '/sw/zana/mjenzi-cv/', heading: 'Muhtasari', loaded: 'maandishi yamepakiwa', empty: 'Hakuna maandishi', failed: 'Uchanganuzi wa faili haukufaulu' }
];
const summary = 'Synthetic local professional summary with experience.';

async function pdfFixture(locale, columns = false, imageOnly = false) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const first = document.addPage([595, 842]);
  if (imageOnly) {
    const image = await document.embedPng(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz8AAAAASUVORK5CYII=', 'base64'));
    first.drawImage(image, { x: 40, y: 40, width: 300, height: 700 });
  } else {
    const lines = ['Synthetic Candidate', 'synthetic@example.invalid', locale.heading, summary];
    lines.forEach((line, i) => first.drawText(line, { x: 40, y: 800 - i * 24, size: 12, font, color: rgb(0, 0, 0) }));
    if (columns) {
      first.drawText('Skills', { x: 340, y: 800, size: 12, font });
      first.drawText('SQL, Excel', { x: 340, y: 776, size: 12, font });
    } else {
      const second = document.addPage([595, 842]);
      ['Experience', 'Synthetic Analyst at Example', '2022 - 2024', 'Prepared local reports.', 'Education', 'Synthetic Diploma', '2020'].forEach((line, i) => second.drawText(line, { x: 40, y: 800 - i * 24, size: 12, font }));
    }
  }
  return Buffer.from(await document.save());
}

async function openImport(page, baseURL, locale, width) {
  await page.setViewportSize({ width, height: 844 });
  const errors = [];
  const requests = { parser: 0, worker: 0, sends: 0 };
  page.on('pageerror', error => errors.push(error.name));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { requests.sends++; return route.abort(); }
    if (url.origin !== new URL(baseURL).origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return route.abort();
    if (url.pathname === '/assets/vendor/pdfjs/pdf.min.js') requests.parser++;
    if (url.pathname === '/assets/vendor/pdfjs/pdf.worker.min.js') requests.worker++;
    return route.continue();
  });
  await page.goto(locale.route);
  await page.waitForFunction(() => window.CVImportAssistant && window.CVApp);
  expect(requests.parser).toBe(0);
  await page.evaluate(() => {
    window.__pdfImportEvents = [];
    window.CVAnalytics = { track(event, metadata) { if (event === 'cv_import_completed') window.__pdfImportEvents.push(metadata); } };
    CVApp.getState().data.summary = 'Synthetic original draft';
    CVImportAssistant.open();
  });
  await expect(page.locator('[data-import-text]')).toBeFocused();
  return { errors, requests };
}

for (const locale of locales) {
  for (const width of [320, 1280]) {
    test(`local multipage PDF retains lines and requires confirmation: ${locale.lang} ${width}`, async ({ page, baseURL }) => {
      const observed = await openImport(page, baseURL, locale, width);
      await page.locator('[data-import-file]').setInputFiles({ name: 'Synthetic Private CV.pdf', mimeType: 'application/pdf', buffer: await pdfFixture(locale) });
      await expect(page.locator('[data-import-status]')).toContainText(locale.loaded);
      const layout = await page.locator('.cv-import-modal').evaluate(modal => {
        const rect = modal.getBoundingClientRect();
        return { width: modal.clientWidth, scroll: modal.scrollWidth, overflowing: Array.from(modal.querySelectorAll('*')).filter(el => el.getClientRects().length && el.getBoundingClientRect().right > rect.right + 1).map(el => ({ tag: el.tagName, className: el.className, width: el.getBoundingClientRect().width })) };
      });
      expect(layout.scroll, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const text = await page.locator('[data-import-text]').inputValue();
      expect(text.split('\n').map(line => line.trim())).toContain(locale.heading);
      expect(text).toContain('Synthetic Diploma');
      expect(text.indexOf(summary)).toBeLessThan(text.indexOf('Synthetic Diploma'));
      expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
      expect(await page.evaluate(() => window.__pdfImportEvents.length)).toBe(0);
      await page.locator('[data-import-parse]').click();
      await expect(page.locator('[data-import-review]')).toBeVisible();
      await expect(page.locator('[data-import-apply]')).toBeDisabled();
      await page.locator('[data-import-replace-ok]').check();
      await page.locator('[data-import-apply]').click();
      const result = await page.evaluate(() => ({ summary: CVApp.getState().data.summary === 'Synthetic local professional summary with experience.', source: window.__pdfImportEvents[0].source, education: CVApp.getState().data.edus.length, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      expect(result).toEqual({ summary: true, source: 'file', education: 1, overflow: false });
      expect(observed.requests.parser).toBe(1);
      expect(observed.requests.worker).toBeGreaterThan(0);
      expect(observed.requests.sends).toBe(0);
      expect(observed.errors).toEqual([]);
    });
  }

  test(`empty, scanned, damaged and protected PDFs preserve the draft: ${locale.lang}`, async ({ page, baseURL }) => {
    const observed = await openImport(page, baseURL, locale, 390);
    const emptyDocument = await PDFDocument.create(); emptyDocument.addPage();
    for (const [kind, buffer] of [['empty', Buffer.from(await emptyDocument.save())], ['scanned', await pdfFixture(locale, false, true)], ['damaged', Buffer.from('%PDF-1.7\ninvalid synthetic document')], ['protected', require('node:fs').readFileSync(path.join(__dirname, '../fixtures/cv-pdf-import/encrypted.pdf'))]]) {
      await page.locator('[data-import-file]').setInputFiles({ name: `Synthetic ${kind}.pdf`, mimeType: 'application/pdf', buffer });
      await expect(page.locator('[data-import-status]')).toContainText(['empty', 'scanned'].includes(kind) ? locale.empty : locale.failed);
      expect(await page.locator('[data-import-text]').inputValue()).toBe('');
      expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
      expect(await page.evaluate(() => window.__pdfImportEvents.length)).toBe(0);
    }
    await page.locator('[data-import-text]').fill('Synthetic Candidate\nSummary\nSynthetic paste fallback remains available.');
    await page.locator('[data-import-parse]').click();
    await expect(page.locator('[data-import-review]')).toBeVisible();
    expect(observed.requests.parser).toBe(1);
    expect(observed.requests.sends).toBe(0);
    expect(observed.errors).toEqual([]);
  });
}

test('PDF column content order remains editable before extraction', async ({ page, baseURL }) => {
  await openImport(page, baseURL, locales[0], 390);
  await page.locator('[data-import-file]').setInputFiles({ name: 'Synthetic columns.pdf', mimeType: 'application/pdf', buffer: await pdfFixture(locales[0], true) });
  await expect(page.locator('[data-import-status]')).toContainText('text loaded');
  const text = await page.locator('[data-import-text]').inputValue();
  expect(text.indexOf(summary)).toBeLessThan(text.indexOf('Skills'));
  await expect(page.locator('.cv-import-upload span')).toContainText('Review column order');
  await page.locator('[data-import-text]').fill(text + '\nLanguages\nSynthetic language');
  expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
});

test('failed local PDF parser download can retry without changing the draft', async ({ page, baseURL }) => {
  const observed = await openImport(page, baseURL, locales[0], 390);
  let attempts = 0;
  await page.route('**/assets/vendor/pdfjs/pdf.min.js', route => ++attempts === 1 ? route.abort() : route.fallback());
  const upload = { name: 'Synthetic retry.pdf', mimeType: 'application/pdf', buffer: await pdfFixture(locales[0]) };
  await page.locator('[data-import-file]').setInputFiles(upload);
  await expect(page.locator('[data-import-status]')).toContainText('File parsing failed');
  await page.locator('[data-import-file]').setInputFiles(upload);
  await expect(page.locator('[data-import-status]')).toContainText('text loaded');
  expect(attempts).toBe(2);
  expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
  expect(observed.requests.sends).toBe(0);
});

for (const outcome of ['success', 'failure']) {
  test(`an older PDF ${outcome} cannot replace a newer text selection`, async ({ page, baseURL }) => {
    await openImport(page, baseURL, locales[0], 390);
    // A controllable parser models late completion; the other cases use actual PDF.js.
    await page.evaluate(() => {
      window.__oldPdfStarted = false; window.__oldPdfReleased = false;
      window.pdfjsLib = { GlobalWorkerOptions: {}, getDocument() {
        window.__oldPdfStarted = true;
        return { promise: new Promise((resolve, reject) => { window.__resolveOldPdf = resolve; window.__rejectOldPdf = reject; }), async destroy() { window.__oldPdfReleased = true; } };
      } };
    });
    await page.locator('[data-import-file]').setInputFiles({ name: 'Synthetic old.pdf', mimeType: 'application/pdf', buffer: Buffer.from('synthetic deferred parser input') });
    await page.waitForFunction(() => window.__oldPdfStarted);
    const newer = 'Synthetic Candidate\nSummary\nNewer local selection.';
    await page.locator('[data-import-file]').setInputFiles({ name: 'Synthetic newer.txt', mimeType: 'text/plain', buffer: Buffer.from(newer) });
    await expect(page.locator('[data-import-text]')).toHaveValue(newer);
    await expect(page.locator('[data-import-status]')).toContainText('text file text loaded');
    await page.evaluate(outcome => {
      if (outcome === 'failure') window.__rejectOldPdf(new Error('synthetic old failure'));
      else window.__resolveOldPdf({ numPages: 1, async getPage() { return { async getTextContent() { return { items: [{ str: 'Old PDF text', hasEOL: true }] }; }, cleanup() {} }; }, async destroy() { window.__oldPdfReleased = true; } });
    }, outcome);
    await page.waitForFunction(() => window.__oldPdfReleased);
    await expect(page.locator('[data-import-text]')).toHaveValue(newer);
    await expect(page.locator('[data-import-status]')).toContainText('text file text loaded');
    expect(await page.evaluate(() => CVApp.getState().data.summary === 'Synthetic original draft')).toBe(true);
  });
}
