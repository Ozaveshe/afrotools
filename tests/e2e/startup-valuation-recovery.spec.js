const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
test.use({trace:'off',video:'off',screenshot:'off'});
const routes=['/tools/startup-valuation/','/fr/tools/evaluation-startup/','/sw/zana/thamani-ya-startup/'];
async function fill(page){
 await page.locator('[name=currencyUnit]').fill('TEST');
 for(const [key,value] of Object.entries({uncertaintyPct:'20',annualRevenue:'100000',multipleLow:'2',multipleBase:'3',multipleHigh:'4',comparableBaseline:'500000',teamScore:'110',productScore:'100',tractionScore:'90',marketScore:'100',executionScore:'100',teamWeight:'30',productWeight:'20',tractionWeight:'20',marketWeight:'15',executionWeight:'15',productEvidence:'50000',teamEvidence:'75000',tractionEvidence:'100000',relationshipsEvidence:'25000',riskReductionEvidence:'50000'})) await page.locator(`[name="${key}"]`).fill(value);
 await page.locator('#sv-calc').click();await expect(page.locator('#sv-results')).toHaveClass(/on/);
}
async function setup(page,route,mode){
 await page.addInitScript(mode=>{
  window.__copies=[];window.__copyQueue=[];
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode==='missing'?undefined:{writeText:text=>{
   window.__copies.push(text);
   if(mode==='throws')throw new Error('synthetic clipboard rejection');
   if(mode==='denied')return Promise.reject(new Error('synthetic clipboard rejection'));
   if(mode==='delayed')return new Promise((resolve,reject)=>window.__copyQueue.push({resolve,reject}));
   return Promise.resolve();
  }}});
 },mode);
 await page.goto(route);await fill(page);
}
for(const [index,route] of routes.entries()){
 const failed=[/Copy is unavailable.*JSON/,/Copie indisponible.*JSON/,/Kunakili hakupatikani.*JSON/][index];
 const copied=[/Summary copied/,/Résumé copié/,/Muhtasari umenakiliwa/][index];
 for(const mode of ['missing','denied','throws'])test(`${route} ${mode} clipboard offers native JSON recovery`,async({page})=>{
  let errors=0;page.on('pageerror',()=>errors++);await setup(page,route,mode);await page.locator('#sv-copy').click();await expect(page.locator('#sv-status')).toHaveText(failed);
  const pending=page.waitForEvent('download');await page.locator('#sv-json').click();const data=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));
  expect(data.inputs.currencyUnit).toBe('TEST');expect(data.result.methods).toHaveLength(3);expect(errors).toBe(0);
 });
 test(`${route} successful copy confirms the native evidence payload`,async({page})=>{
  await setup(page,route,'success');await page.locator('#sv-copy').click();await expect(page.locator('#sv-status')).toHaveText(copied);
  const fields=await page.evaluate(()=>{const d=JSON.parse(window.__copies[0]);return{currency:d.inputs.currencyUnit,methods:d.result.methods.length}});expect(fields).toEqual({currency:'TEST',methods:3});
 });
 test(`${route} delayed copy cannot overwrite newer state`,async({page})=>{
  let errors=0;page.on('pageerror',()=>errors++);await setup(page,route,'delayed');
  for(const action of ['clear','edit','recalculate','invalid'])for(const outcome of ['resolve','reject']){
   await fill(page);await page.locator('#sv-copy').click();
   if(action==='clear')await page.locator('#sv-clear').click();
   if(action==='edit')await page.locator('[name=annualRevenue]').fill('110000');
   if(action==='recalculate')await page.locator('#sv-calc').click();
   if(action==='invalid'){await page.locator('[name=multipleLow]').fill('9');await page.locator('#sv-calc').click()}
   const status=await page.locator('#sv-status').textContent();
   await page.evaluate(async outcome=>{window.__copyQueue.shift()[outcome]();await new Promise(r=>setTimeout(r,0))},outcome);await expect(page.locator('#sv-status')).toHaveText(status);
  }
  await fill(page);await page.locator('#sv-copy').click();await page.locator('#sv-copy').click();
  await page.evaluate(async()=>{window.__copyQueue[1].resolve();await new Promise(r=>setTimeout(r,0))});await expect(page.locator('#sv-status')).toHaveText(copied);
  await page.evaluate(async()=>{window.__copyQueue[0].reject();await new Promise(r=>setTimeout(r,0))});await expect(page.locator('#sv-status')).toHaveText(copied);expect(errors).toBe(0);
 });
 test(`${route} failure feedback fits a 320px viewport`,async({page})=>{
  await page.setViewportSize({width:320,height:812});await setup(page,route,'denied');await page.locator('#sv-copy').click();await expect(page.locator('#sv-status')).toHaveText(failed);
  const status=page.locator('#sv-status');await expect(status).toHaveAttribute('role','status');
  expect(await status.evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})).toBe(true);
 });
}
