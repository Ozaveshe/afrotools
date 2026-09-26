const{test,expect}=require('@playwright/test');const fs=require('fs'),crypto=require('crypto');const{PDFDocument,PDFName,decodePDFRawStream}=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');const parse=require('pdf-parse');const routes={en:'/tools/pdf-sign/',fr:'/fr/tools/signer-pdf/',sw:'/sw/zana/kusaini-pdf/'};const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

test.use({trace:'off',screenshot:'off',video:'off',storageState:{cookies:[],origins:[]}});

for(const[locale,url]of Object.entries(routes))for(const mode of ['type','draw','upload'])test(`${locale} ${mode} signature image matches preview and stale output is unavailable`,async({page,baseURL},info)=>{

 await page.setViewportSize({width:390,height:844});const origin=new URL(baseURL).origin;await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());

 const source=await PDFDocument.create();source.addPage([600,800]).drawText('SYNTHETIC ORIGINAL CONTENT',{x:40,y:740,size:12});await page.goto(url);if(await page.locator('#afro-cc-decline').isVisible())await page.locator('#afro-cc-decline').click();await page.locator('#pdfInput').setInputFiles({name:'synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(await source.save())});await page.locator(`[data-tab="${mode}"]`).click();

 if(mode==='type'){await page.locator('#typeName').fill('Élodie Mwang’ombe');await page.locator('[data-font="Pacifico"]').click();await page.locator('[data-typecolor="navy"]').click();await page.locator('#useTypeBtn').click();}

 else if(mode==='upload'){const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=60;const x=c.getContext('2d');x.fillStyle='#940080';x.fillRect(8,20,130,8);x.fillRect(100,5,8,45);return c.toDataURL();});await page.locator('#sigImageInput').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(image.split(',')[1],'base64')});await expect(page.locator('#imagePreview')).toBeVisible();await page.locator('#useImageBtn').click();}

 else{await page.locator('#drawCanvas').scrollIntoViewIfNeeded();const r=await page.locator('#drawCanvas').boundingBox();await page.mouse.move(r.x+25,r.y+35);await page.mouse.down();await page.mouse.move(r.x+80,r.y+60,{steps:8});await page.mouse.move(r.x+130,r.y+20,{steps:8});await page.mouse.up();await page.locator('#useDrawBtn').click();}

 await expect(page.locator('#sigOverlay')).toBeVisible();await expect.poll(()=>page.locator('#overlayImg').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);

 const expected=await page.locator('#overlayImg').evaluate(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);const rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data,rgb=[];for(let n=0;n<rgba.length;n+=4)rgb.push(rgba[n],rgba[n+1],rgba[n+2]);const o=document.querySelector('#sigOverlay'),p=document.querySelector('#pdfRenderCanvas'),scale=p.width/600;return{width:c.width,height:c.height,rgb,alpha:Array.from(rgba).filter((_,n)=>n%4===3),x:parseFloat(o.style.left)/scale,y:800-(parseFloat(o.style.top)+parseFloat(o.style.height))/scale,w:parseFloat(o.style.width)/scale,h:parseFloat(o.style.height)/scale};});

 await page.locator('#downloadPdfBtn').click();await expect(page.locator('#finalDownloadBtn')).toBeEnabled();const download=page.waitForEvent('download');await page.locator('#finalDownloadBtn').click();const file=await download,output=info.outputPath(`${locale}-${mode}.pdf`);await file.saveAs(output);const bytes=new Uint8Array(fs.readFileSync(output)),pdf=await PDFDocument.load(bytes),p=pdf.getPage(0);expect(pdf.getPageCount()).toBe(1);expect((await parse(bytes)).text).toContain('SYNTHETIC ORIGINAL CONTENT');const objects=p.node.Resources().lookup(PDFName.of('XObject'));const images=objects.entries().map(([k,v])=>pdf.context.lookup(v)).filter(x=>x.dict.get(PDFName.of('Subtype')).toString()==='/Image');expect(images).toHaveLength(1);const im=images[0];expect(im.dict.lookup(PDFName.of('Width')).asNumber()).toBe(expected.width);expect(im.dict.lookup(PDFName.of('Height')).asNumber()).toBe(expected.height);expect(hash(decodePDFRawStream(im).decode())).toBe(hash(Buffer.from(expected.rgb)));const mask=im.dict.get(PDFName.of('SMask'));if(mask)expect(hash(decodePDFRawStream(pdf.context.lookup(mask)).decode())).toBe(hash(Buffer.from(expected.alpha)));else expect(expected.alpha.every(a=>a===255)).toBe(true);

 const contents=p.node.Contents();let operators='';for(let n=0;n<contents.size();n++)operators+=Buffer.from(decodePDFRawStream(pdf.context.lookup(contents.get(n))).decode()).toString();const matrices=[...operators.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) cm/g)].map(m=>m.slice(1).map(Number));expect(matrices.some(m=>Math.abs(m[4]-expected.x)<.02&&Math.abs(m[5]-expected.y)<.02)).toBe(true);expect(matrices.some(m=>Math.abs(m[0]-expected.w)<.02&&Math.abs(m[3]-expected.h)<.02)).toBe(true);

 await page.locator('[data-placement="all"]').click();await expect(page.locator('#finalDownloadBtn')).toBeHidden();await expect(page.locator('#finalDownloadBtn')).toBeDisabled();await page.locator('#downloadPdfBtn').click();await expect(page.locator('#finalDownloadBtn')).toBeEnabled();await page.locator('#addDateCheckbox').check();await expect(page.locator('#finalDownloadBtn')).toBeHidden();expect(await page.evaluate(()=>localStorage.getItem('afrotools_signature'))).toBeNull();
 if(mode==='type'){
  await page.locator('.resize-handle').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));const handle=await page.locator('.resize-handle').boundingBox();expect(await page.evaluate(r=>document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML,handle)).toContain('resize-handle');await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2+80,handle.y+handle.height/2+60,{steps:8});await page.mouse.up();
  await expect.poll(()=>page.locator('#sigOverlay').evaluate(e=>parseFloat(e.style.width))).toBeGreaterThan(200);
  await page.locator('#sigOverlay').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));const overlay=await page.locator('#sigOverlay').boundingBox();await page.mouse.move(overlay.x+20,overlay.y+20);await page.mouse.down();await page.mouse.move(overlay.x+20,overlay.y+300,{steps:8});await page.mouse.up();
  await expect.poll(()=>page.locator('#sigOverlay').evaluate(e=>parseFloat(e.style.top))).toBeGreaterThan(350);
 }
 await page.locator('#downloadPdfBtn').click();await expect(page.locator('#finalDownloadBtn')).toBeEnabled();const datedPending=page.waitForEvent('download');await page.locator('#finalDownloadBtn').click();const datedFile=await datedPending;const datedOutput=info.outputPath(`${locale}-${mode}-dated.pdf`);await datedFile.saveAs(datedOutput);const datedText=(await parse(new Uint8Array(fs.readFileSync(datedOutput)))).text;expect(datedText).toContain('SYNTHETIC ORIGINAL CONTENT');expect(datedText).toContain(await page.evaluate(()=>new Date().toLocaleDateString()));
 const datedBytes=new Uint8Array(fs.readFileSync(datedOutput)),datedPdf=await PDFDocument.load(datedBytes),datedPage=datedPdf.getPage(0);let datedOperators='';const streams=datedPage.node.Contents();for(let i=0;i<streams.size();i++)datedOperators+=Buffer.from(decodePDFRawStream(datedPdf.context.lookup(streams.get(i))).decode()).toString();const cm=[...datedOperators.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) cm/g)].map(m=>m.slice(1).map(Number));const translation=cm.find(m=>m[0]===1&&m[3]===1&&(m[4]!==0||m[5]!==0)),size=cm.find(m=>m[0]>1&&m[3]>1);expect(translation[4]).toBeGreaterThanOrEqual(0);expect(translation[5]).toBeGreaterThanOrEqual(16);expect(translation[4]+size[0]).toBeLessThanOrEqual(600.01);expect(translation[5]+size[3]).toBeLessThanOrEqual(800.01);let dateItems=[];await parse(datedBytes,{pagerender:async p=>{const c=await p.getTextContent();dateItems=c.items.filter(i=>i.str!== 'SYNTHETIC ORIGINAL CONTENT');return '';}});expect(dateItems).toHaveLength(1);expect(dateItems[0].transform[5]).toBeGreaterThanOrEqual(0);expect(dateItems[0].transform[5]+dateItems[0].height).toBeLessThan(translation[5]);



 if(mode==='type'){

  await page.evaluate(()=>{const original=PDFLib.PDFDocument.load;PDFLib.PDFDocument.load=async function(...args){await new Promise(resolve=>window.__releaseSigningLoad=resolve);return original.apply(this,args);};});

  await page.locator('#downloadPdfBtn').click();await expect.poll(()=>page.evaluate(()=>typeof window.__releaseSigningLoad)).toBe('function');

  await page.locator('#addDateCheckbox').uncheck();await page.evaluate(()=>window.__releaseSigningLoad());

  const message={en:'The document or signature changed.',fr:'Le document ou la signature a changé.',sw:'Hati au sahihi imebadilika.'};

  await expect(page.locator('#resultText')).toContainText(message[locale]);await expect(page.locator('#finalDownloadBtn')).toBeHidden();await expect(page.locator('#finalDownloadBtn')).toBeDisabled();

 }



});
