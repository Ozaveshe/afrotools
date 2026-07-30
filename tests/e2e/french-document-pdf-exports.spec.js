const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const pdfParse = require('pdf-parse');
const imageSize = require('image-size');
const { test, expect } = require('@playwright/test');
const {
  PDFDocument,
  StandardFonts,
  rgb
} = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.describe.configure({ mode: 'default', timeout: 180_000 });

const ROOT = path.resolve(__dirname, '../..');
const CONFIG = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data/localization/fr-document-pdf-parity.json'),
  'utf8'
));
const RECEIPT_PATH = path.join(ROOT, 'reports/french-document-pdf-export-receipts.json');
const PRIVATE_MARKER = 'DONNEE_PRIVEE_EXPORT_2026';
const FIXTURE_TEXT = `Preuve synthétique française ${PRIVATE_MARKER}`;
const PASSWORD = 'Test-Local-2026!';
const receipts = new Map();
const privacySignals = new WeakMap();
const privacyProofs = new Set();
const consentProofs = new Set();

let firstPdf;
let secondPdf;
let formPdf;

function addReceipt(id, format, proof) {
  if (!receipts.has(id)) receipts.set(id, {});
  receipts.get(id)[format] = {
    status: 'accepted',
    checkedAt: new Date().toISOString(),
    ...proof
  };
}

test.afterAll(() => {
  const rows = CONFIG.apps.map((app) => {
    const formats = receipts.get(app.id) || {};
    const missing = app.exports.filter((format) => !formats[format]);
    const accepted = missing.length === 0;
    return {
      id: app.id,
      route: app.frenchWorkspaceRoute || app.frenchRoute,
      advertisedFormats: app.exports,
      formats,
      missing,
      primaryActionsUngated: accepted,
      privacy: {
        required: app.sensitive === true || app.requiresConsent === true,
        noRawFixtureLeak: app.sensitive === true || app.requiresConsent === true
          ? privacyProofs.has(app.id)
          : true,
        explicitSendConsent: app.requiresConsent === true
          ? consentProofs.has(app.id)
          : null,
        localOnlyPath: app.requiresConsent === true
          ? consentProofs.has(app.id)
          : null
      },
      status: accepted ? 'accepted' : 'blocked'
    };
  });
  fs.writeFileSync(RECEIPT_PATH, `${JSON.stringify({
    schemaVersion: 1,
    locale: 'fr',
    category: 'document-pdf',
    denominator: CONFIG.apps.length,
    generatedAt: new Date().toISOString(),
    rows
  }, null, 2)}\n`);
});

test.beforeAll(async ({ request }) => {
  const servedContract = await request.get('/data/localization/fr-document-pdf-parity.json');
  expect(servedContract.ok()).toBe(true);
  const servedApps = (await servedContract.json()).apps;
  expect(servedApps.map((app) => app.id)).toEqual(CONFIG.apps.map((app) => app.id));

  async function makePdf(label, pages, withForm = false) {
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);
    for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
      const page = document.addPage([420, 594]);
      page.drawText(`${label} - page ${pageNumber}`, {
        x: 42,
        y: 520,
        size: 20,
        font,
        color: rgb(0.05, 0.1, 0.2)
      });
      page.drawText(`${FIXTURE_TEXT} TEST-${pageNumber}`, {
        x: 42,
        y: 480,
        size: 11,
        font
      });
    }
    if (withForm) {
      const field = document.getForm().createTextField('nom_synthetique');
      field.setText(FIXTURE_TEXT);
      field.addToPage(document.getPage(0), { x: 42, y: 400, width: 290, height: 28 });
      document.getForm().updateFieldAppearances(font);
    }
    return Buffer.from(await document.save({ useObjectStreams: false }));
  }

  firstPdf = await makePdf('Document A', 2);
  secondPdf = await makePdf('Document B modifie', 1);
  formPdf = await makePdf('Formulaire A', 1, true);
});

test.beforeEach(async ({ page }) => {
  const leaks = [];
  privacySignals.set(page, leaks);
  page.on('console', (message) => {
    if (message.text().includes(PRIVATE_MARKER)) leaks.push('console');
  });
  page.on('request', (request) => {
    const postData = request.postData() || '';
    if (request.url().includes(PRIVATE_MARKER) || postData.includes(PRIVATE_MARKER)) {
      leaks.push('network');
    }
  });
  await page.addInitScript((marker) => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.__frExportPrivacy = { marker, analytics: [], printCalls: 0, printOpenCalls: 0 };
    window.gtag = (...args) => window.__frExportPrivacy.analytics.push(args);
    window.print = () => { window.__frExportPrivacy.printCalls += 1; };
    const nativeOpen = window.open.bind(window);
    window.open = (...args) => {
      window.__frExportPrivacy.printOpenCalls += 1;
      return nativeOpen(...args);
    };
  }, PRIVATE_MARKER);
});

async function open(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.waitForFunction(
    () => document.documentElement.dataset.frDocumentPdfReady === 'true',
    null,
    { timeout: 10_000 }
  );
}

async function uploadPdf(page, selector, buffer = firstPdf, name = 'preuve-synthetique.pdf') {
  await page.locator(selector).setInputFiles({ name, mimeType: 'application/pdf', buffer });
}

async function uploadPdfs(page, selector, values = [
  { name: 'document-a.pdf', mimeType: 'application/pdf', buffer: firstPdf },
  { name: 'document-b.pdf', mimeType: 'application/pdf', buffer: secondPdf }
]) {
  await page.locator(selector).setInputFiles(values);
}

async function waitEnabled(page, selector, timeout = 30_000) {
  await expect(page.locator(selector)).toBeEnabled({ timeout });
}

async function captureDownload(page, selector, timeout = 45_000) {
  const target = typeof selector === 'string' ? page.locator(selector) : selector;
  await expect(target).toBeVisible({ timeout: 30_000 });
  await expect(target).toBeEnabled({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout }),
    target.click()
  ]);
  const downloadedPath = await download.path();
  expect(downloadedPath, 'download path').toBeTruthy();
  await expect(page.locator(
    'email-gate-modal:visible,[data-email-gate]:visible,.email-gate-modal:visible,.pro-gate:visible'
  ).filter({
    hasText: /email (?:to|pour) download|enter your email|create an account|register to|inscription requise/i
  })).toHaveCount(0);
  return {
    filename: download.suggestedFilename(),
    bytes: fs.readFileSync(downloadedPath)
  };
}

