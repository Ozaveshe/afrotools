const {test,expect}=require('@playwright/test');
for(const route of ['/tools/remittance-compare/index.html','/tools/remittance-compare/','/tools/remittance-v2/','/fr/tools/transfert-argent/','/fr/tools/transfert-v2/','/sw/zana/ulinganisho-uhamishaji-pesa/','/sw/zana/ulinganisho-uhamishaji-pesa-kina/'])test(`${route} analytics require explicit consent`,async({page})=>{
 const requests=[];page.on('request',request=>{if(/google-analytics|googletagmanager|googlesyndication|clarity.ms/.test(request.url()))requests.push({url:request.url(),body:request.postData()||''});});
 await page.goto(route);await page.locator('#rm-a-label').fill('PRIVATE_SYNTHETIC_QUOTE');
 await page.waitForTimeout(1200);expect(requests).toEqual([]);
 await page.evaluate(()=>{localStorage.setItem('afrotools_cookie_consent','accepted');dispatchEvent(new CustomEvent('afrotools:cookie-consent',{detail:{status:'accepted'}}));});
 await expect.poll(()=>requests.some(request=>request.url.includes('googletagmanager.com/gtag/js'))).toBe(true);
 await page.evaluate(()=>{localStorage.setItem('afrotools_cookie_consent','declined');dispatchEvent(new CustomEvent('afrotools:cookie-consent',{detail:{status:'declined'}}));});
 expect(await page.evaluate(()=>window['ga-disable-G-D859CGF391'])).toBe(true);
 expect(requests.some(request=>(request.url+request.body).includes('PRIVATE_SYNTHETIC_QUOTE'))).toBe(false);
 requests.length=0;await page.reload();await page.waitForTimeout(1200);expect(requests).toEqual([]);
 expect(requests.some(request=>(request.url+request.body).includes('PRIVATE_SYNTHETIC_QUOTE'))).toBe(false);
});
