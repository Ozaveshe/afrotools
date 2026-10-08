const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
const key='afrotools-saved-synthetic-paye';
const payload={version:2,inputs:{salaryValue:123},snapshot:{grossAnnual:123,netMonthly:10,taxAnnual:3}};
const record={id:'existing',title:'Synthetic scenario',data:payload,createdAt:1,updatedAt:1};
async function open(page,baseURL,options={}){
 const errors=[],leaks=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('console',m=>{if(m.text().includes('SYNTHETIC_SECRET_SENTINEL'))leaks.push('sensitive-error-details')});page.on('dialog',d=>d.accept());
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.route('**/__paye_sync_fixture__',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><body><input id="calcSaveName" value="Synthetic scenario"><button id="calcSaveBtn">Save</button><div id="calcSaveStatus"></div><div id="calcSavedList"></div><div id="resultsCard"></div><script src="/assets/js/lib/save-state-classic.js"></script><script src="/assets/js/lib/paye-calculation-sync.js"></script></body></html>`}));
 await page.addInitScript(({key,payload,options})=>{
  if(options.raw!==undefined)localStorage.setItem(key,options.raw);
  window.mock={upserts:0,removes:0,lists:0,rows:options.rows||[],upsertMode:options.upsertMode||'null',listFail:false,restores:0,init:false,removeMode:options.removeMode||'success',user:'synthetic-user'};
  window.PAYE_CALC_SYNC_CONFIG={storageSlug:'synthetic-paye',toolSlug:'synthetic-paye',toolHref:'/__paye_sync_fixture__',toolName:'Synthetic PAYE'};
  window.PAYE_CALC_SYNC_ADAPTER={hasResult:()=>true,buildPayload:()=>JSON.parse(JSON.stringify(payload)),getDefaultTitle:()=> 'Synthetic scenario',getPayloadSummary:()=> 'Synthetic summary',restorePayload:()=>{window.mock.restores++;return true}};
  window.AfroAuth={isLoggedIn:()=>false,getUser:()=>({id:window.mock.user}),onReady:()=>{}};
  window.AfroWorkspace={isSignedIn:()=>false,list:async query=>{window.mock.lists++;if(window.mock.listFail)throw Error('SYNTHETIC_SECRET_SENTINEL');return query&&query.itemKey?window.mock.rows.filter(row=>row.item_key===query.itemKey):window.mock.rows},upsert:async item=>{window.mock.upserts++;if(window.mock.upsertMode==='fail')throw Error('SYNTHETIC_SECRET_SENTINEL');if(window.mock.upsertMode==='null')return null;return {item_key:item.itemKey,payload:item.payload,title:item.title}},remove:async input=>{window.mock.removes++;if(window.mock.removeMode==='fail')throw Error('SYNTHETIC_SECRET_SENTINEL');if(window.mock.removeMode==='noop')return null;window.mock.rows=window.mock.rows.filter(row=>row.item_key!==input.itemKey);if(window.mock.removeMode==='switch')window.mock.user='different-user';return null}};
  window.addEventListener('afro-saved-calculations-change',e=>{window.mock.lastAction=e.detail.action;if(e.detail.action==='init')window.mock.init=true});
 },{key,payload,options});
 await page.goto('/__paye_sync_fixture__');await page.waitForFunction(()=>window.mock.init||document.getElementById('calcSaveStatus').dataset.tone==='warning');return {errors,leaks};
}
async function deny(page,read=false){await page.evaluate(({key,read})=>{const method=read?'getItem':'setItem',original=Storage.prototype[method];if(read)window.originalRead=()=>original.call(localStorage,key);Storage.prototype[method]=function(name,value){if(name===key)throw Error('SYNTHETIC_SECRET_SENTINEL');return original.call(this,name,value)};window.restoreStorage=()=>Storage.prototype[method]=original},{key,read})}
async function raw(page){return page.evaluate(k=>localStorage.getItem(k),key)}
test('modern PAYE: failed local save does not call dashboard upsert',async({page,baseURL})=>{
 const proof=await open(page,baseURL);await deny(page);await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSaveStatus')).toContainText('not saved');expect(await page.evaluate(()=>window.mock.upserts)).toBe(0);expect(await raw(page)).toBeNull();expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
test('modern PAYE: malformed collection survives startup and attempted save',async({page,baseURL})=>{
 const proof=await open(page,baseURL,{raw:'{broken'});await expect(page.locator('#calcSaveStatus')).toContainText('unreadable');await page.locator('#calcSaveBtn').click();expect(await raw(page)).toBe('{broken');expect(await page.evaluate(()=>window.mock.upserts)).toBe(0);expect(proof.errors).toEqual([]);
});
test('modern PAYE: denied load does not restore or show success',async({page,baseURL})=>{
 const before=JSON.stringify([record]),proof=await open(page,baseURL,{raw:before});await deny(page,true);await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toContainText('cannot be read');expect(await page.evaluate(()=>window.mock.restores)).toBe(0);expect(await page.evaluate(()=>window.originalRead())).toBe(before);expect(proof.errors).toEqual([]);
});
test('modern PAYE: denied local delete preserves card and stops remote removal',async({page,baseURL})=>{
 const before=JSON.stringify([record]),proof=await open(page,baseURL,{raw:before});await deny(page);await page.locator('[data-action=delete]').click();await expect(page.locator('#calcSaveStatus')).toContainText('not saved');expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.mock.removes)).toBe(0);await expect(page.locator('.calc-save-card')).toHaveCount(1);expect(proof.errors).toEqual([]);
});
for(const mode of ['null','fail','success'])test('modern PAYE: dashboard '+mode+' response reports only acknowledged persistence',async({page,baseURL})=>{
 const proof=await open(page,baseURL,{upsertMode:mode});await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSaveStatus')).toContainText(mode==='success'?'Saved to your dashboard and this device.':'Saved on this device.');expect(JSON.parse(await raw(page))).toHaveLength(1);expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
test('modern PAYE: failed dashboard refresh preserves visible cached row and redacts errors',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row],upsertMode:'success'});await expect(page.locator('.calc-save-card')).toHaveCount(1);await page.evaluate(()=>{window.mock.listFail=true;window.dispatchEvent(new CustomEvent('afro-workspace-change',{detail:{itemType:'saved-calculation'}}))});await expect(page.locator('#calcSaveStatus')).toContainText('Sync failed');await expect(page.locator('.calc-save-card')).toHaveCount(1);expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
for(const mode of ['fail','noop'])test('modern PAYE: '+mode+' dashboard deletion retains local copy until confirmed retry',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row],removeMode:mode});const before=await raw(page);await page.locator('[data-action=delete]').click();await expect(page.locator('#calcSaveStatus')).toContainText('device copy has been kept');expect(await raw(page)).toBe(before);await expect(page.locator('.calc-save-card')).toHaveCount(1);
 await page.evaluate(()=>{window.mock.removeMode='success'});await page.locator('[data-action=delete]').click();await expect(page.locator('.calc-save-card')).toHaveCount(0);await expect(page.locator('#calcSaveBtn')).toBeFocused();expect(JSON.parse(await raw(page))).toEqual([]);expect(await page.evaluate(()=>window.mock.rows.length)).toBe(0);
 // A delayed stale listing in this page must not resurrect confirmed deletion.
 await page.evaluate(row=>{window.mock.rows=[row];window.dispatchEvent(new CustomEvent('afro-workspace-change',{detail:{itemType:'saved-calculation'}}))},row);await page.waitForFunction(()=>window.mock.lastAction==='workspace-change');await expect(page.locator('.calc-save-card')).toHaveCount(0);expect(JSON.parse(await raw(page))).toEqual([]);expect(await page.evaluate(()=>window.mock.upserts)).toBe(0);expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
test('modern PAYE: remote deletion followed by local failure keeps device copy and permits local retry',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row]});const before=await raw(page);await deny(page);await page.locator('[data-action=delete]').click();await expect(page.locator('#calcSaveStatus')).toContainText('Dashboard copy deleted. The device copy could not be deleted');expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.mock.rows.length)).toBe(0);await page.evaluate(()=>window.restoreStorage());await page.locator('[data-action=delete]').click();await expect(page.locator('.calc-save-card')).toHaveCount(0);expect(await page.evaluate(()=>window.mock.removes)).toBe(1);expect(proof.errors).toEqual([]);
});
test('modern PAYE: account change during deletion preserves the device copy',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row],removeMode:'switch'});const before=await raw(page);await page.locator('[data-action=delete]').click();await expect(page.locator('#calcSaveStatus')).toContainText('device copy has been kept');expect(await raw(page)).toBe(before);expect(proof.errors).toEqual([]);
});
test('modern PAYE: cached rows from a previous account cannot be deleted under another account',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row]});const before=await raw(page);await page.evaluate(()=>{window.mock.user='different-user'});await page.locator('[data-action=delete]').click();await expect(page.locator('#calcSaveStatus')).toContainText('original dashboard account');expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.mock.removes)).toBe(0);expect(proof.errors).toEqual([]);
});
test('modern PAYE: refresh does not upload existing local scenarios without a save action',async({page,baseURL})=>{
 const before=JSON.stringify([record]),proof=await open(page,baseURL,{raw:before,upsertMode:'success'});await page.evaluate(()=>window.dispatchEvent(new CustomEvent('afro-workspace-change',{detail:{itemType:'saved-calculation'}})));await page.waitForFunction(()=>window.mock.lastAction==='workspace-change');expect(await page.evaluate(()=>window.mock.upserts)).toBe(0);expect(await raw(page)).toBe(before);expect(proof.errors).toEqual([]);
});
