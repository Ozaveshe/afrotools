const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
for(const [locale,route] of [['en','/tools/leave-calculator/'],['sw','/sw/zana/kikokotoo-likizo/']]) {
 test(`${locale}: payout accepts zero and rejects invalid inputs without stale TXT`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(route);
  const decline=page.getByRole('button',{name:locale==='sw'?'Kataa uchanganuzi':'Decline analytics',exact:true});if(await decline.isVisible())await decline.click();
  await page.locator('#lc-tab-payout').click();await page.locator('#po-country').selectOption('KE');
  await page.locator('#po-unused').fill('10');await page.locator('#po-salary').fill('2600');
  await expect(page.locator('#po-result .lc-result-headline')).toContainText('1,200');
  await page.locator('#po-unused').fill('0');await expect(page.locator('#po-result .lc-result-headline')).toHaveText(/(?:KES )?0/);
  const pending=page.waitForEvent('download');await page.locator('[onclick="lcDownloadSummary()"]').click();const downloaded=await pending;expect(fs.readFileSync(await downloaded.path(),'utf8')).toContain('0');
  for(const [field,value] of [['po-unused','-1'],['po-unused','61'],['po-unused',''],['po-salary','-1'],['po-salary','']]) {
   await page.locator('#po-unused').fill('10');await page.locator('#po-salary').fill('2600');await page.locator('#'+field).fill(value);
   await expect(page.locator('#po-result')).toBeHidden();expect(await page.locator('#po-result').textContent()).toBe('');expect(await page.evaluate(()=>lcBuildSummary())).toBe('');
  }
  await page.locator('#po-unused').fill('10');await page.locator('#po-salary').fill('0');await expect(page.locator('#po-result .lc-result-headline')).toHaveText(/(?:KES )?0/);
  await page.locator('#po-salary').evaluate(el=>{el.value='malformed';el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(page.locator('#po-result')).toBeHidden();expect(await page.evaluate(()=>lcBuildSummary())).toBe('');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('Swahili missing paternity remains unknown in rights, comparison and planner',async({page})=>{
 await page.goto('/sw/zana/kikokotoo-likizo/');await page.waitForFunction(()=>typeof LEAVE_DATA==='object');
 const code=await page.evaluate(()=>Object.keys(LEAVE_DATA).find(k=>LEAVE_DATA[k].patDays===null));expect(code).toBeTruthy();
 await page.locator('#lc-country').selectOption(code);expect(await page.evaluate(()=>lcBuildSummary())).toContain('Taarifa hazipo');
 await page.locator('#lc-tab-compare').click();await expect(page.locator('#lc-tbody')).toContainText('Taarifa hazipo');
 await page.locator('#lc-tab-parental').click();await page.locator('#pp-country').selectOption(code);await page.locator('#pp-type').selectOption('pat');await page.locator('#pp-due').fill('2026-09-18');
 await expect(page.locator('#pp-result')).toContainText('taarifa kukosekana hakumaanishi siku sifuri');expect(await page.evaluate(()=>lcCurrentPP)).toBeNull();
});
