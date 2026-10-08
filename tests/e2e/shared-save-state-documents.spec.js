const {test,expect}=require('@playwright/test');
test.use({trace:'off',screenshot:'off',video:'off'});
const apps=[
 {slug:'meeting-minutes',routes:{en:'/tools/meeting-minutes/app.html',fr:'/fr/tools/compte-rendu-reunion/app.html',sw:'/sw/zana/kumbukumbu-za-mkutano/'},save:'[data-action="save"]',remove:'[data-delete]',load:'[data-load]'},
 {slug:'receipt-generator',routes:{en:'/tools/receipt-generator/',fr:'/fr/tools/generateur-recu/',sw:'/sw/zana/kizalishaji-risiti/',ha:'/ha/kayan-aiki/kirkiro-resit/'},save:'#saveReceiptBtn',remove:'[data-delete-saved]',load:'[data-open-saved]'},
 {slug:'business-plan',routes:{en:'/tools/business-plan/app.html',fr:'/fr/tools/plan-affaires/app.html',sw:'/sw/zana/mpango-wa-biashara/'},save:'#savePlanBtn',remove:'[data-delete-saved]',load:'[data-open-saved]'}
];
test('receipt-generator ha: capacity never evicts an older receipt',async({page,baseURL})=>{
 const app=apps.find(app=>app.slug==='receipt-generator');
 const raw=JSON.stringify(Array.from({length:30},(_,i)=>({id:'synthetic-'+i,title:'Synthetic receipt '+i,data:{},createdAt:i+1,updatedAt:i+1})));
 const {key,errors}=await open(page,baseURL,app,'ha',raw);
 await page.locator(app.save).click();
 await expect(page.locator('#savedStorageStatus')).toContainText('An kai iyakar');
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
 await expect(page.locator(app.remove)).toHaveCount(30);expect(errors).toEqual([]);
});
test('receipt-generator ha: startup read denial keeps controls available',async({page,baseURL})=>{
 await page.addInitScript(()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='afrotools-saved-receipt-generator')throw Error('Synthetic denial');return get.call(this,key)}});
 const app=apps.find(app=>app.slug==='receipt-generator'),{errors}=await open(page,baseURL,app,'ha');
 await expect(page.locator('#savedStorageStatus')).toContainText('Ba a iya karanta');
 await expect(page.locator('#businessName')).toBeEditable();
 await expect(page.locator('#jsonBtn')).toBeEnabled();
 expect(errors).toEqual([]);
});
async function open(page,baseURL,app,locale,raw){
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('dialog',d=>d.accept());await page.setViewportSize({width:390,height:844});
 await page.addInitScript(({key,raw})=>{localStorage.setItem('afrotools_cookie_consent','declined');if(raw!==undefined&&!sessionStorage.getItem('seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('seeded','yes')}},{key:'afrotools-saved-'+app.slug,raw});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());await page.goto(app.routes[locale]);await page.locator(app.save).first().waitFor();return{key:'afrotools-saved-'+app.slug,errors};
}
async function deny(page,key){await page.evaluate(key=>{const set=Storage.prototype.setItem;window.attempts=0;Storage.prototype.setItem=function(name,value){if(name===key){window.attempts++;throw Error('Synthetic failure')}return set.call(this,name,value)};window.allowSaving=()=>{Storage.prototype.setItem=set}},key)}
for(const app of apps)for(const locale of Object.keys(app.routes)){
 test(app.slug+' '+locale+': saved document opens from its stable URL',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app,locale);await page.locator(app.save).first().click();
  const id=await page.evaluate(({key,slug})=>{const records=JSON.parse(localStorage.getItem(key));const data=records[0].data;if(slug==='meeting-minutes')data.meetingTitle='Synthetic restored document';else if(slug==='receipt-generator')data.business.name='Synthetic restored document';else data.sections.company.name='Synthetic restored document';localStorage.setItem(key,JSON.stringify(records));return records[0].id},{key,slug:app.slug});
  await page.goto(app.routes[locale]+'?id='+encodeURIComponent(id));
  if(app.slug==='meeting-minutes')await expect(page.locator('#meetingTitle')).toHaveValue('Synthetic restored document');else if(app.slug==='receipt-generator')await expect(page.locator('#businessName')).toHaveValue('Synthetic restored document');else await expect(page.locator('#planPreview')).toContainText('Synthetic restored document');
  await expect(page.locator(app.save).first()).toBeEnabled();expect(errors).toEqual([]);
 });
 test(app.slug+' '+locale+': denied save retains previous data and allows retry',async({page,baseURL})=>{
  const raw=JSON.stringify([{id:'older',title:'Synthetic older item',data:{},createdAt:1,updatedAt:1}]),{key,errors}=await open(page,baseURL,app,locale,raw);await deny(page,key);await page.locator(app.save).first().click();
  await expect(page.locator('#savedStorageStatus')).toContainText({en:'not saved',fr:'pas été enregistrée',sw:'hayajahifadhiwa',ha:'Ba a ajiye wannan canjin ba'}[locale]);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);expect(await page.evaluate(()=>window.attempts)).toBe(1);expect(new URL(page.url()).searchParams.has('id')).toBe(false);
  await page.evaluate(()=>window.allowSaving());await page.locator(app.save).first().click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key)).toBe(2);await expect(page.locator('#savedStorageStatus')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(app.slug+' '+locale+': corrupt collection is preserved across startup and save',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app,locale,'{broken');await expect(page.locator('#savedStorageStatus')).toContainText({en:'unreadable',fr:'illisibles',sw:'haisomeki',ha:'ba su karantu ba'}[locale]);await page.locator(app.save).first().click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');expect(errors).toEqual([]);
 });
 test(app.slug+' '+locale+': failed delete retains saved row and successful delete restores focus',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app,locale);await page.locator(app.save).first().click();await expect(page.locator(app.remove)).toHaveCount(1);const before=await page.evaluate(k=>localStorage.getItem(k),key);await deny(page,key);await page.locator(app.remove).click();await expect(page.locator('#savedStorageStatus')).toContainText({en:'not saved',fr:'pas été enregistrée',sw:'hayajahifadhiwa',ha:'Ba a ajiye wannan canjin ba'}[locale]);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);await expect(page.locator(app.remove)).toHaveCount(1);
  await page.evaluate(()=>window.allowSaving());await page.locator(app.remove).click();await expect(page.locator(app.remove)).toHaveCount(0);await expect(page.locator(app.save).first()).toBeFocused();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key)).toBe(0);expect(errors).toEqual([]);
 });
 test(app.slug+' '+locale+': denied saved-item read leaves document available',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app,locale);await page.locator(app.save).first().click();const before=await page.evaluate(k=>localStorage.getItem(k),key);await page.evaluate(key=>{const get=Storage.prototype.getItem;window.readOriginal=k=>get.call(localStorage,k);Storage.prototype.getItem=function(name){if(name===key)throw Error('Synthetic denial');return get.call(this,name)}},key);await page.locator(app.load).first().click();await expect(page.locator('#savedStorageStatus')).toContainText({en:'cannot be read',fr:'Impossible de lire',sw:'haviwezi kusomwa',ha:'Ba a iya karanta'}[locale]);expect(await page.evaluate(k=>window.readOriginal(k),key)).toBe(before);await expect(page.locator(app.save).first()).toBeEnabled();expect(errors).toEqual([]);
 });
}
