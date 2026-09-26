const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {PDFDocument,PDFName,decodePDFRawStream}=require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const pdfParse=require('pdf-parse');
const routes={en:'/tools/pdf-sign/',fr:'/fr/tools/signer-pdf/',sw:'/sw/zana/kusaini-pdf/'};
test.use({trace:'off',screenshot:'off',video:'off',storageState:{cookies:[],origins:[]}});
for(const[locale,route]of Object.entries(routes))test(`${locale} guest signs selected or all pages and preserves original PDF`,async({page,baseURL},testInfo)=>{
 const input=await PDFDocument.create();
 for(let n=1;n<=2;n++)input.addPage(n===1?[600,800]:[800,600]).drawText('SYNTHETIC ORIGINAL PAGE '+n,{x:40,y:n===1?740:540,size:12});
 await page.setViewportSize({width:390,height:844});
 const origin=new URL(baseURL).origin,uploads=[];
 page.on('request',r=>{if(r.method()==='POST')uploads.push(r.url());});
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await page.goto(route);
 if(await page.locator('#afro-cc-decline').isVisible())await page.locator('#afro-cc-decline').click();
 await page.locator('#pdfInput').setInputFiles({name:'synthetic.pdf',mimeType:'application/pdf',buffer:Buffer.from(await input.save())});
 await page.locator('[data-tab="type"]').click();
 await page.locator('#typeName').fill('SYNTHETIC SIGN');
 await page.locator('#useTypeBtn').click();
 await expect(page.locator('#sigOverlay')).toBeVisible();
 // Select second page; the signature must not be silently placed on page one.
 await page.locator('#nextPageBtn').click();
 await expect(page.locator('#currentPage')).toHaveText('2');
 for(const mode of ['current','all']){
  await page.locator(`[data-placement="${mode}"]`).click();
  await expect(page.locator(`[data-placement="${mode}"]`)).toHaveAttribute('aria-pressed','true');
  const placement=await page.evaluate(()=>{const c=document.querySelector('#pdfRenderCanvas'),o=document.querySelector('#sigOverlay');return{x:parseFloat(o.style.left)/(c.width/800),h:parseFloat(o.style.height)/(c.width/800),w:parseFloat(o.style.width)/(c.width/800),yOffset:parseFloat(o.style.top)/(c.width/800)};});
  await page.locator('#downloadPdfBtn').click();
  await expect(page.locator('#finalDownloadBtn')).toBeVisible();
  const pending=page.waitForEvent('download');
  await page.locator('#finalDownloadBtn').click();
  const file=await pending,output=testInfo.outputPath(`${locale}-${mode}-signed.pdf`);await file.saveAs(output);
  const bytes=new Uint8Array(fs.readFileSync(output));
  const saved=await PDFDocument.load(bytes);expect(saved.getPageCount()).toBe(2);expect(saved.getPage(0).getSize()).toEqual({width:600,height:800});expect(saved.getPage(1).getSize()).toEqual({width:800,height:600});
  const pages=[];await pdfParse(bytes,{pagerender:async p=>{const content=await p.getTextContent();pages.push(content.items);return content.items.map(i=>i.str).join(' ');}});
  for(let n=0;n<2;n++){
   expect(pages[n].map(i=>i.str).join(' ')).toContain('SYNTHETIC ORIGINAL PAGE '+(n+1));
   const resources=saved.getPage(n).node.Resources(),objects=resources.lookup(PDFName.of('XObject'));
   const images=objects?objects.entries().map(([key,value])=>saved.context.lookup(value)).filter(item=>item.dict.get(PDFName.of('Subtype')).toString()==='/Image'):[];
   expect(images).toHaveLength(mode==='all'||n===1?1:0);
   if(images.length){
    const contents=saved.getPage(n).node.Contents();let operators='';for(let i=0;i<contents.size();i++)operators+=Buffer.from(decodePDFRawStream(saved.context.lookup(contents.get(i))).decode()).toString();
    const matrices=[...operators.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) cm/g)].map(m=>m.slice(1).map(Number));
    const x=Math.max(0,Math.min(placement.x,(n===0?600:800)-placement.w));
    const y=Math.max(0,(n===0?800:600)-placement.yOffset-placement.h);
    expect(matrices.some(m=>Math.abs(m[4]-x)<.02&&Math.abs(m[5]-y)<.02)).toBe(true);
    expect(matrices.some(m=>Math.abs(m[0]-placement.w)<.02&&Math.abs(m[3]-placement.h)<.02)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);expect(x+placement.w).toBeLessThanOrEqual(n===0?600:800);expect(y).toBeGreaterThanOrEqual(0);
   }
  }
 }
 expect(uploads).toEqual([]);
 expect(await page.evaluate(()=>localStorage.getItem('afrotools_signature'))).toBeNull();
});
