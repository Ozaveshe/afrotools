const {test,expect}=require('@playwright/test');const fs=require('fs');
const routes=[['en','/tools/pdf-redact/'],['fr','/fr/tools/caviarder-pdf/'],['sw','/sw/zana/kuficha-taarifa-pdf/']];
for(const [locale,route] of routes)test(locale+' redaction burns pixels and removes underlying text for guests',async({page,baseURL},info)=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.route('**/*',r=>r.request().url().startsWith(baseURL)?r.continue():r.abort());await page.goto(route);
 const bytes=await page.evaluate(async()=>{const pdf=await PDFLib.PDFDocument.create();const font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);for(let i=0;i<2;i++){const p=pdf.addPage([612,792]);p.drawText('PUBLIC SYNTHETIC PAGE '+(i+1),{x:50,y:700,size:18,font});p.drawText('SYNTHETIC_SECRET_471',{x:50,y:650,size:18,font});}return Array.from(await pdf.save());});
 await page.locator('#fileInput').setInputFiles({name:'synthetic-redaction.pdf',mimeType:'application/pdf',buffer:Buffer.from(bytes)});
 await expect(page.locator('#pageTotal')).toContainText('2');
 await page.locator('#searchTerms').fill('SYNTHETIC_SECRET_471');
 await page.locator('#searchScope').selectOption('all');await page.locator('#findBtn').click();
 await expect(page.locator('#boxCount')).toContainText('2');await page.locator('#reviewConfirm').check();await page.locator('#exportBtn').click();await expect(page.locator('#downloadRow')).toHaveClass(/(^|\s)on(\s|$)/);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadBtn').click()]);
 const output=fs.readFileSync(await download.path());fs.writeFileSync(info.outputPath(locale+'-redacted.pdf'),output);
 const proof=await page.evaluate(async(data)=>{const pdf=await pdfjsLib.getDocument({data:new Uint8Array(data)}).promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const text=(await p.getTextContent()).items.map(x=>x.str).join(' ');const canvas=document.createElement('canvas'),vp=p.getViewport({scale:1});canvas.width=vp.width;canvas.height=vp.height;const ctx=canvas.getContext('2d');await p.render({canvasContext:ctx,viewport:vp}).promise;
 function dark(x,y,w,h){const pixels=ctx.getImageData(x,y,w,h).data;let n=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k]<40&&pixels[k+1]<40&&pixels[k+2]<40)n++;return n/(w*h);}
 pages.push({text,secretDark:dark(60,132,150,8),publicInk:dark(50,73,250,22),white:dark(400,300,50,50),image:canvas.toDataURL('image/png')});}return pages;},Array.from(output));
 expect(proof).toHaveLength(2);for(let i=0;i<proof.length;i++){expect(proof[i].text).toBe('');expect(proof[i].secretDark).toBeGreaterThan(.97);expect(proof[i].publicInk).toBeGreaterThan(.03);expect(proof[i].publicInk).toBeLessThan(.5);expect(proof[i].white).toBe(0);fs.writeFileSync(info.outputPath(locale+'-page'+(i+1)+'.png'),Buffer.from(proof[i].image.split(',')[1],'base64'));}
 expect(posts).toEqual([]);await expect(page.locator('#pdgEmail:visible')).toHaveCount(0);
 await page.locator('#undoBtn').click();await expect(page.locator('#downloadRow')).not.toHaveClass(/(^|\s)on(\s|$)/);await expect(page.locator('#downloadBtn')).toBeDisabled();await expect(page.locator('#reviewConfirm')).not.toBeChecked();
 await page.locator('#exportBtn').click();await expect(page.locator('#downloadRow')).not.toHaveClass(/(^|\s)on(\s|$)/);await expect(page.locator('#reviewConfirm')).toBeFocused();
 const reviewCopy={en:['Review required','Confirm the final review checkbox before exporting the flattened redacted PDF.'],fr:['Examen requis','Cochez la case de révision finale avant d’exporter le PDF expurgé aplati.'],sw:['Ukaguzi unahitajika','Weka tiki kuthibitisha ukaguzi wa mwisho kabla ya kuhamisha PDF. Sehemu ulizoficha zitafutwa, na kurasa zitahifadhiwa kama picha.']}[locale];
 await expect(page.locator('#resultTitle')).toHaveText(reviewCopy[0]);await expect(page.locator('#resultNote')).toHaveText(reviewCopy[1]);
 await page.locator('#clearAllBtn').click();await expect(page.locator('#exportBtn')).toBeDisabled();
 await page.setViewportSize({width:390,height:844});await page.locator('#overlayCanvas').scrollIntoViewIfNeeded();
 const box=await page.locator('#overlayCanvas').boundingBox();
 await page.mouse.move(box.x+45/612*box.width,box.y+112/792*box.height);await page.mouse.down();await page.mouse.move(box.x+300/612*box.width,box.y+158/792*box.height,{steps:8});await page.mouse.up();
 await expect(page.locator('#boxCount')).toContainText('1');await expect(page.locator('#reviewConfirm')).not.toBeChecked();await page.locator('#reviewConfirm').check();await page.locator('#exportBtn').click();await expect(page.locator('#downloadRow')).toHaveClass(/(^|\s)on(\s|$)/);
 const [manual]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadBtn').click()]);const manualBytes=fs.readFileSync(await manual.path());fs.writeFileSync(info.outputPath(locale+'-manual-redacted.pdf'),manualBytes);
 const manualProof=await page.evaluate(async bytes=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;const p=await doc.getPage(1),canvas=document.createElement('canvas'),vp=p.getViewport({scale:1});canvas.width=vp.width;canvas.height=vp.height;const ctx=canvas.getContext('2d');await p.render({canvasContext:ctx,viewport:vp}).promise;return {text:(await p.getTextContent()).items.map(x=>x.str).join(''),pixel:Array.from(ctx.getImageData(150,135,1,1).data)};},Array.from(manualBytes));expect(manualProof.text).toBe('');expect(manualProof.pixel.slice(0,3).every(x=>x<40)).toBe(true);
 await page.locator('#qualitySelect').selectOption('high');await expect(page.locator('#downloadRow')).not.toHaveClass(/(^|\s)on(\s|$)/);await expect(page.locator('#reviewConfirm')).not.toBeChecked();
 expect(posts).toEqual([]);


});
