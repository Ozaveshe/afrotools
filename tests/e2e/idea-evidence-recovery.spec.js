const {test,expect}=require('@playwright/test');
const key='afrotools:idea-evidence-shortlist:v1';
const record={id:'synthetic-1',name:'Synthetic repair desk',country_code:'KE',country_name:'Kenya',sector:'technology',risk:'low',currency:'KES',startup_cost_min:100,startup_cost_max:200};
const routes={en:'/tools/idea-board/',fr:'/fr/tools/tableau-idees/',sw:'/sw/zana/kichunguzi-ushahidi-wa-mawazo/'};
async function open(page,route,corrupt=false){
 await page.addInitScript(({key,corrupt})=>{localStorage.setItem('afrotools_cookie_consent','declined');if(corrupt)localStorage.setItem(key,'{broken')},{key,corrupt});
 await page.route('**/.netlify/functions/idea-evidence**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({rows:[record],reportedTotal:1})}));
 await page.goto(route);await page.locator('[data-search-form] button[type=submit]').click();await expect(page.locator('.iee-card')).toHaveCount(1);
}
async function add(page){await page.locator('[data-action^="add:"]').first().click()}
const status=page=>page.locator('[data-local-status]');
for(const [locale,route] of Object.entries(routes)){
 test(`${locale} preserves corrupt storage until explicit reset`,async({page})=>{
  await open(page,route,true);await add(page);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');
  await expect(status(page)).toContainText(/session|kipindi/);
  const download=page.waitForEvent('download');await page.locator('[data-action=backup]').click();expect((await download).suggestedFilename()).toMatch(/backup.json$/);
  await page.locator('[data-action=clear]').click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();await add(page);expect(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).items).toHaveLength(1);
 });
 for(const mode of ['reject','missing','throw'])test(`${locale} copy ${mode} has a usable fallback`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page,route);await add(page);
  await page.evaluate(mode=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:()=>{if(mode==='throw')throw Error('synthetic');return Promise.reject(Error('synthetic'))}}}),mode);
  await page.locator('[data-action=copy]').click();await expect(status(page)).toContainText('TXT');expect(errors).toEqual([]);
 });
 test(`${locale} ignores late copy feedback after clear`,async({page})=>{
  await open(page,route);await add(page);await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(resolve=>window.finishCopy=resolve)}}));
  await page.locator('[data-action=copy]').click();await page.locator('[data-action=clear]').click();const cleared=await status(page).textContent();await page.evaluate(()=>window.finishCopy());await expect(status(page)).toHaveText(cleared);
 });
 test(`${locale} denied clear and import preserve current data`,async({page})=>{
  await open(page,route);await add(page);const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.evaluate(()=>{Storage.prototype.removeItem=function(){throw Error('synthetic')}});await page.locator('[data-action=clear]').click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);await expect(page.locator('.iee-compare-card')).toHaveCount(1);
  const dismissed=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());await page.locator('[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(saved)});await dismissed;expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('synthetic')}});const accepted=page.waitForEvent('dialog').then(dialog=>dialog.accept());await page.locator('[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(saved)});await accepted;await expect(status(page)).toContainText(/unchanged|inchang|haijabadilika/);await expect(page.locator('.iee-compare-card')).toHaveCount(1);
 });
 test(`${locale} failed storage writes leave an exportable session`,async({page})=>{
  await open(page,route);await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('synthetic')}});await add(page);await expect(status(page)).toContainText(/session|kipindi/);await expect(page.locator('.iee-compare-card')).toHaveCount(1);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
 });
 test(`${locale} unreadable and oversized imports leave saved data unchanged`,async({page})=>{
  await open(page,route);await add(page);const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.locator('[data-import]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.alloc(262145)});expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
  await page.evaluate(()=>{window.FileReader=class{readAsText(){this.onerror()}}});await page.locator('[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(saved)});await expect(status(page)).toContainText(/unchanged|inchang|haijabadilika/);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
 });
 test(`${locale} late import cannot undo an explicit clear`,async({page})=>{
  await open(page,route);await add(page);const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.evaluate(saved=>{window.FileReader=class{readAsText(){this.result=saved;window.finishImport=()=>this.onload()}}},saved);await page.locator('[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(saved)});await page.locator('[data-action=clear]').click();const cleared=await status(page).textContent();await page.evaluate(()=>window.finishImport());await expect(status(page)).toHaveText(cleared);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
 });
 test(`${locale} explicit replacement restores a valid backup`,async({page})=>{
  await open(page,route);await add(page);const saved=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.evaluate(k=>localStorage.setItem(k,'{broken'),key);await page.reload();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(saved)});await expect(page.locator('.iee-compare-card')).toHaveCount(1);expect(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).items).toHaveLength(1);
 });

}
