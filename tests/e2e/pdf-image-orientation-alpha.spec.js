const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const routes={en:'/tools/pdf-image-convert/',fr:'/fr/tools/pdf-en-image/',sw:'/sw/zana/kubadilisha-pdf-na-picha/'};
function exif(bytes,orientation){const app=Buffer.from('ffe1002245786966000049492a0008000000010012010300010000000100000000000000','hex');app.writeUInt16LE(orientation,28);return Buffer.concat([bytes.subarray(0,2),app,bytes.subarray(2)]);}
async function save(page){const d=page.waitForEvent('download');await page.locator('#i2pDownloadBtn').click();return fs.readFileSync(await(await d).path());}
async function render(page,bytes){return page.evaluate(async a=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(a)}).promise,p=await doc.getPage(1),v=p.getViewport({scale:4/3}),c=document.createElement('canvas');c.width=Math.round(v.width);c.height=Math.round(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;const x=c.getContext('2d');const points=[[.25,.25],[.75,.25],[.25,.75],[.75,.75]].map(([a,b])=>Array.from(x.getImageData(Math.floor(c.width*a),Math.floor(c.height*b),1,1).data));await doc.destroy();return {width:c.width,height:c.height,points,png:c.toDataURL()};},[...bytes]);}
async function fixture(page,type){return page.evaluate(type=>{const c=document.createElement('canvas');c.width=80;c.height=40;const x=c.getContext('2d');if(type==='jpeg'){x.fillStyle='red';x.fillRect(0,0,40,40);x.fillStyle='blue';x.fillRect(40,0,40,40);x.fillStyle='yellow';x.fillRect(0,20,40,20);x.fillStyle='#00ff00';x.fillRect(40,20,40,20);}else{x.fillStyle='rgba(255,0,0,0.5)';x.fillRect(0,0,40,40);}return c.toDataURL('image/'+type,1).split(',')[1];},type);}
for(const [locale,route]of Object.entries(routes))test(`${locale} EXIF orientations and alpha image PDF appearance`,async({page},info)=>{
 await page.goto(route);await page.locator('#modeImgToPdf').click();await page.locator('#i2pPageSize').selectOption('fit');await page.locator('#i2pMargin').fill('0');
 const jpeg=Buffer.from(await fixture(page,'jpeg'),'base64');
 for(const orientation of [1,2,3,4,5,6,7,8]){
  await page.locator('#imgFileInput').setInputFiles({name:'synthetic.jpg',mimeType:'image/jpeg',buffer:exif(jpeg,orientation)});
  await expect(page.locator('.file-item')).toHaveCount(1);await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();const out=await render(page,await save(page));
  expect([out.width,out.height]).toEqual(orientation<=4?[80,40]:[40,80]);
  const colors=[[255,0,0],[0,0,255],[255,255,0],[0,255,0]],order={1:[0,1,2,3],2:[1,0,3,2],3:[3,2,1,0],4:[2,3,0,1],5:[0,2,1,3],6:[2,0,3,1],7:[3,1,2,0],8:[1,3,0,2]}[orientation];out.points.forEach((point,i)=>colors[order[i]].forEach((value,j)=>expect(Math.abs(point[j]-value)).toBeLessThan(15)));
  fs.writeFileSync(info.outputPath(`orientation-${orientation}.png`),Buffer.from(out.png.split(',')[1],'base64'));
  await page.locator('#imgFileList .file-item-remove').click();
 }
 for(const type of ['png','webp']){
  await page.locator('#imgFileInput').setInputFiles({name:'alpha.'+type,mimeType:'image/'+type,buffer:Buffer.from(await fixture(page,type),'base64')});
  await expect(page.locator('.file-item')).toHaveCount(1);await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();const bytes=await save(page),out=await render(page,bytes);
  expect(out.points[0][0]).toBeGreaterThan(250);expect(out.points[0][1]).toBeGreaterThan(120);expect(out.points[0][1]).toBeLessThan(135);expect(out.points[1]).toEqual([255,255,255,255]);
  // Inspect PDF soft mask: auto mode should retain alpha rather than silently JPEG-flatten it.
  const masks=await page.evaluate(async a=>{const doc=await PDFLib.PDFDocument.load(new Uint8Array(a));return [...doc.context.enumerateIndirectObjects()].filter(([,o])=>o.dict&&o.dict.has(PDFLib.PDFName.of('SMask'))).length;},[...bytes]);expect(masks).toBeGreaterThan(0);
  await expect(page.locator('#i2pResultNote')).toContainText({en:'transparency is retained',fr:'la transparence est conservée',sw:'uwazi huhifadhiwa'}[locale]);
  await page.locator('#modePdfToImg').click();await page.locator('#pdfFileInput').setInputFiles({name:'roundtrip.pdf',mimeType:'application/pdf',buffer:bytes});await expect(page.locator('#p2iConvertBtn')).toBeEnabled();await page.locator('#p2iMode').selectOption('pages');await page.locator('#p2iFormat').selectOption('png');await page.locator('#p2iConvertBtn').click();await expect(page.locator('.thumb-card')).toHaveCount(1);
  const pending=page.waitForEvent('download');await page.locator('.thumb-card button').click();const roundtrip=fs.readFileSync(await(await pending).path());
  const pixels=await page.evaluate(async a=>{const url=URL.createObjectURL(new Blob([new Uint8Array(a)])),img=new Image();await new Promise(r=>{img.onload=r;img.src=url;});const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);URL.revokeObjectURL(url);return [.25,.75].map(f=>Array.from(x.getImageData(Math.floor(c.width*f),Math.floor(c.height/2),1,1).data));},[...roundtrip]);
  expect(pixels[0][0]).toBeGreaterThan(250);expect(pixels[0][1]).toBeGreaterThan(120);expect(pixels[0][1]).toBeLessThan(135);expect(pixels[1]).toEqual([255,255,255,255]);
  fs.writeFileSync(info.outputPath(`alpha-${type}-roundtrip.png`),roundtrip);
  fs.writeFileSync(info.outputPath(`alpha-${type}.pdf`),bytes);
  for (const outputFormat of ['png','webp']) {
   await page.locator('#p2iMode').selectOption('extract');await page.locator('#p2iFormat').selectOption(outputFormat);await page.locator('#p2iConvertBtn').click();await expect(page.locator('.thumb-card')).toHaveCount(1);
   const extractedDownload=page.waitForEvent('download');await page.locator('.thumb-card button').click();const extracted=fs.readFileSync(await(await extractedDownload).path());
   const alpha=await page.evaluate(async a=>{const url=URL.createObjectURL(new Blob([new Uint8Array(a)])),img=new Image();await new Promise(r=>{img.onload=r;img.src=url;});const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);URL.revokeObjectURL(url);return [.25,.75].map(f=>x.getImageData(Math.floor(c.width*f),Math.floor(c.height/2),1,1).data[3]);},[...extracted]);
   expect(alpha[0]).toBeGreaterThan(120);expect(alpha[0]).toBeLessThan(135);expect(alpha[1]).toBe(0);
  }

  await page.locator('#modeImgToPdf').click();await page.locator('#i2pImageMode').selectOption('jpeg');await page.locator('#i2pConvertBtn').click();await expect(page.locator('#i2pDownloadBtn')).toBeVisible();
  const flattened=await render(page,await save(page));expect(flattened.points[1]).toEqual([255,255,255,255]);await expect(page.locator('#i2pResultNote')).toContainText({en:'flattened onto white',fr:'aplatie sur fond blanc',sw:'mandharinyuma meupe'}[locale]);
  await page.locator('#i2pImageMode').selectOption('auto');

  await page.locator('#imgFileList .file-item-remove').click();
 }
});
