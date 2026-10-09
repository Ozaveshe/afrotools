'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
test.use({ trace: 'off', screenshot: 'off', video: 'off', viewport: { width: 390, height: 844 } });
const rows = [
  { locale: 'en', route: '/tools/pdf-workspace/', retry: 'Retry PDF loading', invalid: /saved PDF could not be opened/i },
  { locale: 'fr', route: '/fr/tools/espace-pdf/', retry: 'Réessayer le chargement PDF', invalid: /PDF enregistré n’a pas pu être ouvert/ },
  { locale: 'sw', route: '/sw/zana/nafasi-pdf/', retry: 'Jaribu kupakia PDF tena', invalid: /PDF hii iliyohifadhiwa haikuweza kufunguliwa/ }
];
let validBytes;
test.beforeAll(async () => {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 2; i++) doc.addPage([300, 400]).drawText('SYNTHETIC STORED ORIGINAL', { x: 20, y: 340, size: 12, font });
  validBytes = Array.from(await doc.save({ useObjectStreams: false }));
});
async function prepare(page, baseURL, row, library, fail) {
  const origin = new URL(baseURL).origin, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let release, reached, released = !library, restored = false;
  const held = new Promise(resolve => { release = () => { released = true; resolve(); }; });
  const requested = new Promise(resolve => { reached = resolve; });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (library && url.pathname === library && !restored) {
      reached();
      if (!released) await held;
      if (fail) return route.abort('failed');
    }
    return route.continue();
  });
  await page.route('**/__pdf_history_startup_fixture__', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Synthetic history preparation</title>' }));
  await page.goto('/__pdf_history_startup_fixture__');
  await page.evaluate(async bytes => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('afrotools-saved-pdf-workspace', JSON.stringify([
      { id: 'legacy-good', title: 'Synthetic original.pdf', createdAt: 1, updatedAt: 1, data: { operation: 'Synthetic history', hasFile: true } },
      { id: 'legacy-bad', title: 'Synthetic broken.pdf', createdAt: 2, updatedAt: 2, data: { operation: 'Synthetic history', hasFile: true } }
    ]));
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('afrotools-pdf-workspace', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('recent-files');
      request.onerror = () => reject(Error('Synthetic seed failed'));
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('recent-files', 'readwrite');
        tx.objectStore('recent-files').put(new Uint8Array(bytes), 'legacy-good');
        tx.objectStore('recent-files').put(new Uint8Array([0, 1, 2, 3]), 'legacy-bad');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => { db.close(); reject(Error('Synthetic seed transaction failed')); };
      };
    });
  }, validBytes);
  await page.goto(row.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-pdf-history-id="legacy-good"] [data-pdf-history-action="resume"]')).toBeVisible();
  return { errors, requested, release, restore: () => { restored = true; } };
}
async function exportOriginal(page) {
  await expect(page.locator('#tbDL')).toBeVisible({ timeout: 30000 });
  await page.locator('#tbDL').click();
  const next = page.waitForEvent('download');
  await page.locator('#exDownload').click();
  const download = await next, bytes = fs.readFileSync(await download.path());
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
  const text = await page.evaluate(async bytes => {
    const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    try { const result = []; for (let i = 1; i <= doc.numPages; i++) result.push((await (await doc.getPage(i)).getTextContent()).items.map(item => item.str).join(' ')); return result.join('\n'); }
    finally { await doc.destroy(); }
  }, Array.from(bytes));
  expect(text).toContain('SYNTHETIC STORED ORIGINAL');
}
async function currentDocument(page) {
  return page.evaluate(async () => ({ name: fn, pages: po.length, objects: JSON.stringify(objs), sha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pB))).map(n => n.toString(16).padStart(2, '0')).join('') }));
}
for (const row of rows) {
  for (const library of ['/assets/vendor/pdf-lib/pdf-lib.min.js', '/assets/vendor/pdfjs/pdf.min.js']) {
    for (const fail of [false, true]) test(`${row.locale} saved PDF resumes and exports after ${fail ? 'failed' : 'delayed'} ${library}`, async ({ page, baseURL }) => {
      const gate = await prepare(page, baseURL, row, library, fail);
      await gate.requested;
      await page.locator('[data-pdf-history-id="legacy-good"] [data-pdf-history-action="resume"]').click();
      gate.release();
      if (fail) {
        const retry = page.getByRole('button', { name: row.retry, exact: true });
        await expect(retry).toBeVisible();
        gate.restore();
        await retry.focus();
        await page.keyboard.press('Enter');
      }
      await expect(page.locator('#tbFn')).toHaveText('Synthetic original.pdf', { timeout: 15000 });
      await exportOriginal(page);
      expect(gate.errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
  test(`${row.locale} corrupt saved PDF preserves the existing document and export`, async ({ page, baseURL }) => {
    const gate = await prepare(page, baseURL, row);
    await page.locator('[data-pdf-history-id="legacy-good"] [data-pdf-history-action="resume"]').click();
    await expect(page.locator('#ws')).toHaveClass(/on/);
    const before = await currentDocument(page);
    // Returning to recent files leaves the current document in memory. A failed
    // replacement must restore that view and preserve its actual export bytes.
    await page.locator('#tbX').click();
    await page.locator('[data-pdf-history-id="legacy-bad"] [data-pdf-history-action="resume"]').click();
    await expect(page.locator('#toast')).toHaveClass(/on/);
    expect(await currentDocument(page)).toEqual(before);
    await expect(page.locator('#toast')).toContainText(row.invalid);
    await expect(page.locator('#tbFn')).toHaveText('Synthetic original.pdf');
    await expect(page.locator('#ws')).toHaveClass(/on/);
    expect(await page.evaluate(async () => Array.from((await window.AfroPdfHistory.get('legacy-bad')).bytes))).toEqual([0, 1, 2, 3]);
    await exportOriginal(page);
    expect(gate.errors).toEqual([]);
  });
}
