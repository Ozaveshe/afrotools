const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pdfParse=require('pdf-parse');
const {PDFDocument}=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const routes={
 'business-plan':{en:'/tools/business-plan/app',fr:'/fr/tools/plan-affaires/app',sw:'/sw/zana/mpango-wa-biashara/'},
 'receipt-generator':{en:'/tools/receipt-generator/',fr:'/fr/tools/generateur-recu/',sw:'/sw/zana/kizalishaji-risiti/'},
 'meeting-minutes':{en:'/tools/meeting-minutes/app',fr:'/fr/tools/compte-rendu-reunion/app',sw:'/sw/zana/kumbukumbu-za-mkutano/'}
};
const marker='SYNTHETIC_DOCUMENT_2026';
const detail=marker+' This synthetic local business serves customers, verifies assumptions, documents responsibilities and reviews operating costs every month. Its planning assumptions are user supplied and are not official forecasts.';
async function download(page,selector){const [file]=await Promise.all([page.waitForEvent('download'),page.locator(selector).first().click()]);return fs.readFileSync(await file.path());}
async function pdfText(page,bytes){const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(0);try{const parsed=await pdfParse(bytes);if(parsed.text.includes(marker))return parsed.text;}catch{}return page.evaluate(async values=>{if(!window.pdfjsLib){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/assets/vendor/pdfjs/pdf.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}window.pdfjsLib.GlobalWorkerOptions.workerSrc='/assets/vendor/pdfjs/pdf.worker.min.js';const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(values)}).promise;let text='';for(let i=1;i<=pdf.numPages;i++){text+=(await(await pdf.getPage(i)).getTextContent()).items.map(x=>x.str||'').join(' ')+'\n';}return text;},Array.from(bytes));}
for(const locale of ['en','fr','sw'])for(const app of Object.keys(routes))test(`${locale}: ${app} exports preserve real content and backup roundtrip`,async({page})=>{
 const leaks=[];page.on('request',r=>{const text=r.url()+(r.postData()||'');if([marker,encodeURIComponent(marker),Buffer.from(marker).toString('base64')].some(v=>text.includes(v)))leaks.push(r.method());});
 await page.setViewportSize({width:390,height:844});await page.goto(routes[app][locale]);
 let buttons,review,field,importInput;
 if(app==='business-plan'){
  await page.locator('[data-section-field]').first().waitFor();
  await page.locator('[data-section-field]').evaluateAll((fields,value)=>fields.forEach(f=>{f.value=value;f.dispatchEvent(new Event('input',{bubbles:true}));}),detail);
  await page.locator('[data-section-index="6"]').click();
  for(const [key,value]of Object.entries({revenue:1000,cogs:300,opex:100,salaries:200,marketing:50,capex:80}))await page.locator(`[data-fin-row="${key}"]`).first().fill(String(value));
  await expect(page.locator('#metricProfit')).toContainText('350');
  await expect(page.locator('[data-fin-calc="grossProfit"]').first()).toContainText('700');
  await expect(page.locator('[data-fin-calc="netCash"]').first()).toContainText('270');
  review='#bpExportReview';buttons={pdf:'#pdfBtn',doc:'#docBtn',txt:'#txtBtn',csv:'#csvBtn',json:'#jsonBtn'};field='[data-section-field="company.name"]';importInput='#importJson';
 }else if(app==='receipt-generator'){
  await page.locator('#businessName').fill(marker);await page.locator('#customerName').fill('Synthetic Customer');await page.locator('#receiptNumber').fill('TEST-001');await page.locator('#receiptDate').fill('2026-09-16');
  for(const [key,value]of Object.entries({desc:'Synthetic service',qty:2,rate:125,discount:10}))await page.locator(`[data-item-field="${key}"]`).first().fill(String(value));
  await page.locator('#paymentReference').fill('SYNTHETIC-REF');expect(await page.locator('#discountType option').evaluateAll(options=>options.map(o=>o.value))).toEqual(['percent','amount']);await page.locator('#discountType').selectOption('amount');for(const [key,value]of Object.entries({discount:10,serviceCharge:5,shipping:15,taxRate:20}))await page.locator('#'+key).fill(String(value));
  await expect(page.locator('#metricSubtotal')).toContainText('225');
  await page.locator('#discountType').selectOption('percent');await expect(page.locator('#metricTotal')).toContainText('267.00');
  await page.locator('#discountType').selectOption('amount');await expect(page.locator('#metricTotal')).toContainText('282.00');
  review='#receiptReviewConfirm';buttons={pdf:'#downloadPdfBtn',txt:'#txtBtn',csv:'#csvBtn',json:'#jsonBtn'};field='#businessName';importInput='#importJson';
 }else{
  await page.locator('#meetingTitle').fill(marker);await page.locator('#organization').fill('Synthetic Organization');await page.locator('#meetingDate').fill('2026-09-16');await page.locator('#chair').fill('Synthetic Chair');await page.locator('#minuteTaker').fill('Synthetic Writer');
  await page.locator('#attendeeName').fill('Synthetic Participant');await page.locator('[data-action="add-attendee"]').click();await page.locator('#agendaTitle').fill('Synthetic agenda');await page.locator('#agendaDiscussion').fill(detail);await page.locator('[data-action="add-agenda"]').click();await page.locator('#actionText').fill('Prepare synthetic report');await page.locator('#actionOwner').fill('Synthetic Participant');await page.locator('#actionDue').fill('2026-10-01');await page.locator('[data-action="add-action"]').click();await page.locator('[data-action="rebuild"]').first().click();
  review='#exportReviewConfirm';buttons={pdf:'[data-action="pdf"]',doc:'[data-action="word"]',txt:'[data-action="txt"]',csv:'[data-action="csv"]',json:'[data-action="json"]'};field='#meetingTitle';importInput='#importInput';
 }
 if(app==='receipt-generator')await page.locator('h1').first().click();
 await page.locator(review).check();
 const outputs={};for(const [format,selector]of Object.entries(buttons)){const bytes=await download(page,selector);outputs[format]=format==='pdf'?await pdfText(page,bytes):bytes.toString('utf8');if(format==='pdf'&&app==='receipt-generator'){const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(0);expect(bytes.toString('latin1')).toContain('/Subtype /Image');test.info().annotations.push({type:'content-applicability',description:'Receipt PDF is raster: structural image presence only; textual semantics proven separately in preview/TXT/CSV. Render fidelity remains unverified.'});}else if(format!=='csv')expect(outputs[format],`${locale}/${app} ${format} marker`).toContain(marker);}
 if(app==='business-plan'){expect(outputs.csv).toMatch(/700/);expect(outputs.csv).toMatch(/350/);expect(outputs.csv).toMatch(/270/);}
 if(app==='receipt-generator'){expect(outputs.csv).toMatch(/282\.00/);expect(outputs.txt).toMatch(/282\.00/);await expect(page.locator('#receiptPreview')).toContainText('282.00');}
 if(app==='meeting-minutes'){expect(outputs.csv).toContain('Prepare synthetic report');expect(outputs.csv).toContain('2026-10-01');expect(outputs.pdf).toContain('Synthetic Participant');}
 const payload=JSON.parse(outputs.json);
 await page.locator(importInput).setInputFiles({name:'exported.json',mimeType:'application/json',buffer:Buffer.from(outputs.json)});
 await expect(page.locator(field)).toHaveValue(app==='business-plan'?detail:marker);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 expect(leaks).toEqual([]);
});


