const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
for(const [locale,route]of Object.entries({en:'/tools/invoice-generator/',fr:'/fr/tools/generateur-factures/',sw:'/sw/zana/kizalishaji-ankara/'}))test(`${locale} long invoice PDF keeps every item and section inside readable pages`,async({page},testInfo)=>{
 await page.goto(route);
 await page.locator('#companyName').fill('Élodie Diop');
 await page.locator('#clientName').fill('François Bâ');
 const state=await page.evaluate(()=>window.AfroInvoiceState.gatherState());
 state.cu='USD';state.tt='none';state.dp='0';state.wh='0';state.ap='0';state.tr='0';
 state.items=Array.from({length:14},(_,i)=>({d:`ITEM_${i+1}_START `+'Synthetic description for a detailed project delivery. '.repeat(28)+`ITEM_${i+1}_END`,q:'2',p:'10',t:'0'}));
 state.bd=Array.from({length:55},(_,i)=>`PAYMENT_${i+1} Synthetic payment instruction.`).join('\n');
 state.nt=Array.from({length:35},(_,i)=>`NOTE_${i+1} Synthetic invoice note.`).join('\n');
 await page.locator('#importJsonInput').setInputFiles({name:'synthetic-long-invoice.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
 await expect(page.locator('.line-item')).toHaveCount(14);
 await page.locator('#invoiceReviewConfirm').check();
 const pending=page.waitForEvent('download');await page.locator('#btnPDF').click();
 const bytes=fs.readFileSync(await(await pending).path());
 const parsed=await pdfParse(bytes);
 expect(parsed.numpages).toBeGreaterThan(3);
 expect(parsed.text).toContain('Élodie Diop');expect(parsed.text).toContain('François Bâ');
 for(let i=1;i<=14;i++){expect(parsed.text).toContain(`ITEM_${i}_START`);expect(parsed.text).toContain(`ITEM_${i}_END`);}
 for(let i=1;i<=55;i++)expect(parsed.text).toContain(`PAYMENT_${i} `);
 for(let i=1;i<=35;i++)expect(parsed.text).toContain(`NOTE_${i} `);
 expect(parsed.text).toContain('USD 280.00');
 expect(parsed.text.match(/USD 20\.00/g)).toHaveLength(14);
 await page.addScriptTag({url:'/assets/vendor/pdfjs/pdf.min.js'});
 const pages=await page.evaluate(async data=>{
  pdfjsLib.GlobalWorkerOptions.workerSrc='/assets/vendor/pdfjs/pdf.worker.min.js';
  const doc=await pdfjsLib.getDocument({data:Uint8Array.from(atob(data),c=>c.charCodeAt(0))}).promise,output=[];
  for(let number=1;number<=doc.numPages;number++){
   const pdfPage=await doc.getPage(number),viewport=pdfPage.getViewport({scale:1}),content=await pdfPage.getTextContent();
   const text=content.items.filter(i=>i.str.trim()).map(i=>({text:i.str,x:i.transform[4],y:i.transform[5],width:i.width,height:i.height}));
   const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
   await pdfPage.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
   output.push({number,width:viewport.width,height:viewport.height,text,png:canvas.toDataURL('image/png').split(',')[1]});
  }
  return output;
 },bytes.toString('base64'));
 for(const sheet of pages){
  fs.writeFileSync(testInfo.outputPath(`page-${sheet.number}.png`),Buffer.from(sheet.png,'base64'));
  for(const item of sheet.text){
   expect(item.y,`page ${sheet.number}: off-page baseline`).toBeGreaterThanOrEqual(20);
   expect(item.y+item.height,`page ${sheet.number}: clipped top`).toBeLessThanOrEqual(sheet.height-20);
   expect(item.x).toBeGreaterThanOrEqual(20);
   expect(item.x+item.width).toBeLessThanOrEqual(sheet.width-20);
  }
  const collisions=[];
  for(let i=0;i<sheet.text.length;i++)for(let j=i+1;j<sheet.text.length;j++){
   const a=sheet.text[i],b=sheet.text[j];
   const overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);
   const overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
   if(overlapX>1&&overlapY>1)collisions.push([i,j]);
  }
  expect(collisions,`page ${sheet.number}: overlapping text items`).toEqual([]);
 }
});
