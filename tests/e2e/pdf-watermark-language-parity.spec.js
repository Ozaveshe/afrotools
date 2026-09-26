const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { PDFDocument, rgb } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const routes = { en: '/tools/pdf-watermark/', fr: '/fr/tools/filigrane-pdf/', sw: '/sw/zana/watermark-pdf/' };
let fixture;
test.beforeAll(async () => {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= 3; i++) {
    const p = doc.addPage([300 + i * 20, 400 + i * 20]);
    p.drawText('ORIGINAL PAGE ' + i, { x: 20, y: 40 });
    p.drawRectangle({ x: 20, y: 80, width: 40, height: 30, color: rgb(0, 1, 0) });
  }
  fixture = Buffer.from(await doc.save());
});
async function upload(page, name = 'synthetic.pdf', buffer = fixture) {
  await page.locator('#pdfFileInput').setInputFiles({ name, mimeType: 'application/pdf', buffer });
}
async function previewReady(page) {
  await expect(page.locator('#previewStatus')).toHaveText(/^(Preview page|Aperçu de la page|Hakiki ukurasa) \d+ \/ \d+$/);
}
async function apply(page) {
  await page.locator('#watermarkBtn').click();
  await expect(page.locator('#actionRow')).toHaveClass(/\bon\b/);
  await expect(page.locator('#watermarkBtn')).toBeEnabled();
}
async function output(page, name) {
  const waiting = page.waitForEvent('download');
  await page.locator('#downloadBtn').click();
  const d = await waiting;
  const bytes = fs.readFileSync(await d.path());
  fs.writeFileSync(test.info().outputPath(name + '.pdf'), bytes);
  return page.evaluate(async arr => {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arr) }).promise;
    const result = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const p = await pdf.getPage(i), viewport = p.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
      await p.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0, green = 0, blue = 0;
      for (let j = 0; j < pixels.length; j += 4) {
        if (pixels[j] > 230 && pixels[j + 1] < 230 && pixels[j + 2] < 230) red++;
        if (pixels[j] < 230 && pixels[j + 1] < 230 && pixels[j + 2] > 230) blue++;
        if (pixels[j] < 10 && pixels[j + 1] > 245 && pixels[j + 2] < 10) green++;
      }
      result.push({ text: (await p.getTextContent()).items.map(x => x.str).join(' '), view: p.view, red, green, blue, png: canvas.toDataURL().split(',')[1] });
    }
    return result;
  }, [...bytes]);
}
for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} guest text selected/all and image output retain original pages`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(route);
    let chooser = 0; page.on('filechooser', () => chooser++);
    await page.locator('#pdfDropZone').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    await expect.poll(() => chooser).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await upload(page); await page.locator('#watermarkText').fill('AUDIT MARK'); await page.locator('#rotation').fill('0');
    await page.locator('#pageRange').fill('2'); await apply(page);
    let result = await output(page, 'selected');
    expect(result.map(x => x.text)).toEqual(['ORIGINAL PAGE 1', 'ORIGINAL PAGE 2  AUDIT MARK', 'ORIGINAL PAGE 3']);
    expect(result.map(x => x.view)).toEqual([[0, 0, 320, 420], [0, 0, 340, 440], [0, 0, 360, 460]]);
    expect(result.map(x => x.green)).toEqual([1200, 1200, 1200]);
    await page.locator('#pageRange').fill(''); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/); await apply(page);
    result = await output(page, 'all'); expect(result.every(x => x.text.includes('AUDIT MARK'))).toBe(true);
    const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 40; c.height = 20; const ctx = c.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 40, 20); return c.toDataURL().split(',')[1]; });
    await page.locator('[data-type=image]').click();
    await page.locator('#imageFileInput').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await expect(page.locator('#imageFileName')).toContainText('red.png'); await apply(page); result = await output(page, 'image');
    expect(result.map(x => x.text)).toEqual(['ORIGINAL PAGE 1', 'ORIGINAL PAGE 2', 'ORIGINAL PAGE 3']);
    expect(result.map(x => x.red)).toEqual([4608, 5304, 5832]); expect(result.map(x => x.green)).toEqual([1200, 1200, 1200]);
    fs.writeFileSync(test.info().outputPath('image-page2.png'), Buffer.from(result[1].png, 'base64'));
    await expect(page.locator('#resultText')).toHaveText({ en: 'Done. Watermarked pages: 3.', fr: 'Terminé. Pages avec filigrane : 3.', sw: 'Imekamilika. Kurasa zenye alama ya maji: 3.' }[locale]);
  });
  test(`${locale} changed settings and files invalidate pending and completed outputs`, async ({ page }) => {
    await page.goto(route); await upload(page); await page.locator('#rotation').fill('0'); await page.locator('#fontSize').fill('24'); await page.locator('#watermarkText').fill('OLD MARK'); await previewReady(page);
    await page.evaluate(() => { const original = PDFLib.PDFDocument.load; PDFLib.PDFDocument.load = async function () { PDFLib.PDFDocument.load = original; await new Promise(r => window.releaseWatermark = r); return original.apply(this, arguments); }; });
    await page.locator('#watermarkBtn').click(); await page.waitForFunction(() => !!window.releaseWatermark);
    await page.locator('#watermarkText').fill('NEW MARK'); await page.evaluate(() => window.releaseWatermark());
    await expect(page.locator('#watermarkBtn')).toBeEnabled(); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await apply(page); expect((await output(page, 'new')).every(x => x.text.includes('NEW MARK') && !x.text.includes('OLD MARK'))).toBe(true);
    for (const [id, value] of [['fontSize', '45'], ['textOpacity', '60'], ['rotation', '15'], ['offsetX', '2'], ['pageRange', '2']]) {
      await page.locator('#' + id).fill(value); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/); await apply(page);
    }
    await previewReady(page);
    await page.evaluate(() => { const original = PDFLib.PDFDocument.load; PDFLib.PDFDocument.load = async function () { PDFLib.PDFDocument.load = original; await new Promise(r => window.releaseSource = r); return original.apply(this, arguments); }; });
    await page.locator('#watermarkBtn').click(); await page.waitForFunction(() => !!window.releaseSource); await upload(page, 'second.pdf');
    await page.evaluate(() => window.releaseSource()); await expect(page.locator('#watermarkBtn')).toBeEnabled(); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('.file-row')).toHaveCount(2);
    await page.locator('.file-row .mini-btn').last().click(); await apply(page); await output(page, 'after-source');
  });
  test(`${locale} invalid PDFs and malformed ranges show native safe errors`, async ({ page }) => {
    await page.goto(route); await upload(page);
    await page.locator('#pageRange').fill('1e0'); await page.locator('#watermarkBtn').click(); await expect(page.locator('#watermarkBtn')).toBeEnabled();
    await expect(page.locator('#resultText')).toContainText({en:'Check the page range',fr:'Vérifiez les pages',sw:'Kagua kurasa'}[locale]);
    await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await page.locator('.file-row .mini-btn').click(); await upload(page, 'invalid.pdf', Buffer.from('not pdf'));
    await page.locator('#watermarkBtn').click(); await expect(page.locator('#watermarkBtn')).toBeEnabled();
    await expect(page.locator('#resultText')).toContainText({en:'could not be applied',fr:'Impossible d’appliquer',sw:'haikuwekwa'}[locale]);
    await expect(page.locator('#resultText')).not.toContainText('offset='); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
  });
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} latest image wins delayed reads and invalid replacement removes old bytes`, async ({ page }) => {
    await page.goto(route); await upload(page); await page.locator('[data-type=image]').click();
    const images = await page.evaluate(() => ['red', 'blue'].map(color => { const c = document.createElement('canvas'); c.width = 40; c.height = 20; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 40, 20); return c.toDataURL().split(',')[1]; }));
    for (const fail of [false, true]) {
      await page.evaluate(fail => { const read = File.prototype.arrayBuffer; File.prototype.arrayBuffer = async function() { if(this.name === 'slow.png') { File.prototype.arrayBuffer = read; await new Promise(resolve => window.releaseImage = resolve); if(fail) throw new Error('synthetic read failure'); } return read.call(this); }; }, fail);
      await page.locator('#imageFileInput').setInputFiles({ name:'slow.png', mimeType:'image/png', buffer:Buffer.from(images[0], 'base64') });
      await page.waitForFunction(() => typeof window.releaseImage === 'function'); await expect(page.locator('#watermarkBtn')).toBeDisabled();
      await page.locator('#imageFileInput').setInputFiles({ name:'current.png', mimeType:'image/png', buffer:Buffer.from(images[1], 'base64') });
      await expect(page.locator('#imageFileName')).toContainText('current.png');
      await page.evaluate(() => { window.releaseImage(); delete window.releaseImage; });
      await previewReady(page); await expect(page.locator('#imageFileName')).toContainText('current.png');
      await apply(page); const result = await output(page, 'current-image-' + fail);
      expect(result.every(p => p.blue > 1000 && p.red === 0 && p.green === 1200)).toBe(true);
      await page.locator('#imageFileInput').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
      await expect(page.locator('#imageFileName')).toHaveText({en:'Choose a PNG, JPG, JPEG, or WebP image.',fr:'Choisissez une image PNG, JPG, JPEG ou WebP.',sw:'Chagua picha ya PNG, JPG, JPEG au WebP.'}[locale]);
      await expect(page.locator('#watermarkBtn')).toBeDisabled(); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    }
  });
  test(`${locale} preview uses exported font and placement and old painting cannot replace latest preview`, async ({page}) => {
    await page.goto(route); await upload(page); await page.locator('#rotation').fill('0'); await page.locator('#fontSize').fill('24'); await page.locator('#watermarkText').fill('PREVIEW MARK'); await previewReady(page);
    await page.evaluate(() => {
      const getDocument = pdfjsLib.getDocument; let hold = true;
      window.pdfjsLib = Object.assign({}, pdfjsLib);
      pdfjsLib.getDocument = function() { const task = getDocument.apply(this, arguments); const promise = task.promise.then(doc => {
        const getPage = doc.getPage.bind(doc); doc.getPage = async function() { const pdfPage = await getPage(...arguments); const render = pdfPage.render.bind(pdfPage);
          pdfPage.render = function(params) { if (!hold) return render(params); hold = false; return {promise: new Promise(resolve => window.releasePaint = resolve).then(() => render(params).promise).then(() => { window.oldPaintFinished = true; })}; }; return pdfPage; }; return doc;
      }); return {promise}; };
    });
    await page.locator('#fontSelect').selectOption('TimesRoman'); await page.waitForFunction(() => !!window.releasePaint);
    await page.locator('#fontSelect').selectOption('CourierBold'); await page.locator('#offsetX').fill('3'); await previewReady(page);
    const expected = await page.locator('#previewCanvas').evaluate(c => c.toDataURL());
    await page.evaluate(() => window.releasePaint()); await page.waitForFunction(() => window.oldPaintFinished);
    expect(await page.locator('#previewCanvas').evaluate(c => c.toDataURL())).toBe(expected);
    await apply(page); await previewReady(page);
    const waiting = page.waitForEvent('download'); await page.locator('#downloadBtn').click(); const dl=await waiting; const bytes=fs.readFileSync(await dl.path());
    const parity = await page.evaluate(async bytes => { const doc = await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise; const p = await doc.getPage(1), full=p.getViewport({scale:1}), view=p.getViewport({scale:Math.min(340/full.width,460/full.height,1.3)}); const c=document.createElement('canvas');c.width=Math.floor(view.width);c.height=Math.floor(view.height);await p.render({canvasContext:c.getContext('2d'),viewport:view,background:'white'}).promise;return {actual:c.toDataURL(),preview:document.querySelector('#previewCanvas').toDataURL()};}, [...bytes]);
    expect(parity.preview).toBe(parity.actual);
    fs.writeFileSync(test.info().outputPath('preview-match.pdf'),bytes);
    fs.writeFileSync(test.info().outputPath('preview-match.png'),Buffer.from(parity.preview.split(',')[1],'base64'));
  });
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} behind-content selected pages and batch ZIP remain usable to guests`, async ({page}) => {
    await page.goto(route); await upload(page, 'first.pdf');
    await page.locator('#rotation').fill('0'); await page.locator('#fontSize').fill('24'); await page.locator('#watermarkText').fill('BATCH MARK');
    await page.locator('#pageRange').fill('2'); await page.locator('#layerSelect').selectOption('under'); await apply(page);
    const result = await output(page, 'behind-selected');
    expect(result.map(p => p.text.includes('BATCH MARK'))).toEqual([false, true, false]);
    expect(result.every((p,i) => p.text.includes('ORIGINAL PAGE ' + (i+1)) && p.green === 1200)).toBe(true);
    expect(result.map(p=>p.view)).toEqual([[0,0,320,420],[0,0,340,440],[0,0,360,460]]);
    await upload(page, 'second.pdf'); await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/); await apply(page);
    await expect(page.locator('#downloadBtn')).toHaveText({en:'Download ZIP',fr:'Télécharger le ZIP',sw:'Pakua ZIP'}[locale]);
    const waiting=page.waitForEvent('download'); await page.locator('#downloadBtn').click();const download=await waiting;const bytes=fs.readFileSync(await download.path());
    const zip=await require('jszip').loadAsync(bytes,{checkCRC32:true});expect(Object.keys(zip.files).sort()).toEqual(['first_watermarked.pdf','second_watermarked.pdf']);
    for(const file of Object.values(zip.files)) {
      const pdf=await file.async('nodebuffer');const texts=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const out=[];for(let i=1;i<=doc.numPages;i++)out.push((await(await doc.getPage(i)).getTextContent()).items.map(t=>t.str).join(' '));return out;},[...pdf]);
      expect(texts.every((text,i)=>text.includes('ORIGINAL PAGE '+(i+1)))).toBe(true);expect(texts.map(text=>text.includes('BATCH MARK'))).toEqual([false,true,false]);
    }
    fs.writeFileSync(test.info().outputPath('batch.zip'),bytes);
  });
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} oversized rotated watermark clipping matches the actual PDF preview`, async ({page}) => {
    await page.goto(route); await upload(page);
    await page.locator('#watermarkText').fill('NEW MARK'); await page.locator('#fontSize').fill('60'); await page.locator('#rotation').fill('-45');
    await apply(page); await previewReady(page);
    const waiting=page.waitForEvent('download');await page.locator('#downloadBtn').click();const dl=await waiting;const bytes=fs.readFileSync(await dl.path());
    const result=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const p=await doc.getPage(1),full=p.getViewport({scale:1}),view=p.getViewport({scale:Math.min(340/full.width,460/full.height,1.3)});const c=document.createElement('canvas');c.width=Math.floor(view.width);c.height=Math.floor(view.height);await p.render({canvasContext:c.getContext('2d'),viewport:view,background:'white'}).promise;return {actual:c.toDataURL(),preview:document.querySelector('#previewCanvas').toDataURL(),view:p.view,text:(await p.getTextContent()).items.map(t=>t.str).join(' ')};},[...bytes]);
    expect(result.preview).toBe(result.actual);expect(result.view).toEqual([0,0,320,420]);expect(result.text).toContain('ORIGINAL PAGE 1');
    const lib=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');const doc=await PDFDocument.load(bytes);const stream=doc.getPage(0).node.Contents().asArray().map(ref=>Buffer.from(lib.decodePDFRawStream(doc.context.lookup(ref)).decode()).toString()).join('\n');
    expect(stream).toContain('<4E4557204D41524B> Tj');expect(stream).toMatch(/-8\.299999999999983 175\.2 Tm/);
    fs.writeFileSync(test.info().outputPath('oversized-preview-match.pdf'),bytes);fs.writeFileSync(test.info().outputPath('oversized-preview-match.png'),Buffer.from(result.preview.split(',')[1],'base64'));
  });
}

