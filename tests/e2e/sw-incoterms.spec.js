const {test,expect}=require("@playwright/test");
const fs=require("node:fs/promises");
test("cost allocation and insurance comparison at 390px survives exports and legacy import",async({page})=>{
  await page.goto("/sw/zana/kikokotoo-incoterms/",{waitUntil:"domcontentloaded"});
  const form=page.locator("[data-incoterms-form]"), result=page.locator("[data-result]");
  const calculate=form.getByRole("button",{name:"Kokotoa ndani"});
  await expect(form.getByRole("spinbutton")).toHaveCount(12);
  await expect(form.locator('[name="termCode"] option')).toHaveCount(11);
  await calculate.click();
  await expect(result).toContainText("11,500 USD");
  await expect(result).toContainText("8,500 USD");
  await expect(result).toContainText("Sheria ya nchi ya kuagiza");
  await expect(result).toContainText("hatari huhamia");
  await form.locator('[name="freight"]').fill("6500");
  await form.locator('[name="insurance"]').fill("250");
  await expect(result).toBeHidden(); await calculate.click();
  await expect(result).toContainText("6,750 USD");
  let payload;
  for(const format of ["json","csv","txt","pdf"]){
    const pending=page.waitForEvent("download");await result.locator('[data-export="'+format+'"]').click();
    const bytes=await fs.readFile(await(await pending).path());
    if(format==="json"){payload=JSON.parse(bytes);expect(payload.result.buyerDifference).toBe(6750);}
    else if(format==="pdf"){expect(bytes.subarray(0,5).toString()).toBe("%PDF-");expect(bytes.toString("latin1")).toMatch(/\/Count [2-9]/);}
    else expect(bytes.toString()).toContain("Thamani ya forodha");
  }
  delete payload.input.compareCode;payload.result.split.sellerTotal=1;
  await page.locator("[data-import]").setInputFiles({name:"legacy.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(payload))});
  await expect(result).toContainText("9,750 USD");
  await form.locator('[name="termCode"]').selectOption("EXW");
  await calculate.click();
  await expect(result).toContainText("EXW");
  await expect(result).not.toContainText("all African");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
