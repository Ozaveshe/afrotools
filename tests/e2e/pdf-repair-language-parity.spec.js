const fs = require('node:fs');
const {test, expect} = require('@playwright/test');
const JSZip = require('jszip');
const {PDFDocument, rgb, degrees} = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
test.use({trace: 'off', screenshot: 'off', video: 'off', viewport: {width: 320, height: 740}});
test.describe.configure({timeout: 180000});
const routes = {en: '/tools/pdf-repair/', fr: '/fr/tools/reparer-pdf/', sw: '/sw/zana/kurekebisha-pdf/'};
const native = {en: /compatibility normalization/, fr: /Normalisation de compatibilité/, sw: /Urekebishaji wa uoanifu/};
const rasterNative = {en: /image-only pages/, fr: /ne conserve pas le texte sélectionnable/, sw: /picha pekee/};
let fixture, damaged;
test.beforeAll(async () => {
  const doc = await PDFDocument.create();
  for (const rotation of [0, 90, 180, 270]) {
    const p = doc.addPage([450, 300]);
    p.setCropBox(20, 30, 400, 240); p.setRotation(degrees(rotation));
    p.drawText('SYNTHETIC ORIGINAL ' + rotation, {x: 50, y: 150, size: 14});
    p.drawRectangle({x: 60, y: 80, width: 40, height: 30, color: rgb(0, 1, 0)});
  }
  fixture = Buffer.from(await doc.save({useObjectStreams: false}));
  damaged = Buffer.from(fixture.toString('latin1').replace(/startxref\s+\d+/, 'startxref\n0').replace(/%%EOF\s*$/, ''), 'latin1');
});
async function open(page, locale) {
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(page.url()).origin || route.request().isNavigationRequest() ? route.continue() : route.abort());
  await page.goto(routes[locale]);
  await page.waitForFunction(() => window.PDFLib && window.PdfUtils && window.QPDF);
  if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
}
async function upload(page, bytes = fixture, name = 'synthetic.pdf') {
  await page.locator('#pdfFileInput').setInputFiles({name, mimeType: 'application/pdf', buffer: bytes});
}
async function run(page, mode = 'normalize') {
  await page.locator('#repairMode').selectOption(mode);
  await page.locator('#repairBtn').click();
  await expect(page.locator('#resultCard')).toHaveClass(/on/, {timeout: 90000});
  await expect(page.locator('#repairBtn')).toBeEnabled();
}
async function download(page, selector, info, name) {
  await page.locator('#reviewConfirm').check();
  const next = page.waitForEvent('download', {timeout: 10000});
  await page.locator(selector).click();
  const result = await next;
  const bytes = fs.readFileSync(await result.path());
  if (info) fs.writeFileSync(info.outputPath(name || result.suggestedFilename()), bytes);
  return bytes;
}
async function inspect(page, bytes, info, prefix) {
  const output = await PDFDocument.load(bytes);
  const boxes = output.getPages().map(p => ({size: p.getSize(), crop: p.getCropBox(), rotation: p.getRotation().angle}));
  const pages = await page.evaluate(async bytes => {
    const lib = await PdfUtils.ensurePdfJs();
    const pdf = await lib.getDocument({data: new Uint8Array(bytes)}).promise;
    try {
      const result = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i), v = p.getViewport({scale: 1});
        const c = document.createElement('canvas'); c.width = Math.ceil(v.width); c.height = Math.ceil(v.height);
        await p.render({canvasContext: c.getContext('2d'), viewport: v, background: 'white'}).promise;
        const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let green = 0, xSum = 0, ySum = 0;
        for (let n = 0; n < pixels.length; n += 4) if (pixels[n] < 20 && pixels[n + 1] > 230 && pixels[n + 2] < 20) {
          green++; xSum += (n / 4) % c.width; ySum += Math.floor(n / 4 / c.width);
        }
        result.push({visible: [v.width, v.height], text: (await p.getTextContent()).items.map(x => x.str).join(' '),
          green, center: [xSum / green, ySum / green], png: c.toDataURL().split(',')[1]});
      }
      return result;
    } finally { await pdf.destroy(); }
  }, [...bytes]);
  for (const [i, p] of pages.entries()) {
    if (info) fs.writeFileSync(info.outputPath(prefix + '-' + i + '.png'), Buffer.from(p.png, 'base64'));
  }
  return {boxes, pages};
}
async function hold(page, operation) {
  await page.evaluate(operation => {
    let target, key;
    if (operation === 'read') { target = File.prototype; key = 'arrayBuffer'; }
    else if (operation === 'save') { target = PDFLib.PDFDocument.prototype; key = 'save'; }
    else { target = JSZip.prototype; key = 'generateAsync'; }
    const original = target[key];
    window.heldRepairFinished = false;
    target[key] = async function(...args) {
      target[key] = original;
      await new Promise(resolve => window.releaseHeldRepair = resolve);
      try { return await original.apply(this, args); } finally { window.heldRepairFinished = true; }
    };
  }, operation);
}
for (const locale of Object.keys(routes)) {
  test(locale + ': normalization and damaged-xref recovery preserve actual pages and native reports', async ({page}, info) => {
    await open(page, locale);
    const original = await inspect(page, fixture);
    for (const [mode, bytes] of [['normalize', fixture], ['auto', damaged]]) {
      await upload(page, bytes); await run(page, mode);
      const body = await page.locator('#resultCard').innerText();
      expect(body).not.toMatch(/HEAP|0x[0-9a-f]{6}|parse a number|offset=/i);
      const repaired = await download(page, '#downloadBtn', info, mode + '.pdf');
      const proof = await inspect(page, repaired, info, mode);
      expect(proof.boxes).toEqual(original.boxes);
      proof.pages.forEach((p, i) => {expect(p.text).toBe(original.pages[i].text); expect(p.png).toBe(original.pages[i].png);});
      const reportBytes = await download(page, '#downloadReportBtn', info, mode + '.json');
      const report = JSON.parse(reportBytes); expect(report.reports).toHaveLength(1);
      expect(report.reports[0].pages).toBe(4); expect(report.reports[0].qpdfLog).toEqual([]);
      if (mode === 'normalize') expect(report.reports[0].method).toMatch(native[locale]);
      await page.locator('main #clearBtn').click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
  test(locale + ': raster qualities retain cropped physical dimensions and all four orientations', async ({page}, info) => {
    await open(page, locale); const original = await inspect(page, fixture);
    for (const quality of ['1', '1.25', '1.6']) {
      await upload(page); await page.locator('#rasterScale').selectOption(quality); await run(page, 'raster');
      await expect(page.locator('#errorListInner')).toContainText(rasterNative[locale]);
      const bytes = await download(page, '#downloadBtn', info, 'raster-' + quality + '.pdf');
      const result = await inspect(page, bytes, info, 'raster-' + quality);
      result.pages.forEach((p, i) => {
        expect(p.visible).toEqual(original.pages[i].visible); expect(p.text).toBe('');
        expect(Math.abs(p.green - original.pages[i].green)).toBeLessThan(100);
        expect(Math.abs(p.center[0] - original.pages[i].center[0])).toBeLessThan(1);
        expect(Math.abs(p.center[1] - original.pages[i].center[1])).toBeLessThan(1);
        expect(result.boxes[i].rotation).toBe(0);
      });
      fs.writeFileSync(info.outputPath('geometry-' + quality + '.json'), JSON.stringify({boxes: result.boxes, pages: result.pages.map(({png, ...p}) => p)}, null, 2));
      await page.locator('main #clearBtn').click();
    }
  });
  test(locale + ': guest ZIP and CSV reopen; invalid PDF has native honest failure and no PDF download', async ({page}, info) => {
    await open(page, locale);
    const names = ['same.pdf', 'same.pdf', 'SAME.pdf', 'report?.pdf', 'report*.pdf', '报告.pdf', '报告.pdf'];
    for (const [i, name] of names.entries()) {
      const pdf = await PDFDocument.create(); pdf.addPage([300, 400]).drawText('SYNTHETIC MEMBER ' + i);
      await upload(page, Buffer.from(await pdf.save({useObjectStreams: false})), name);
    }
    await run(page);
    const bytes = await download(page, '#downloadZipBtn', info);
    const zip = await JSZip.loadAsync(bytes);
    const pdfs = Object.keys(zip.files).filter(n => n.endsWith('.pdf')); expect(pdfs).toHaveLength(names.length);
    expect(new Set(pdfs.map(n => n.normalize('NFC').toLowerCase())).size).toBe(names.length);
    expect(pdfs.filter(n => n.startsWith('报告'))).toHaveLength(2);
    const reports = JSON.parse(await zip.file('pdf-repair-report.json').async('string')).reports;
    expect(reports).toHaveLength(names.length);
    for (const [i, report] of reports.entries()) {
      expect(report.file).toBe(names[i]); expect(pdfs).toContain(report.outputFile);
      const member = await zip.file(report.outputFile).async('uint8array');
      expect((await PDFDocument.load(member)).getPageCount()).toBe(1);
      const actualText = await page.evaluate(async bytes => {
        const lib = await PdfUtils.ensurePdfJs(), pdf = await lib.getDocument({data: new Uint8Array(bytes)}).promise;
        try { return (await (await pdf.getPage(1)).getTextContent()).items.map(x => x.str).join(' '); }
        finally { await pdf.destroy(); }
      }, [...member]);
      expect(actualText).toBe('SYNTHETIC MEMBER ' + i);
    }
    await page.locator('#reportFormat').selectOption('csv');
    expect((await download(page, '#downloadReportBtn', info)).toString()).toMatch(native[locale]);
    await page.locator('main #clearBtn').click(); await page.locator('#reportFormat').selectOption('json'); await upload(page, Buffer.from('SYNTHETIC INVALID DOCUMENT')); await run(page, 'auto');
    await expect(page.locator('#downloadBtn')).toBeHidden(); await expect(page.locator('#downloadZipBtn')).toBeHidden();
    const report = JSON.parse(await download(page, '#downloadReportBtn', info, 'failure.json'));
    expect(report.reports[0].status).toBe('failed'); expect(report.reports[0].pages).toBe(0);
    expect(report.reports[0].qpdfLog).toEqual([]);
    const visible = await page.locator('#resultCard').innerText();
    expect(visible).not.toMatch(/HEAP|0x[0-9a-f]{6}|parse a number|offset=|line:|column:/i);
    if (locale !== 'en') expect(visible).not.toMatch(/Repair failed|could not recover|marker is missing|No %PDF/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
  test(locale + ': delayed source/settings/save/ZIP cannot expose obsolete output', async ({page}) => {
    await open(page, locale);
    for (const change of ['mode', 'quality', 'password', 'source', 'save']) {
      await page.locator('#openPassword').fill(''); await upload(page); await page.locator('#repairMode').selectOption('normalize');
      await hold(page, change === 'save' ? 'save' : 'read'); await page.locator('#repairBtn').click();
      await page.waitForFunction(() => !!window.releaseHeldRepair);
      if (change === 'mode' || change === 'save') await page.locator('#repairMode').selectOption('raster');
      if (change === 'quality') await page.locator('#rasterScale').selectOption('1.6');
      if (change === 'password') await page.locator('#openPassword').fill('synthetic-password');
      if (change === 'source') await upload(page, fixture, 'replacement.pdf');
      await page.evaluate(() => {window.releaseHeldRepair(); delete window.releaseHeldRepair;});
      await expect(page.locator('#repairBtn')).toBeEnabled();
      await expect(page.locator('#resultCard')).not.toHaveClass(/on/); await expect(page.locator('#actionRow')).toBeHidden();
      await page.locator('main #clearBtn').click();
    }
    await upload(page, fixture, 'first.pdf'); await upload(page, fixture, 'second.pdf'); await run(page);
    await page.locator('#reviewConfirm').check(); await hold(page, 'zip');
    const downloads = []; page.on('download', d => downloads.push(d));
    await page.locator('#downloadZipBtn').click(); await page.waitForFunction(() => !!window.releaseHeldRepair);
    await page.locator('#repairMode').selectOption('raster');
    await page.evaluate(() => {window.releaseHeldRepair(); delete window.releaseHeldRepair;});
    // Let the actual ZIP promise finish, then assert its completion emitted no download.
    await page.waitForFunction(() => window.heldRepairFinished);
    expect(downloads).toHaveLength(0); await expect(page.locator('#actionRow')).toBeHidden();
    await run(page, 'normalize'); await expect(page.locator('#downloadZipBtn')).toBeVisible();
  });
}
