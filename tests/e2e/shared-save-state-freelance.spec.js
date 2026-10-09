const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
const routes={en:'/tools/freelance-invoice/',fr:'/fr/tools/facture-freelance/',sw:'/sw/zana/ankara-ya-freelancer/'};
const key='afrotools-saved-freelance-invoice';
const copy={en:{write:'not saved',read:'cannot be read',invalid:'unreadable'},fr:{write:'pas été enregistrée',read:'Impossible de lire',invalid:'illisibles'},sw:{write:'hayajahifadhiwa',read:'haviwezi kusomwa',invalid:'haisomeki'}};
async function open(page,baseURL,locale,raw){
 const errors=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('dialog',d=>d.accept());await page.setViewportSize({width:390,height:844});
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.addInitScript(({key,raw})=>{if(raw!==undefined)localStorage.setItem(key,raw)},{key,raw});
 await page.goto(routes[locale]);await page.locator('#saveInvoiceBtn').waitFor();return errors;
}
async function deny(page,read=false){await page.evaluate(({key,read})=>{const method=read?'getItem':'setItem',original=Storage.prototype[method];window.attempts=0;if(read)window.originalRead=()=>original.call(localStorage,key);Storage.prototype[method]=function(name,value){if(name===key){window.attempts++;throw Error('Synthetic failure')}return original.call(this,name,value)};window.restoreStorage=()=>Storage.prototype[method]=original},{key,read})}
async function raw(page){return page.evaluate(k=>localStorage.getItem(k),key)}
for(const locale of Object.keys(routes)){
 test(locale+' freelance: failed save preserves bytes and selected invoice ID',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#saveInvoiceBtn').click();const before=await raw(page);await page.locator('#clientName').fill('Synthetic replacement');await deny(page);await page.locator('#saveInvoiceBtn').click();await expect(page.locator('#savedStorageStatus')).toContainText(copy[locale].write);expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.attempts)).toBe(1);
  await page.evaluate(()=>window.restoreStorage());await page.locator('#saveInvoiceBtn').click();const after=JSON.parse(await raw(page));expect(after).toHaveLength(1);expect(after[0].id).toBe(JSON.parse(before)[0].id);expect(after[0].data.client.name).toBe('Synthetic replacement');await expect(page.locator('#savedStorageStatus')).toHaveCount(0);expect(errors).toEqual([]);
 });
 test(locale+' freelance: corrupt collection is preserved through startup and save',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale,'{broken');await expect(page.locator('#savedStorageStatus')).toContainText(copy[locale].invalid);await page.locator('#saveInvoiceBtn').click();expect(await raw(page)).toBe('{broken');await expect(page.locator('#clientName')).toBeEditable();expect(errors).toEqual([]);
 });
 test(locale+' freelance: saved draft restores and deletion is atomic',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#clientName').fill('Synthetic original');await page.locator('#saveInvoiceBtn').click();await page.locator('#clientName').fill('Synthetic changed');await page.locator('[data-open-saved]').click();await expect(page.locator('#clientName')).toHaveValue('Synthetic original');const before=await raw(page);
  await deny(page);await page.locator('[data-delete-saved]').click();await expect(page.locator('#savedStorageStatus')).toContainText(copy[locale].write);expect(await raw(page)).toBe(before);await expect(page.locator('[data-open-saved]')).toHaveCount(1);
  await page.evaluate(()=>window.restoreStorage());await page.locator('[data-delete-saved]').click();await expect(page.locator('[data-open-saved]')).toHaveCount(0);await expect(page.locator('#saveInvoiceBtn')).toBeFocused();expect(JSON.parse(await raw(page))).toEqual([]);expect(errors).toEqual([]);
 });
 test(locale+' freelance: unreadable saved item does not replace current draft',async({page,baseURL})=>{
  const errors=await open(page,baseURL,locale);await page.locator('#saveInvoiceBtn').click();await page.locator('#clientName').fill('Synthetic current');const before=await raw(page);await deny(page,true);await page.locator('[data-open-saved]').click();await expect(page.locator('#savedStorageStatus')).toContainText(copy[locale].read);await expect(page.locator('#clientName')).toHaveValue('Synthetic current');expect(await page.evaluate(()=>window.originalRead())).toBe(before);expect(errors).toEqual([]);
 });
 test(locale+' freelance: malformed saved payload neither breaks rendering nor replaces draft',async({page,baseURL})=>{
  const before=JSON.stringify([{id:'bad',title:'Synthetic damaged invoice',data:{lineItems:'wrong-shape',meta:null},createdAt:1,updatedAt:1}]);const errors=await open(page,baseURL,locale,before);await page.locator('#clientName').fill('Synthetic current');await page.locator('[data-open-saved]').click();await expect(page.locator('#savedStorageStatus')).toBeVisible();await expect(page.locator('#clientName')).toHaveValue('Synthetic current');expect(await raw(page)).toBe(before);
  await page.locator('#saveInvoiceBtn').click();const after=JSON.parse(await raw(page));expect(after).toHaveLength(2);expect(after.find(x=>x.id!=='bad').data.client.name).toBe('Synthetic current');expect(after.find(x=>x.id==='bad')).toEqual(JSON.parse(before)[0]);expect(errors).toEqual([]);
 });
 test(locale+' freelance: full collection never evicts older invoices',async({page,baseURL})=>{
  const before=JSON.stringify(Array.from({length:40},(_,i)=>({id:'saved-'+i,title:'Synthetic saved invoice',data:{},createdAt:i+1,updatedAt:i+1})));const errors=await open(page,baseURL,locale,before);await page.locator('#saveInvoiceBtn').click();await expect(page.locator('#savedStorageStatus')).toBeVisible();expect(await raw(page)).toBe(before);await expect(page.locator('[data-delete-saved]')).toHaveCount(40);expect(errors).toEqual([]);
 });
}
