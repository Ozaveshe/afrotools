const {test,expect}=require('@playwright/test');
for(const width of [390,1280])test('cross-border legal print remains local at '+width,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.addInitScript(()=>{localStorage.setItem('afrotools_cookie_consent','declined');window.__prints=0;window.print=()=>window.__prints++;});
 const sends=[];
 await page.route('**/*',route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method())){sends.push(r.url());return route.abort();}return route.continue();});
 await page.goto('/tools/cross-border-data/');
 const root=page.locator('.leg-workflow-copilot');
 await expect(root.locator('[data-workflow-optin]')).not.toBeChecked();
 await root.locator('[data-workflow-field="note"]').fill('Synthetic private note');
 const print=root.locator('[data-workflow-print]');
 await expect(print).not.toHaveAttribute('data-trade-pdf-gated','true');
 await print.click();
 await expect.poll(()=>page.evaluate(()=>window.__prints)).toBe(1);
 expect(sends).toEqual([]);
 expect(await page.evaluate(()=>localStorage.getItem('afrotools-legal-workflow:cross-border-data'))).toBeNull();
});
