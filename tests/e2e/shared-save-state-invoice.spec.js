const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
const routes={en:'/tools/invoice-generator/',fr:'/fr/tools/generateur-factures/',sw:'/sw/zana/kizalishaji-ankara/',ha:'/ha/kayan-aiki/kirkiro-invoice/'};
const key='afrotools-saved-invoice-generator';
const scriptRequests=new WeakMap();
test.beforeEach(async({page})=>{
 const paths=[];scriptRequests.set(page,paths);
 page.on('request',request=>{if(request.resourceType()==='script')paths.push(new URL(request.url()).pathname)});
});
test.afterEach(async({page},testInfo)=>{
 if(!testInfo.title.startsWith('ha invoice:'))return;
 expect(scriptRequests.get(page)).toContain('/assets/js/pages/invoice-generator-enhancements.js');
 expect(scriptRequests.get(page)).not.toContain('/ha/kayan-aiki/kirkiro-invoice/app.js');
});
const copy={en:{write:'not saved',read:'cannot be read',invalid:'unreadable'},fr:{write:'pas été enregistrée',read:'Impossible de lire',invalid:'illisibles'},sw:{write:'hayajahifadhiwa',read:'haviwezi kusomwa',invalid:'haisomeki'},ha:{write:'Ba a ajiye wannan canjin ba',read:'Ba a iya karanta',invalid:'ba su karantu ba'}};
async function open(page,baseURL,locale,raw){
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('dialog',d=>d.accept());await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.addInitScript(({key,raw})=>{if(raw!==undefined)localStorage.setItem(key,raw)},{key,raw});
 await page.goto(routes[locale]);await page.waitForFunction(()=>window.AfroInvoiceState&&window.AfroInvoiceState.__enhanced);
 return errors;
}
async function deny(page,read=false){await page.evaluate(({key,read})=>{const method=read?'getItem':'setItem',original=Storage.prototype[method];window.attempts=0;window.originalRead=()=>Storage.prototype.getItem.call(localStorage,key);if(read)window.originalRead=()=>original.call(localStorage,key);Storage.prototype[method]=function(name,value){if(name===key){window.attempts++;throw Error('Synthetic failure')}return original.call(this,name,value)};window.restoreStorage=()=>Storage.prototype[method]=original},{key,read})}
async function raw(page){return page.evaluate(k=>localStorage.getItem(k),key)}
for(const locale of Object.keys(routes)){
 test(locale+' invoice: saved actions fit mobile and remain keyboard reachable',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#invoiceNumber').fill('SYN-'+ 'A'.repeat(100));await page.locator('#btnSaveInvoice').click();
  const remove=page.locator('[data-delete-invoice]'),box=await remove.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x+box.width).toBeLessThanOrEqual(391);
  await page.locator('.invoice-saved-card').focus();await page.keyboard.press('Tab');await expect(remove).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#btnSaveInvoice')).toBeFocused();expect(errors).toEqual([]);
 });
 test(locale+' invoice: failed save preserves previous bytes and retries',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#btnSaveInvoice').click();const before=await raw(page);
  await page.locator('#clientName').fill('Synthetic replacement');await deny(page);await page.locator('#btnSaveInvoice').click();
  await expect(page.locator('#invoiceStorageStatus')).toContainText(copy[locale].write);expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.attempts)).toBe(1);
  await page.evaluate(()=>window.restoreStorage());await page.locator('#btnSaveInvoice').click();expect(JSON.parse(await raw(page))).toHaveLength(1);expect(JSON.parse(await raw(page))[0].data.state.cl).toBe('Synthetic replacement');await expect(page.locator('#invoiceStorageStatus')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(locale+' invoice: corrupt collection survives startup and save',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale,'{broken');await expect(page.locator('#invoiceStorageStatus')).toContainText(copy[locale].invalid);await page.locator('#btnSaveInvoice').click();expect(await raw(page)).toBe('{broken');await expect(page.locator('#clientName')).toBeEditable();expect(errors).toEqual([]);
 });
 test(locale+' invoice: full saved draft reopens and deletes with safe focus',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#clientName').fill('Synthetic original');await page.locator('.li-desc').first().fill('Synthetic line');await page.locator('#btnSaveInvoice').click();await page.locator('#clientName').fill('Synthetic changed');await page.locator('.invoice-saved-card').click();await expect(page.locator('#clientName')).toHaveValue('Synthetic original');await expect(page.locator('.li-desc').first()).toHaveValue('Synthetic line');
  const before=await raw(page);await deny(page);await page.locator('[data-delete-invoice]').click();await expect(page.locator('#invoiceStorageStatus')).toContainText(copy[locale].write);expect(await raw(page)).toBe(before);await expect(page.locator('.invoice-saved-card')).toHaveCount(1);
  await page.evaluate(()=>window.restoreStorage());await page.locator('[data-delete-invoice]').click();await expect(page.locator('.invoice-saved-card')).toHaveCount(0);await expect(page.locator('#btnSaveInvoice')).toBeFocused();expect(JSON.parse(await raw(page))).toEqual([]);expect(errors).toEqual([]);
 });
 test(locale+' invoice: denied read leaves the current draft intact',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#btnSaveInvoice').click();await page.locator('#clientName').fill('Synthetic current');const before=await raw(page);await deny(page,true);await page.locator('.invoice-saved-card').click();await expect(page.locator('#invoiceStorageStatus')).toContainText(copy[locale].read);await expect(page.locator('#clientName')).toHaveValue('Synthetic current');expect(await page.evaluate(()=>window.originalRead())).toBe(before);expect(errors).toEqual([]);
 });
 test(locale+' invoice: legacy summary cannot overwrite current draft',async({page,baseURL})=>{
  const before=JSON.stringify([{id:'legacy',title:'Synthetic legacy summary',data:{client:'Synthetic',total:'100'},createdAt:1,updatedAt:1}]);const errors=await open(page,baseURL,locale,before);await page.locator('#clientName').fill('Synthetic current');await page.locator('.invoice-saved-card').click();await expect(page.locator('#invoiceStorageStatus')).toBeVisible();await expect(page.locator('#clientName')).toHaveValue('Synthetic current');expect(await raw(page)).toBe(before);expect(errors).toEqual([]);
 });
 test(locale+' invoice: legacy save API stores the full draft',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#clientName').fill('Synthetic legacy API');await page.evaluate(()=>window.invSaveCurrentInvoice());expect(JSON.parse(await raw(page))[0].data.state.cl).toBe('Synthetic legacy API');await expect(page.locator('.invoice-saved-card')).toHaveCount(1);expect(errors).toEqual([]);
 });
}
