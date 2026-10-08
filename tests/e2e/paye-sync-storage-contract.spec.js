const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
const key='afrotools-saved-synthetic-paye';
const payload={version:2,inputs:{salaryValue:123},snapshot:{grossAnnual:123,netMonthly:10,taxAnnual:3}};
const record={id:'existing',title:'Synthetic scenario',data:payload,createdAt:1,updatedAt:1};
async function open(page,baseURL,options={}){
 const errors=[],leaks=[];page.on('pageerror',()=>errors.push('pageerror'));page.on('console',m=>{if(m.text().includes('SYNTHETIC_SECRET_SENTINEL'))leaks.push('sensitive-error-details')});page.on('dialog',d=>d.accept());
 await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.route('**/__paye_sync_fixture__',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><body><input id="salaryInput" value="456"><input id="calcSaveName" value="Synthetic scenario"><button id="calcSaveBtn">Save</button><div id="calcSaveStatus"></div><div id="calcSavedList"></div><div id="resultsCard"></div><script src="/assets/js/lib/save-state-classic.js"></script><script src="/assets/js/lib/paye-calculation-sync.js"></script></body></html>`}));
 await page.addInitScript(({key,payload,options})=>{
  if(options.raw!==undefined)localStorage.setItem(key,options.raw);
  window.mock={upserts:0,removes:0,lists:0,historySends:0,deviceWrites:0,calculations:0,rows:options.rows||[],upsertMode:options.upsertMode||'null',listFail:false,restores:0,init:false,removeMode:options.removeMode||'success',user:'synthetic-user'};
  window.PAYE_CALC_SYNC_CONFIG={storageSlug:'synthetic-paye',toolSlug:'synthetic-paye',toolHref:'/__paye_sync_fixture__',toolName:'Synthetic PAYE'};
  window.PAYE_CALC_SYNC_ADAPTER={hasResult:()=>true,buildPayload:()=>JSON.parse(JSON.stringify(payload)),getDefaultTitle:()=> 'Synthetic scenario',getPayloadSummary:()=> 'Synthetic summary',restorePayload:value=>{window.mock.restores++;if(options.restoreThrows)throw Error('SYNTHETIC_SECRET_SENTINEL');document.getElementById('salaryInput').value=value.inputs.salaryValue;return true}};
  window.calculate=()=>{window.mock.calculations++;return 'calculated'};
  window.AfroData={logToolUse:()=>{},save:()=>{window.mock.deviceWrites++}};
  window.AfroHistory={save:async()=>{window.mock.historySends++;return {saved:false}}};
  window.AfroAuth={isLoggedIn:()=>false,getUser:()=>({id:window.mock.user}),onReady:()=>{}};
  window.AfroWorkspace={isSignedIn:()=>false,list:async query=>{window.mock.lists++;if(window.mock.listFail)throw Error('SYNTHETIC_SECRET_SENTINEL');return query&&query.itemKey?window.mock.rows.filter(row=>row.item_key===query.itemKey):window.mock.rows},upsert:async (item,guard)=>{if(window.mock.upsertMode==='switch-before')window.mock.user='different-user';if(guard&&guard.canRequest&&!guard.canRequest())throw Error('SYNTHETIC_SECRET_SENTINEL');window.mock.upserts++;if(window.mock.upsertMode==='switch-after')window.mock.user='different-user';if(window.mock.upsertMode==='fail')throw Error('SYNTHETIC_SECRET_SENTINEL');if(window.mock.upsertMode==='null')return null;return {item_key:item.itemKey,payload:item.payload,title:item.title}},remove:async input=>{window.mock.removes++;if(window.mock.removeMode==='fail')throw Error('SYNTHETIC_SECRET_SENTINEL');if(window.mock.removeMode==='noop')return null;window.mock.rows=window.mock.rows.filter(row=>row.item_key!==input.itemKey);if(window.mock.removeMode==='switch')window.mock.user='different-user';return null}};
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

for(const event of ['focus','afro-auth-change'])test('modern PAYE: calculation and '+event+' keep salary history local',async({page,baseURL})=>{
 const proof=await open(page,baseURL,{upsertMode:'success'});
 expect(await page.evaluate(()=>window.calculate())).toBe('calculated');
 await expect.poll(()=>page.evaluate(()=>window.mock.deviceWrites)).toBe(1);
 await page.evaluate(event=>{if(event==='afro-auth-change')window.mock.user='different-user';window.dispatchEvent(new Event(event))},event);
 await page.waitForFunction(event=>window.mock.lastAction===(event==='afro-auth-change'?'auth-change':event),event);
 expect(await page.evaluate(()=>({history:window.mock.historySends,upserts:window.mock.upserts}))).toEqual({history:0,upserts:0});
 await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSaveStatus')).toContainText('Saved to your dashboard and this device.');
 expect(await page.evaluate(()=>({history:window.mock.historySends,upserts:window.mock.upserts}))).toEqual({history:0,upserts:1});
 expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});

const invalidRestores={
 'missing salary':{version:2,inputs:{}},
 'non-numeric salary':{version:2,inputs:{salaryValue:'wrong'}},
 'negative salary':{version:2,inputs:{salaryValue:-10}},
 'array inputs':{version:2,inputs:[]},
 'invalid period':{version:2,inputs:{salaryValue:123,salaryPeriod:'weekly'}},
 'nested amount':{version:2,inputs:{salaryValue:123,annualRent:{amount:1}}},
 'non-boolean toggle':{version:2,inputs:{salaryValue:123,toggles:{pension:'false'}}},
 'wrong tool':{...payload,toolSlug:'different-tool'},
 'wrong country':{...payload,countryCode:'KE'},
 'future version':{...payload,version:99},
 'summary-only legacy':{summary:'old summary'}
};
for(const [label,data] of Object.entries(invalidRestores))test('modern PAYE: reject '+label+' before touching salary form',async({page,baseURL})=>{
 const before=JSON.stringify([{...record,data}]),proof=await open(page,baseURL,{raw:before});await page.locator('[data-action=load]').click();
 await expect(page.locator('#calcSaveStatus')).toContainText('could not be restored');await expect(page.locator('#salaryInput')).toHaveValue('456');expect(await raw(page)).toBe(before);expect(await page.evaluate(()=>window.mock.restores)).toBe(0);expect(proof.errors).toEqual([]);
});
test('modern PAYE: valid scenario restores',async({page,baseURL})=>{
 const before=JSON.stringify([record]);let proof=await open(page,baseURL,{raw:before});await page.locator('[data-action=load]').click();await expect(page.locator('#salaryInput')).toHaveValue('123');await expect(page.locator('#calcSaveStatus')).toContainText('Loaded saved scenario');expect(proof.errors).toEqual([]);
});
test('modern PAYE: throwing restore adapter shows failure without generic fallback',async({page,baseURL})=>{
 const before=JSON.stringify([record]),proof=await open(page,baseURL,{raw:before,restoreThrows:true});await page.locator('[data-action=load]').click();await expect(page.locator('#calcSaveStatus')).toContainText('could not be restored');await expect(page.locator('#salaryInput')).toHaveValue('456');expect(await raw(page)).toBe(before);expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});

for(const mode of ['switch-before','switch-after'])test('modern PAYE: '+mode+' save retains local copy without claiming dashboard success',async({page,baseURL})=>{
 const proof=await open(page,baseURL,{upsertMode:mode});await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');expect(JSON.parse(await raw(page))).toHaveLength(1);expect(await page.evaluate(()=>window.mock.upserts)).toBe(mode==='switch-before'?0:1);await expect(page.locator('.calc-save-badge')).toHaveText('This device');expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
test('modern PAYE: account switch followed by list failure drops old dashboard cache',async({page,baseURL})=>{
 const row={item_key:'remote',title:'Synthetic remote',payload,updated_at:'2026-01-01T00:00:00Z'},proof=await open(page,baseURL,{rows:[row]});await page.evaluate(()=>{window.mock.user='different-user';window.mock.listFail=true;window.dispatchEvent(new Event('afro-auth-change'))});await expect(page.locator('#calcSaveStatus')).toContainText('Sync failed');await expect(page.locator('.calc-save-badge')).toHaveText('This device');expect(proof.errors).toEqual([]);
});

test('modern PAYE: real workspace helper blocks save when account changes during token lookup',async({page,baseURL})=>{
 const proof=await open(page,baseURL);await page.addScriptTag({url:'/assets/js/lib/workspace-sync.js'});
 await page.evaluate(()=>{window.__workspaceSends=0;window.AfroAuth.getSessionTokenAsync=async()=>{window.mock.user='different-user';return 'synthetic-token'};window.fetch=async()=>{window.__workspaceSends++;return new Response('{}',{status:200})}});
 await page.locator('#calcSaveBtn').click();await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');expect(await page.evaluate(()=>window.__workspaceSends)).toBe(0);expect(JSON.parse(await raw(page))).toHaveLength(1);await expect(page.locator('.calc-save-badge')).toHaveText('This device');expect(proof.errors).toEqual([]);expect(proof.leaks).toEqual([]);
});
