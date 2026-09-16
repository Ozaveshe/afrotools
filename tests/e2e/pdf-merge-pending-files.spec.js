const {test,expect}=require('@playwright/test'),fs=require('node:fs');
const {PDFDocument}=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const routes={en:'/tools/pdf-merge-split/',fr:'/fr/tools/fusionner-diviser-pdf/',sw:'/sw/zana/unganisha-na-gawanya-pdf/'};
let fixtures;
test.beforeAll(async()=>{fixtures={};for(const name of ['A','B','C']){const d=await PDFDocument.create();d.addPage().drawText(name);fixtures[name]=Buffer.from(await d.save());}});
async function delay(page){await page.evaluate(()=>{const original=File.prototype.arrayBuffer,seen=new WeakSet();File.prototype.arrayBuffer=async function(){if(this.name.startsWith('delayed')&&!seen.has(this)){seen.add(this);window.readPending=true;await new Promise(resolve=>{window.releaseRead=resolve;});}return original.call(this);};});}
async function output(page){const wait=page.waitForEvent('download');await page.locator('#actionRow .act-download').click();const bytes=fs.readFileSync(await(await wait).path());return page.evaluate(async a=>{const d=await pdfjsLib.getDocument({data:new Uint8Array(a)}).promise,labels=[];for(let i=1;i<=d.numPages;i++)labels.push((await(await d.getPage(i)).getTextContent()).items.map(x=>x.str).join(''));await d.destroy();return labels;},[...bytes]);}
for(const[locale,route]of Object.entries(routes))test(`${locale} waits for all selected files before merge`,async({page})=>{
 for(const count of [2,3]){
  await page.goto(route);await delay(page);
  const names=['A','B','C'].slice(0,count);
  await page.locator('#mergeFileInput').setInputFiles(names.map((name,i)=>({name:(i===count-1?'delayed-':'')+name+'.pdf',mimeType:'application/pdf',buffer:fixtures[name]})));
  await page.waitForFunction(()=>window.readPending===true);
  for(let i=0;i<count-1;i++)await expect(page.locator('#mergeFileList input').nth(i)).toBeEnabled();
  await expect(page.locator('#mergeBtn')).toBeDisabled();
  await expect(page.locator('#mergeSummary')).toContainText({en:'Reading all selected PDFs',fr:'Lecture de tous les PDF sélectionnés',sw:'Inasoma PDF zote zilizochaguliwa'}[locale]);
  await page.evaluate(()=>window.releaseRead());
  await expect(page.locator('#mergeBtn')).toBeEnabled();await page.locator('#mergeBtn').click();await expect(page.locator('#actionRow .act-download')).toBeVisible();expect(await output(page)).toEqual(names);
 }
});
for(const[locale,route]of Object.entries(routes))test(`${locale} delayed unreadable file requires explicit removal`,async({page})=>{
 await page.goto(route);await delay(page);await page.locator('#mergeFileInput').setInputFiles([{name:'A.pdf',mimeType:'application/pdf',buffer:fixtures.A},{name:'B.pdf',mimeType:'application/pdf',buffer:fixtures.B},{name:'delayed-invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('private-unreadable')}]);
 await page.waitForFunction(()=>window.readPending===true);await expect(page.locator('#mergeFileList input').nth(1)).toBeEnabled();await expect(page.locator('#mergeBtn')).toBeDisabled();await page.evaluate(()=>window.releaseRead());
 await expect(page.locator('#mergeSummary')).toContainText({en:'Remove unreadable PDFs',fr:'Supprimez les PDF illisibles',sw:'Ondoa PDF zisizosomeka'}[locale]);await expect(page.locator('#mergeBtn')).toBeDisabled();await expect(page.locator('#mergeSummary')).not.toContainText('private-unreadable');
 await page.locator('#mergeFileList .file-item').nth(2).locator('[data-action=remove]').click();await expect(page.locator('#mergeBtn')).toBeEnabled();await page.locator('#mergeBtn').click();await expect(page.locator('#actionRow .act-download')).toBeVisible();expect(await output(page)).toEqual(['A','B']);
});
