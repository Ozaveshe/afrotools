const {test,expect}=require('@playwright/test');
for(const slug of ['tunisia','togo','mali'])test(`${slug}: search intent copy is visible and native at 390px`,async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/fr/tools/suivi-carburant/'+slug+'/');
 await expect(page.locator('h1')).toContainText('essence et gasoil');
 await expect(page.locator('.fuel-country-hero .fuel-note')).toContainText('ne confirme pas le tarif du jour');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://afrotools.com/fr/tools/suivi-carburant/'+slug+'/');
 const question=page.locator('.fuel-faq summary').filter({hasText:'aujourd’hui'});await question.focus();await page.keyboard.press('Enter');await expect(question.locator('..').locator('p')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 expect(await page.evaluate(async()=> (await axe.run(document.querySelector('.fuel-country-hero h1'),{runOnly:{type:'rule',values:['color-contrast']}})).violations.map(v=>v.id))).toEqual([]);
 // A tall element screenshot after FAQ focus stitches a sticky navbar into the hero.
 // Capture actual viewports and check the navbar at each scroll position instead.
 for(const top of [0,200,600]){
  await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),top);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(top);
  const nav=await page.locator('afro-navbar').evaluate(e=>({position:getComputedStyle(e).position,top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height}));
  expect(nav.position).toBe('sticky');expect(nav.top).toBe(0);expect(nav.height).toBeGreaterThan(0);expect(nav.height).toBeLessThanOrEqual(64);
  if(top===0)expect(await page.locator('h1').evaluate(e=>e.getBoundingClientRect().top)).toBeGreaterThan(64);
  await page.screenshot({path:info.outputPath('french-fuel-'+slug+'-viewport-'+top+'-390.png')});
 }
});
