const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const JSZip = require('../../assets/vendor/jszip/jszip.min.js');
const { PDFDocument } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const routes = { en: '/tools/pdf-page-numbers/', fr: '/fr/tools/numerotation-pdf/', sw: '/sw/zana/namba-za-kurasa-pdf/' };
const optionIds = ['templateSelect', 'startNumber', 'padLength', 'startPage', 'pageRange', 'subsetSelect', 'prefixInput', 'suffixInput', 'fontSelect', 'fontSize', 'opacity', 'marginX', 'marginY', 'rotation', 'colorInput', 'colorText', 'facingMode', 'pdfFileInput'];

async function fixture(marker) {
  const pdf = await PDFDocument.create();
  for (let i = 1; i <= 2; i++) pdf.addPage([420, 594]).drawText(`SYNTHETIC ${marker} PAGE ${i}`, { x: 60, y: 300, size: 12 });
  return Buffer.from(await pdf.save());
}
async function readBatch(page, info, artifact, prefix) {
  const pending = page.waitForEvent('download');
  await page.locator('#downloadBtn').click();
  const bytes = fs.readFileSync(await (await pending).path());
  fs.writeFileSync(info.outputPath(artifact), bytes);
  // Reopen the ZIP independently, checking CRCs and its central directory.
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const names = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  expect(names).toHaveLength(3);
  expect(new Set(names.map(name => name.toLowerCase())).size).toBe(3);
  const expected = { 'a_b_numbered.pdf': 'FIRST', 'a_b_numbered_2.pdf': 'SECOND', 'A_B_numbered_3.pdf': 'THIRD' };
  expect(names.sort()).toEqual(Object.keys(expected).sort());
  for (const name of names) {
    const pdf = await zip.files[name].async('uint8array');
    const texts = await page.evaluate(async data => {
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
      try {
        const result = [];
        for (let i = 1; i <= doc.numPages; i++) result.push((await (await doc.getPage(i)).getTextContent()).items.map(item => item.str).join('|'));
        return result;
      } finally { await doc.destroy(); }
    }, [...pdf]);
    expect(texts).toHaveLength(2);
    for (let i = 0; i < 2; i++) {
      expect(texts[i]).toContain(`SYNTHETIC ${expected[name]} PAGE ${i + 1}`);
      expect(texts[i]).toContain(`${prefix}${i + 1}`);
      expect(texts[i]).not.toContain(prefix === 'OLD-' ? 'NEW-' : 'OLD-');
    }
  }
  return names;
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale}: delayed numbering locks every option and preserves distinct colliding ZIP files`, async ({ page, baseURL }, info) => {
    test.setTimeout(90000);
    await page.route('**/*', request => request.request().url().startsWith(baseURL) ? request.continue() : request.abort());
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(route);
    if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
    await page.locator('#prefixInput').fill('OLD-');
    await page.locator('#pdfFileInput').setInputFiles(await Promise.all([
      ['a b.pdf', 'FIRST'], ['a_b.pdf', 'SECOND'], ['A_B.pdf', 'THIRD']
    ].map(async ([name, marker]) => ({ name, mimeType: 'application/pdf', buffer: await fixture(marker) }))));
    await expect(page.locator('#previewStatus')).toContainText({ en: 'Previewing PDF page', fr: 'Aperçu de la page', sw: 'Onyesho la ukurasa' }[locale]);
    await page.evaluate(() => {
      const original = File.prototype.arrayBuffer;
      window.delayedNumberingRead = false;
      File.prototype.arrayBuffer = function () {
        if (this.name === 'a b.pdf' && !window.delayedNumberingRead) {
          window.delayedNumberingRead = true;
          return new Promise((resolve, reject) => {
            window.releaseNumberingRead = () => original.call(this).then(resolve, reject);
          });
        }
        return original.call(this);
      };
    });
    await page.locator('#numberBtn').click();
    await expect.poll(() => page.evaluate(() => window.delayedNumberingRead)).toBe(true);
    for (const id of optionIds) await expect(page.locator('#' + id)).toBeDisabled();
    for (const button of await page.locator('[data-position], [data-page-preset], #clearFilesBtn, #fileList .mini-btn').all()) await expect(button).toBeDisabled();
    expect(await page.locator('[data-page-preset]').count()).toBe(4);
    await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    // Native clicks on disabled controls must not apply another preset mid-batch.
    await page.locator('[data-page-preset="report"]').evaluate(button => button.click());
    await expect(page.locator('#prefixInput')).toHaveValue('OLD-');
    await expect(page.locator('#templateSelect')).toHaveValue('number');
    let fileChooserOpened = false;
    page.on('filechooser', () => { fileChooserOpened = true; });
    await page.locator('#dropZone').focus();
    await page.keyboard.press('Enter');
    expect(fileChooserOpened).toBe(false);
    await page.evaluate(() => window.releaseNumberingRead());
    await expect(page.locator('#actionRow')).toHaveClass(/\bon\b/);
    const names = await readBatch(page, info, 'locked-batch.zip', 'OLD-');
    for (const name of names) await expect(page.locator('#resultRows')).toContainText(name);
    for (const id of optionIds) await expect(page.locator('#' + id)).toBeEnabled();
    await page.locator('#prefixInput').fill('NEW-');
    await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await page.locator('#numberBtn').click();
    await expect(page.locator('#actionRow')).toHaveClass(/\bon\b/);
    await readBatch(page, info, 'updated-batch.zip', 'NEW-');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
