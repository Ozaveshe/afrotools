'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
const rows = [
  { locale: 'en', route: '/tools/pdf-workspace/', loading: /Preparing PDF tools/, retry: 'Retry PDF loading' },
  { locale: 'fr', route: '/fr/tools/espace-pdf/', loading: /Préparation des outils PDF/, retry: 'Réessayer le chargement PDF' },
  { locale: 'sw', route: '/sw/zana/nafasi-pdf/', loading: /Zana za PDF zinaandaliwa/, retry: 'Jaribu kupakia PDF tena' }
];
let first, latest;
test.beforeAll(async () => {
  async function fixture(marker) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 2; i++) doc.addPage([595, 842]).drawText(marker, { x: 50, y: 740, font, size: 18 });
    return Buffer.from(await doc.save({ useObjectStreams: false }));
  }
  first = await fixture('SYNTHETIC FIRST FILE');
  latest = await fixture('SYNTHETIC LATEST FILE');
});

async function setup(page, baseURL, library, fail) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const origin = new URL(baseURL).origin;
  let release;
  let reached;
  const held = new Promise(resolve => { release = resolve; });
  const requested = new Promise(resolve => { reached = resolve; });
  let count = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === library && ++count === 1) {
      reached();
      await held;
      return fail ? route.abort('failed') : route.continue();
    }
    return route.continue();
  });
  return { release, requested, errors };
}

async function assertExport(page, marker) {
  await expect(page.locator('#tbDL')).toBeVisible({ timeout: 30000 });
  await page.locator('#tbDL').click();
  const downloaded = page.waitForEvent('download');
  await page.locator('#exDownload').click();
  const download = await downloaded;
  const bytes = fs.readFileSync(await download.path());
  const structure = await PDFDocument.load(bytes);
  expect(structure.getPageCount()).toBe(2);
  // Match the native guest-export suite: parse actual downloaded bytes with
  // the current local PDF.js reader, independently of the open workspace.
  const parsed = await page.evaluate(async buffer => {
    const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    try {
      const texts = [];
      for (let i = 1; i <= doc.numPages; i++) texts.push((await (await doc.getPage(i)).getTextContent()).items.map(item => item.str).join(' '));
      return { numpages: doc.numPages, text: texts.join('\n') };
    } finally { await doc.destroy(); }
  }, Array.from(bytes));
  expect(parsed.numpages).toBe(2);
  expect(parsed.text).toContain(marker);
  return parsed.text;
}

for (const row of rows) {
  test(`${row.locale} first upload waits for PDFLib then exports without reselection`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const gate = await setup(page, baseURL, '/assets/vendor/pdf-lib/pdf-lib.min.js', false);
    const response = await page.goto(row.route, { waitUntil: 'domcontentloaded' });
    const initial = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return { status: doc.querySelector('#workspaceLoadStatus').textContent, retry: doc.querySelector('#workspaceLoadRetry').textContent, guidance: doc.querySelectorAll('.pdf-workflow-card').length, privacy: doc.querySelector('.priv-bar')?.textContent || '' };
    }, await response.text());
    expect(initial.status).toMatch(row.loading);
    expect(initial.retry).toBe(row.retry);
    if (row.locale === 'fr') { expect(initial.guidance).toBe(3); expect(initial.privacy).toContain('Privé par défaut'); }
    await gate.requested;
    await page.locator('#fileIn').setInputFiles({ name: 'first.pdf', mimeType: 'application/pdf', buffer: first });
    await expect(page.locator('#workspaceLoadStatus')).toHaveText(row.loading);
    await expect(page.locator('#tbDL')).toBeHidden();
    gate.release();
    await assertExport(page, 'SYNTHETIC FIRST FILE');
    expect(gate.errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test(`${row.locale} latest upload replaces the queued file while PDF.js loads`, async ({ page, baseURL }) => {
    const gate = await setup(page, baseURL, '/assets/vendor/pdfjs/pdf.min.js', false);
    await page.goto(row.route, { waitUntil: 'domcontentloaded' });
    await gate.requested;
    await page.locator('#fileIn').setInputFiles({ name: 'first.pdf', mimeType: 'application/pdf', buffer: first });
    await page.locator('#fileIn').setInputFiles({ name: 'latest.pdf', mimeType: 'application/pdf', buffer: latest });
    gate.release();
    const text = await assertExport(page, 'SYNTHETIC LATEST FILE');
    expect(text).not.toContain('SYNTHETIC FIRST FILE');
    await expect(page.locator('#tbFn')).toHaveText('latest.pdf');
    expect(gate.errors).toEqual([]);
  });

  for (const library of ['/assets/vendor/pdf-lib/pdf-lib.min.js', '/assets/vendor/pdfjs/pdf.min.js']) {
    test(`${row.locale} ${library} failure retains the first upload for keyboard retry`, async ({ page, baseURL }) => {
      const gate = await setup(page, baseURL, library, true);
      await page.goto(row.route, { waitUntil: 'domcontentloaded' });
      await gate.requested;
      await page.locator('#fileIn').setInputFiles({ name: 'first.pdf', mimeType: 'application/pdf', buffer: first });
      gate.release();
      const retry = page.getByRole('button', { name: row.retry, exact: true });
      await expect(retry).toBeVisible();
      await expect(page.locator('#tbDL')).toBeHidden();
      await retry.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#tbDL')).toBeVisible({ timeout: 30000 });
      await expect(page.locator('#tbDL')).toBeFocused();
      await assertExport(page, 'SYNTHETIC FIRST FILE');
      expect(gate.errors).toEqual([]);
    });
  }

  test(`${row.locale} a dropped PDF is queued during startup`, async ({ page, baseURL }) => {
    const gate = await setup(page, baseURL, '/assets/vendor/pdf-lib/pdf-lib.min.js', false);
    await page.goto(row.route, { waitUntil: 'domcontentloaded' });
    await gate.requested;
    await page.locator('#dz').evaluate((zone, bytes) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(bytes)], 'dropped.pdf', { type: 'application/pdf' }));
      zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }, Array.from(first));
    gate.release();
    await assertExport(page, 'SYNTHETIC FIRST FILE');
    expect(gate.errors).toEqual([]);
  });
}
