const {test,expect}=require('@playwright/test'),fs=require('node:fs'),{PNG}=require('pngjs'),JSZip=require('jszip');
const {PDFDocument,rgb}=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
test.setTimeout(90000);
const routes={en:'/tools/pdf-image-convert/',fr:'/fr/tools/pdf-en-image/',sw:'/sw/zana/kubadilisha-pdf-na-picha/'};
function png(width,height,color){const p=new PNG({width,height});for(let i=0;i<p.data.length;i+=4){p.data[i]=color[0];p.data[i+1]=color[1];p.data[i+2]=color[2];p.data[i+3]=255;}return PNG.sync.write(p);}
const red=png(120,80,[255,0,0]),blue=png(80,160,[0,0,255]),green=png(30,20,[0,255,0]);let pdf;
test.beforeAll(async()=>{const doc=await PDFDocument.create(),image=await doc.embedPng(green);for(const [w,h,color]of [[200,100,rgb(1,0,0)],[100,200,rgb(0,0,1)]]){const page=doc.addPage([w,h]);page.drawRectangle({x:0,y:0,width:w,height:h,color});page.drawImage(image,{x:5,y:5,width:30,height:20});}pdf=Buffer.from(await doc.save());});
async function download(page,selector){const pending=page.waitForEvent('download',{timeout:10000});await page.locator(selector).click();const d=await pending;return{bytes:fs.readFileSync(await d.path()),name:d.suggestedFilename()};}
async function inspectImage(page,bytes){return page.evaluate(async data=>{const url=URL.createObjectURL(new Blob([new Uint8Array(data)])),img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixel=Array.from(ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data);URL.revokeObjectURL(url);return{width:c.width,height:c.height,pixel,png:c.toDataURL('image/png').split(',')[1]};},[...bytes]);}
async function inspectPdf(page,bytes){return page.evaluate(async data=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(data)}).promise,pages=[];for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),v=p.getViewport({scale:1}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);const ctx=c.getContext('2d');await p.render({canvasContext:ctx,viewport:v}).promise;pages.push({width:v.width,height:v.height,center:Array.from(ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data),edge:Array.from(ctx.getImageData(5,Math.floor(c.height/2),1,1).data),text:(await p.getTextContent()).items.map(x=>x.str).join(' '),png:c.toDataURL('image/png').split(',')[1]});}await doc.destroy();return pages;},[...bytes]);}
async function uploadImages(page){await page.locator('#modeImgToPdf').click();await page.locator('#imgFileInput').setInputFiles([{name:'red-private-95173.png',mimeType:'image/png',buffer:red},{name:'blue-private-95173.png',mimeType:'image/png',buffer:blue}]);await expect(page.locator('.file-item')).toHaveCount(2);}
for(const [locale,route]of Object.entries(routes))test(`${locale} actual conversion formats page selection order and dimensions`,async({page},info)=>{
 const requests=[];page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));await page.setViewportSize({width:390,height:844});await page.goto(route);await expect(page.locator('email-gate-modal')).toHaveCount(0);
 await page.locator('#pdfFileInput').setInputFiles({name:'source-private-95173.pdf',mimeType:'application/pdf',buffer:pdf});await expect(page.locator('#p2iConvertBtn')).toBeEnabled();await page.locator('#p2iPages').fill('2,1');await page.locator('#p2iScale').selectOption('2');
 for(const format of ['png','jpeg','webp']){await page.locator('#p2iFormat').selectOption(format);await page.locator('#p2iConvertBtn').click();await expect(page.locator('.thumb-card')).toHaveCount(2);const one=await download(page,'.thumb-card:nth-child(1) button'),image=await inspectImage(page,one.bytes);expect(image.width).toBe(200);expect(image.height).toBe(400);expect(image.pixel[2]).toBeGreaterThan(240);expect(image.pixel[0]).toBeLessThan(15);if(format==='png')fs.writeFileSync(info.outputPath('pdf-page-2.png'),Buffer.from(image.png,'base64'));}
 const zipped=await download(page,'#p2iZipBtn'),zip=await JSZip.loadAsync(zipped.bytes),members=Object.keys(zip.files);expect(members).toHaveLength(2);expect(members[0]).toContain('_page_2');expect(members[1]).toContain('_page_1');expect((await inspectImage(page,await zip.file(members[1]).async('nodebuffer'))).pixel[0]).toBeGreaterThan(240);
 await page.locator('#p2iMode').selectOption('extract');await page.locator('#p2iPages').fill('1');await page.locator('#p2iFormat').selectOption('png');await page.locator('#p2iConvertBtn').click();await expect(page.locator('.thumb-card')).toHaveCount(1);const extracted=await inspectImage(page,(await download(page,'.thumb-card button')).bytes);expect(extracted.width).toBe(30);expect(extracted.height).toBe(20);expect(extracted.pixel.slice(0,3)).toEqual([0,255,0]);
 await uploadImages(page);await page.locator('.file-item:nth-child(2) .mini-btn').first().click();await page.locator('#i2pPageSize').selectOption('fit');await page.locator('#i2pMargin').fill('0');await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();let pages=await inspectPdf(page,(await download(page,'#i2pDownloadBtn')).bytes);expect(pages.map(p=>[p.width,p.height])).toEqual([[60,120],[90,60]]);expect(pages[0].center.slice(0,3)).toEqual([0,0,255]);expect(pages[1].center.slice(0,3)).toEqual([255,0,0]);expect(pages.map(p=>p.text)).toEqual(['','']);fs.writeFileSync(info.outputPath('images-pdf-first.png'),Buffer.from(pages[0].png,'base64'));
 expect(requests.join('\n')).not.toContain('private-95173');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('converter-'+locale+'-390.png')});
});
for(const [locale,route]of Object.entries(routes))test(`${locale} ordering and settings invalidate prior converted output`,async({page})=>{await page.goto(route);await uploadImages(page);await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();await page.locator('.file-item:nth-child(2) .mini-btn').first().click();await expect(page.locator('#i2pDownloadBtn')).toBeHidden();await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();await page.locator('#i2pOrientation').selectOption('landscape');await expect(page.locator('#i2pDownloadBtn')).toBeHidden();});
test('cover mode preserves chosen margins',async({page})=>{await page.goto(routes.en);await uploadImages(page);await page.locator('.file-item:nth-child(2) .file-item-remove').click();await page.locator('#i2pPageSize').selectOption('a4');await page.locator('#i2pOrientation').selectOption('portrait');await page.locator('#i2pFit').selectOption('cover');await page.locator('#i2pMargin').fill('10');await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();const pages=await inspectPdf(page,(await download(page,'#i2pDownloadBtn')).bytes);expect(pages[0].center.slice(0,3)).toEqual([255,0,0]);expect(pages[0].edge.slice(0,3)).toEqual([255,255,255]);});

