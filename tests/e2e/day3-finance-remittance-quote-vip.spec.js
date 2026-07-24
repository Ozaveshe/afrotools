const {test,expect}=require("@playwright/test");
const fs=require("fs");
const path=require("path");
const pdfParse=require("pdf-parse");

const routes=[
  ["/crypto/remittance/","en"],
  ["/fr/crypto/remittance/","fr"],
];

async function fillQuote(page,letter,overrides={}){
  const values=Object.assign({
    label:letter==="a"?"Quote A":"Quote B",
    send:"USD",
    debit:"500",
    receive:"NGN",
    recipient:letter==="a"?"780000":"790000",
    observed:letter==="a"?"2026-01-01T10:00":"2026-01-01T10:05",
    expires:"",
  },overrides);
  await page.locator(`#rm-${letter}-label`).fill(values.label);
  await page.locator(`#rm-${letter}-send`).fill(values.send);
  await page.locator(`#rm-${letter}-debit`).fill(values.debit);
  await page.locator(`#rm-${letter}-receive`).fill(values.receive);
  await page.locator(`#rm-${letter}-recipient`).fill(values.recipient);
  await page.locator(`#rm-${letter}-observed`).fill(values.observed);
  if(values.expires)await page.locator(`#rm-${letter}-expires`).fill(values.expires);
}

async function compareTwo(page){
  await fillQuote(page,"a");
  await fillQuote(page,"b");
  await page.locator("#rm-form button[type=submit]").click();
}

for(const [route,lang] of routes){
  test(`${lang} remittance receipts are native, private and exact`,async({page})=>{
    const errors=[];
    const quoteRequests=[];
    page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
    page.on("pageerror",error=>errors.push(error.message));
    page.on("request",request=>{
      if(/remittance-quotes|api\/remittance|wise|remitly|westernunion|coingecko|binance|bybit/i.test(request.url()))quoteRequests.push(request.url());
    });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang",lang);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/Wise|Remitly|Western Union|live exchange rates|cheapest provider|real savings/i);
    for(const id of ["#rm-a-label","#rm-a-send","#rm-a-debit","#rm-a-receive","#rm-a-recipient","#rm-a-observed","#rm-b-label","#rm-b-send","#rm-b-debit","#rm-b-receive","#rm-b-recipient","#rm-b-observed"]){
      await expect(page.locator(id)).toHaveValue("");
    }
    const storageBefore=await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
    await compareTwo(page);
    await expect(page.locator("#rm-primary-value")).toContainText("790");
    await expect(page.locator(".rm-result[data-highest=true]")).toHaveCount(1);
    await expect(page.locator(".rm-result").nth(0)).toContainText("780");
    await expect(page.locator(".rm-result").nth(1)).toContainText("790");

    await page.locator("#rm-b-debit").fill("501");
    await page.locator("#rm-form button[type=submit]").click();
    await expect(page.locator("#rm-primary-value")).toHaveText("—");
    await expect(page.locator("#rm-primary-detail")).not.toBeEmpty();

    await page.locator("#rm-b-debit").fill("500");
    await page.locator("#rm-third").check();
    await fillQuote(page,"c",{label:"Expired quote",recipient:"900000",observed:"2026-01-01T10:10",expires:"2026-01-01T10:20"});
    await page.locator("#rm-form button[type=submit]").click();
    await expect(page.locator(".rm-result")).toHaveCount(3);
    await expect(page.locator(".rm-result[data-expiry=expired]")).toHaveCount(1);
    await expect(page.locator("#rm-primary-value")).toContainText("790");

    const storageAfter=await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
    expect(storageAfter).toBe(storageBefore);
    expect(quoteRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("CSV, JSON and parser-readable PDF remain local",async({page})=>{
  await page.goto("/crypto/remittance/");
  await compareTwo(page);
  await page.locator("#rm-a-label").fill("=SYNTHETIC");
  await page.locator("#rm-form button[type=submit]").click();

  const jsonEvent=page.waitForEvent("download");
  await page.locator("#rm-json").click();
  const json=JSON.parse(fs.readFileSync(await(await jsonEvent).path(),"utf8"));
  expect(json.groups[0].highestRecipientAmount).toBe(790000);
  expect(json.quotes[0].label).toBe("=SYNTHETIC");

  const csvEvent=page.waitForEvent("download");
  await page.locator("#rm-csv").click();
  const csv=fs.readFileSync(await(await csvEvent).path(),"utf8");
  expect(csv).toContain("790000");
  expect(csv).toContain("'=SYNTHETIC");

  const pdfEvent=page.waitForEvent("download");
  await page.locator("#rm-pdf").click();
  const pdf=await pdfParse(fs.readFileSync(await(await pdfEvent).path()));
  expect(pdf.text).toContain("Remittance quote comparison");
  expect(pdf.text.length).toBeGreaterThan(220);
  expect(pdf.text).not.toMatch(/undefined|NaN/);
});

for(const width of [320,360,375,768]){
  test(`remittance comparator has no overflow and 44px controls at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:920});
    await page.goto("/crypto/remittance/");
    const layout=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      client:document.documentElement.clientWidth,
      heights:Array.from(document.querySelectorAll("button,input,select"),node=>node.getBoundingClientRect()).filter(rect=>rect.width>0&&rect.height>0).map(rect=>rect.height),
    }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.client+1);
    expect(Math.min(...layout.heights)).toBeGreaterThanOrEqual(44);
  });
}

test("controls stay inside the viewport at 200 percent zoom",async({page})=>{
  await page.setViewportSize({width:640,height:920});
  await page.goto("/crypto/remittance/");
  await page.evaluate(()=>{document.body.style.zoom="200%";});
  const layout=await page.evaluate(()=>({
    client:document.documentElement.clientWidth,
    right:Math.max(...Array.from(document.querySelectorAll("button,input,select"),node=>node.getBoundingClientRect().right)),
  }));
  expect(layout.right).toBeLessThanOrEqual(layout.client+1);
});

test("dark preview and reduced motion are respected",async({browser})=>{
  const context=await browser.newContext({colorScheme:"dark",reducedMotion:"reduce"});
  const page=await context.newPage();
  await page.goto("/crypto/remittance/");
  await expect(page.locator("body")).toHaveAttribute("data-remit-theme","dark");
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  await page.locator("#rm-theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await context.close();
});

test("durable 375px light and dark result evidence",async({page})=>{
  const output=path.resolve("artifacts/day3-finance/remittance-row113");
  fs.mkdirSync(output,{recursive:true});
  await page.setViewportSize({width:375,height:900});
  await page.goto("/crypto/remittance/");
  await compareTwo(page);
  await page.screenshot({path:path.join(output,"en-375-results-light.png"),fullPage:true});
  await page.locator("#rm-theme").click();
  await page.screenshot({path:path.join(output,"en-375-results-dark.png"),fullPage:true});
});
