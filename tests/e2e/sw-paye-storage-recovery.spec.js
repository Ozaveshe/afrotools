const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
for(const country of ['nigeria','namibia','mozambique','madagascar','south-africa','sierra-leone','algeria','libya','sudan','dr-congo','congo'])test(`Swahili PAYE ${country}: denied save retains data and permits retry`,async({page,baseURL})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.name));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(baseURL).origin?r.continue():r.abort());
 await page.goto(`/sw/${country}/kikokotoo-kodi-mshahara/`);const root=page.locator('[data-sw-paye-app]'),gross=root.locator('[name=gross]');
 const key='afrotools:sw:paye:'+await root.getAttribute('data-tool-id');
 await gross.fill('120000');await root.locator('[type=submit]').click();await root.locator('[data-save]').click();const before=await page.evaluate(k=>localStorage.getItem(k),key);expect(before).not.toBeNull();
 await gross.fill('240000');await root.locator('[type=submit]').click();
 await page.evaluate(key=>{const old=Storage.prototype.setItem;window.restoreStorage=()=>Storage.prototype.setItem=old;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('Synthetic storage denial');return old.call(this,k,v)}},key);
 await root.locator('[data-save]').click();await expect(root.locator('[data-status]')).toContainText('hayajahifadhiwa');await expect(gross).toHaveValue('240000');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 await page.evaluate(()=>window.restoreStorage());await root.locator('[data-save]').click();await expect(root.locator('[data-status]')).toContainText('yamehifadhiwa');expect(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).inputs.gross).toBe(240000);
 await gross.fill('360000');await root.locator('[data-load]').click();await expect(gross).toHaveValue('240000');expect(errors).toEqual([]);
});
