const {test,expect}=require('@playwright/test');
test.use({trace:'off',video:'off',screenshot:'off'});
for(const route of ['/tools/startup-valuation/','/fr/tools/evaluation-startup/','/sw/zana/thamani-ya-startup/']){
 for(const [label,field,value] of [['missing currency','currencyUnit',''],['invalid uncertainty','uncertaintyPct','101'],['negative revenue','annualRevenue','-1']])test(`${route} ${label} identifies and focuses the affected input`,async({page})=>{
  await page.goto(route);await page.locator('[name=currencyUnit]').fill('TEST');await page.locator('[name=annualRevenue]').fill('100');await page.locator('[name=multipleLow]').fill('2');await page.locator('[name=multipleBase]').fill('3');await page.locator('[name=multipleHigh]').fill('4');
  await page.locator(`[name=${field}]`).fill(value);await page.locator('#sv-calc').click();await expect(page.locator('#sv-results')).not.toHaveClass(/on/);await expect(page.locator('#sv-status')).not.toBeEmpty();
  await expect(page.locator(`[name=${field}]`)).toHaveAttribute('aria-invalid','true');await expect(page.locator(`[name=${field}]`)).toHaveAttribute('aria-describedby',/sv-status/);await expect(page.locator(`[name=${field}]`)).toBeFocused();
  await page.locator(`[name=${field}]`).fill(field==='currencyUnit'?'TEST':field==='uncertaintyPct'?'20':'100');await expect(page.locator(`[name=${field}]`)).not.toHaveAttribute('aria-invalid','true');await expect(page.locator(`[name=${field}]`)).toBeFocused();await expect(page.locator('#sv-results')).not.toHaveClass(/on/);
 });
}

for(const route of ['/tools/startup-valuation/','/fr/tools/evaluation-startup/','/sw/zana/thamani-ya-startup/'])test(`${route} grouped validation clears without stealing editing focus`,async({page})=>{
 await page.goto(route);await page.locator('[name=currencyUnit]').fill('TEST');await page.locator('input[type=number]').evaluateAll(ns=>ns.forEach(n=>{n.value=n.name==='uncertaintyPct'?'20':'100';n.dispatchEvent(new Event('input',{bubbles:true}))}));
 await page.locator('[name=multipleLow]').fill('101');await page.locator('#sv-calc').click();await expect(page.locator('[name=multipleLow]')).toBeFocused();for(const name of ['multipleLow','multipleBase','multipleHigh'])await expect(page.locator(`[name=${name}]`)).toHaveAttribute('aria-invalid','true');
 await page.locator('[name=multipleLow]').fill('100');await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);await expect(page.locator('[name=multipleLow]')).toBeFocused();
 for(const k of ['team','product','traction','market','execution'])await page.locator(`[name=${k}Weight]`).fill('0');await page.locator('#sv-calc').click();await expect(page.locator('[name=teamWeight]')).toBeFocused();await expect(page.locator('[aria-invalid=true]')).toHaveCount(5);
 await page.locator('[name=executionWeight]').fill('20');await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);await expect(page.locator('[name=executionWeight]')).toBeFocused();await expect(page.locator('#sv-status')).toBeEmpty();await expect(page.locator('#sv-results')).not.toHaveClass(/on/);
 await page.locator('[name=currencyUnit]').fill('');await page.locator('#sv-calc').click();await page.locator('#sv-clear').click();await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);
});
