const {test,expect}=require('@playwright/test');const fs=require('node:fs');const pdf=require('pdf-parse');
test.use({trace:'off',video:'off',screenshot:'off'});
for(const [route,header,phrase,formula] of [
 ['/tools/startup-valuation/','currency_unit,method,low,point,high,formula,assumptions,evidence_note','Each method is independent','annual revenue'],
 ['/fr/tools/evaluation-startup/','devise_unite,methode,bas,estimation,haut,formule,hypotheses,note_de_preuve','Chaque m\u00e9thode est ind\u00e9pendante','revenu annuel'],
 ['/sw/zana/thamani-ya-startup/','sarafu_kitengo,mbinu,chini,makadirio,juu,kanuni,dhana,dokezo_la_ushahidi','Kila mbinu ni huru','mapato ya mwaka']
])test(`${route} localizes human export text without changing numeric contracts`,async({page})=>{
 await page.goto(route);await page.locator('[name=currencyUnit]').fill('TEST');
 await page.locator('input[type=number]').evaluateAll(nodes=>nodes.forEach(n=>{n.value=n.name==='uncertaintyPct'?'20':n.name==='multipleLow'?'2':n.name==='multipleBase'?'3':n.name==='multipleHigh'?'4':'100';n.dispatchEvent(new Event('input',{bubbles:true}))}));
 await page.locator('[name=revenueEvidence]').fill('=1+1');await page.locator('#sv-calc').click();await expect(page.locator('.sv-method').first()).toContainText(formula);
 async function exported(id){const pending=page.waitForEvent('download');await page.locator(id).click();return fs.readFileSync(await(await pending).path())}
 const csv=(await exported('#sv-csv')).toString();expect(csv.split('\n')[0]).toBe(header);expect(csv).toContain("\"'=1+1\"");expect(csv).toContain(formula);
 const json=JSON.parse((await exported('#sv-json')).toString());expect(Object.keys(json)).toEqual(['inputs','result','methodology']);expect(json.inputs.evidenceNotes.revenue).toBe('=1+1');expect(json.methodology).toContain(phrase);expect(json.result.methodology).toContain(phrase);expect(json.result.methods[0].formula).toContain(formula);
 const expected=await page.evaluate(input=>window.StartupValuationEngine.calculate(input),json.inputs);
 const numeric=m=>m.map(({formula,...fields})=>fields);
 expect(numeric(json.result.methods)).toEqual(numeric(expected.methods));expect(json.result.crossMethodSpan).toEqual(expected.crossMethodSpan);
 const parsed=await pdf(await exported('#sv-pdf'));expect(parsed.text).toContain(phrase);expect(parsed.text).toContain(formula);
 if(!route.startsWith('/tools/')){expect(parsed.text).not.toContain('Assumptions:');expect(parsed.text).not.toContain('Evidence:');expect(parsed.text).not.toContain('Currency / unit');expect(parsed.text).not.toContain('Each method is independent')}
});
