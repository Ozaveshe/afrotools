const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const parsePdf = require('pdf-parse');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

// This suite requires real HTTP CSP on pages AND the worker, with real local engines.
const routes = {
  en: { workflow: '/tools/pdf-workflow/', ocr: '/tools/pdf-ocr/' },
  fr: { workflow: '/fr/tools/flux-pdf/', ocr: '/fr/tools/ocr-pdf/' },
  sw: { workflow: '/sw/zana/workflow-ya-pdf/', ocr: '/sw/zana/ocr-pdf/' }
};
const marker = 'SYNTHETIC LOCAL DOCUMENT';
let pdfBytes;
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.beforeAll(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let index = 1; index <= 2; index++) {
    const page = doc.addPage([595, 842]);
    page.drawText(marker, { x: 45, y: 720, size: 22, font });
    page.drawText('Page ' + index + ' - item quantity 17', { x: 45, y: 670, size: 18, font });
  }
  pdfBytes = Buffer.from(await doc.save({ useObjectStreams: false }));
});

async function assertPolicy(response, wasm) {
  expect(response.status()).toBe(200);
  const policy = response.headers()['content-security-policy'];
  expect(policy, 'real response must carry CSP').toBeTruthy();
  for (const enforcedPolicy of policy.split(',')) {
    const script = enforcedPolicy.split(';').find(part => /^\s*script-src\s/.test(part));
    expect(script, 'every enforced policy needs script-src').toBeTruthy();
    expect(script).not.toContain("'unsafe-eval'");
    if (wasm) expect(script).toContain("'wasm-unsafe-eval'");
    else expect(script).not.toContain("'wasm-unsafe-eval'");
  }
}

async function download(page, selector) {
  await expect(page.locator(selector)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(selector)).toBeEnabled({ timeout: 30_000 });
  const pending = page.waitForEvent('download', { timeout: 45_000 });
  await page.locator(selector).click();
  const result = await pending;
  return { name: result.suggestedFilename(), bytes: fs.readFileSync(await result.path()) };
}

test('only the approved document routes and worker receive WASM permission', async ({ request }) => {
  for (const row of Object.values(routes)) for (const route of Object.values(row)) {
    for (const variant of [route, route.slice(0, -1), route + 'index.html']) {
      await assertPolicy(await request.get(variant), true);
    }
  }
  await assertPolicy(await request.get('/assets/vendor/tesseract/worker.min.js'), true);
  await assertPolicy(await request.get('/assets/vendor/qpdf/qpdf-worker.js'), true);
  for (const route of ['/', '/tools/pdf-convert/', '/assets/js/lib/pdf-utils.js', '/widgets/iframe/crypto-crypto-tax.html']) {
    await assertPolicy(await request.get(route), false);
  }
});

for (const [locale, row] of Object.entries(routes)) {
  test(`${locale} Workflow exports a parsed PDF and report under the served CSP`, async ({ page }) => {
    const errors = [];
    const workers = [];
    page.on('worker', worker => workers.push(worker.url()));
    page.on('pageerror', error => errors.push(error.message));
    await assertPolicy(await page.goto(row.workflow), true);
    await page.locator('#pdfFileInput').setInputFiles({ name: 'synthetic-local.pdf', mimeType: 'application/pdf', buffer: pdfBytes });
    await page.locator('#quickPresetBtn').click();
    await page.locator('#runBtn').click();
    await expect(page.locator('#reviewConfirm')).toBeVisible({ timeout: 60_000 });
    await page.locator('#reviewConfirm').check();
    const output = await download(page, '#downloadBtn');
    expect(output.name).toMatch(/\.pdf$/i);
    const parsed = await parsePdf(output.bytes);
    expect(parsed.numpages).toBe(2);
    expect(parsed.text).toContain(marker);
    const report = await download(page, '#downloadReportBtn');
    expect(report.name).toMatch(/\.json$/i);
    const reportText = report.bytes.toString('utf8');
    expect(() => JSON.parse(reportText)).not.toThrow();
    expect(reportText).toMatch(/steps|input|rapport|étapes|fichier|pages/i);
    expect(workers.some(url => new URL(url).pathname === '/assets/vendor/qpdf/qpdf-worker.js')).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${locale} actual OCR worker recognizes the PDF and exports TXT under its response CSP`, async ({ page, request }) => {
    test.setTimeout(120_000);
    const workers = [];
    const errors = [];
    page.on('worker', worker => workers.push(worker.url()));
    page.on('pageerror', error => errors.push(error.message));
    await assertPolicy(await page.goto(row.ocr), true);
    await assertPolicy(await request.get('/assets/vendor/tesseract/worker.min.js'), true);
    await page.locator('#languageSelect').selectOption('eng');
    await page.locator('#fileInput').setInputFiles({ name: 'synthetic-local.pdf', mimeType: 'application/pdf', buffer: pdfBytes });
    await page.locator('#extractBtn').click();
    await expect(page.locator('#downloadBtn')).toBeVisible({ timeout: 90_000 });
    const output = await download(page, '#downloadBtn');
    expect(output.name).toMatch(/\.txt$/i);
    expect(output.bytes.toString('utf8')).toContain(marker);
    expect(output.bytes.toString('utf8')).toContain('17');
    expect(workers.some(url => new URL(url).pathname === '/assets/vendor/tesseract/worker.min.js')).toBe(true);
    expect(errors).toEqual([]);
  });
}
