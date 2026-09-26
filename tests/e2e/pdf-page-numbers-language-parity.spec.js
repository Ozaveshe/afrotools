const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { PDFDocument, degrees, rgb } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const routes = { en:'/tools/pdf-page-numbers/', fr:'/fr/tools/numerotation-pdf/', sw:'/sw/zana/namba-za-kurasa-pdf/' };
async function fixture(rotated=false, tiny=false) {
  const doc = await PDFDocument.create();
  for(let i=0;i<(tiny?1:4);i++) {
    const p=doc.addPage(tiny?[20,10]:rotated?[480,680]:[420,594]);
    if(!tiny){p.drawText('SYNTHETIC ORIGINAL '+(i+1),{x:60,y:300,size:12});p.drawRectangle({x:90,y:180,width:20,height:20,color:rgb(0,1,0)});}
    if(rotated){p.setCropBox(30,40,420,594);p.setRotation(degrees(i*90));}
  }
  return Buffer.from(await doc.save());
}
async function upload(page,buffer,name='synthetic.pdf') { await page.locator('#pdfFileInput').setInputFiles({name,mimeType:'application/pdf',buffer}); }
async function run(page,info,label) {
  await page.locator('#numberBtn').click();
  await expect(page.locator('#actionRow')).toHaveClass(/\bon\b/);
  const event=page.waitForEvent('download');await page.locator('#downloadBtn').click();const dl=await event;
  const bytes=fs.readFileSync(await dl.path());fs.writeFileSync(info.outputPath(label),bytes);return bytes;
}
async function texts(page,bytes){return page.evaluate(async a=>{const doc=await pdfjsLib.getDocument({data:new Uint8Array(a)}).promise;try{const out=[];for(let i=1;i<=doc.numPages;i++)out.push((await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join('|'));return out;}finally{await doc.destroy();}},[...bytes]);}
async function set(page,id,value){await page.locator('#'+id).fill(String(value));}
for(const [locale,route] of Object.entries(routes)) {
  test(`${locale} numbering guest output preserves subsets, native formats, custom numbering and ZIP`, async({page},info)=>{
    test.setTimeout(120000);await page.setViewportSize({width:320,height:844});await page.goto(route);
    if(await page.locator('#afro-cc-decline').isVisible())await page.locator('#afro-cc-decline').click();
    await upload(page,await fixture());await set(page,'startNumber',7);await set(page,'padLength',2);await set(page,'pageRange','2-4');await set(page,'prefixInput','N-');await set(page,'suffixInput','!');await page.locator('#subsetSelect').selectOption('odd');
    const selected=await texts(page,await run(page,info,'subset.pdf'));
    expect(selected).toHaveLength(4);for(let i=0;i<4;i++){expect(selected[i]).toContain('SYNTHETIC ORIGINAL '+(i+1));expect(selected[i].includes('N-07!')).toBe(i===2);}
    await set(page,'pageRange','');await page.locator('#subsetSelect').selectOption('all');await page.locator('#templateSelect').selectOption('page-of-total');
    let output=await texts(page,await run(page,info,'native.pdf'));
    expect(output[0]).toContain({en:'Page 07 of 4',fr:'Page 07 sur 4',sw:'Ukurasa 07 kati ya 4'}[locale]);
    await page.locator('#templateSelect').selectOption('number-of-total');output=await texts(page,await run(page,info,'total.pdf'));expect(output[3]).toContain('10 / 4');
    await page.locator('#templateSelect').selectOption('letters-upper');await set(page,'startNumber',26);await set(page,'startPage',2);await set(page,'prefixInput','Appendix ');await set(page,'suffixInput','');output=await texts(page,await run(page,info,'letters.pdf'));expect(output[0]).not.toContain('Appendix');expect(output[1]).toContain('Appendix Z');expect(output[2]).toContain('Appendix AA');
    await upload(page,await fixture(),'second-synthetic.pdf');const zip=await run(page,info,'batch.zip');expect(zip.readUInt32LE(0)).toBe(0x04034b50);expect(zip.toString('latin1')).toContain('second-synthetic_numbered.pdf');
    let offset=0,entries=0;while(zip.readUInt32LE(offset)===0x04034b50){const size=zip.readUInt32LE(offset+18),nameLength=zip.readUInt16LE(offset+26),extraLength=zip.readUInt16LE(offset+28),start=offset+30+nameLength+extraLength;const embedded=await texts(page,zip.subarray(start,start+size));expect(embedded).toHaveLength(4);expect(embedded[1]).toContain('Appendix Z');expect(embedded[3]).toContain('SYNTHETIC ORIGINAL 4');entries++;offset=start+size;}expect(entries).toBe(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test(`${locale} numbering actual raster remains inside rotated CropBoxes and requested positions`,async({page},info)=>{
    test.setTimeout(120000);await page.goto(route);await upload(page,await fixture(true));await set(page,'fontSize',72);await set(page,'prefixInput','TEST');await set(page,'colorText','#FF0000');await page.locator('#colorText').press('Tab');
    const evidence=[];
    for(const[position,angle]of [['top-left',90],['center',-45],['bottom-right',-90]]){
      await page.locator('[data-position="'+position+'"]').click();await set(page,'rotation',angle);const bytes=await run(page,info,position+'.pdf');
      const expectedPreview=await page.evaluate(async a=>{const d=await pdfjsLib.getDocument({data:new Uint8Array(a)}).promise;try{const p=await d.getPage(1),u=p.getViewport({scale:1}),v=p.getViewport({scale:Math.min(340/u.width,500/u.height,1.35)}),c=document.createElement('canvas');c.width=Math.floor(v.width);c.height=Math.floor(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v,background:'white'}).promise;return c.toDataURL();}finally{await d.destroy();}},[...bytes]);
      await expect.poll(()=>page.locator('#previewCanvas').evaluate(c=>c.toDataURL())).toBe(expectedPreview);
      const pages=await page.evaluate(async({a})=>{
        const doc=await pdfjsLib.getDocument({data:new Uint8Array(a)}).promise;const out=[];
        try{for(let i=1;i<=doc.numPages;i++) {const p=await doc.getPage(i),v=p.getViewport({scale:1}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;await p.render({canvasContext:c.getContext('2d'),viewport:v,background:'white'}).promise;
          const px=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let minX=c.width,minY=c.height,maxX=-1,maxY=-1,count=0,green=0;
          for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const n=(y*c.width+x)*4;if(px[n]>180&&px[n+1]<90&&px[n+2]<90){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}if(px[n]<70&&px[n+1]>180&&px[n+2]<70)green++;}
          out.push({width:c.width,height:c.height,minX,minY,maxX,maxY,count,green,text:(await p.getTextContent()).items.map(x=>x.str).join('|'),png:c.toDataURL().split(',')[1]});
        }return out;}finally{await doc.destroy();}
      },{a:[...bytes]});
      for(let i=0;i<pages.length;i++){const p=pages[i];fs.writeFileSync(info.outputPath(position+'-'+i+'.png'),Buffer.from(p.png,'base64'));delete p.png;expect(p.count).toBeGreaterThan(1000);expect(p.green).toBeGreaterThan(350);expect(p.minX).toBeGreaterThan(0);expect(p.minY).toBeGreaterThan(0);expect(p.maxX).toBeLessThan(p.width-1);expect(p.maxY).toBeLessThan(p.height-1);expect(p.text).toContain('SYNTHETIC ORIGINAL '+(i+1));expect(p.text).toContain('TEST'+(i+1));
        if(position==='top-left'){expect(p.minX).toBeLessThan(100);expect(p.minY).toBeLessThan(100);}
        if(position==='bottom-right'){expect(p.maxX).toBeGreaterThan(p.width-100);expect(p.maxY).toBeGreaterThan(p.height-100);}
        if(position==='center'){expect(Math.abs((p.minX+p.maxX)/2-p.width/2)).toBeLessThan(30);expect(Math.abs((p.minY+p.maxY)/2-p.height/2)).toBeLessThan(30);}
      }evidence.push({position,angle,pages});
    }fs.writeFileSync(info.outputPath('geometry.json'),JSON.stringify(evidence,null,2));
  });
  test(`${locale} numbering tiny, unsupported text, bad range and invalid PDF fail natively without output`,async({page})=>{
    await page.goto(route);await upload(page,await fixture(false,true));await set(page,'fontSize',72);await set(page,'prefixInput','TEST');await page.locator('#numberBtn').click();await expect(page.locator('#resultRows')).toContainText({en:'does not fit',fr:'ne tient pas',sw:'hazitoshei'}[locale]);await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await page.locator('#clearFilesBtn').click();await upload(page,await fixture());await set(page,'fontSize',12);await set(page,'prefixInput','測試');await page.locator('#numberBtn').click();await expect(page.locator('#resultRows')).toContainText({en:'cannot display',fr:'ne peut pas afficher',sw:'haiwezi kuonyesha'}[locale]);await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
    await set(page,'prefixInput','');await set(page,'pageRange','9');await page.locator('#numberBtn').click();await expect(page.locator('#resultRows')).toContainText({en:'Check the start',fr:'Vérifiez la page',sw:'Kagua ukurasa'}[locale]);
    await page.locator('#clearFilesBtn').click();await upload(page,Buffer.from('SYNTHETIC INVALID PDF'));await page.locator('#numberBtn').click();await expect(page.locator('#resultRows')).toContainText({en:'could not be processed',fr:'n’a pas pu être traité',sw:'haikuweza kuchakatwa'}[locale]);await expect(page.locator('#resultRows')).not.toContainText('No PDF header');await expect(page.locator('#actionRow')).not.toHaveClass(/\bon\b/);
  });
}
