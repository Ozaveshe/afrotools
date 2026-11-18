const {test, expect} = require("@playwright/test");
const fs = require("node:fs/promises");
const route = "/sw/zana/athari-forex-kuagiza/";
test("quotes, saved files and manual rates use the selected currency", async ({page}) => {
  await page.route("**/data/forex/latest.json", route => route.fulfill({json:{base:"USD",rate_observations:{
    KES:{rate:130.0991,source:"exchangerate-api",observed_at:"2026-11-18T00:00:01Z"},
    XOF:{rate:596.3778,source:"test-XOF",observed_at:"2026-11-17T00:00:01Z"}
  }}}));
  await page.goto(route,{waitUntil:"domcontentloaded"});
  const form = page.locator("[data-trade-form]"), result = page.locator("[data-result]");
  const field = name => form.locator('[name="'+name+'"]');
  const submit = form.getByRole("button",{name:"Kokotoa ndani"});
  await expect(field("fxRate")).toHaveValue("130.0991");
  await expect(field("countryCode").locator("option")).toHaveCount(15);
  await submit.click();
  await expect(result).toContainText("1,300,991");
  await expect(result).toContainText("2026-11-18");
  for (const [name,value] of Object.entries({fxRate:"132",usdAmount:"5000",maxSellingPrice:"800000",otherCosts:"50000"})) await field(name).fill(value);
  await field("scenarioPercent").selectOption("-10");
  await submit.click();
  for (const value of ["660,000","594,000","-66,000","150 KES/USD","ulichoweka mwenyewe"]) await expect(result).toContainText(value);
  let payload;
  for (const format of ["json","csv","txt","pdf"]){
    const pending=page.waitForEvent("download");
    await result.locator('[data-export="'+format+'"]').click();
    const data=await fs.readFile(await (await pending).path());
    if(format==="json"){payload=JSON.parse(data);expect(payload.input.rateBasis.kind).toBe("manual");}
    else if(format==="pdf") expect(data.subarray(0,5).toString()).toBe("%PDF-");
    else expect(data.toString()).toContain("594,000");
  }
  await field("countryCode").selectOption("SN");
  await expect(field("fxRate")).toHaveValue("596.3778");
  await expect(form).toContainText("2026-11-17");
  await expect(result).toBeHidden();
  delete payload.input.fxRate; delete payload.input.rateBasis; payload.result.current.rate=133; payload.result.current.localCost=1;
  await page.locator("[data-import]").setInputFiles({name:"saved.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(payload))});
  await expect(result).toContainText("665,000");
  await expect(result).toContainText("faili ulilofungua");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test("failed feed shows the dated monthly basis",async ({page})=>{
  await page.route("**/data/forex/latest.json",route=>route.abort());
  await page.goto(route,{waitUntil:"domcontentloaded"});
  await expect(page.locator('[name="fxRate"]')).toHaveValue("138");
  await expect(page.locator("[data-rate-basis]")).toContainText("2026-03");
});
