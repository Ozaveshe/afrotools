const {test,expect}=require("@playwright/test");
const fs=require("node:fs");
const pdfParse=require("pdf-parse");

async function open(page,url,width=375){
  await page.setViewportSize({width,height:900});
  await page.goto(url);
  await expect(page.locator("[data-paystack-planner]")).toBeVisible();
}
async function calculate(page,amount="2000"){
  await page.locator("[name=amount]").fill(amount);
  await page.locator("[data-form]").getByRole("button",{name:/Calculate planning estimate|Calculer l'estimation|Lissafa kiyasin shiri/i}).click();
  await expect(page.locator("[data-results]")).toBeVisible();
}

test("does not calculate, store or contact Paystack before explicit action",async({page})=>{
  const contacts=[];page.on("request",request=>{if(/paystack\.com/i.test(request.url()))contacts.push(request.url())});
  await open(page,"/tools/paystack-calculator/");
  await expect(page.locator("[data-results]")).toBeHidden();
  await expect(page.locator("[data-status]")).toContainText("No calculation has run");
  expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>/paystack/i.test(key)))).toEqual([]);
  expect(contacts).toEqual([]);
});

for(const route of [
  {url:"/tools/paystack-calculator/",lang:"en"},
  {url:"/fr/tools/calculateur-paystack/",lang:"fr"},
  {url:"/ha/kayan-aiki/kalkuletan-paystack/",lang:"ha"}
]){
  test(`${route.lang} is a native functional route at 320px`,async({page})=>{
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await open(page,route.url,320);
    await expect(page.locator("html")).toHaveAttribute("lang",route.lang);
    await expect(page.locator("[name=country]")).toBeVisible();
    await expect(page.locator("[name=amount]")).toHaveAttribute("type","number");
    await calculate(page);
    await expect(page.locator("[data-report]")).toContainText(/30[.,]00/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("Nigeria fixed-fee boundary, cap and target-net gross-up are transparent",async({page})=>{
  await open(page,"/tools/paystack-calculator/");
  await calculate(page,"2000");await expect(page.locator("[data-report]")).toContainText(/Processing fee:.*30\.00/);
  await page.locator("[name=amount]").fill("2500");await page.locator("[data-form]").getByRole("button",{name:/Calculate/}).click();await expect(page.locator("[data-report]")).toContainText(/Processing fee:.*137\.50/);
  await page.locator("[name=amount]").fill("200000");await page.locator("[name=targetNet]").fill("200000");await page.locator("[data-form]").getByRole("button",{name:/Calculate/}).click();
  await expect(page.locator("[data-report]")).toContainText(/Processing fee:.*2,000\.00/);
  await expect(page.locator("[data-report]")).toContainText(/Charge required:.*202,000\.00/);
  await expect(page.locator("[data-detail]")).toContainText("Published cap applied");
  await expect(page.locator("[data-detail]")).toContainText("Yes");
});

test("validation, keyboard submit and changed-result state remain explicit",async({page})=>{
  await open(page,"/tools/paystack-calculator/");
  await page.locator("[data-form]").getByRole("button",{name:/Calculate/}).click();
  await expect(page.locator("[data-status]")).toContainText(/Enter an amount greater than 0/i);
  await page.locator("[name=amount]").fill("2000");await page.locator("[name=amount]").press("Enter");await expect(page.locator("[data-results]")).toBeVisible();
  await page.locator("[name=amount]").fill("2001");await expect(page.locator("[data-results]")).toBeHidden();await expect(page.locator("[data-status]")).toContainText(/Inputs changed/i);
});

test("country lock exposes only supported channels and ZA-only VAT",async({page})=>{
  await open(page,"/tools/paystack-calculator/");
  await page.locator("[name=country]").selectOption("GH");await expect(page.locator("[name=channel] option")).toHaveCount(2);await expect(page.locator("[data-currency]")).toContainText("GHS");
  await page.locator("[name=country]").selectOption("KE");await expect(page.locator("[name=channel] option")).toHaveCount(3);await page.locator("[name=channel]").selectOption("mpesa");await calculate(page,"10000");await expect(page.locator("[data-report]")).toContainText(/Processing fee:.*150\.00/);
  await page.locator("[name=country]").selectOption("ZA");await page.locator("[name=channel]").selectOption("local");await calculate(page,"1000");await expect(page.locator("[data-report]")).toContainText(/Supported tax on fee:.*4\.50/);
  await expect(page.locator("[data-report]")).toContainText(/Processing fee:.*34\.50/);
});

test("local TXT, CSV, full JSON and parser-readable PDF exports work",async({page})=>{
  await open(page,"/tools/paystack-calculator/");await calculate(page,"10000");
  let pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download TXT"}).click();let file=await pending;expect(fs.readFileSync(await file.path(),"utf8")).toContain("Deterministic planning estimate only");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download CSV"}).click();file=await pending;const csv=fs.readFileSync(await file.path(),"utf8");expect(csv).toContain("source_updated");expect(csv).toContain("2026-05-20");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download full JSON"}).click();file=await pending;const json=JSON.parse(fs.readFileSync(await file.path(),"utf8"));expect(json.result.freshness.effectiveDate).toBeNull();expect(json.scope).toContain("stamp duty");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download PDF"}).click();file=await pending;const parsed=await pdfParse(fs.readFileSync(await file.path()));expect(parsed.text).toContain("Paystack merchant fee planning report");expect(parsed.text).toContain("Effective date: Not published");
});