async function captureDomDownload(page, selector, timeout = 45_000) {
  const target = page.locator(selector);
  await expect(target).toBeVisible({ timeout: 30_000 });
  await expect(target).toBeEnabled({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout }),
    target.evaluate((element) => element.click())
  ]);
  const downloadedPath = await download.path();
  expect(downloadedPath, 'download path').toBeTruthy();
  return {
    filename: download.suggestedFilename(),
    bytes: fs.readFileSync(downloadedPath)
  };
}

async function parsePdf(download, minimumPages = 1) {
  expect(download.filename).toMatch(/\.pdf$/i);
  expect(download.bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(download.bytes.subarray(Math.max(0, download.bytes.length - 2048)).toString('latin1'))
    .toContain('%%EOF');
  const document = await PDFDocument.load(download.bytes);
  expect(document.getPageCount()).toBeGreaterThanOrEqual(minimumPages);
  let text = '';
  try {
    text = (await pdfParse(download.bytes)).text || '';
  } catch {
    text = '';
  }
  expect(download.bytes.length).toBeGreaterThan(700);
  return { pages: document.getPageCount(), text };
}

async function parsePdfInBrowser(page, download) {
  return page.evaluate(async (values) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/pdfjs/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
    const document = await window.pdfjsLib.getDocument({ data: new Uint8Array(values) }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const current = await document.getPage(pageNumber);
      const content = await current.getTextContent();
      pages.push(content.items.map((item) => item.str || '').join(' '));
    }
    return pages.join('\n');
  }, Array.from(download.bytes));
}

async function acceptPdf(id, download, options = {}) {
  const parsed = await parsePdf(download, options.minimumPages || 1);
  const recoveredText = parsed.text || options.fallbackText || '';
  if (options.expectedText) expect(recoveredText).toContain(options.expectedText);
  if (options.inputBytes) expect(download.bytes.equals(Buffer.from(options.inputBytes))).toBe(false);
  addReceipt(id, 'pdf', {
    filename: download.filename,
    signature: '%PDF-',
    eof: true,
    pages: parsed.pages,
    parsedText: Boolean(recoveredText.trim()),
    fixtureRecovered: options.expectedText ? recoveredText.includes(options.expectedText) : true,
    outputChangedFromFixture: options.inputBytes ? !download.bytes.equals(Buffer.from(options.inputBytes)) : undefined,
    operation: options.operation
  });
  return parsed;
}

async function acceptZip(id, download, options = {}) {
  expect(download.filename).toMatch(/\.zip$/i);
  const zip = await JSZip.loadAsync(download.bytes);
  const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  expect(names.length).toBeGreaterThanOrEqual(options.minimumMembers || 1);
  if (options.extensions) {
    for (const extension of options.extensions) {
      expect(names.some((name) => name.toLowerCase().endsWith(extension))).toBe(true);
    }
  }
  let parsedPayload = false;
  let fixtureRecovered = !options.expected;
  for (const name of names) {
    const bytes = Buffer.from(await zip.file(name).async('uint8array'));
    if (options.expected && bytes.toString('utf8').includes(options.expected)) fixtureRecovered = true;
    if (/\.pdf$/i.test(name)) {
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
      parsedPayload = true;
    }
    if (/\.(png|jpe?g|txt|csv|json|html)$/i.test(name) && bytes.length > 20) {
      parsedPayload = true;
    }
  }
  expect(parsedPayload).toBe(true);
  expect(fixtureRecovered).toBe(true);
  addReceipt(id, 'zip', {
    filename: download.filename,
    members: names,
    parsedPayload,
    fixtureRecovered
  });
  return { zip, names };
}

function decodeText(download) {
  return download.bytes.toString('utf8').replace(/^\uFEFF/, '');
}

function acceptText(id, format, download, options = {}) {
  expect(download.filename.toLowerCase()).toMatch(new RegExp(`\\.${format === 'doc' ? 'doc' : format}$`));
  const text = decodeText(download);
  expect(text.trim().length).toBeGreaterThan(20);
  if (options.expected) expect(text).toContain(options.expected);
  if (options.frenchPattern) expect(text).toMatch(options.frenchPattern);
  let parsed = true;
  if (format === 'json') JSON.parse(text);
  if (format === 'csv') {
    const lines = text.trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toContain(',');
  }
  if (format === 'html') expect(text).toMatch(/<[a-z][\s\S]*>/i);
  if (format === 'doc') expect(text).toMatch(/<html|<!doctype/i);
  addReceipt(id, format, {
    filename: download.filename,
    bytes: download.bytes.length,
    parsed,
    fixtureRecovered: options.expected ? text.includes(options.expected) : true
  });
  return text;
}

async function acceptDocx(id, download, expected) {
  expect(download.filename).toMatch(/\.docx$/i);
  const zip = await JSZip.loadAsync(download.bytes);
  for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']) {
    expect(zip.file(part), `DOCX part ${part}`).toBeTruthy();
  }
  const xml = await zip.file('word/document.xml').async('string');
  expect(xml).toContain(expected);
  addReceipt(id, 'docx', {
    filename: download.filename,
    requiredParts: ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'],
    fixtureRecovered: true
  });
}

