const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const crypto = require('node:crypto');
const parse = require('pdf-parse');
const { PDFDocument, PDFName, decodePDFRawStream } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

const routes = {
  en: { merge: '/tools/pdf-merge-split/', sign: '/tools/pdf-sign/', aria: 'Pages from Upload PDF.pdf to include', error: 'Pages must be between 1 and 2.', ready: 'PDFs ready: 2 | Pages: 3.', placeholder: 'Your Name' },
  fr: { merge: '/fr/tools/fusionner-diviser-pdf/', sign: '/fr/tools/signer-pdf/', aria: 'Pages du fichier Upload PDF.pdf à inclure', error: 'Les pages doivent être comprises entre 1 et 2.', ready: 'PDF prêts : 2 | Pages : 3.', placeholder: 'Votre nom' },
  sw: { merge: '/sw/zana/unganisha-na-gawanya-pdf/', sign: '/sw/zana/kusaini-pdf/', aria: 'Kurasa za Upload PDF.pdf za kujumuisha', error: 'Kurasa lazima ziwe kati ya 1 na 2.', ready: 'PDF zilizo tayari: 2 | Kurasa: 3.', placeholder: 'Jina Lako' }
};
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = []; pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  await settleTranslations(page);
  expect(pageErrors.get(page)).toEqual([]);
  await expect(page.locator('#afro-error-banner')).toHaveCount(0);
});
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
test.use({ contextOptions: { reducedMotion: 'reduce' }, viewport: { width: 390, height: 844 } });

async function fixture(prefix) {
  const doc = await PDFDocument.create();
  for (let n = 1; n <= 2; n++) doc.addPage([600, 800]).drawText(prefix + ' ' + n, { x: 30, y: 750, size: 16 });
  return Buffer.from(await doc.save());
}
async function settleTranslations(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function open(page, baseURL, route) {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
  await page.goto(route);
  if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
}
async function downloaded(page, selector, info, name) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await pending;
  const target = info.outputPath(name);
  await download.saveAs(target);
  return { bytes: fs.readFileSync(target), filename: download.suggestedFilename() };
}

