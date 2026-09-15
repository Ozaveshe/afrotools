const {test,expect}=require('@playwright/test');

for(const state of ['success','rejected','missing']) {
  test(`PAYE copy reports ${state} clipboard truthfully`,async({page})=>{
    await page.goto('/sw/morocco/kikokotoo-kodi-mshahara/');
    const app=page.locator('[data-sw-paye-app=paye]');
    await app.locator('[name=gross]').fill('120000');
    await app.locator('form button[type=submit]').click();
    await page.evaluate(state=>{
      const clipboard=state==='missing'?undefined:{writeText:()=>new Promise((resolve,reject)=>{window.finishCopy=state==='success'?resolve:()=>reject(new Error('denied'));})};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard});
    },state);
    await app.locator('[data-copy]').click();
    const status=app.locator('[data-status]');
    await expect(status).not.toHaveText('Muhtasari umenakiliwa.');
    if(state!=='missing')await page.evaluate(()=>window.finishCopy());
    if(state==='success')await expect(status).toHaveText('Muhtasari umenakiliwa.');
    else await expect(status).toHaveText('Imeshindikana kunakili. Pakua muhtasari kama TXT badala yake.');
  });
}