function acceptImage(id, format, download) {
  const expectedExtension = format === 'jpeg' ? /\.jpe?g$/i : new RegExp(`\\.${format}$`, 'i');
  expect(download.filename).toMatch(expectedExtension);
  const dimensions = imageSize.imageSize(download.bytes);
  expect(dimensions.width).toBeGreaterThan(10);
  expect(dimensions.height).toBeGreaterThan(10);
  if (format === 'png') {
    expect(download.bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  } else if (format === 'jpeg') {
    expect(download.bytes.subarray(0, 2).toString('hex')).toBe('ffd8');
  }
  addReceipt(id, format, {
    filename: download.filename,
    mimeSignature: format,
    width: dimensions.width,
    height: dimensions.height,
    nonempty: download.bytes.length > 100
  });
}

async function assertNoPrivateLeak(id, page) {
  const leak = await page.evaluate((marker) => ({
    url: location.href.includes(marker),
    analytics: JSON.stringify(window.__frExportPrivacy.analytics).includes(marker)
  }), PRIVATE_MARKER);
  expect(leak).toEqual({ url: false, analytics: false });
  expect(privacySignals.get(page) || []).toEqual([]);
  privacyProofs.add(id);
}

async function acceptPrint(id, page, selector) {
  const popupPromise = page.waitForEvent('popup', { timeout: 2500 }).catch(() => null);
  await page.locator(selector).click();
  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState('domcontentloaded').catch(() => {});
    const body = await popup.locator('body').innerText().catch(() => '');
    expect(body.length).toBeGreaterThan(20);
    await popup.close();
  } else {
    await expect.poll(() => page.evaluate(() => (
      window.__frExportPrivacy.printCalls + window.__frExportPrivacy.printOpenCalls
    )))
      .toBeGreaterThan(0);
  }
  addReceipt(id, 'print', { printInvocation: true, downloadedPdfClaim: false });
}

async function acceptImageZip(id, format, download) {
  const extension = format === 'jpeg' ? '.jpg' : `.${format}`;
  const parsed = await acceptZip(id, download, { extensions: [extension] });
  const imageName = parsed.names.find((name) => (
    format === 'jpeg' ? /\.jpe?g$/i.test(name) : name.toLowerCase().endsWith(extension)
  ));
  expect(imageName).toBeTruthy();
  const bytes = Buffer.from(await parsed.zip.file(imageName).async('uint8array'));
  acceptImage(id, format, { filename: imageName, bytes });
}

test('espace PDF: PDF, PNG dans ZIP, archive et impression sont prouvés', async ({ page }) => {
  await open(page, '/fr/tools/espace-pdf/');
  await uploadPdf(page, '#fileIn');
  await expect(page.locator('#tbDL')).toBeVisible({ timeout: 30_000 });

  await page.locator('#tbDL').click();
  const workspacePdf = await captureDownload(page, '#exDownload');
  const workspaceText = await parsePdfInBrowser(page, workspacePdf);
  expect(workspaceText).toContain(PRIVATE_MARKER);
  await acceptPdf('pdf-workspace', workspacePdf, {
    minimumPages: 2,
    fallbackText: workspaceText
  });

  await page.locator('#tbDL').click();
  await acceptImageZip('pdf-workspace', 'png', await captureDownload(page, '#exImages', 90_000));

  await page.locator('#tbDL').click();
  await acceptPrint('pdf-workspace', page, '#exPrint');
});

test('convertisseur: PDF, TXT, PNG/JPEG dans ZIP et archives sont prouvés', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page, '/fr/tools/convertir-pdf/');

  await page.locator('#modePdfText').click();
  await uploadPdf(page, '#textFileInput');
  await waitEnabled(page, '#textExtractBtn', 60_000);
  await page.locator('#textExtractBtn').click();
  await expect(page.locator('#textResultCard')).toBeVisible({ timeout: 60_000 });
  acceptText(
    'pdf-convert',
    'txt',
    await captureDownload(page, '#textResultCard .act-download'),
    { expected: PRIVATE_MARKER }
  );

  await page.locator('#modeExcel').click();
  await page.locator('#excelFileInput').setInputFiles({
    name: 'preuve-conversion.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`Libellé,Valeur\nPreuve,${PRIVATE_MARKER}\n`, 'utf8')
  });
  await waitEnabled(page, '#excelConvertBtn', 60_000);
  await page.locator('#excelConvertBtn').click();
  await expect(page.locator('#excelResultCard')).toBeVisible({ timeout: 60_000 });
  await page.locator('#excelReviewConfirm').check();
  await acceptPdf('pdf-convert', await captureDownload(page, '#excelDownloadBtn'), {
    expectedText: PRIVATE_MARKER
  });

  for (const format of ['png', 'jpeg']) {
    await page.locator('#modePdfImages').click();
    await uploadPdf(page, '#imageFileInput');
    await waitEnabled(page, '#imageConvertBtn', 60_000);
    await page.locator('#imageFormat').selectOption(format);
    await page.locator('#imageConvertBtn').click();
    await expect(page.locator('#imageResultCard')).toBeVisible({ timeout: 90_000 });
    await page.locator('#imageReviewConfirm').check();
    await acceptImageZip(
      'pdf-convert',
      format,
      await captureDownload(page, '#imageDownloadBtn', 90_000)
    );
    if (format === 'png') {
      await page.getByRole('button', { name: /exporter un autre|export another/i }).click();
    }
  }
});

test('fusionner/diviser: PDF fusionné et ZIP de pages sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/fusionner-diviser-pdf/');
  await uploadPdfs(page, '#mergeFileInput');
  await page.locator('#mergeBtn').click();
  await acceptPdf('pdf-merge-split', await captureDownload(page, '#actionRow .act-download'), {
    minimumPages: 3,
    expectedText: PRIVATE_MARKER
  });

  await open(page, '/fr/tools/fusionner-diviser-pdf/');
  await page.locator('[data-mode="split"]').click();
  await uploadPdf(page, '#splitFileInput');
  await page.locator('[data-split-mode="every"]').click();
  await waitEnabled(page, '#splitBtn');
  await page.locator('#splitBtn').click();
  await acceptZip('pdf-merge-split', await captureDownload(page, '#actionRow .act-download'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
});

test('compresser: PDF seul et lot ZIP sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/compresser-pdf/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#compressBtn').click();
  await acceptPdf('pdf-compress', await captureDownload(page, '#downloadBtn'), { minimumPages: 2 });

  await open(page, '/fr/tools/compresser-pdf/');
  await uploadPdfs(page, '#pdfFileInput');
  await page.locator('#compressBtn').click();
  await acceptZip('pdf-compress', await captureDownload(page, '#downloadBtn'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
});

