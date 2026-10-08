const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const parsePdf = require('pdf-parse');

const routes = {
  en: '/tools/pdf-convert/',
  fr: '/fr/tools/convertir-pdf/',
  sw: '/sw/zana/kubadilisha-format-pdf/'
};
const csv = (name, label) => ({ name, mimeType: 'text/csv', buffer: Buffer.from('Item,Quantity\n' + label + ',17\n') });
const input = page => page.locator('#excelFileInput');
const button = page => page.locator('#excelConvertBtn');
const status = page => page.locator('#excelLoadStatus');

async function open(page, route) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.locator('#modeExcel').click();
  await expect(button(page)).toBeDisabled();
  await expect(status(page)).toHaveAttribute('role', 'status');
  await expect(status(page)).toHaveAttribute('aria-live', 'polite');
}

async function holdRead(page, name) {
  await page.evaluate(name => {
    const original = File.prototype.arrayBuffer;
    window.readFinished = false;
    File.prototype.arrayBuffer = function () {
      if (this.name !== name) return original.call(this);
      const file = this;
      return new Promise((resolve, reject) => {
        window.releaseRead = async fail => {
          if (fail) reject(new Error('Synthetic unreadable file'));
          else resolve(await original.call(file));
          // The application promise continuation runs before this checkpoint.
          await Promise.resolve();
          window.readFinished = true;
        };
      });
    };
  }, name);
}

async function releaseRead(page, fail = false) {
  await page.evaluate(fail => window.releaseRead(fail), fail);
  await expect.poll(() => page.evaluate(() => window.readFinished)).toBe(true);
}

