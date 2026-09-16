const {test,expect}=require('@playwright/test');
for(const route of ['/tools/cv-builder/','/fr/tools/generateur-cv/','/sw/zana/mjenzi-cv/'])test('styled CV preserves supplied fields and dark-header contrast: '+route,async({page,baseURL})=>{
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.fulfill({status:204}));
 await page.goto(route);await page.waitForFunction(()=>window.CVProductionTemplates&&window.CVApp);
 const fixture={fn:'Élodie',ln:'François Łukasz',github:'https://example.test/github',web:'https://example.test/website',portfolio:'https://example.test/portfolio',altPhone:'+250 700000001',edus:[{deg:'Maîtrise',sch:'Université Exemple',d:'Étude des systèmes durables.'}],refs:[{n:'Asha Mwang’ombe',rel:'Ancienne responsable'}],projs:[{n:'Projet Énergie',d:'Maelezo ya mradi.'}],showRefs:true,showProjs:true};
 for(const template of ['lagos-corporate','nairobi-tech']){
  await page.evaluate(({fixture,template})=>{const s=window.CVApp.getState();Object.assign(s.data,fixture);s.template=template;window.CVApp.renderAll();},{fixture,template});
  const preview=page.locator('#cvpreview');
  const text=await preview.innerText();
  for(const value of [fixture.fn,fixture.ln,fixture.github,fixture.web,fixture.portfolio,fixture.altPhone,fixture.edus[0].d,fixture.refs[0].rel,fixture.projs[0].d])expect(text).toContain(value);
  expect(await preview.locator('h1').evaluate(e=>getComputedStyle(e).color)).toBe('rgb(255, 255, 255)');
  if(template==='lagos-corporate')expect(await preview.locator('header > div').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(219, 234, 254)');
 }
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}))).toEqual({width,scroll:width});}
 const control=page.locator('.cv-toolbar select').first();await control.focus();await expect(control).toBeFocused();
});
