const { test, expect } = require("@playwright/test");

for(const route of ["/fr/kenya/","/fr/angola/","/sw/kenya/","/sw/angola/"]){
  test(`${route} country evidence and discovery work on mobile`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await page.goto(route);
    const standard=page.locator("[data-localized-country-standard]");
    await expect(standard).toBeVisible();
    const input=standard.locator('input[name="q"]');
    await input.fill("VAT");
    await expect(input).toHaveValue("VAT");
    await expect(standard.locator("details").first()).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
