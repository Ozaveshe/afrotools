const {test,expect}=require("@playwright/test");
const fs=require("node:fs");
const pdfParse=require("pdf-parse");
const {REVIEW_DUE_AT}=require("../../assets/js/engines/paystack-fee-planner.js");

async function open(page,url,width=375){
  await page.setViewportSize({width,height:900});
  await page.goto(url);
  await expect(page.locator("[data-paystack-planner]")).toBeVisible();
}
async function calculate(page,amount="2000"){
  await page.locator("[name=amount]").fill(amount);
  await page.locator("[data-form]").getByRole("button",{name:/Calculate planning estimate|Calculer l'estimation|Lissafa kiyasin shiri|Kokotoa makadirio ya mpango/i}).click();
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
  {url:"/ha/kayan-aiki/kalkuletan-paystack/",lang:"ha"},
  {url:"/sw/zana/mpangaji-ada-za-paystack/",lang:"sw"}
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
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download CSV"}).click();file=await pending;const csv=fs.readFileSync(await file.path(),"utf8");expect(csv).toContain("source_updated");expect(csv).toContain("2026-09-15");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download full JSON"}).click();file=await pending;const json=JSON.parse(fs.readFileSync(await file.path(),"utf8"));expect(json.result.freshness.effectiveDate).toBeNull();expect(json.scope).toContain("stamp duty");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Download PDF"}).click();file=await pending;const parsed=await pdfParse(fs.readFileSync(await file.path()));expect(parsed.text).toContain("Paystack merchant fee planning report");expect(parsed.text).toContain("Effective date: Not published");
});

for(const reference of [
  {url:"/tools/paystack-calculator/",warning:"Confirm current Paystack fees",txt:"Download TXT",csv:"Download CSV",json:"Download full JSON",pdf:"Download PDF",print:"Print"},
  {url:"/fr/tools/calculateur-paystack/",warning:"Vérifiez les frais Paystack actuels",txt:"Télécharger TXT",csv:"Télécharger CSV",json:"Télécharger JSON complet",pdf:"Télécharger PDF",print:"Imprimer"},
  {url:"/ha/kayan-aiki/kalkuletan-paystack/",warning:"Tabbatar da kuɗin Paystack na yanzu",txt:"Sauke TXT",csv:"Sauke CSV",json:"Sauke cikakken JSON",pdf:"Sauke PDF",print:"Buga"},
  {url:"/sw/zana/mpangaji-ada-za-paystack/",warning:"Thibitisha ada za sasa za Paystack",txt:"Pakua TXT",csv:"Pakua CSV",json:"Pakua JSON kamili",pdf:"Pakua PDF",print:"Chapisha"}
]){
  test(`overdue dated reference remains useful and labelled: ${reference.url}`,async({page})=>{
    const contacts=[];page.on("request",request=>{if(/paystack\.com/i.test(request.url()))contacts.push(request.url())});
    const overdueStamp=new Date(REVIEW_DUE_AT+"T23:59:59Z").getTime()+1000;
    await page.addInitScript(stamp=>{const NativeDate=Date;class MockDate extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}}window.Date=MockDate},overdueStamp);
    await open(page,reference.url,320);
    const note=page.locator("[data-reference-note]");
    await expect(note).toBeVisible();await expect(note).toContainText(reference.warning);
    await expect(page.locator("[data-form] [type=submit]")).toBeEnabled();
    await calculate(page,"2000");
    await expect(page.locator("[data-report]")).toContainText(reference.warning);
    for(const [label,format] of [[reference.txt,"txt"],[reference.csv,"csv"],[reference.json,"json"],[reference.pdf,"pdf"]]){
      const pending=page.waitForEvent("download");await page.getByRole("button",{name:label,exact:true}).click();
      const file=await pending,bytes=fs.readFileSync(await file.path());
      if(format==="pdf")expect((await pdfParse(bytes)).text.replace(/\s+/g," ")).toContain(reference.warning);
      else{const text=bytes.toString("utf8");if(format==="json"){const data=JSON.parse(text);expect(data.result.freshness.mode).toBe("dated-reference");expect(data.result.freshness.fresh).toBe(false)}else expect(text).toContain(reference.warning);if(format==="csv"){expect(text).toContain("source_url");expect(text).toContain("https://support.paystack.com/");expect(text).toContain("dated-reference")}}
      await expect(note).toBeVisible();await expect(note).toContainText(reference.warning);
    }
    await page.emulateMedia({media:"print"});await expect(note).toBeVisible();await expect(page.locator("[data-report]")).toContainText(reference.warning);await page.emulateMedia({media:"screen"});
    await page.locator("[name=amount]").fill("-1");await expect(page.locator("[data-results]")).toBeHidden();
    await page.locator("[data-form] [type=submit]").click();await expect(page.locator("[data-results]")).toBeHidden();await expect(note).toBeVisible();
    await calculate(page,"2000");expect(contacts).toEqual([]);
  });
}

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
