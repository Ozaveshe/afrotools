const {test,expect}=require('@playwright/test');
for(const [locale,route] of [['en','/tools/minimum-wage/'],['sw','/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/']]) test(`Recorded inflation direction and year ${locale}`,async({page})=>{
 await page.goto(route);
 for(const [country,year,direction] of [['MA','2024','gain'],['NG','2025','loss'],['ZA','2026','gain']]){
  await page.locator('#country').selectOption(country);
  const summary=page.locator('#r-inflation-stat');
  await expect(summary).toContainText(year);
  await expect(summary).toContainText(locale==='en'?direction:direction==='gain'?'ongezeko':'upungufu');
  await expect(summary).toContainText(locale==='en'?'CPI source':'CPI');
  await expect(summary).not.toContainText(/Today|cha leo|drop of -|wa -/);
 }
 await page.evaluate(()=>renderInflationChart({points:[{year:2020,nominal:100,cpi:100},{year:2024,nominal:120,cpi:120}],baseYear:2020},{name:'Synthetic',currency:'ZAR'}));
 await expect(page.locator('#r-inflation-stat')).toContainText(locale==='en'?'no change':'hakuna mabadiliko');
});
