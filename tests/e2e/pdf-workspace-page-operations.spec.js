const root=require('node:path').resolve(__dirname,'../..');
const {test,expect}=require(root+'/node_modules/@playwright/test');
const {PDFDocument,StandardFonts}=require(root+'/assets/vendor/pdf-lib/pdf-lib.min.js');const fs=require('node:fs');test.setTimeout(90000);
async function read(page,bytes){const doc=await PDFDocument.load(bytes);const texts=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise,rows=[];for(let i=1;i<=doc.numPages;i++)rows.push((await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join(' '));await doc.destroy();return rows;},[...bytes]);expect(doc.getPageCount()).toBe(texts.length);return texts;}
async function download(page,selector){const pending=page.waitForEvent('download');await page.locator(selector).click();return fs.readFileSync(await(await pending).path());}
async function fullExport(page){await page.locator('#tbDL').click();const bytes=await download(page,'#exDownload');if(await page.locator('#mC').isVisible())await page.locator('#mC').click();return read(page,bytes);}
for(const [locale,route] of [['en','/tools/pdf-workspace/'],['fr','/fr/tools/espace-pdf/'],['sw','/sw/zana/nafasi-pdf/']])for(const width of [390,1280])for(const theme of ['light','dark'])test(`${locale} workspace page operations at ${width}px ${theme}`,async({page})=>{
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('dialog',d=>d.accept());
 await page.addInitScript(theme=>localStorage.setItem('aft_theme',theme),theme);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await page.setViewportSize({width,height:900});await page.goto(route);
 if(locale==='sw') {
  await expect(page.locator('.pdf-help > summary')).toHaveText('Unahitaji msaada kuchagua hatua ya PDF?');
  await expect(page.locator('.crumb a').nth(1)).toHaveText('Zana za PDF');
  await expect(page.locator('[data-run="tbDraw"] small')).toHaveText('Chora kwa mkono');
  await expect(page.locator('[data-related-tool][data-id="document-pdf"]')).toHaveText('Zana zote za PDF na hati');
  await expect(page.locator('[data-related-tool][data-id="document-pdf"]')).toHaveAttribute('data-name','Zana zote za PDF na hati');
 }
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);for(let i=1;i<=3;i++)pdf.addPage([420,594]).drawText('SYNTH_PAGE_'+i,{x:35,y:500,size:18,font});
 await page.locator('#fileIn').setInputFiles({name:'synthetic-three-pages.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});await expect(page.locator('#tbDL')).toBeVisible();
 if(width<=768 && !(await page.locator('#sb').getAttribute('class')).split(' ').includes('open'))await page.locator('#sbTog').click();
 await page.locator('#sb .sd-del').nth(1).click();await expect(page.locator('#sb .sd-thumb')).toHaveCount(2);
 expect(await fullExport(page)).toEqual(['SYNTH_PAGE_1','SYNTH_PAGE_3']);
 await page.locator('#cmdMoreBtn').click();
 const hitTest=()=>page.locator('[data-run="cmdUndoPages"]').evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);function ancestors(node){const rows=[];for(let p=node;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);rows.push({tag:p.tagName,id:p.id,class:p.className,zIndex:s.zIndex,position:s.position});}return rows;}return{clickable:!!top&&(top===el||el.contains(top)),target:ancestors(el),hit:ancestors(top),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};});
 // The hit test verifies real pointer reachability without forcing the click.
 try { await expect.poll(async () => (await hitTest()).clickable).toBe(true); }
 catch(error) { await test.info().attach('menu-hit-target', {body:JSON.stringify(await hitTest()),contentType:'application/json'}); throw error; }
 await page.locator('[data-run="cmdUndoPages"]').click();await expect(page.locator('#sb .sd-thumb')).toHaveCount(3);
 expect(await fullExport(page)).toEqual(['SYNTH_PAGE_1','SYNTH_PAGE_2','SYNTH_PAGE_3']);
 if(width<=768 && !(await page.locator('#sb').getAttribute('class')).split(' ').includes('open'))await page.locator('#sbTog').click();
 await page.locator('#sb .sd-thumb').nth(1).click();const bytes=await download(page,'[data-page-op="extract"]');expect(await read(page,bytes)).toEqual(['SYNTH_PAGE_2']);
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