for (const [locale, copy] of Object.entries(routes)) {
  test(`${locale} merge filename boundaries survive invalid range and recovery with real exports`, async ({ page, baseURL }, info) => {
    await open(page, baseURL, copy.merge);
    await page.locator('#mergeFileInput').setInputFiles([
      { name: 'Upload PDF.pdf', mimeType: 'application/pdf', buffer: await fixture('Upload PDF') },
      { name: 'Clear.pdf', mimeType: 'application/pdf', buffer: await fixture('Clear') }
    ]);
    await expect(page.locator('#mergeBtn')).toBeEnabled();
    await settleTranslations(page);
    await expect(page.locator('.file-item-name')).toHaveText(['Upload PDF.pdf', 'Clear.pdf']);
    const ranges = page.locator('#mergeFileList input[data-action="pages"]');
    await expect(ranges.first()).toHaveAccessibleName(copy.aria);
    await ranges.first().fill('99');
    await settleTranslations(page);
    await expect(page.locator('#mergeSummary')).toHaveText('Upload PDF.pdf: ' + copy.error);
    await expect(page.locator('#mergeBtn')).toBeDisabled();
    await ranges.first().fill('2');
    await settleTranslations(page);
    await expect(page.locator('#mergeSummary')).toHaveText(copy.ready);
    await expect(ranges.first()).toHaveAccessibleName(copy.aria);
    await ranges.nth(1).fill('99');
    await settleTranslations(page);
    await expect(page.locator('#mergeSummary')).toHaveText('Clear.pdf: ' + copy.error);
    await ranges.nth(1).fill('1');
    await expect(page.locator('#mergeBtn')).toBeEnabled();
    await page.locator('#mergeBtn').click();
    const merged = await downloaded(page, '#actionRow .act-download', info, `${locale}-merged.pdf`);
    expect(merged.filename).toBe('Upload PDF_merged.pdf');
    const doc = await PDFDocument.load(merged.bytes);
    expect(doc.getPages().map(p => p.getSize())).toEqual([{ width: 600, height: 800 }, { width: 600, height: 800 }]);
    let extracted = [];
    await parse(new Uint8Array(merged.bytes), { pagerender: async p => { extracted.push((await p.getTextContent()).items.map(x => x.str).join('')); return ''; } });
    expect(extracted).toEqual(['Upload PDF 2', 'Clear 1']);
    await page.locator('[data-mode="split"]').click();
    await page.locator('#splitFileInput').setInputFiles({ name: 'Upload PDF.pdf', mimeType: 'application/pdf', buffer: await fixture('Upload PDF') });
    await expect(page.locator('.sp-cell')).toHaveCount(2);
    await settleTranslations(page);
    await expect(page.locator('#splitFileName')).toHaveText('Upload PDF.pdf');
    // Literal '$1' keys do not introduce template substitution.
    if (locale === 'sw') await expect(page.locator('.sp-cell-label').nth(1)).toHaveText('Page 2');
    await page.locator('[data-split-mode="extract"]').click();
    await page.locator('#extractInput').fill('2');
    const split = await downloaded(page, '#splitBtn', info, `${locale}-extracted.pdf`);
    expect((await parse(new Uint8Array(split.bytes))).text.trim()).toBe('Upload PDF 2');
    expect((await PDFDocument.load(split.bytes)).getPageCount()).toBe(1);
    await page.screenshot({ path: info.outputPath(`${locale}-merge-split.png`) });
  });

  test(`${locale} signing keeps collision text in preview and exact exported image pixels`, async ({ page, baseURL }, info) => {
    await open(page, baseURL, copy.sign);
    await page.locator('#pdfInput').setInputFiles({ name: 'Upload PDF.pdf', mimeType: 'application/pdf', buffer: await fixture('Upload PDF') });
    await expect(page.locator('#step2Card')).toBeVisible();
    await settleTranslations(page);
    // Successful upload advances the step: this filename assertion is deliberately DOM-only.
    await expect(page.locator('#pdfFileName')).toHaveText('Upload PDF.pdf');
    await page.locator('[data-tab="type"]').click();
    for (const text of ['Upload PDF', 'Clear', '']) {
      await page.locator('#typeName').fill(text);
      await settleTranslations(page);
      await expect(page.locator('#typeName')).toHaveValue(text);
      await expect(page.locator('#fontPreview')).toHaveText(text || copy.placeholder);
      await expect(page.locator('#fontPreview')).toBeVisible();
    }
    const rawText = 'Upload PDF';
    await page.locator('#typeName').fill(rawText);
    await settleTranslations(page);
    await expect(page.locator('#fontPreview')).toHaveText(rawText);
    await page.locator('#fontPreview').screenshot({ path: info.outputPath(`${locale}-typed-preview.png`) });
    await page.locator('#useTypeBtn').click();
    await expect(page.locator('#downloadPdfBtn')).toBeEnabled();
    await expect.poll(() => page.locator('#overlayImg').evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    // Independently draw the literal test input, not a string read back from the product preview.
    const expected = await page.locator('#overlayImg').evaluate((image, literal) => {
      const overlay = document.getElementById('sigOverlay');
      const w = parseFloat(overlay.style.width), h = parseFloat(overlay.style.height);
      const reference = document.createElement('canvas');
      reference.width = Math.ceil(w * 3); reference.height = Math.ceil(h * 3);
      const ctx = reference.getContext('2d'); ctx.scale(3, 3); ctx.fillStyle = '#000000';
      ctx.font = '24px Dancing Script'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(literal, w / 2, h / 2, Math.max(1, w - 4));
      const actual = document.createElement('canvas'); actual.width = image.naturalWidth; actual.height = image.naturalHeight;
      actual.getContext('2d').drawImage(image, 0, 0);
      const a = actual.getContext('2d').getImageData(0, 0, actual.width, actual.height).data;
      const r = ctx.getImageData(0, 0, reference.width, reference.height).data;
      const rgb = [], alpha = [];
      for (let n = 0; n < r.length; n += 4) { rgb.push(r[n], r[n + 1], r[n + 2]); alpha.push(r[n + 3]); }
      return { width: reference.width, height: reference.height, exact: a.length === r.length && a.every((v, n) => v === r[n]), rgb, alpha };
    }, rawText);
    expect(expected.exact).toBe(true);
    await page.locator('#downloadPdfBtn').click();
    await expect(page.locator('#finalDownloadBtn')).toBeEnabled();
    const exported = await downloaded(page, '#finalDownloadBtn', info, `${locale}-signed.pdf`);
    const pdf = await PDFDocument.load(exported.bytes);
    expect(pdf.getPageCount()).toBe(2);
    expect((await parse(new Uint8Array(exported.bytes))).text).toContain('Upload PDF 1');
    expect((await parse(new Uint8Array(exported.bytes))).text).toContain('Upload PDF 2');
    const objects = pdf.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
    const images = objects.entries().map(([, ref]) => pdf.context.lookup(ref)).filter(x => x.dict.get(PDFName.of('Subtype')).toString() === '/Image');
    expect(images).toHaveLength(1);
    const image = images[0];
    expect(image.dict.lookup(PDFName.of('Width')).asNumber()).toBe(expected.width);
    expect(image.dict.lookup(PDFName.of('Height')).asNumber()).toBe(expected.height);
    const actualRgb = decodePDFRawStream(image).decode();
    expect(hash(actualRgb)).toBe(hash(Buffer.from(expected.rgb)));
    const mask = image.dict.get(PDFName.of('SMask'));
    expect(mask).toBeTruthy();
    const actualAlpha = decodePDFRawStream(pdf.context.lookup(mask)).decode();
    expect(hash(actualAlpha)).toBe(hash(Buffer.from(expected.alpha)));
    expect(await page.evaluate(() => localStorage.getItem('afrotools_signature'))).toBeNull();
    fs.writeFileSync(info.outputPath(`${locale}-image-proof.json`), JSON.stringify({ rawText, width: expected.width, height: expected.height, referenceEqualsOverlay: expected.exact, rgbSha256: hash(actualRgb), alphaSha256: hash(actualAlpha), outputSha256: hash(exported.bytes) }, null, 2));
  });
}
