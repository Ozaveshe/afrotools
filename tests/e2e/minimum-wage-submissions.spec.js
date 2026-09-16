const {test,expect}=require('@playwright/test');
for(const [lang,route] of [['en','/tools/minimum-wage/'],['fr','/fr/tools/salaire-minimum/'],['sw','/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/']])test(`Native submissions ${lang}: no automatic sends and truthful failures`,async({page})=>{
 const requests=[];let mode='error';
 await page.route('**/.netlify/functions/minimum-wage-alerts',async route=>{requests.push(route.request().postDataJSON());if(mode==='network')return route.abort();await route.fulfill({status:mode==='success'?200:500,contentType:'application/json',body:JSON.stringify({ok:mode==='success',error:'Synthetic server rejection'})});});
 await page.goto(route);
 await page.locator(lang==='fr'?'#referenceCountry':'#country').selectOption('ZA');
 if(lang==='fr')await page.getByText('Notifications et signalement de salaire',{exact:true}).click();
 expect(requests).toHaveLength(0);
 const email='synthetic-only@example.invalid';await page.locator('#alert-email').fill(email);
 expect(requests).toHaveLength(0);
 await page.locator('[onclick="subscribeAlert()"]').click();
 await expect(page.locator('#alert-result')).toContainText(lang==='en'?'not confirmed':lang==='fr'?'non confirmé':'haujathibitishwa');
 await expect(page.locator('#alert-email')).toHaveValue(email);
 expect(requests[0]).toEqual({country_code:'ZA',email});
 mode='success';await page.locator('[onclick="subscribeAlert()"]').click();
 await expect(page.locator('#alert-email')).toHaveValue('');
 await expect(page.locator('#alert-result')).toContainText(lang==='en'?'recorded':lang==='fr'?'enregistrée':'limehifadhiwa');
 if(lang!=='fr')await page.locator('#violation-toggle-btn').click();
 await page.locator('#vf-country').selectOption('ZA');await page.locator('#vf-sector').fill('Synthetic sector');await page.locator('#vf-salary').fill('1234');await page.locator('#vf-city').fill('Synthetic City');
 for(const failure of ['error','network']){
 mode=failure;await page.locator('[onclick="submitViolation()"]').click();
 await expect(page.locator('#vf-result')).toContainText(lang==='en'?'not confirmed':lang==='fr'?'non confirmé':'haijathibitishwa');
 await expect(page.locator('#vf-salary')).toHaveValue('1234');
 await expect(page.locator('#vf-result')).not.toContainText('+50');
 }
 expect(requests.at(-1)).toEqual({type:'violation',country_code:'ZA',sector:'Synthetic sector',salary:'1234',city:'Synthetic City'});
 mode='success';await page.locator('[onclick="submitViolation()"]').click();await expect(page.locator('#vf-salary')).toHaveValue('');
 for(const width of [320,390]){await page.setViewportSize({width,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
