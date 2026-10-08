const {test,expect}=require('@playwright/test');
test.use({storageState:{cookies:[],origins:[]},trace:'off',video:'off',screenshot:'off'});
for(const locale of ['en','fr','sw','ha','yo'])for(const zoom of [1,2])test(`${locale} consent controls remain usable at ${zoom*100}% CSS zoom`,async({page,baseURL})=>{
 await page.route('**/*',route=>route.request().url().startsWith(baseURL)?route.continue():route.abort());
 await page.setViewportSize({width:zoom===1?320:640,height:812});
 await page.goto('/tools/startup-valuation/');
 await page.evaluate(({locale,zoom})=>{document.documentElement.lang=locale;document.documentElement.style.zoom=String(zoom);window.AfroTools.analyticsConsent.open()}, {locale,zoom});
 const panel=page.locator('#afro-cookie-consent');await expect(panel).toBeVisible();
 const bounds=await panel.evaluate(n=>[n,...n.querySelectorAll('button,a,.afro-cc-message')].map(e=>{const r=e.getBoundingClientRect();return{id:e.id||e.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height}}));
 for(const box of bounds){expect(box.left,box.id).toBeGreaterThanOrEqual(0);expect(box.right,box.id).toBeLessThanOrEqual(zoom===1?320:640);expect(box.top,box.id).toBeGreaterThanOrEqual(0);expect(box.bottom,box.id).toBeLessThanOrEqual(812)}
 expect(await page.evaluate(()=>localStorage.getItem('afrotools_cookie_consent'))).toBeNull();
 await page.locator('#afro-analytics-consent-accept').focus();await page.keyboard.press('Tab');await expect(page.locator('#afro-cc-decline')).toBeFocused();await page.keyboard.press('Enter');await expect(panel).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
 await page.evaluate(()=>window.AfroTools.analyticsConsent.open());await expect(page.locator('#afro-cc-close')).toBeVisible();await page.locator('#afro-analytics-consent-accept').click();expect(await page.evaluate(()=>localStorage.getItem('afrotools_cookie_consent'))).toBe('accepted');await expect(panel).toHaveCount(0);
});
