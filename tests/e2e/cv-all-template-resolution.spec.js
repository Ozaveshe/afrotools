const {test,expect}=require('@playwright/test');
// Full-field gallery DOM is large; assertions carry the evidence without repeated trace snapshots.
test.use({trace:'off',screenshot:'off',video:'off'});
const fixture=require('../fixtures/cv-complete-form.js');
const families={
 'text-first':['ats-plain','global-compact','abuja-government','francophone-standard','boardroom-executive','healthcare-clinical','remote-assistant','founder-consultant','diaspora-relocation'],
 'two-column':['cape-town-modern','cairo-bilingual','teacher-education','finance-admin','sales-retail','customer-support','trade-skills','driver-logistics','construction-hse'],
 'sidebar':['kigali-developer','morocco-french-arabic','hospitality','oil-gas-technical'],
 'impact':['ngo-impact','me-officer'], 'academic':['scholarship-academic']
};
const productionClasses={'pan-african-minimal':'cv-prod-pan-african-minimal','lagos-corporate':'cv-prod-lagos','nairobi-tech':'cv-prod-nairobi-tech','accra-graduate':'cv-prod-accra-graduate','creative-portfolio':'cv-prod-creative'};
const privateFields=['nat','gen','mar','so','lga','idNumber','dlStatus','healthStatus','milStatus','religion'];
const markerValues=JSON.stringify(fixture).match(/QZ[A-Za-z0-9]+X/g);
for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/','/sw/zana/mjenzi-cv/'])for(let group=0;group<6;group++)test('all advertised templates resolve and retain enabled form fields: '+route+' group '+group,async({page,baseURL})=>{
 const requests=[];page.on('request',r=>requests.push(r));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));
 await page.goto(route);await page.waitForFunction(()=>window.CVApp&&window.CVTemplateRegistry&&window.CVTemplateGallery);
 await page.locator('[data-cv-entry="start"]').click();
 await page.evaluate(f=>{Object.assign(CVApp.getState().data,f);CVApp.getState().country='NG';CVApp.renderAll();},fixture);
 const ids=await page.evaluate(()=>CVTemplateRegistry.all().map(r=>r.id));expect(ids).toHaveLength(30);
 for(const id of ids.slice(group*5,group*5+5)){
  await page.locator('.cv-selected-template-card').press('Enter');
  await page.locator('.cv-template-drawer-shell [data-template-use="'+id+'"]').filter({visible:true}).first().press('Enter');
  const result=await page.evaluate(id=>{const row=CVTemplateRegistry.get(id),el=document.querySelector('#cvpreview');const expected=document.createElement('div');expected.innerHTML=CVTemplateRegistry.render(id,CVApp.getState().data,'NG');return{state:CVApp.getState().template,same:CVTemplates===window.CVTemplates&&CVTemplates[id]===row.previewRenderer,body:el.textContent,gallery:expected.textContent,photo:el.querySelectorAll('img').length,photoSupport:row.photoSupport,production:!el.querySelector('.cv-expanded-template'),layout:el.querySelector('[data-layout]')?.getAttribute('data-layout')||null};},id);
  expect(result.state).toBe(id);expect(result.same).toBe(true);
  expect(result.production).toBe(['pan-african-minimal','lagos-corporate','nairobi-tech','accra-graduate','creative-portfolio'].includes(id));
  for(const marker of markerValues){if(id==='diaspora-relocation'&&privateFields.some(key=>fixture[key]===marker))continue;expect(result.body,id+' '+marker).toContain(marker);expect(result.gallery,id+' gallery '+marker).toContain(marker);}
  expect(result.photo>0,id+' photo').toBe(Boolean(result.photoSupport));
  // Exercise the visibility switches independently of the advertised layout.
  await page.evaluate(()=>{const d=CVApp.getState().data;d.showProjs=false;d.showRefs=false;d.sp=false;d.showPhoto=false;CVApp.renderPreview();});
  const hidden=await page.locator('#cvpreview').textContent();for(const marker of ['QZProjectX','QZRefX',...privateFields.map(k=>fixture[k])])expect(hidden,id+' hidden '+marker).not.toContain(marker);
  expect(await page.locator('#cvpreview img').count()).toBe(0);
  await page.evaluate(()=>{const d=CVApp.getState().data;d.showProjs=true;d.showRefs=true;d.sp=true;d.showPhoto=true;CVApp.renderPreview();});
 }
 expect(requests.every(r=>!decodeURIComponent(r.url()).includes('Élodie')&&!(r.postData()||'').includes('Élodie'))).toBe(true);
});


for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/','/sw/zana/mjenzi-cv/'])test('saved versions restore every advertised template after reload: '+route,async({page,baseURL})=>{
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));await page.goto(route);await page.waitForFunction(()=>window.CVVersionSystem&&window.CVTemplateRegistry);
 await page.evaluate(f=>{Object.assign(CVApp.getState().data,f);CVVersionSystem.saveMaster();for(const row of CVTemplateRegistry.all())CVVersionSystem.createVersion({title:'Synthetic '+row.id,template:row.id});},fixture);
 await page.reload();await page.waitForFunction(()=>window.CVVersionSystem&&window.CVTemplateRegistry);
 const result=await page.evaluate(()=>{const saved=CVVersionSystem.loadStore().versions;return CVTemplateRegistry.all().map(row=>{const version=saved.find(v=>v.template===row.id);if(!version)return{id:row.id,missing:true};CVVersionSystem.loadItem(version.id);return{id:row.id,restored:CVApp.getState().template,same:CVTemplates[row.id]===CVTemplateRegistry.get(row.id).previewRenderer,text:document.querySelector('#cvpreview').textContent};});});
 expect(result).toHaveLength(30);for(const row of result){expect(row.restored).toBe(row.id);expect(row.same).toBe(true);expect(row.text).toContain('Élodie');expect(row.text).toContain('QZEduDetailX');expect(row.text).toContain('QZProjectX');}
});

for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/','/sw/zana/mjenzi-cv/'])test('all actual template DOM families remain distinct: '+route,async({page,baseURL})=>{
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));await page.goto(route);await page.waitForFunction(()=>window.CVTemplateRegistry&&window.CVApp);
 const rows=await page.evaluate(f=>{Object.assign(CVApp.getState().data,f);return CVTemplateRegistry.all().map(row=>{CVApp.getState().template=row.id;CVApp.renderPreview();const root=document.querySelector('#cvpreview');return{id:row.id,production:root.querySelector('.cv-prod')?.className||null,layout:root.querySelector('.cv-expanded-template')?.getAttribute('data-layout')||null};});},fixture);
 for(const row of rows){if(productionClasses[row.id])expect(row.production).toContain(productionClasses[row.id]);else{const family=Object.keys(families).find(key=>families[key].includes(row.id));expect(family,row.id).toBeTruthy();expect(row.layout,row.id).toBe(family);}}
});
