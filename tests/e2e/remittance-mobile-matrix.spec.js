const {test,expect}=require('@playwright/test');
for(const[locale,route,menu]of[['en','/tools/remittance-compare/','Open menu'],['fr','/fr/tools/transfert-argent/','Ouvrir le menu'],['sw','/sw/zana/ulinganisho-uhamishaji-pesa/','Fungua menyu']])for(const width of[320,390])for(const theme of['light','dark'])test(`${locale} ${width} ${theme} remittance controls and contrast`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto(route);
 if(theme==='dark'){await page.getByRole('button',{name:menu,exact:true}).click();await page.locator('#mobThemeToggle').click();await page.keyboard.press('Escape');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');}
 await page.locator('#rm-third').focus();await page.keyboard.press('Space');
 for(const letter of ['a','b','c'])for(const[key,value]of Object.entries({label:'Synthetic '+letter,sendCountry:'GB',receiveCountry:'SN',send:'USD',debit:'500',receive:'NGN',recipient:letter==='c'?'800000':'790000',observed:'2026-01-01T11:00'}))await page.locator(`#rm-${letter}-${key}`).fill(value);
 await page.locator('#rm-form button[type=submit]').focus();await page.keyboard.press('Enter');await expect(page.locator('.rm-result')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>{const r=await axe.run({include:[['.rm-hero'],['main']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return r.violations.filter(x=>['serious','critical'].includes(x.impact)).map(x=>({id:x.id,nodes:x.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});expect(violations).toEqual([]);
 await page.locator('#rm-form button[type=reset]').click();await expect(page.locator('#rm-third')).not.toBeChecked();await expect(page.locator('#rm-c-label')).toBeDisabled();await expect(page.locator('.rm-result')).toHaveCount(0);
});