for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} sanitized filename collisions retain every distinct PDF in the ZIP`, async ({page}) => {
    await page.goto(route);
    const second=await PDFDocument.create(); second.addPage([280,380]).drawText('SECOND SOURCE',{x:20,y:40});const secondBytes=Buffer.from(await second.save());
    await upload(page,'report A.pdf');await upload(page,'report_A.pdf',secondBytes);await upload(page,'é.pdf');await upload(page,'中文.pdf',secondBytes);
    await page.locator('#fontSize').fill('24');await page.locator('#rotation').fill('0');await page.locator('#watermarkText').fill('ZIP MARK');await apply(page);
    const waiting=page.waitForEvent('download');await page.locator('#downloadBtn').click();const dl=await waiting;const bytes=fs.readFileSync(await dl.path());const zip=await require('jszip').loadAsync(bytes,{checkCRC32:true});
    const expected={'report_A_watermarked.pdf':'ORIGINAL PAGE 1','report_A_watermarked_2.pdf':'SECOND SOURCE','document_watermarked.pdf':'ORIGINAL PAGE 1','document_watermarked_2.pdf':'SECOND SOURCE'};
    expect(Object.keys(zip.files).sort()).toEqual(Object.keys(expected).sort());
    for(const [name,marker] of Object.entries(expected)) {
      const pdf=await zip.file(name).async('nodebuffer');const result=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;return {pages:doc.numPages,text:(await(await doc.getPage(1)).getTextContent()).items.map(t=>t.str).join(' ')};},[...pdf]);
      expect(result.pages).toBe(marker==='SECOND SOURCE'?1:3);expect(result.text).toContain(marker);expect(result.text).toContain('ZIP MARK');
    }
    fs.writeFileSync(test.info().outputPath('colliding-names.zip'),bytes);
  });
}
