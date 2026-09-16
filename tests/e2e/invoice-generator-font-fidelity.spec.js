const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const parse=require('pdf-parse');
const routes={en:'/tools/invoice-generator/',fr:'/fr/tools/generateur-factures/',sw:'/sw/zana/kizalishaji-ankara/'};
async function prepare(page,route){
 await page.goto(route);await page.locator('#companyName').fill('Adéjọkẹ́ Ọlá');await page.locator('#clientName').fill('Kɔfi Ŋku');await page.locator('.li-desc').fill('Étude à Dakar — Ŋɔ');await page.locator('.li-price').fill('10');await page.locator('#invoiceReviewConfirm').check();
 await page.evaluate(()=>{window.__pdfMessages=[];window.AfroTools=window.AfroTools||{};window.AfroTools.toast={success:m=>window.__pdfMessages.push(m),error:m=>window.__pdfMessages.push(m)};});
}
async function download(page){const pending=page.waitForEvent('download');await page.locator('#btnPDF').click();return fs.readFileSync(await(await pending).path());}
for(const [locale,route]of Object.entries(routes))test(`${locale} invoice PDF preserves extended Latin user text`,async({page},info)=>{
 const fontRequests=[];page.on('request',r=>{if(r.url().includes('/assets/fonts/noto-sans/'))fontRequests.push({url:new URL(r.url()).pathname,search:new URL(r.url()).search,method:r.method(),body:r.postData()});});
 await prepare(page,route);const bytes=await download(page),text=(await parse(bytes)).text.normalize('NFC');
 for(const value of ['Adéjọkẹ́ Ọlá','Kɔfi Ŋku','Étude à Dakar — Ŋɔ'])expect(text).toContain(value.normalize('NFC'));
 expect(text).not.toContain('\u0000');expect(fontRequests).toHaveLength(2);for(const r of fontRequests){expect(r.method).toBe('GET');expect(r.search).toBe('');expect(r.body).toBeNull();}
 await page.addScriptTag({url:'/assets/vendor/pdfjs/pdf.min.js'});
 const png=await page.evaluate(async data=>{pdfjsLib.GlobalWorkerOptions.workerSrc='/assets/vendor/pdfjs/pdf.worker.min.js';const doc=await pdfjsLib.getDocument({data:Uint8Array.from(atob(data),c=>c.charCodeAt(0))}).promise;const p=await doc.getPage(1),viewport=p.getViewport({scale:1.5}),c=document.createElement('canvas');c.width=viewport.width;c.height=viewport.height;await p.render({canvasContext:c.getContext('2d'),viewport}).promise;return c.toDataURL().split(',')[1];},bytes.toString('base64'));
 fs.writeFileSync(info.outputPath('extended-latin.png'),Buffer.from(png,'base64'));
});
test('invoice PDF font failures and unsupported glyphs fail clearly and retry safely',async({page})=>{
 let downloads=0;page.on('download',()=>downloads++);await page.route('**/assets/fonts/noto-sans/*.ttf',r=>r.fulfill({status:503,body:''}));await prepare(page,routes.en);await page.locator('#btnPDF').click();
 await expect.poll(()=>page.evaluate(()=>window.__pdfMessages.at(-1))).toContain('could not be created');expect(downloads).toBe(0);await expect(page.locator('#btnPDF')).toBeEnabled();
 await page.unroute('**/assets/fonts/noto-sans/*.ttf');await download(page);expect(downloads).toBe(1);
 await page.locator('#companyName').fill('Synthetic 😀');await page.locator('#invoiceReviewConfirm').check();await page.locator('#btnPDF').click();await expect.poll(()=>page.evaluate(()=>window.__pdfMessages.at(-1))).toContain('does not support');expect(downloads).toBe(1);await expect(page.locator('#btnPDF')).toBeEnabled();
 const button=page.locator('#btnExportJson');for(const detail of await button.locator('xpath=ancestor::details').all())if(await detail.getAttribute('open')===null)await detail.locator('summary').first().click();
 const pending=page.waitForEvent('download');await button.click();const json=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));expect(json.cn).toBe('Synthetic 😀');
});
test('editing during font load blocks stale PDF until reviewed again',async({page})=>{
 let release;const gate=new Promise(resolve=>release=resolve);let requested=0;await page.route('**/assets/fonts/noto-sans/*.ttf',async r=>{requested++;await gate;await r.continue();});let downloads=0;page.on('download',()=>downloads++);
 await prepare(page,routes.en);await page.locator('#btnPDF').click();await expect.poll(()=>requested).toBe(2);await page.locator('#companyName').fill('Updated synthetic company');release();
 await expect.poll(()=>page.evaluate(()=>window.__pdfMessages.at(-1))).toContain('changed while');expect(downloads).toBe(0);await expect(page.locator('#btnPDF')).toBeEnabled();await page.locator('#invoiceReviewConfirm').check();const text=(await parse(await download(page))).text;expect(text).toContain('Updated synthetic company');
});
