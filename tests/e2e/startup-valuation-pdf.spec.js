const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const pdf=require('pdf-parse');
test.use({trace:'off',video:'off',screenshot:'off'});
for(const route of ['/tools/startup-valuation/','/fr/tools/evaluation-startup/','/sw/zana/thamani-ya-startup/'])test(`${route} long evidence PDF keeps all content inside page bounds`,async({page},info)=>{
 await page.goto(route);await page.locator('[name=currencyUnit]').fill('TEST');
 await page.locator('input[type=number]').evaluateAll(nodes=>nodes.forEach(n=>{n.value=n.name==='uncertaintyPct'?'20':n.name==='multipleLow'?'2':n.name==='multipleBase'?'3':n.name==='multipleHigh'?'4':'100';n.dispatchEvent(new Event('input',{bubbles:true}))}));
 for(const name of ['revenueEvidence','scorecardEvidence','milestoneNote'])await page.locator(`[name=${name}]`).fill(('Synthetic evidence for '+name+' ').repeat(100)+' END_'+name);
 await page.locator('#sv-calc').click();await expect(page.locator('#sv-results')).toHaveClass(/on/);
 const pending=page.waitForEvent('download');await page.locator('#sv-pdf').click();const file=info.outputPath('synthetic-evidence.pdf');await(await pending).saveAs(file);
 const outside=[];const parsed=await pdf(fs.readFileSync(file),{pagerender:async p=>{const c=await p.getTextContent(),v=p.getViewport(1);for(const t of c.items)if(t.str.trim()&&(t.transform[4]<35||t.transform[4]+t.width>v.width-35||t.transform[5]<30||t.transform[5]>v.height-25))outside.push({page:p.pageNumber,x:t.transform[4],y:t.transform[5],width:t.width});return c.items.map(t=>t.str).join(' ')}});
 fs.writeFileSync(info.outputPath('pdf-bounds.json'),JSON.stringify({pages:parsed.numpages,outside}));
 expect(outside).toEqual([]);expect(parsed.numpages).toBeGreaterThan(1);
 for(const name of ['revenueEvidence','scorecardEvidence','milestoneNote'])expect(parsed.text).toContain('END_'+name);
});
