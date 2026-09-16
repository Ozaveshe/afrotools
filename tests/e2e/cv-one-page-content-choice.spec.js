const {test,expect}=require('@playwright/test'),fs=require('fs');
const fixture=require('../fixtures/cv-complete-form');
const {inspectRasterPdf}=require('../support/cv-raster-pdf-bounds');
test.use({trace:'off',screenshot:'off',video:'off'});
for(const[lang,route,native]of [['en','/tools/cv-builder/','For this export'],['fr','/fr/tools/generateur-cv/','Pour cet export'],['sw','/sw/zana/mjenzi-cv/','Kwa uhamishaji huu']])test('one-page export keeps readable name and asks separately before hiding: '+lang,async({page,baseURL},info)=>{
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));await page.setViewportSize({width:320,height:844});await page.goto(route);await page.waitForFunction(()=>window.CVExportPdfQuality);await page.waitForTimeout(1100);
 await page.evaluate(async f=>{Object.assign(CVApp.getState().data,f);CVApp.getState().template='pan-african-minimal';CVApp.renderAll();CVExportUpgrade.setOptions({density:'one-page',hideOptionalForOnePage:true});await loadPdfLibs();const original=html2canvas;window.captureEvidence=[];window.html2canvas=async function(node,opts){captureEvidence.push({nameSize:parseFloat(getComputedStyle(node.querySelector('h1')).fontSize),hidden:[...node.querySelectorAll('.cv-export-hide-optional')].map(s=>s.dataset.cvSection),text:node.innerText});return original(node,opts);};},fixture);
 const before=await page.evaluate(()=>JSON.stringify(CVApp.getState().data));
 for(const hide of [true,false]){
 const dialogue=page.waitForEvent('dialog');const download=page.waitForEvent('download');const exporting=page.evaluate(()=>CVExportUpgrade.exportPdf());const dialog=await dialogue;expect(dialog.message()).toContain(native);await(hide?dialog.accept():dialog.dismiss());await exporting;const file=info.outputPath(lang+'-'+hide+'.pdf');await(await download).saveAs(file);expect((await inspectRasterPdf(fs.readFileSync(file))).every(b=>b.insidePaper)).toBe(true);
 }
 const captures=await page.evaluate(()=>captureEvidence);expect(captures.length).toBe(2);for(const c of captures)expect(c.nameSize).toBeGreaterThanOrEqual(20);expect(captures[0].hidden).toContain('references');expect(captures[0].hidden).toContain('custom');expect(captures[1].hidden).toEqual([]);expect(captures[1].text).toContain('QZCustomContentX');expect(captures[1].text).toContain('QZRelationshipX');expect(await page.evaluate(()=>JSON.stringify(CVApp.getState().data))).toBe(before);
});