test("stale reviewed rates hard-block calculation",async({page})=>{
  await page.addInitScript(()=>{const NativeDate=Date,stamp=new NativeDate("2026-10-22T00:00:00Z").getTime();class MockDate extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}}window.Date=MockDate});
  await open(page,"/tools/paystack-calculator/");
  await expect(page.locator("[data-form] [type=submit]")).toBeDisabled();
  await expect(page.locator("[data-status]")).toContainText(/review is overdue/i);
  await expect(page.locator("[data-results]")).toBeHidden();
});

for(const config of [
  {url:"/tools/paystack-calculator/",width:375,theme:"dark"},
  {url:"/fr/tools/calculateur-paystack/",width:768,theme:"light"},
  {url:"/ha/kayan-aiki/kalkuletan-paystack/",width:375,theme:"system-dark"}
]){
  test(`${config.theme} post-result layout is safe at ${config.width}px`,async({page},testInfo)=>{
    if(config.theme==="system-dark")await page.emulateMedia({colorScheme:"dark",reducedMotion:"reduce"});
    await open(page,config.url,config.width);
    if(config.theme!=="system-dark")await page.evaluate(theme=>{document.documentElement.dataset.theme=theme},config.theme);
    await calculate(page,"2000");
    const geometry=await page.evaluate(()=>{
      const assistant=document.querySelector("afro-site-assistant"),rect=assistant&&assistant.getBoundingClientRect(),visible=!!(rect&&rect.width&&rect.height&&getComputedStyle(assistant).display!=="none");
      const controls=[...document.querySelectorAll(".pfp-button,.pfp-field input,.pfp-field select")];
      return {noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,assistantVisible:visible,minControlHeight:Math.min(...controls.map(control=>control.getBoundingClientRect().height)),resultWidth:document.querySelector(".pfp-results").getBoundingClientRect().width,writingModes:[...document.querySelectorAll(".pfp-metric strong")].map(item=>getComputedStyle(item).writingMode)};
    });
    expect(geometry.noOverflow).toBe(true);expect(geometry.assistantVisible).toBe(false);expect(geometry.minControlHeight).toBeGreaterThanOrEqual(44);expect(geometry.resultWidth).toBeGreaterThan(config.width===768?600:270);expect(geometry.writingModes.every(mode=>mode==="horizontal-tb")).toBe(true);
    if(config.width===375&&config.theme==="dark"){await page.locator("[data-results]").scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath("paystack-375-dark.png"),fullPage:false})}
  });
}
