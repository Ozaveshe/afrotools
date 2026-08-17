const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  PDFDocument,
  StandardFonts
} = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

test.describe.configure({ mode: 'default', timeout: 240_000 });

const LARGE_SIZE = 85 * 1024 * 1024;
let largePdfPath;
let smallPdf;

async function makePdf(pageCount) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([420, 594]);
    page.drawText(`Synthetic AfroTools PDF page ${index + 1}`, {
      x: 42,
      y: 520,
      size: 18,
      font
    });
  }
  return Buffer.from(await document.save({ useObjectStreams: false }));
}

function writeLargePdf(filePath, pdfBytes) {
  const descriptor = fs.openSync(filePath, 'w');
  const padding = Buffer.alloc(1024 * 1024, 0x20);
  try {
    fs.writeSync(descriptor, pdfBytes);
    let remaining = LARGE_SIZE - pdfBytes.length;
    while (remaining > 0) {
      const length = Math.min(remaining, padding.length);
      fs.writeSync(descriptor, padding, 0, length);
      remaining -= length;
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

async function observeProgress(page) {
  await page.evaluate(() => {
    window.__pdfCompressProgress = [];
    const bar = document.querySelector('#progressBar');
    const label = document.querySelector('#processingLabel');
    const detail = document.querySelector('#processingDetail');
    const capture = () => {
      const entry = {
        percent: Number(bar.getAttribute('aria-valuenow')),
        label: label.textContent.trim(),
        detail: detail.textContent.trim()
      };
      const last = window.__pdfCompressProgress.at(-1);
      if (!last || JSON.stringify(last) !== JSON.stringify(entry)) {
        window.__pdfCompressProgress.push(entry);
      }
    };
    new MutationObserver(capture).observe(document.querySelector('#processingText'), {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
    capture();
  });
}

test.beforeAll(async () => {
  smallPdf = await makePdf(2);
  largePdfPath = path.join(os.tmpdir(), `afrotools-pdf-compress-${process.pid}.pdf`);
  writeLargePdf(largePdfPath, await makePdf(1));
});

test.afterAll(() => {
  if (largePdfPath && fs.existsSync(largePdfPath)) fs.unlinkSync(largePdfPath);
});

test('85 MB Clean compression reports local read, analysis, rewrite and completion', async ({ page }) => {
  const pageErrors = [];
  const uploadRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    const payloadBytes = request.postDataBuffer()?.length || 0;
    const sameOrigin = request.url().startsWith('http://127.0.0.1:4173/');
    if (['fetch', 'xhr'].includes(request.resourceType())
      && request.method() !== 'GET'
      && (sameOrigin || payloadBytes > 1024 * 1024)) {
      uploadRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/tools/pdf-compress/', { waitUntil: 'domcontentloaded' });
  await page.locator('#pdfFileInput').setInputFiles(largePdfPath);

  await expect(page.locator('#fileSize')).toHaveText('85.0 MB');
  await expect(page.locator('#fileAdvice')).toHaveAttribute('data-size-state', 'large');
  await expect(page.locator('#fileAdvice')).toContainText('nothing is uploaded');
  await observeProgress(page);

  await page.locator('#compressBtn').click();
  await expect(page.locator('#processingText')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#progressBar')).toHaveAttribute('aria-valuenow', /[1-9][0-9]?|100/);
  await expect(page.locator('#downloadBtn')).toBeVisible({ timeout: 180_000 });
  await expect(page.locator('#progressPercent')).toHaveText('100%');
  await expect(page.locator('#resultCard')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#originalSize')).toHaveText('85.0 MB');

  const progress = await page.evaluate(() => window.__pdfCompressProgress);
  const transcript = progress.map((entry) => `${entry.label} ${entry.detail}`).join('\n');
  expect(transcript).toContain('Reading 1/1');
  expect(transcript).toContain('no upload is happening');
  expect(transcript).toContain('Analyzing PDF structure');
  expect(transcript).toContain('Rewriting PDF efficiently');
  expect(progress.some((entry) => entry.percent > 0 && entry.percent < 100)).toBe(true);
  expect(uploadRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('Strong compression reports page rendering and keeps the progress UI accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/tools/pdf-compress/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preset="ebook"]').click();
  await page.locator('#pdfFileInput').setInputFiles({
    name: 'two-page-synthetic.pdf',
    mimeType: 'application/pdf',
    buffer: smallPdf
  });
  await observeProgress(page);

  await page.locator('#compressBtn').click();
  await expect(page.locator('#downloadBtn')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#progressBar')).toHaveAttribute('role', 'progressbar');
  await expect(page.locator('#progressBar')).toHaveAttribute('aria-valuemin', '0');
  await expect(page.locator('#progressBar')).toHaveAttribute('aria-valuemax', '100');
  await expect(page.locator('#progressBar')).toHaveAttribute('aria-valuenow', '100');

  const progress = await page.evaluate(() => window.__pdfCompressProgress);
  expect(progress.some((entry) => entry.label.includes('Rendering page 1 of 2'))).toBe(true);
  expect(progress.some((entry) => entry.label.includes('Packing compressed PDF'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
