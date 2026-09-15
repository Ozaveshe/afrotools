const {test,expect}=require('@playwright/test');
for(const country of ['morocco','tunisia'])test(country+' source evidence and report-error links remain visible in each locale',async({page,request})=>{
 await page.setViewportSize({width:320,height:900});
 await page.route(/^https?:\/\//,r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 for(const [file]of require('../../scripts/build-'+country+'-paye').outputs()){
  await page.goto('/'+file.replace(/index.html$/,'').replace(/\.html$/,''));
  const panel=page.locator('[data-tool-verification-panel]');await expect(panel).toBeVisible();await expect(panel.locator('h2')).toBeVisible();
  await expect(panel).toContainText(/15 (?:September|septembre|Septemba) 2026/);
  const link=panel.locator('.tool-verification-report');await expect(link).toBeVisible();const href=await link.getAttribute('href');expect(href).toContain('topic=calculation-error');expect(href).toContain('tool='+ (country==='morocco'?'ma':'tn')+'-paye');
  const response=await request.get(href);expect(response.status()).toBe(200);expect(await response.text()).toMatch(/<form\b/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(322);
 }
});
