const {test,expect}=require('@playwright/test');
test.describe('mobile money fee finder',()=>{
  test('calculates verified bands and exposes unavailable states',async({page})=>{
    await page.goto('/tools/mobile-money-fees/');
    await expect(page.locator('#mm-provider option')).toHaveCount(2);
    await page.locator('#mm-amount').fill('500');
    await page.locator('#mm-tariff-form button[type="submit"]').click();
    await expect(page.locator('#mm-tariff-result')).toContainText('100 UGX');
    await expect(page.locator('#mm-tariff-result')).toContainText('600 UGX');
    await expect(page.locator('#mm-tariff-result a')).toHaveAttribute('href','https://www.mtn.co.ug/tariffs/mobile-money-tariffs/');
    await page.locator('#mm-provider').selectOption('airtel-tanzania');
    await page.locator('#mm-action').selectOption('withdraw');
    await page.locator('#mm-amount').fill('3000');
    await page.locator('#mm-tariff-form button[type="submit"]').click();
    await expect(page.locator('#mm-tariff-result')).toContainText('604 TZS');
    await expect(page.locator('#mm-tariff-result')).toContainText('governmentLevy: 14 TZS');
    await page.locator('#mm-action').selectOption('send');
    await page.locator('#mm-amount').fill('10000');
    await page.locator('#mm-tariff-form button[type="submit"]').click();
    await expect(page.locator('#mm-tariff-result')).toContainText('AMOUNT_OUTSIDE_VERIFIED_BANDS');
  });
  test('stays usable at 375px',async({page})=>{
    await page.setViewportSize({width:375,height:812});
    await page.goto('/fr/tools/frais-mobile-money/');
    await expect(page.locator('#mm-provider')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
  test('preserves the local manual quote comparator and exports',async({page})=>{
    await page.goto('/sw/zana/ada-pesa-simu/');
    const checked=new Date(Date.now()-60000).toISOString().slice(0,16);
    for(const letter of ['a','b']){
      await page.locator('#mm-'+letter+'-label').fill('Njia '+letter.toUpperCase());
      await page.locator('#mm-'+letter+'-market').fill('Soko la majaribio');
      await page.locator('#mm-'+letter+'-currency').fill('KES');
      await page.locator('#mm-'+letter+'-amount').fill('5000');
      await page.locator('#mm-'+letter+'-sender').fill(letter==='a'?'30':'20');
      await page.locator('#mm-'+letter+'-recipient').fill('5');
      await page.locator('#mm-'+letter+'-observed').fill(checked);
    }
    await page.locator('#mm-form button[type="submit"]').click();
    await expect(page.locator('#mm-primary-value')).toContainText('25 KES');
    const download=page.waitForEvent('download');
    await page.locator('#mm-json').click();
    const item=await download;
    expect(item.suggestedFilename()).toBe('mobile-money-quote-comparison.json');
  });
});
