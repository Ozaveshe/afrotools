// Saved-card controls use the route language and preserve browser data.
// Artifact mode loads the served SaveState module without source or bundle
// interception; remote requests are isolated for this functional test.
const {test, expect} = require('@playwright/test');
test.use({trace:'off', screenshot:'off', video:'off', viewport:{width:390,height:844}});
const routes = [
  {slug:'meeting-minutes',en:'/tools/meeting-minutes/',fr:'/fr/tools/compte-rendu-reunion/',target:'#saved-minutes'},
  {slug:'cover-letter',en:'/tools/cover-letter-generator/',fr:'/fr/tools/generateur-lettre-motivation/',target:'#saved-letters'},
  {slug:'business-plan',en:'/tools/business-plan/',fr:'/fr/tools/plan-affaires/',target:'#saved-plans'}
];
const copy = {
  en:{open:'Open',remove:'Delete',date:/ago/,confirm:/^Delete /,write:/not saved/,corrupt:/unreadable/,empty:/No saved /},
  fr:{open:'Ouvrir',remove:'Supprimer',date:/il y a/,confirm:/^Supprimer /,write:/pas été enregistrée/,corrupt:/illisibles/,empty:/Aucun élément enregistré/}
};
async function open(page,baseURL,app,locale,raw){
  const key='afrotools-saved-'+app.slug,errors=[],runtimes=[];
  page.on('pageerror',()=>errors.push('pageerror'));
  page.on('response',response=>{if(new URL(response.url()).pathname==='/assets/js/lib/save-state.js')runtimes.push({url:response.url(),status:response.status()});});
  await page.addInitScript(({key,raw})=>{localStorage.setItem('afrotools_cookie_consent','declined');localStorage.setItem(key,raw);},{key,raw});
  await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort());
  await page.goto(app[locale]);
  await page.locator(app.target).waitFor({state:'visible'});
  return{key,errors,runtimes};
}
async function confirmDelete(page,target,accept,expected){
  const next=page.waitForEvent('dialog'),activation=page.locator(target+' [data-delete]').press('Enter');
  const dialog=await next;expect(dialog.message()).toMatch(expected);
  expect(dialog.message()).toContain('Synthetic saved result');
  if(accept)await dialog.accept();else await dialog.dismiss();
  await activation;
}
for(const app of routes)for(const locale of ['en','fr']){
  test(app.slug+' '+locale+': landing saved controls and dates use the page language',async({page,baseURL})=>{
    const raw=JSON.stringify([{id:'synthetic/id?1',title:'Synthetic saved result',data:{},createdAt:Date.now()-121000,updatedAt:Date.now()-120000}]);
    const state=await open(page,baseURL,app,locale,raw),target=page.locator(app.target),words=copy[locale];
    await expect(target.locator('.saved-card-open')).toHaveText(words.open);
    await expect(target.locator('.saved-card-delete')).toHaveText(words.remove);
    await expect(target.locator('.saved-card-date')).toContainText(words.date);
    await expect(target.locator('.saved-card-open')).toHaveAttribute('href','app.html?id=synthetic%2Fid%3F1');
    expect(await page.evaluate(key=>localStorage.getItem(key),state.key)).toBe(raw);
    expect(state.runtimes.some(runtime=>runtime.status===200)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    expect(state.errors).toEqual([]);
  });
  test(app.slug+' '+locale+': keyboard delete preserves the record on cancel or failure and restores focus after retry',async({page,baseURL})=>{
    const raw=JSON.stringify([{id:'synthetic',title:'Synthetic saved result',data:{},createdAt:1,updatedAt:Date.now()}]);
    const state=await open(page,baseURL,app,locale,raw),target=page.locator(app.target),words=copy[locale];
    await target.locator('.saved-card-open').focus();await page.keyboard.press('Tab');
    await expect(target.locator('[data-delete]')).toBeFocused();
    await confirmDelete(page,app.target,false,words.confirm);
    expect(await page.evaluate(key=>localStorage.getItem(key),state.key)).toBe(raw);
    await page.evaluate(key=>{const set=Storage.prototype.setItem;window.syntheticAttempts=0;Storage.prototype.setItem=function(name,value){if(name===key){window.syntheticAttempts++;throw Error('SYNTHETIC_STORAGE_DENIED');}return set.call(this,name,value);};window.allowSyntheticWrite=()=>{Storage.prototype.setItem=set;};},state.key);
    await confirmDelete(page,app.target,true,words.confirm);
    await expect(target.locator('[data-save-state-status]')).toContainText(words.write);
    await expect(target.locator('[data-delete]')).toHaveCount(1);
    expect(await page.evaluate(key=>localStorage.getItem(key),state.key)).toBe(raw);
    expect(await page.evaluate(()=>window.syntheticAttempts)).toBe(1);
    await page.evaluate(()=>window.allowSyntheticWrite());
    await confirmDelete(page,app.target,true,words.confirm);
    await expect(target).toBeFocused();await expect(target).toHaveAttribute('role','status');
    await expect(target).toContainText(words.empty);
    expect(await page.evaluate(key=>localStorage.getItem(key),state.key)).toBe('[]');
    expect(state.errors).toEqual([]);
  });
  test(app.slug+' '+locale+': corrupt saved collection stays intact with localized feedback',async({page,baseURL})=>{
    const state=await open(page,baseURL,app,locale,'{synthetic-corrupt');
    await expect(page.locator(app.target+' [data-save-state-status]')).toContainText(copy[locale].corrupt);
    expect(await page.evaluate(key=>localStorage.getItem(key),state.key)).toBe('{synthetic-corrupt');
    expect(state.errors).toEqual([]);
  });
}