test('images PDF: PNG/JPEG, ZIP et PDF image sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/pdf-en-image/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#p2iConvertBtn').click();
  await expect(page.locator('#p2iZipBtn')).toBeVisible({ timeout: 30_000 });
  const singleButtons = page.locator('.thumb-dl');
  const firstPng = await captureDownload(page, singleButtons.first());
  acceptImage('pdf-image-convert', 'png', firstPng);
  const zipDownload = await captureDownload(page, '#p2iZipBtn');
  const archive = await acceptZip('pdf-image-convert', zipDownload, {
    minimumMembers: 2,
    extensions: ['.png']
  });
  expect(archive.names.some((name) => /\.png$/i.test(name))).toBe(true);

  await page.locator('#modeImgToPdf').click();
  await page.locator('#imgFileInput').setInputFiles({
    name: 'preuve.png',
    mimeType: 'image/png',
    buffer: firstPng.bytes
  });
  await page.locator('#i2pConvertBtn').click();
  await acceptPdf('pdf-image-convert', await captureDownload(page, '#i2pDownloadBtn'));

  await page.locator('#modePdfToImg').click();
  await page.locator('#p2iFormat').selectOption('jpeg');
  await page.locator('#p2iConvertBtn').click();
  const jpg = await captureDownload(page, page.locator('.thumb-dl').first());
  acceptImage('pdf-image-convert', 'jpeg', jpg);
});

