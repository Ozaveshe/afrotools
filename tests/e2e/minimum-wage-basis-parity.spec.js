const {test,expect}=require('@playwright/test');
const fs=require('fs');
const locales=[['en','/tools/minimum-wage/'],['sw','/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/']];
for(const [locale,route] of locales) test(locale+' keeps recorded and derived monthly values distinct in UI and actual CSV',async({page,baseURL})=>{
 const errors=[];const posts=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.route('**/*',r=>r.request().url().startsWith(baseURL)?r.continue():r.abort());
 await page.setViewportSize({width:390,height:844});await page.goto(route);
 await page.locator('#country').selectOption('GH');
 await expect(page.locator('#r-monthly')).toHaveText('399.30 GHS');
 await expect(page.locator('#monthly-basis-note')).toContainText('544.50 GHS');
 await page.locator('#compliance-toggle-btn').click();
 for(const [salary,pass] of [['399.29',false],['399.30',true],['400',true]]){
  await page.locator('#compliance-salary').fill(salary);await page.locator('[onclick="checkCompliance()"]').click();
  await expect(page.locator('#compliance-result')).toHaveClass('mw-compliance-result '+(pass?'pass':'fail'));
  await expect(page.locator('#cr-detail')).toContainText('399.3');
 }
 await page.locator('#country').selectOption('ZA');
 await expect(page.locator('#r-monthly')).toHaveText('5,320.48 ZAR');
 await expect(page.locator('#monthly-basis-note')).toContainText('5,320.00 ZAR');
 await page.locator('#compliance-toggle-btn').click();
 for(const [salary,pass] of [['5320',false],['5320.47',false],['5320.48',true]]){
  await page.locator('#compliance-salary').fill(salary);await page.locator('[onclick="checkCompliance()"]').click();
  await expect(page.locator('#compliance-result')).toHaveClass('mw-compliance-result '+(pass?'pass':'fail'));
 }
 await page.locator('#state-select').selectOption('epwp');
 await expect(page.locator('#r-monthly')).toHaveText('2,925.12 ZAR');
 await expect(page.locator('#compliance-result')).not.toHaveClass(/pass|fail/);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[onclick="doExportCSV()"]').click()]);
 const csv=fs.readFileSync(await download.path(),'utf8');
 const rows=csv.split('\r\n').map(row=>row.match(/"(?:[^"]|"")*"/g).map(cell=>cell.slice(1,-1).replace(/""/g,'"')));
 const gh=rows.find(row=>row[1]==='GH'),za=rows.find(row=>row[1]==='ZA');
 expect(gh.slice(2,5)).toEqual(['GHS','544.50','399.30']);expect(za.slice(2,5)).toEqual(['ZAR','5320.00','5320.48']);
 expect(za[0]).toBe(locale==='sw'?'Afrika Kusini':'South Africa');
 expect(za[11]).toContain(locale==='sw'?'hayajathibitishwa':'not established');
 expect(za[12]).toContain(locale==='sw'?'usio na tarehe':'undated');
 expect(rows[0]).toHaveLength(13);expect(errors).toEqual([]);expect(posts).toEqual([]);
 await expect(page.locator('#pdgEmail:visible')).toHaveCount(0);
 expect(csv).not.toContain('5320.47');
 await expect(page.locator('#monthly-record-view-note')).toContainText(locale==='sw'?'iliyorekodiwa':'recorded');
 for(const width of [320,390]) {await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});

for(const [basis,rate,threshold,below,display] of [['daily','18.15','399.30','399.29','399,30'],['hourly','30.23','5239.87','5239.86','5239,87']]) test('French '+basis+' comparison uses displayed cents in results and exports',async({page,baseURL})=>{
 await page.route('**/*',r=>r.request().url().startsWith(baseURL)?r.continue():r.abort());
 await page.goto('/fr/tools/salaire-minimum/');
 for(const [id,value] of Object.entries({minWage:rate,hoursWeek:'40',daysMonth:'22',actualPay:below,allowances:'0',employeeRate:'0',employerRate:'0',fixedDeductions:'0',payrollFees:'0'}))await page.locator('#'+id).fill(value);
 await page.locator('#currency').selectOption('EUR');await page.locator('#minPeriod').selectOption(basis);await page.locator('#payPeriod').selectOption('monthly');
 await expect(page.locator('#complianceOut')).toHaveText('Sous le minimum');
 await page.locator('#actualPay').fill(threshold);await expect(page.locator('#complianceOut')).toHaveText('Au minimum saisi');
 const summary=(await page.locator('#summaryOutput').textContent()).replace(/[\s\u00a0\u202f]/g,'');expect(summary).toContain(display);
 for(const selector of ['#downloadSummary','[data-fr-finance-export-format="csv"]']) {
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);
  const content=fs.readFileSync(await download.path(),'utf8').replace(/[\s\u00a0\u202f]/g,'');expect(content).toContain(display);expect(content).toContain('Auminimumsaisi');
 }
 for(const width of [320,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