for (const [locale, route] of Object.entries(routes)) test(`${locale} native invalid feedback clears stale output`, async ({page}, info) => {
 await page.goto(route);
 await page.locator('#pdfFileInput').setInputFiles({name:'private-95173.pdf',mimeType:'application/pdf',buffer:pdf});
 await expect(page.locator('#p2iConvertBtn')).toBeEnabled();
 await page.locator('#p2iConvertBtn').click();
 await expect(page.locator('.thumb-card')).toHaveCount(2);
 await page.locator('#p2iPages').fill('999');
 await expect(page.locator('#p2iResultCard')).toBeHidden();
 await page.locator('#p2iConvertBtn').click();
 await expect(page.locator('#p2iStatus')).toContainText({en:'Enter valid pages',fr:'Saisissez des pages',sw:'Weka kurasa'}[locale]);
 await page.locator('#pdfFileInput').setInputFiles({name:'invalid-private-95173.pdf',mimeType:'application/pdf',buffer:Buffer.from('private-95173 not a pdf')});
 await expect(page.locator('#p2iStatus')).toContainText({en:'Could not read this PDF',fr:'Impossible de lire ce PDF',sw:'PDF hii haisomeki'}[locale]);
 await expect(page.locator('#p2iConvertBtn')).toBeDisabled();
 await expect(page.locator('#p2iStatus')).not.toContainText('private-95173');
 await expect(page.locator('#p2iResultCard')).toBeHidden();
 await page.locator('#modeImgToPdf').click();
 await page.locator('#imgFileInput').setInputFiles({name:'Revenue.png',mimeType:'image/png',buffer:red});
 await expect(page.locator('#imgFileList')).toContainText('Revenue.png');
 await page.locator('#i2pConvertBtn').click();
 await expect(page.locator('#i2pResultNote')).toContainText({en:'Source images',fr:'Images sources',sw:'Picha za chanzo'}[locale]);
 await page.locator('#i2pResultCard').scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath(`native-result-${locale}.png`)});
});

for (const [locale, route] of Object.entries(routes)) test(`${locale} keyboard controls accessibility and local export privacy`, async ({page}, info) => {
 await page.setViewportSize({width:390,height:844});
 const requests=[];page.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(route);
 await page.locator('#modeImgToPdf').focus();await page.keyboard.press('Enter');
 await page.locator('#imgFileInput').setInputFiles({name:'private-95173.png',mimeType:'image/png',buffer:red});
 await expect(page.locator('.file-item')).toHaveCount(1);
 await page.locator('#i2pConvertBtn').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#i2pDownloadBtn')).toBeVisible();
 await download(page,'#i2pDownloadBtn');
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const violations=await page.evaluate(async()=> (await axe.run('#img2pdf-panel',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
 expect(violations).toEqual([]);
 expect(errors).toEqual([]);
 expect(requests.join('\n')).not.toContain('private-95173');
 expect(requests.join('\n')).not.toContain(red.toString('base64'));
 await page.locator('#i2pResultCard').scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath(`result-mobile-${locale}.png`)});
});

for (const [locale,route] of Object.entries(routes)) test(`${locale} text and vector page appearance retained in PNG`, async ({page},info)=>{
 const doc=await PDFDocument.create(),p=doc.addPage([300,200]);
 p.drawText('PUBLIC SYNTHETIC PAGE',{x:20,y:150,size:16});
 p.drawRectangle({x:30,y:30,width:70,height:60,color:rgb(0,0.7,0.2)});
 p.drawLine({start:{x:120,y:30},end:{x:250,y:130},thickness:3,color:rgb(0.8,0.1,0.1)});
 const bytes=Buffer.from(await doc.save());
 await page.goto(route);await page.locator('#pdfFileInput').setInputFiles({name:'synthetic.pdf',mimeType:'application/pdf',buffer:bytes});
 await expect(page.locator('#p2iConvertBtn')).toBeEnabled();
 await page.locator('#p2iScale').selectOption('1');await page.locator('#p2iConvertBtn').click();
 await expect(page.locator('.thumb-card')).toHaveCount(1);
 const actual=(await download(page,'.thumb-card button')).bytes;
 const reference=await inspectPdf(page,bytes);
 expect(reference[0].text).toContain('PUBLIC SYNTHETIC PAGE');
 expect(PNG.sync.read(actual).data.equals(PNG.sync.read(Buffer.from(reference[0].png,'base64')).data)).toBe(true);
 fs.writeFileSync(info.outputPath(`text-vector-${locale}.png`),actual);
});