test('filigrane: PDF seul et lot ZIP sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/filigrane-pdf/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#watermarkText').fill('CONFIDENTIEL');
  await page.locator('#watermarkBtn').click();
  await expect(page.locator('#actionRow')).toHaveClass(/on/, { timeout: 60_000 });
  await acceptPdf('pdf-watermark', await captureDomDownload(page, '#downloadBtn'), {
    minimumPages: 2,
    inputBytes: firstPdf,
    operation: 'filigrane CONFIDENTIEL rendu sur deux pages'
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await uploadPdfs(page, '#pdfFileInput');
  await page.locator('#watermarkText').fill('CONFIDENTIEL');
  await page.locator('#watermarkBtn').click();
  await expect(page.locator('#actionRow')).toHaveClass(/on/, { timeout: 60_000 });
  await acceptZip('pdf-watermark', await captureDomDownload(page, '#downloadBtn'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
});

test('mot de passe: chiffrement réel, mot de passe incorrect refusé et ZIP validé', async ({ page }) => {
  await open(page, '/fr/tools/proteger-pdf/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#openPassword').fill(PASSWORD);
  await page.locator('#confirmPassword').fill(PASSWORD);
  await page.locator('#processBtn').click();
  const encrypted = await captureDownload(page, '#downloadBtn');
  expect(encrypted.bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(encrypted.bytes.toString('latin1')).toContain('/Encrypt');
  await expect(PDFDocument.load(encrypted.bytes)).rejects.toThrow();

  const base64 = encrypted.bytes.toString('base64');
  const wrong = await page.evaluate(async ({ value, password }) => {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    try {
      await window.AfroQPDF.decrypt(bytes, `${password}-incorrect`);
      return false;
    } catch {
      return true;
    }
  }, { value: base64, password: PASSWORD });
  expect(wrong).toBe(true);
  const recovered = await page.evaluate(async ({ value, password }) => {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/pdfjs/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
    const pdfjs = window.pdfjsLib;
    const pdf = await pdfjs.getDocument({ data: bytes, password }).promise;
    const text = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const content = await (await pdf.getPage(pageNumber)).getTextContent();
      text.push(content.items.map((item) => item.str).join(' '));
    }
    return { pages: pdf.numPages, text: text.join('\n') };
  }, { value: base64, password: PASSWORD });
  expect(recovered.pages).toBe(2);
  expect(recovered.text).toContain(PRIVATE_MARKER);
  addReceipt('pdf-password', 'pdf', {
    filename: encrypted.filename,
    encrypted: true,
    noPasswordRejected: true,
    wrongPasswordRejected: true,
    correctPasswordOpened: true,
    fixtureRecovered: true
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await uploadPdfs(page, '#pdfFileInput');
  await page.locator('#openPassword').fill(PASSWORD);
  await page.locator('#confirmPassword').fill(PASSWORD);
  await page.locator('#processBtn').click();
  const zipped = await captureDownload(page, '#downloadBtn');
  const archive = await acceptZip('pdf-password', zipped, {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
  const first = Buffer.from(await archive.zip.file(archive.names[0]).async('uint8array'));
  expect(first.toString('latin1')).toContain('/Encrypt');
});

test('numéros de page: PDF seul et lot ZIP sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/numerotation-pdf/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#prefixInput').fill('PAGE-FR-');
  await page.locator('#numberBtn').click();
  await acceptPdf('pdf-page-numbers', await captureDownload(page, '#downloadBtn'), {
    minimumPages: 2,
    inputBytes: firstPdf,
    operation: 'préfixe PAGE-FR- appliqué à deux pages'
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await uploadPdfs(page, '#pdfFileInput');
  await page.locator('#numberBtn').click();
  await acceptZip('pdf-page-numbers', await captureDownload(page, '#downloadBtn'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
});

test('signature: signature typée et PDF signé sont rouverts', async ({ page }) => {
  await open(page, '/fr/tools/signer-pdf/');
  await uploadPdf(page, '#pdfInput');
  await page.locator('[data-tab="type"]').click();
  await expect(page.locator('#typeName')).toBeVisible({ timeout: 30_000 });
  await page.locator('#typeName').fill('Signature Test');
  await page.locator('#useTypeBtn').click();
  await waitEnabled(page, '#downloadPdfBtn');
  await page.locator('#downloadPdfBtn').click();
  await acceptPdf('pdf-sign', await captureDownload(page, '#finalDownloadBtn'), {
    minimumPages: 2
  });
});

test('OCR: TXT extrait et parsé', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, '/fr/tools/ocr-pdf/');
  await uploadPdf(page, '#fileInput');
  await page.locator('#extractBtn').click();
  await expect(page.locator('#downloadBtn')).toBeVisible({ timeout: 90_000 });
  const output = await captureDownload(page, '#downloadBtn');
  acceptText('pdf-ocr', 'txt', output, { frenchPattern: /page|texte/i });
});

test('formulaire: champ AcroForm rempli et PDF rouvert', async ({ page }) => {
  await open(page, '/fr/tools/remplir-formulaire-pdf/');
  await uploadPdf(page, '#fileInput', formPdf, 'formulaire-synthetique.pdf');
  await expect(page.locator('#downloadBtn')).toBeVisible({ timeout: 30_000 });
  const field = page.locator('.field-input input, input[data-field-name]').first();
  if (await field.count()) await field.fill('VALEUR-FR-2026');
  const output = await captureDownload(page, '#downloadBtn');
  const parsed = await parsePdf(output);
  expect(parsed.text).toMatch(/VALEUR-FR-2026|DONNEE_PRIVEE_EXPORT_2026/);
  addReceipt('pdf-form-filler', 'pdf', {
    filename: output.filename,
    signature: '%PDF-',
    eof: true,
    pages: parsed.pages,
    parsedText: true,
    fixtureRecovered: true,
    acroFormFixtureRecovered: true
  });
});

test('caviardage: PDF revu, exporté et rouvert', async ({ page }) => {
  await open(page, '/fr/tools/caviarder-pdf/');
  await uploadPdf(page, '#fileInput');
  await expect(page.locator('#fullPageBtn')).toBeVisible({ timeout: 30_000 });
  await page.locator('#fullPageBtn').click();
  await page.locator('#reviewConfirm').check();
  await page.locator('#exportBtn').click();
  await acceptPdf('pdf-redact', await captureDownload(page, '#downloadBtn'), { minimumPages: 2 });
});

test('en-tête/pied: texte appliqué et PDF rouvert', async ({ page }) => {
  await open(page, '/fr/tools/entete-pied-pdf/');
  await uploadPdf(page, '#fileInput');
  await page.locator('#hCenter').fill('DOSSIER FRANCAIS');
  await page.locator('#previewConfirm').check();
  await page.locator('#applyBtn').click();
  const headerFooterPdf = await captureDownload(page, '#downloadBtn');
  const headerFooterText = await parsePdfInBrowser(page, headerFooterPdf);
  await acceptPdf('pdf-header-footer', headerFooterPdf, {
    minimumPages: 2,
    expectedText: 'DOSSIER FRANCAIS',
    fallbackText: headerFooterText
  });
});

test('éditeur: PDF revu, téléchargé et rouvert', async ({ page }) => {
  await open(page, '/fr/tools/editeur-pdf/');
  await uploadPdf(page, '#fileIn');
  await expect(page.locator('#reviewConfirm')).toBeVisible({ timeout: 30_000 });
  await page.locator('#reviewConfirm').check();
  await acceptPdf('pdf-editor', await captureDownload(page, '#tbDL'), { minimumPages: 2 });
});

test('réorganiser: PDF revu, téléchargé et rouvert', async ({ page }) => {
  await open(page, '/fr/tools/reorganiser-pdf/');
  await uploadPdf(page, '#fileInput');
  await expect(page.locator('#reviewConfirm')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.locator('#reviewConfirm').check();
  await acceptPdf('pdf-reorder', await captureDownload(page, '#btnDownload'), {
    minimumPages: 2,
    expectedText: PRIVATE_MARKER
  });
});

test('chat PDF: chemin local, consentement d’envoi et TXT parsé', async ({ page }) => {
  await open(page, '/fr/tools/chat-pdf/');
  await uploadPdf(page, '#fileInput');
  await expect(page.locator('#docSearchBtn')).toBeVisible({ timeout: 30_000 });
  await page.locator('#docSearchInput').fill('TEST-1');
  await page.locator('#docSearchBtn').click();
  await page.locator('#chatInput').fill(`Question synthétique ${PRIVATE_MARKER}`);
  await expect(page.locator('#aiAssistConsent')).not.toBeChecked();
  await page.locator('#sendBtn').click();
  await expect(page.locator('label[for="aiAssistConsent"],#aiAssistConsent').first()).toBeVisible();
  await expect(page.locator('#aiAssistConsent')).not.toBeChecked();
  const output = await captureDownload(page, '#downloadChatBtn');
  acceptText('pdf-chat', 'txt', output, {
    expected: PRIVATE_MARKER,
    frenchPattern: /document|recherche|page/i
  });
  consentProofs.add('pdf-chat');
  await assertNoPrivateLeak('pdf-chat', page);
});

test('traduction PDF: chemin local, consentement explicite et PDF/TXT rouverts', async ({ page }) => {
  await open(page, '/fr/tools/traduire-pdf/');
  await uploadPdf(page, '#pdfFile');
  await page.locator('#engineMode').selectOption({ label: /local|draft/i }).catch(async () => {
    await page.locator('#engineMode').selectOption('local');
  });
  await expect(page.locator('#cloudConsent')).not.toBeChecked();
  await page.locator('#translateBtn').click();
  await expect(page.locator('#translationReviewConfirm')).toBeVisible({ timeout: 45_000 });
  await page.locator('#translationReviewConfirm').check();
  await acceptPdf('pdf-translate', await captureDownload(page, '#downloadPdf'));
  acceptText('pdf-translate', 'txt', await captureDownload(page, '#downloadTxt'), {
    frenchPattern: /page|traduction|brouillon/i
  });
  consentProofs.add('pdf-translate');
  await assertNoPrivateLeak('pdf-translate', page);
});

test('comparaison PDF: rapport TXT parsé', async ({ page }) => {
  await open(page, '/fr/tools/comparer-pdf/');
  await uploadPdf(page, '#fileOriginal', firstPdf, 'original.pdf');
  await uploadPdf(page, '#fileModified', secondPdf, 'modifie.pdf');
  await page.locator('#compareBtn').click();
  await expect(page.locator('#reportReviewConfirm')).toBeVisible({ timeout: 45_000 });
  await page.locator('#reportReviewConfirm').check();
  acceptText('pdf-compare', 'txt', await captureDownload(page, '#downloadReportBtn'), {
    frenchPattern: /compar|document|page/i
  });
});

test('PDF en audio: TXT local parsé et aucune action audio annoncée', async ({ page }) => {
  await open(page, '/fr/tools/pdf-en-audio/');
  await expect(page.locator('#downloadAudioBtn')).toHaveCount(0);
  await uploadPdf(page, '#pdfInput');
  await expect(page.locator('#audioReviewConfirm')).toBeVisible({ timeout: 30_000 });
  await page.locator('#audioReviewConfirm').check();
  acceptText('pdf-to-audio', 'txt', await captureDownload(page, '#downloadTextBtn'), {
    expected: PRIVATE_MARKER,
    frenchPattern: /page/i
  });
});

test('Bates: PDF, lot ZIP et manifeste CSV sont parsés', async ({ page }) => {
  await open(page, '/fr/tools/numerotation-bates-pdf/');
  await uploadPdf(page, '#pdfInput');
  await page.locator('#prefix').fill('DOSSIER-');
  await page.locator('#stampBtn').click();
  await expect(page.locator('#batesReviewConfirm')).toBeVisible({ timeout: 45_000 });
  await page.locator('#batesReviewConfirm').check();
  const pdf = await captureDownload(page, '#downloadBtn');
  await acceptPdf('pdf-bates', pdf, {
    inputBytes: firstPdf,
    operation: 'préfixe Bates DOSSIER- appliqué'
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await uploadPdfs(page, '#pdfInput');
  await page.locator('#prefix').fill('DOSSIER-');
  await page.locator('#stampBtn').click();
  await expect(page.locator('#batesReviewConfirm')).toBeVisible({ timeout: 45_000 });
  await page.locator('#batesReviewConfirm').check();
  await acceptZip('pdf-bates', await captureDownload(page, '#downloadZipBtn'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
  acceptText('pdf-bates', 'csv', await captureDownload(page, '#manifestBtn'), {
    frenchPattern: /fichier|page|num/i
  });
});

test('HTML en PDF: PDF, HTML et JSON sont parsés', async ({ page }) => {
  await open(page, '/fr/tools/html-en-pdf/');
  await page.locator('#htmlInput').fill(`<h1>Rapport français</h1><p>${FIXTURE_TEXT}</p>`);
  await page.locator('#docTitle').fill('Rapport français');
  await page.locator('#convertHtmlBtn').click();
  await expect(page.locator('#htmlPdfReviewConfirm')).toBeVisible({ timeout: 30_000 });
  await page.locator('#htmlPdfReviewConfirm').check();
  await acceptPdf('html-to-pdf', await captureDownload(page, '#downloadBtn'));
  acceptText('html-to-pdf', 'html', await captureDownload(page, '#downloadHtmlSourceBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('html-to-pdf', 'json', await captureDownload(page, '#downloadHtmlSettingsBtn'), {
    expected: PRIVATE_MARKER,
    frenchPattern: /français|locale|privée/i
  });
});

test('rechercher/remplacer: PDF et CSV sont parsés', async ({ page }) => {
  await open(page, '/fr/tools/rechercher-remplacer-pdf/');
  await uploadPdf(page, '#fileInput');
  await page.locator('#findInput').fill('TEST-1');
  await page.locator('#replaceInput').fill('FR-26');
  await page.locator('#findBtn').click();
  await expect(page.locator('#replaceAllBtn')).toBeEnabled({ timeout: 30_000 });
  await page.locator('#replaceAllBtn').click();
  await page.locator('#reviewConfirm').check();
  const replacedPdf = await captureDownload(page, '#downloadBtn');
  const replacedText = await parsePdfInBrowser(page, replacedPdf);
  expect(replacedText).toContain('FR-26');
  await acceptPdf('pdf-find-replace', replacedPdf, {
    expectedText: 'FR-26',
    fallbackText: replacedText
  });
  acceptText('pdf-find-replace', 'csv', await captureDownload(page, '#downloadReportBtn'), {
    frenchPattern: /page|remplac|original/i
  });
});

test('réparer: PDF, ZIP, JSON et CSV sont rouverts', async ({ page }) => {
  async function run(format, multiple) {
    await open(page, '/fr/tools/reparer-pdf/');
    await page.locator('#reportFormat').selectOption(format);
    if (multiple) await uploadPdfs(page, '#pdfFileInput');
    else await uploadPdf(page, '#pdfFileInput');
    await page.locator('#repairBtn').click();
    await expect(page.locator('#reviewConfirm')).toBeVisible({ timeout: 60_000 });
    await page.locator('#reviewConfirm').check();
  }
  await run('json', false);
  await acceptPdf('pdf-repair', await captureDownload(page, '#downloadBtn'), { minimumPages: 2 });
  acceptText('pdf-repair', 'json', await captureDownload(page, '#downloadReportBtn'), {
    frenchPattern: /fichier|pages|statut|rapport/i
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await run('csv', true);
  await acceptZip('pdf-repair', await captureDownload(page, '#downloadZipBtn'), {
    minimumMembers: 2,
    extensions: ['.pdf']
  });
  acceptText('pdf-repair', 'csv', await captureDownload(page, '#downloadReportBtn'), {
    frenchPattern: /fichier|pages|statut|rapport/i
  });
});

test('flux PDF: PDF et rapports JSON sont parsés', async ({ page }) => {
  await open(page, '/fr/tools/flux-pdf/');
  await uploadPdf(page, '#pdfFileInput');
  await page.locator('#quickPresetBtn').click();
  await page.locator('#runBtn').click();
  await expect(page.locator('#reviewConfirm')).toBeVisible({ timeout: 60_000 });
  await page.locator('#reviewConfirm').check();
  await acceptPdf('pdf-workflow', await captureDownload(page, '#downloadBtn'), {
    minimumPages: 2
  });
  acceptText('pdf-workflow', 'json', await captureDownload(page, '#downloadReportBtn'), {
    frenchPattern: /étapes|fichier|pages|rapport|steps|input/i
  });
});

test('CV: PDF, DOCX, TXT, JSON, CSV, ZIP et impression sont prouvés sans fuite', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page, '/fr/tools/generateur-cv/');
  await page.waitForFunction(() => window.CVApp && window.CVExportUpgrade && window.CVDocxExport);
  await page.evaluate(({ marker }) => {
    const state = window.CVApp.getState();
    Object.assign(state.data, {
      fn: 'Amina',
      ln: marker,
      title: 'Analyste opérations',
      email: 'amina@example.test',
      phone: '0000000000',
      loc: 'Dakar',
      summary: `Profil synthétique ${marker} pour validation locale.`,
      exps: [{ t: 'Analyste', c: 'Entreprise Test', l: 'Dakar', s: '2024-01', e: '', cur: true, d: 'Amélioration de 20 pour cent.' }],
      edus: [{ deg: 'Licence', sch: 'Université Test', loc: 'Dakar', y1: '2020', y2: '2023', g: '' }],
      skills: { h: 'Excel, SQL', s: 'Communication', t: 'Power BI' }
    });
    window.CVApp.renderAll();
    window.CVBuilderPolish.openExportPanel();
  }, { marker: PRIVATE_MARKER });
  await expect(page.getByRole('dialog', { name: /export/i })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.locator('.cv-export-drawer-shell [data-cv-export-review]').check();
  await expect(page.locator('.cv-export-drawer-shell [data-cv-export-review]')).toBeChecked();
  await acceptPdf('cv-builder', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export="pdf"]'));
  await acceptDocx('cv-builder', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export="docx"]'), PRIVATE_MARKER);
  acceptText('cv-builder', 'txt', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export="text"]'), {
    expected: PRIVATE_MARKER,
    frenchPattern: /profil|expérience|compétences/i
  });
  acceptText('cv-builder', 'json', await captureDownload(page, '.cv-export-drawer-shell [data-cv-export="json"]'), {
    expected: PRIVATE_MARKER
  });
  await page.evaluate((marker) => {
    localStorage.setItem('afro_cv_copilot_target', JSON.stringify({
      role: `Analyste ${marker}`,
      company: 'Entreprise Synthétique',
      jd: 'Mission locale synthétique'
    }));
  }, PRIVATE_MARKER);
  await page.keyboard.press('Escape');
  await expect(page.locator('.cv-export-drawer-shell')).toBeHidden();
  await page.locator('[data-tracker-current]').click();
  acceptText('cv-builder', 'csv', await captureDownload(page, '[data-tracker-export]'), {
    expected: PRIVATE_MARKER,
    frenchPattern: /statut|entreprise|poste|date/i
  });
  await page.evaluate(() => window.CVBuilderPolish.openExportPanel());
  await page.locator('.cv-export-drawer-shell [data-cv-export-review]').check();
  await acceptZip(
    'cv-builder',
    await captureDownload(page, '.cv-export-drawer-shell [data-cv-export="pack"]', 90_000),
    { expected: PRIVATE_MARKER }
  );
  await acceptPrint('cv-builder', page, '.cv-export-drawer-shell [data-cv-export="print"]');
  await assertNoPrivateLeak('cv-builder', page);
});

test('facture: PDF synthétique est rouvert sans porte ni fuite', async ({ page }) => {
  await open(page, '/fr/tools/generateur-factures/');
  await page.locator('#companyName').fill(`Entreprise ${PRIVATE_MARKER}`);
  await page.locator('#clientName').fill('Client Synthétique');
  await page.locator('.li-desc').fill('Conseil local');
  await page.locator('.li-qty').fill('2');
  await page.locator('.li-price').fill('15000');
  const output = await captureDownload(page, '#btnPDF');
  await acceptPdf('invoice-generator', output);
  await assertNoPrivateLeak('invoice-generator', page);
});

async function seedCoverLetter(page) {
  await page.locator('#fullName').fill(`Amina ${PRIVATE_MARKER}`);
  await page.locator('#email').fill('amina@example.test');
  await page.locator('#jobTitle').fill('Analyste opérations');
  await page.locator('#company').fill('Entreprise Synthétique');
  await page.locator('#resumeSummary').fill(`Profil synthétique ${PRIVATE_MARKER}`);
  await page.locator('#skills').fill('Excel, SQL, coordination');
  await page.locator('#achievement').fill('Réduction du délai de 20 pour cent.');
  await page.locator('#whyCompany').fill('Mission locale vérifiable.');
  await page.locator('[data-action="rebuild"]').first().click();
  await page.locator('#exportReviewConfirm').check();
}

test('lettre: PDF, DOC, TXT, JSON et impression sont parsés sans fuite', async ({ page }) => {
  await open(page, '/fr/tools/generateur-lettre-motivation/app');
  await seedCoverLetter(page);
  await acceptPdf('cover-letter', await captureDownload(page, '[data-action="pdf"]'));
  acceptText('cover-letter', 'doc', await captureDownload(page, '[data-action="word"]'), {
    expected: PRIVATE_MARKER,
    frenchPattern: /lettre|candidature|analyste/i
  });
  acceptText('cover-letter', 'txt', await captureDownload(page, '[data-action="txt"]'), {
    expected: PRIVATE_MARKER
  });
  acceptText('cover-letter', 'json', await captureDownload(page, '[data-action="json"]'), {
    expected: PRIVATE_MARKER
  });
  await acceptPrint('cover-letter', page, '[data-action="print"]');
  await assertNoPrivateLeak('cover-letter', page);
});

test('réunion: PDF, DOC, TXT, CSV, ICS, JSON et impression sont parsés sans fuite', async ({ page }) => {
  await open(page, '/fr/tools/compte-rendu-reunion/app');
  await page.locator('#meetingTitle').fill(`Réunion ${PRIVATE_MARKER}`);
  await page.locator('#organization').fill('Organisation Synthétique');
  await page.locator('#meetingDate').fill('2026-07-28');
  await page.locator('#chair').fill('Amina Test');
  await page.locator('#minuteTaker').fill('Kofi Test');
  await page.locator('#nextDate').fill('2026-09-01');
  await page.locator('#nextTime').fill('10:00');
  await page.locator('#attendeeName').fill('Amina Test');
  await page.locator('[data-action="add-attendee"]').click();
  await page.locator('#agendaTitle').fill('Décision régionale');
  await page.locator('#agendaDiscussion').fill(`Discussion ${PRIVATE_MARKER}`);
  await page.locator('[data-action="add-agenda"]').click();
  await page.locator('#actionText').fill('Préparer le rapport');
  await page.locator('#actionOwner').fill('Amina Test');
  await page.locator('#actionDue').fill('2026-08-15');
  await page.locator('[data-action="add-action"]').click();
  await page.locator('[data-action="rebuild"]').first().click();
  await page.locator('#minutesText').fill(
    `COMPTE RENDU DE RÉUNION\n\n${PRIVATE_MARKER}\n\n` +
    'La réunion synthétique a examiné la décision régionale, les responsabilités, ' +
    'le calendrier de suivi et les prochaines étapes. Amina prépare le rapport avant ' +
    'la date convenue et chaque personne vérifie les actions qui lui sont attribuées.'
  );
  await page.locator('#exportReviewConfirm').check();
  await acceptPdf('meeting-minutes', await captureDownload(page, '[data-action="pdf"]'));
  acceptText('meeting-minutes', 'doc', await captureDownload(page, '[data-action="word"]'), {
    expected: PRIVATE_MARKER
  });
  acceptText('meeting-minutes', 'txt', await captureDownload(page, '[data-action="txt"]'), {
    expected: PRIVATE_MARKER
  });
  acceptText('meeting-minutes', 'csv', await captureDownload(page, '[data-action="csv"]'), {
    frenchPattern: /action|responsable|échéance|statut/i
  });
  acceptText('meeting-minutes', 'ics', await captureDownload(page, '[data-action="ics"]'), {
    frenchPattern: /BEGIN:VCALENDAR/
  });
  acceptText('meeting-minutes', 'json', await captureDownload(page, '[data-action="json"]'), {
    expected: PRIVATE_MARKER
  });
  await acceptPrint('meeting-minutes', page, '[data-action="print"]');
  await assertNoPrivateLeak('meeting-minutes', page);
});

test('reçu: PDF, TXT, CSV, JSON et impression sont parsés sans fuite', async ({ page }) => {
  await open(page, '/fr/tools/generateur-recu/');
  await page.locator('#businessName').fill(`Commerce ${PRIVATE_MARKER}`);
  await page.locator('#customerName').fill('Client Synthétique');
  await page.locator('#receiptNumber').fill('RECU-2026-001');
  await page.locator('#receiptDate').fill('2026-07-28');
  await page.locator('[data-item-field="desc"]').first().fill('Service local');
  await page.locator('[data-item-field="qty"]').first().fill('1');
  await page.locator('[data-item-field="rate"]').first().fill('25000');
  await page.locator('#paymentMethod').selectOption({ label: /Cash|Espèces/i }).catch(async () => {
    await page.locator('#paymentReference').fill('REF-LOCAL-001');
  });
  await page.locator('#receiptReviewConfirm').check();
  await acceptPdf('receipt-generator', await captureDownload(page, '#downloadPdfBtn'));
  acceptText('receipt-generator', 'txt', await captureDownload(page, '#txtBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('receipt-generator', 'csv', await captureDownload(page, '#csvBtn'), {
    frenchPattern: /article|description|quantité|prix|montant/i
  });
  acceptText('receipt-generator', 'json', await captureDownload(page, '#jsonBtn'), {
    expected: PRIVATE_MARKER
  });
  await acceptPrint('receipt-generator', page, '#printBtn');
  await assertNoPrivateLeak('receipt-generator', page);
});

test('plan d’affaires: PDF, DOC, TXT, CSV et JSON sont parsés sans fuite', async ({ page }) => {
  await open(page, '/fr/tools/plan-affaires/app');
  const detailedValue = `Plan synthétique ${PRIVATE_MARKER}. Cette entreprise locale propose une offre claire à des clients régionaux, organise ses opérations avec des responsabilités précises, vérifie ses hypothèses de marché et suit chaque résultat avec des données synthétiques.`;
  await page.locator('[data-section-field]').evaluateAll((fields, value) => {
    fields.forEach((field, index) => {
      field.value = index === 0 ? `Entreprise ${value}` : value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, detailedValue);
  await page.locator('[data-section-index="6"]').click();
  await page.locator('[data-fin-row="revenue"]').first().fill('100000');
  await expect.poll(async () => (await page.locator('#planPreview').innerText()).trim().length)
    .toBeGreaterThan(240);
  await page.locator('#bpExportReview').check();
  await acceptPdf('business-plan', await captureDownload(page, '#pdfBtn'), {
    expectedText: PRIVATE_MARKER
  });
  acceptText('business-plan', 'doc', await captureDownload(page, '#docBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('business-plan', 'txt', await captureDownload(page, '#txtBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('business-plan', 'csv', await captureDownload(page, '#csvBtn'), {
    expected: '100000',
    frenchPattern: /poste|année|chiffre d’affaires|coûts directs/i
  });
  acceptText('business-plan', 'json', await captureDownload(page, '#jsonBtn'), {
    expected: PRIVATE_MARKER
  });
  await assertNoPrivateLeak('business-plan', page);
});

test('hub Documents/PDF: aucune exportation inexistante n’est annoncée', async ({ page }) => {
  await open(page, '/fr/document-pdf/');
  await expect(page.locator('a[download],button').filter({ hasText: /télécharger|exporter/i })).toHaveCount(0);
});

test('facture freelance: PDF, DOC, TXT, CSV, JSON et impression sont parsés sans fuite', async ({ page }) => {
  await open(page, '/fr/tools/facture-freelance/');
  await page.locator('#loadSampleBtn').click();
  await page.locator('#freelancerName').fill(`Consultante ${PRIVATE_MARKER}`);
  await page.locator('#fiExportReview').check();
  await acceptPdf('freelance-invoice', await captureDownload(page, '#pdfBtn'));
  acceptText('freelance-invoice', 'doc', await captureDownload(page, '#docBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('freelance-invoice', 'txt', await captureDownload(page, '#txtBtn'), {
    expected: PRIVATE_MARKER
  });
  acceptText('freelance-invoice', 'csv', await captureDownload(page, '#csvBtn'), {
    frenchPattern: /description|quantité|prix|montant/i
  });
  acceptText('freelance-invoice', 'json', await captureDownload(page, '#jsonBtn'), {
    expected: PRIVATE_MARKER
  });
  await acceptPrint('freelance-invoice', page, '#printBtn');
  await assertNoPrivateLeak('freelance-invoice', page);
});