async function exportText(page, expected, absent) {
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await expect(page.locator('#excelResultCard')).toBeVisible();
  await page.locator('#excelReviewConfirm').check();
  const downloading = page.waitForEvent('download');
  await page.locator('#excelDownloadBtn').click();
  const download = await downloading;
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const parsed = await parsePdf(bytes);
  expect(parsed.numpages).toBeGreaterThanOrEqual(1);
  expect(parsed.text).toContain(expected);
  expect(parsed.text).toContain('17');
  if (absent) expect(parsed.text).not.toContain(absent);
  return download.suggestedFilename();
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} waits for the parser library before a single successful conversion`, async ({ page }) => {
    await open(page, route);
    await page.evaluate(() => {
      const original = ensureXlsx;
      ensureXlsx = () => new Promise(resolve => { window.releaseLibrary = () => resolve(original()); });
    });
    await input(page).setInputFiles(csv('library.csv', 'LIBRARY READY'));
    await expect(status(page)).toHaveAttribute('data-state', 'loading');
    await expect(button(page)).toBeDisabled();
    await page.evaluate(() => convertExcel());
    await expect(page.locator('#excelResultCard')).toBeHidden();
    await page.evaluate(() => window.releaseLibrary());
    await expect(status(page)).toHaveAttribute('data-state', 'ready');
    await expect(status(page)).toContainText({ en: 'Spreadsheet ready', fr: 'Tableur prêt', sw: 'Lahajedwali liko tayari' }[locale]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await exportText(page, 'LIBRARY READY');
  });

  test(`${locale} a failed parser library request can be retried with a new file`, async ({ page }) => {
    await open(page, route);
    await page.route('**/assets/vendor/xlsx/xlsx.full.min.js*', route => route.abort(), { times: 1 });
    await input(page).setInputFiles(csv('unavailable.csv', 'UNAVAILABLE CONTENT'));
    await expect(status(page)).toHaveAttribute('data-state', 'error');
    await expect(button(page)).toBeDisabled();
    await input(page).setInputFiles(csv('retry.csv', 'RETRY CONTENT'));
    await exportText(page, 'RETRY CONTENT', 'UNAVAILABLE CONTENT');
  });

  test(`${locale} a failed PDF library request can be retried without leaving an error status`, async ({ page }) => {
    await open(page, route);
    await input(page).setInputFiles(csv('retry-pdf.csv', 'PDF RETRY CONTENT'));
    await expect(button(page)).toBeEnabled();
    await page.route('**/assets/vendor/jspdf/jspdf.umd.min.js*', route => route.abort(), { times: 1 });
    await button(page).click();
    await expect(status(page)).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#excelResultCard')).toBeHidden();
    await exportText(page, 'PDF RETRY CONTENT');
    await expect(status(page)).toHaveAttribute('data-state', 'ready');
  });

  for (const oldFails of [false, true]) {
    test(`${locale} ignores a replaced file's late ${oldFails ? 'failure' : 'success'}`, async ({ page }) => {
      await open(page, route);
      await holdRead(page, 'old.csv');
      await input(page).setInputFiles(csv('old.csv', 'OLD CONTENT'));
      await page.waitForFunction(() => typeof window.releaseRead === 'function');
      await expect(button(page)).toBeDisabled();
      await input(page).setInputFiles(csv('current.csv', 'CURRENT CONTENT'));
      await expect(status(page)).toHaveAttribute('data-state', 'ready');
      await releaseRead(page, oldFails);
      await expect(status(page)).toHaveAttribute('data-state', 'ready');
      expect(await exportText(page, 'CURRENT CONTENT', 'OLD CONTENT')).toBe('current.pdf');
    });
  }

  test(`${locale} replacement immediately invalidates the previous workbook and download`, async ({ page }) => {
    await open(page, route);
    await input(page).setInputFiles(csv('first.csv', 'FIRST CONTENT'));
    await exportText(page, 'FIRST CONTENT');
    await holdRead(page, 'second.csv');
    await input(page).setInputFiles(csv('second.csv', 'SECOND CONTENT'));
    await page.waitForFunction(() => typeof window.releaseRead === 'function');
    await expect(button(page)).toBeDisabled();
    await expect(page.locator('#excelResultCard')).toBeHidden();
    expect(await page.evaluate(() => ({ workbook: excelWorkbook, blob: excelPdfBlob, download: document.getElementById('excelDownloadBtn').onclick }))).toEqual({ workbook: null, blob: null, download: null });
    await page.evaluate(() => convertExcel());
    await expect(page.locator('#excelResultCard')).toBeHidden();
    await releaseRead(page);
    expect(await exportText(page, 'SECOND CONTENT', 'FIRST CONTENT')).toBe('second.pdf');
  });

  test(`${locale} reset invalidates a pending parse and allows a new file`, async ({ page }) => {
    await open(page, route);
    await holdRead(page, 'reset.csv');
    await input(page).setInputFiles(csv('reset.csv', 'RESET CONTENT'));
    await page.waitForFunction(() => typeof window.releaseRead === 'function');
    await page.locator('#excelFileInfo button').click();
    await releaseRead(page);
    await expect(status(page)).toHaveAttribute('data-state', 'idle');
    await expect(button(page)).toBeDisabled();
    await expect(page.locator('#excelResultCard')).toBeHidden();
    expect(await page.evaluate(() => excelWorkbook)).toBeNull();
    await input(page).setInputFiles(csv('recovered.csv', 'RECOVERED CONTENT'));
    await exportText(page, 'RECOVERED CONTENT', 'RESET CONTENT');
  });

  test(`${locale} failed parsing is accessible and recovers with a valid file`, async ({ page }) => {
    await open(page, route);
    await holdRead(page, 'unreadable.csv');
    await input(page).setInputFiles(csv('unreadable.csv', 'UNREADABLE CONTENT'));
    await page.waitForFunction(() => typeof window.releaseRead === 'function');
    await releaseRead(page, true);
    await expect(status(page)).toHaveAttribute('data-state', 'error');
    await expect(status(page)).not.toHaveText('');
    await expect(button(page)).toBeDisabled();
    await input(page).setInputFiles(csv('valid.csv', 'VALID CONTENT'));
    await exportText(page, 'VALID CONTENT', 'UNREADABLE CONTENT');
  });

  for (const action of ['replace', 'reset']) {
    test(`${locale} ${action} invalidates a conversion awaiting the PDF library`, async ({ page }) => {
      await open(page, route);
      await input(page).setInputFiles(csv('pending.csv', 'PENDING CONTENT'));
      await expect(button(page)).toBeEnabled();
      await page.evaluate(() => {
        const original = ensureJsPdf;
        ensureJsPdf = () => new Promise(resolve => { window.releasePdfLibrary = () => { ensureJsPdf = original; resolve(original()); }; });
      });
      await button(page).click();
      await page.waitForFunction(() => typeof window.releasePdfLibrary === 'function');
      if (action === 'reset') await page.locator('#excelFileInfo button').click();
      else await input(page).setInputFiles(csv('next.csv', 'NEXT CONTENT'));
      await page.evaluate(() => window.releasePdfLibrary());
      await expect(page.locator('#excelResultCard')).toBeHidden();
      if (action === 'reset') {
        await expect(button(page)).toBeDisabled();
        await input(page).setInputFiles(csv('next.csv', 'NEXT CONTENT'));
      }
      expect(await exportText(page, 'NEXT CONTENT', 'PENDING CONTENT')).toBe('next.pdf');
    });
  }
}
