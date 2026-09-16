const{test,expect}=require('@playwright/test');const fs=require('fs');
for(const[locale,route,expiry,future]of[
 ['en','/tools/mobile-money-fees/',['Expiry not provided','Not expired','Expired'],'checked date cannot be in the future'],
 ['fr','/fr/tools/frais-mobile-money/',['Expiration non renseignée','Non expiré','Expiré'],'date de vérification ne peut pas être dans le futur'],
 ['sw','/sw/zana/ada-pesa-simu/',['Muda wa mwisho haujawekwa','Muda haujaisha','Muda umeisha'],'Tarehe ya ukaguzi haiwezi kuwa ya baadaye']
])test(locale+' manual expiry, precise errors, keyboard reset and native exports preserve entered text',async({page})=>{
 await page.clock.install({time:new Date('2026-09-16T12:00:00Z')});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
 await page.goto(route);const market=locale==='fr'?'Sénégal':'Synthetic local market';
 async function fill(letter){for(const[key,value]of Object.entries({label:'Total Éwé '+letter,market,currency:'XOF',amount:'10000',sender:'20',recipient:'5',observed:'2026-09-16T10:00'}))await page.locator(`#mm-${letter}-${key}`).fill(value);}
 await fill('a');await fill('b');const submit=page.locator('#mm-form button[type=submit]');
 await submit.click();await expect(page.locator('#mm-result-list')).toContainText(expiry[0]);
 await page.locator('#mm-b-observed').fill('2026-09-17T10:00');await page.locator('#mm-b-observed').press('Enter');await expect(page.locator('#mm-error')).toContainText(future);await expect(page.locator('#mm-b-observed')).toBeFocused();await expect(page.locator('#mm-a-observed')).not.toHaveAttribute('aria-invalid','true');
 // A malformed datetime assigned to the native control is sanitized to empty by Chromium.
 await page.locator('#mm-b-observed').evaluate(node=>{node.value='not-a-date';node.dispatchEvent(new Event('input',{bubbles:true}));});await expect(page.locator('#mm-b-observed')).toHaveValue('');await submit.click();await expect(page.locator('#mm-b-observed')).toBeFocused();await expect(page.locator('#mm-error')).not.toContainText(future);
 await fill('b');await page.locator('#mm-b-sender').fill('-1');await submit.click();await expect(page.locator('#mm-b-sender')).toBeFocused();await expect(page.locator('#mm-error')).toHaveAttribute('data-show','true');await page.locator('#mm-b-sender').fill('5');await expect(page.locator('#mm-error')).toHaveAttribute('data-show','false');
 await page.locator('#mm-b-expires').fill('2026-09-16T09:00');await submit.click();await expect(page.locator('#mm-b-expires')).toBeFocused();await expect(page.locator('#mm-result-list')).toBeEmpty();
 await page.locator('#mm-b-expires').fill('2026-09-17T10:00');await submit.click();await expect(page.locator('#mm-result-list')).toContainText(expiry[1]);
 await page.locator('#mm-b-expires').fill('2026-09-16T11:00');await submit.click();await expect(page.locator('#mm-result-list')).toContainText(expiry[2]);
 await page.locator('#mm-copy').click();expect(await page.evaluate(()=>window.__copied)).toContain(expiry[2]);expect(await page.evaluate(()=>window.__copied)).toContain('Total Éwé b');
 const pending=page.waitForEvent('download');await page.locator('#mm-json').click();const download=await pending,data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));expect(data.locale).toBe(locale);expect(data.resume||data.summary).toContain(expiry[2]);expect(data.result.quotes[1].market).toBe(market);expect(data.result.quotes[1].label).toBe('Total Éwé b');expect(data.result.quotes[1].expiryState).toBe('expired');
 await page.locator('#mm-third').focus();await page.keyboard.press('Space');await expect(page.locator('#mm-quote-c')).toBeVisible();await fill('c');await submit.click();
 await page.locator('#mm-form button[type=reset]').focus();await page.keyboard.press('Enter');await page.clock.runFor(1);await expect(page.locator('#mm-quote-c')).toBeHidden();await expect(page.locator('#mm-c-label')).toBeDisabled();await expect(page.locator('#mm-third')).not.toBeChecked();await expect(page.locator('#mm-result-list')).toBeEmpty();
 await fill('a');await fill('b');await submit.click();await expect(page.locator('#mm-result-list .rm-result')).toHaveCount(2);
});
