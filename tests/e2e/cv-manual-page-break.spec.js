const {test,expect}=require('@playwright/test');
const fs=require('fs');
const fixture=require('../fixtures/cv-complete-form');
const {inspectRasterPdf}=require('../support/cv-raster-pdf-bounds');
test.use({trace:'off',screenshot:'off',video:'off'});
for(const [lang,route]of [['en','/tools/cv-builder/'],['fr','/fr/tools/generateur-cv/'],['sw','/sw/zana/mjenzi-cv/']])test('manual education break uses semantic section and actual PDF boundary: '+lang,async({page,baseURL},info)=>{
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));
 await page.setViewportSize({width:320,height:844});await page.goto(route);await page.waitForFunction(()=>window.CVExportPdfQuality);await page.waitForTimeout(1100);
 await page.evaluate(f=>{Object.assign(CVApp.getState().data,f);CVApp.getState().template='pan-african-minimal';CVApp.renderAll();CVExportUpgrade.setOptions({density:'comfortable',breakEdu:true,breakExp:false,breakProjects:false,breakRefs:false});},fixture);
 const capture=await page.evaluate(async()=>{await loadPdfLibs();const canvas=await CVExportPdfQuality.renderPreviewCanvas(CVExportUpgrade.getOptions());return {breaks:canvas.cvManualBreaks,width:canvas.width,height:canvas.height};});
 expect(capture.breaks.length).toBe(1);expect(capture.breaks[0]).toBeGreaterThan(0);
 const pending=page.waitForEvent('download');await page.evaluate(()=>CVExportUpgrade.exportPdf());const file=info.outputPath(lang+'-manual-education.pdf');await(await pending).saveAs(file);
 const bounds=await inspectRasterPdf(fs.readFileSync(file));expect(bounds.every(b=>b.insidePaper)).toBe(true);
 const firstHeightMm=(bounds[0].yMax-bounds[0].yMin)*25.4/72;
 expect(firstHeightMm).toBeCloseTo(capture.breaks[0]*198/capture.width,1);
 expect(await page.locator('#cvpreview [data-cv-section="education"]').count()).toBe(1);
});
