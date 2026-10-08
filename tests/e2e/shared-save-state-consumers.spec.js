const {test,expect}=require('@playwright/test');
test.use({trace:'off',screenshot:'off',video:'off'});
const apps=[{slug:'ajo-tracker',save:'saveGroup',field:'#groupName',value:'Synthetic Ajo'},{slug:'boq-builder',save:'saveBOQ',field:'#projName',value:'Synthetic BOQ'},{slug:'contract-generator',save:'saveContract'}];
async function open(page,baseURL,app,raw){
 const messages=[],errors=[];page.on('dialog',async d=>{messages.push(d.message());await d.accept()});page.on('pageerror',()=>errors.push('pageerror'));
 await page.setViewportSize({width:390,height:844});await page.addInitScript(({key,raw})=>{localStorage.setItem('afrotools_cookie_consent','declined');if(raw!==undefined&&!sessionStorage.getItem('seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('seeded','yes')}},{key:'afrotools-saved-'+app.slug,raw});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());await page.goto('/tools/'+app.slug+'/app.html');
 if(app.field)await page.locator(app.field).fill(app.value);else await page.locator('.pick-card').first().click();
 return{messages,errors,key:'afrotools-saved-'+app.slug};
}
async function deny(page,key){await page.evaluate(key=>{const set=Storage.prototype.setItem;window.saveAttempts=0;Storage.prototype.setItem=function(name,value){if(name===key){window.saveAttempts++;throw Error('Synthetic write denial')}return set.call(this,name,value)};window.allowSaving=()=>{Storage.prototype.setItem=set} },key)}
for(const app of apps){
 test(app.slug+': storage refusal preserves collection and avoids false success',async({page,baseURL})=>{
  const raw=JSON.stringify([{id:'older',title:'Synthetic older record',data:{},createdAt:1,updatedAt:1}]);const{messages,errors,key}=await open(page,baseURL,app,raw);await deny(page,key);await page.locator('[onclick="'+app.save+'()"]').click();
  expect(messages.at(-1)).toContain('not saved');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);expect(await page.evaluate(()=>window.saveAttempts)).toBe(1);expect(new URL(page.url()).searchParams.has('id')).toBe(false);expect(errors).toEqual([]);
  await page.evaluate(()=>window.allowSaving());await page.locator('[onclick="'+app.save+'()"]').click();expect(messages.at(-1)).toMatch(/saved!/);expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key)).toBe(2);
 });
 test(app.slug+': corrupt collection is preserved while application stays usable',async({page,baseURL})=>{
  const{messages,errors,key}=await open(page,baseURL,app,'{broken');await page.locator('[onclick="'+app.save+'()"]').click();expect(messages.at(-1)).toContain('unreadable');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');expect(errors).toEqual([]);
 });
 test(app.slug+': successful save, update, reopen and landing history',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app);await page.locator('[onclick="'+app.save+'()"]').click();const first=await page.evaluate(k=>JSON.parse(localStorage.getItem(k))[0],key);
  if(app.field)await page.locator(app.field).fill(app.value+' updated');await page.locator('[onclick="'+app.save+'()"]').click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).length,key)).toBe(1);
  await page.goto('/tools/'+app.slug+'/app.html?id='+encodeURIComponent(first.id));if(app.field)await expect(page.locator(app.field)).toHaveValue(app.value+' updated');else await expect(page.locator('.pick-card.on')).toHaveCount(1);
  await page.goto('/tools/'+app.slug+'/');await expect(page.locator('.saved-card')).toHaveCount(1);await expect(page.locator('.saved-card-open')).toHaveAttribute('href','app.html?id='+encodeURIComponent(first.id));expect(errors).toEqual([]);
 });
 test(app.slug+': landing delete failure preserves card; successful delete moves focus',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app);await page.locator('[onclick="'+app.save+'()"]').click();const before=await page.evaluate(k=>localStorage.getItem(k),key);await page.goto('/tools/'+app.slug+'/');await expect(page.locator('.saved-card')).toHaveCount(1);await deny(page,key);await page.locator('[data-delete]').click();await expect(page.locator('[data-save-state-status]')).toContainText('not saved');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);await expect(page.locator('.saved-card')).toHaveCount(1);
  await page.evaluate(()=>window.allowSaving());await page.locator('[data-delete]').click();await expect(page.locator('.saved-card')).toHaveCount(0);await expect(page.locator('.saved-grid')).toBeFocused();await expect(page.locator('.saved-grid')).toBeVisible();expect(errors).toEqual([]);
 });
 test(app.slug+': corrupt landing data is shown as a recovery error, not empty history',async({page,baseURL})=>{
  const{key,errors}=await open(page,baseURL,app,'{broken');await page.goto('/tools/'+app.slug+'/');await expect(page.locator('[data-save-state-status]')).toContainText('unreadable');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');expect(errors).toEqual([]);
 });
}
test('Ajo new group receives its own title and URL instead of the oldest saved ID',async({page,baseURL})=>{
 const app=apps[0],{key}=await open(page,baseURL,app);await page.locator('[onclick="saveGroup()"]').click();const first=new URL(page.url()).searchParams.get('id');await page.goto('/tools/ajo-tracker/app.html');await page.locator('#groupName').fill('Synthetic second group');await page.locator('[onclick="saveGroup()"]').click();const second=new URL(page.url()).searchParams.get('id');expect(second).not.toBe(first);const records=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(records).toHaveLength(2);expect(records.find(r=>r.id===second).title).toBe('Synthetic second group');await page.reload();await expect(page.locator('#groupName')).toHaveValue('Synthetic second group');
});
