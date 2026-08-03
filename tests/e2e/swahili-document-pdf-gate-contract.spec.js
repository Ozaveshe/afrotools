const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const pdfjs = require('../../assets/vendor/pdfjs/pdf.min.js');
const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../assets/vendor/pdfjs/pdf.worker.min.js');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.describe.configure({ mode: 'serial' });

const MARKER = 'SW_GATE_CONTRACT_2026';
let firstPdf;
let secondPdf;

async function fixture(label, pages) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < pages; index += 1) {
    const page = document.addPage([420, 594]);
    page.drawText(`${label} ${MARKER} page ${index + 1}`, { x: 42, y: 520, size: 15, font });
  }
  return Buffer.from(await document.save({ useObjectStreams: false }));
}

async function parsePdfText(bytes) {
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes), disableWorker: true });
  const document = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  await document.destroy();
  return pages.join('\n');
}

test.beforeAll(async () => {
  firstPdf = await fixture('Document A', 2);
  secondPdf = await fixture('Document B', 1);
});

async function openGuest(page) {
  // Keep the complete merge/split workspace in the viewport. The category
  // page mounts late proof panels above the controls; at Playwright's default
  // height that layout shift can move a full-width button between hit testing
  // and dispatch even though a real stationary pointer remains over it.
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.removeItem('afro_auth_v2');
    localStorage.removeItem('afro_session_v3');
    localStorage.removeItem('afro_profile_cache');
  });
  await page.goto('/sw/zana/unganisha-na-gawanya-pdf/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('email-gate-modal')).toHaveCount(1);
  expect(await page.evaluate(() => ({
    auth: localStorage.getItem('afro_auth_v2'),
    session: localStorage.getItem('afro_session_v3'),
    profile: localStorage.getItem('afro_profile_cache')
  }))).toEqual({ auth: null, session: null, profile: null });
}

async function expectGuestBlocked(page, action) {
  const download = page.waitForEvent('download', { timeout: 1800 }).catch(() => null);
  await action.press('Enter');
  expect(await download, 'guest action must not emit a download').toBeNull();
  const dialog = page.locator('.pdg-overlay[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Akaunti ya bure inahitajika/);
  await expect(dialog.locator('.pdg-primary')).toContainText(/Fungua akaunti na upakue/);
  await dialog.locator('.pdg-close').click();
  await expect(dialog).toBeHidden();
}

async function installRegisteredRuntime(page) {
  await page.evaluate(() => {
    window.AfroAuth = {
      isLoggedIn: () => true,
      getUser: () => ({
        id: 'browser-contract-user',
        email: 'registered@example.test',
        name: 'Registered Contract User',
        tier: 'free'
      }),
      getCachedProfile: () => null
    };
  });
  expect(await page.evaluate(() => window.AfroPdfDownloadGate.isRegistered())).toBe(true);
}

async function registeredDownload(page, action) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45_000 }),
    action.press('Enter')
  ]);
  const file = await download.path();
  expect(file).toBeTruthy();
  return {
    filename: download.suggestedFilename(),
    bytes: fs.readFileSync(file)
  };
}

test('merge PDF: guest is blocked and registered runtime downloads a parsed merged PDF', async ({ page }) => {
  await openGuest(page);
  await page.locator('#mergeFileInput').setInputFiles([
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: firstPdf },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: secondPdf }
  ]);
  await expect(page.locator('#mergeSummary')).toContainText(/3 (?:pages|kurasa)/i);
  await page.locator('#mergeBtn').evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.locator('#mergeBtn').press('Enter');
  const action = page.locator('#actionRow .act-download');
  await expect(action).toBeVisible({ timeout: 30_000 });
  await expectGuestBlocked(page, action);
  await installRegisteredRuntime(page);
  const output = await registeredDownload(page, action);
  expect(output.filename).toMatch(/\.pdf$/i);
  const document = await PDFDocument.load(output.bytes);
  expect(document.getPageCount()).toBe(3);
  expect(await parsePdfText(output.bytes)).toContain(MARKER);
});

test('split ZIP: guest is blocked and registered runtime downloads reopened PDF members', async ({ page }) => {
  await openGuest(page);
  await page.locator('[data-mode="split"]').click();
  await page.locator('#splitFileInput').setInputFiles({
    name: 'split.pdf',
    mimeType: 'application/pdf',
    buffer: firstPdf
  });
  await page.locator('[data-split-mode="every"]').click();
  const guestDownload = page.waitForEvent('download', { timeout: 1800 }).catch(() => null);
  await page.locator('#splitBtn').press('Enter');
  expect(await guestDownload, 'guest split action must not emit a ZIP').toBeNull();
  const dialog = page.locator('.pdg-overlay[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Akaunti ya bure inahitajika/);
  await dialog.locator('.pdg-close').click();
  await installRegisteredRuntime(page);
  const output = await registeredDownload(page, page.locator('#splitBtn'));
  expect(output.filename).toMatch(/\.zip$/i);
  const zip = await JSZip.loadAsync(output.bytes);
  const members = Object.keys(zip.files).filter((name) => !zip.files[name].dir && /\.pdf$/i.test(name));
  expect(members).toHaveLength(2);
  for (const name of members) {
    const bytes = Buffer.from(await zip.file(name).async('uint8array'));
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBe(1);
    expect(await parsePdfText(bytes)).toContain(MARKER);
  }
});
