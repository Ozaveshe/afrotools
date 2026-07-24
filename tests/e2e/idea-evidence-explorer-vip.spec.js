const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");

const key = "afrotools:idea-evidence-shortlist:v1";
const records = [
  {id:"idea-1",name:"=CMD Solar cold storage",country_code:"KE",country_name:"Kenya",sector:"energy",risk:"medium",currency:"KES",description:'<img src=x onerror="alert(1)"> Produce cold storage',why_africa:"Reduces spoilage.",revenue_model:"Monthly storage fees",risks:["Power interruption"],best_cities:["Nairobi"],startup_cost_min:100000,startup_cost_max:200000,monthly_revenue_min:30000,monthly_revenue_max:50000,breakeven_months_min:8,breakeven_months_max:14,created_at:"2026-06-15"},
  {id:"idea-2",name:"Mobile repair desk",country_code:"KE",country_name:"Kenya",sector:"technology",risk:"low",currency:"KES",description:"Repair service.",startup_cost_min:50000,startup_cost_max:75000,monthly_revenue_min:20000,monthly_revenue_max:40000,breakeven_months_min:5,breakeven_months_max:9},
  {id:"idea-3",name:"Refill shop",country_code:"KE",country_name:"Kenya",sector:"retail",risk:"medium",currency:"KES",description:"Household refills.",startup_cost_min:80000,startup_cost_max:120000,monthly_revenue_min:25000,monthly_revenue_max:45000,breakeven_months_min:7,breakeven_months_max:12}
];

async function mockIdeas(page, payload = records, status = 200) {
  await page.route("**/.netlify/functions/idea-evidence**", route => route.fulfill({
    status,
    contentType:"application/json",
    body:JSON.stringify(status === 200 ? {rows:payload,reportedTotal:payload.length} : {error:"evidence_service_unavailable"})
  }));
}
async function open(page, url="/tools/idea-board/", width=320) {
  await page.setViewportSize({width,height:850});
  await mockIdeas(page);
  await page.goto(url);
  await page.locator("[data-search-form]").getByRole("button",{name:/Search evidence records|Rechercher les fiches/i}).click();
  await expect(page.locator(".iee-card")).toHaveCount(3);
}

test("makes no evidence request before explicit search", async ({ page }) => {
  let requests=0;
  await page.route("**/.netlify/functions/idea-evidence**", route => { requests+=1;return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({rows:records,reportedTotal:3})}) });
  await page.goto("/tools/idea-board/");await page.waitForTimeout(500);
  expect(requests).toBe(0);
  await expect(page.locator("[data-status]")).toContainText(/no data request is made before you ask/i);
  await page.getByRole("button",{name:/search evidence records/i}).click();await expect(page.locator(".iee-card")).toHaveCount(3);expect(requests).toBe(1);
});

for (const route of [
  {url:"/tools/idea-board/",lang:"en"},
  {url:"/fr/tools/tableau-idees/",lang:"fr"}
]) {
  test(`${route.lang} is native, safe and usable at 320px`, async ({ page }) => {
    const errors=[],dialogs=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",async d=>{dialogs.push(d.message());await d.dismiss()});
    await open(page,route.url,320);
    await expect(page.locator("html")).toHaveAttribute("lang",route.lang);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator(".iee-card img,.iee-card script")).toHaveCount(0);
    await expect(page.locator(".iee-card").first()).toContainText("Solar cold storage");
    await expect(page.locator(".iee-card").first()).toContainText(route.lang==="fr"?"Source non fournie":"Source not supplied");
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    expect(errors).toEqual([]);expect(dialogs).toEqual([]);
  });
}

test("detail dialog traps focus, closes with Escape and returns focus", async ({ page }) => {
  await open(page);
  const trigger=page.getByRole("button",{name:/inspect evidence/i}).first();await trigger.click();
  const dialog=page.locator(".iee-dialog");await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute("aria-modal","true");
  await expect(page.getByRole("button",{name:/close details/i})).toBeFocused();
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
});

test("shortlist is explicit, versioned, recoverable and clearable", async ({ page }) => {
  await open(page);
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
  await page.getByRole("button",{name:/add to local shortlist/i}).first().click();
  await expect(page.locator(".iee-compare-card")).toHaveCount(1);
  const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));expect(saved.schemaVersion).toBe(1);expect(saved.items).toHaveLength(1);
  await page.evaluate(k=>localStorage.setItem(k,"{broken"),key);await page.reload();await expect(page.locator("[data-local-status]")).toContainText(/unreadable/i);
  await page.locator("[data-import]").setInputFiles({name:"shortlist.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(saved))});
  await expect(page.locator("[data-shortlist]")).toContainText("Solar cold storage");
  await expect(page.locator("[data-local-status]")).toContainText(/imported/i);
  await page.getByRole("button",{name:/clear shortlist/i}).click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
});

test("copy, TXT, formula-safe CSV, full JSON and parser-readable PDF work locally", async ({ page }) => {
  await open(page);await page.getByRole("button",{name:/add to local shortlist/i}).first().click();
  let pending=page.waitForEvent("download");await page.getByRole("button",{name:/download txt/i}).click();let file=await pending;expect(fs.readFileSync(await file.path(),"utf8")).toContain("=CMD");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download csv/i}).click();file=await pending;const csv=fs.readFileSync(await file.path(),"utf8");expect(csv).toContain("'=CMD");expect(csv).not.toContain("Submitted field note");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download full json/i}).click();file=await pending;const json=JSON.parse(fs.readFileSync(await file.path(),"utf8"));expect(json.scope).toContain("not verified");expect(json.items[0].source).toEqual({name:"",url:"",asOf:"",confidence:""});
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download pdf/i}).click();file=await pending;const parsed=await pdfParse(fs.readFileSync(await file.path()));expect(parsed.text).toContain("Business Idea Evidence Explorer");expect(parsed.text).toContain("submitted planning estimates");expect(parsed.text).toContain("Source not supplied");
});

test("error, empty and stale states stay explicit and retry succeeds", async ({ page }) => {
  let mode="error";
  await page.route("**/.netlify/functions/idea-evidence**", route => mode==="error"
    ? route.fulfill({status:503,contentType:"application/json",body:'{"message":"down"}'})
    : route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({rows:mode==="empty"?[]:records,reportedTotal:mode==="empty"?0:3})}));
  await page.goto("/tools/idea-board/");await page.getByRole("button",{name:/search evidence records/i}).click();await expect(page.locator("[data-status]")).toContainText(/unavailable/i);
  mode="empty";await page.getByRole("button",{name:/retry search/i}).click();await expect(page.locator("[data-status]")).toContainText(/no normalized/i);
  mode="ready";await page.getByRole("button",{name:/retry search/i}).click();await expect(page.locator(".iee-card")).toHaveCount(3);
  await page.locator("[name=query]").fill("solar");await expect(page.locator("[data-status]")).toContainText(/filters changed/i);
});

test("reported dataset matches stay separate from normalized displayed rows", async ({ page }) => {
  await page.route("**/.netlify/functions/idea-evidence**", route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({rows:[records[0],records[1],{id:"invalid",name:"Invalid row",country_code:"KEN",sector:"energy"}],reportedTotal:3})
  }));
  await page.goto("/tools/idea-board/");
  await page.getByRole("button",{name:/search evidence records/i}).click();
  await expect(page.locator(".iee-card")).toHaveCount(2);
  await expect(page.locator("[data-status]")).toHaveText(/2 normalized records displayed on this page · 3 dataset matches reported before normalization/i);
});

for (const width of [320,375]) {
  test(`mobile shortlist remains readable after adding an idea at ${width}px`, async ({ page }) => {
    await open(page,"/tools/idea-board/",width);
    await page.getByRole("button",{name:/add to local shortlist/i}).first().click();
    const card=page.locator(".iee-compare-card");
    await expect(card).toHaveCount(1);await expect(card).toBeVisible();
    const layout=await page.evaluate(()=>{
      const rows=[...document.querySelectorAll(".iee-compare-row")],table=document.querySelector(".iee-table-wrap");
      return {
        noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
        tableDisplay:getComputedStyle(table).display,
        rows:rows.map(row=>({
          width:row.getBoundingClientRect().width,
          labelWidth:row.querySelector("span").getBoundingClientRect().width,
          valueWidth:row.querySelector("strong").getBoundingClientRect().width,
          writingMode:getComputedStyle(row.querySelector("strong")).writingMode,
          wordBreak:getComputedStyle(row.querySelector("strong")).wordBreak
        }))
      };
    });
    expect(layout.noOverflow).toBe(true);expect(layout.tableDisplay).toBe("none");expect(layout.rows).toHaveLength(6);
    for(const row of layout.rows){expect(row.width).toBeGreaterThan(220);expect(row.labelWidth).toBeGreaterThan(200);expect(row.valueWidth).toBeGreaterThan(200);expect(row.writingMode).toBe("horizontal-tb");expect(row.wordBreak).not.toBe("break-all")}
  });
}

test("French tablet shortlist uses readable cards and an unsplit action label at 768px", async ({ page },testInfo) => {
  await open(page,"/fr/tools/tableau-idees/",768);
  await page.getByRole("button",{name:/ajouter à la sélection locale/i}).first().click();
  const card=page.locator(".iee-compare-card");
  await expect(card).toHaveCount(1);await expect(card).toBeVisible();
  const layout=await page.evaluate(()=>{
    const rows=[...document.querySelectorAll(".iee-compare-row")],action=document.querySelector(".iee-compare-card>.iee-button");
    return {
      noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      tableDisplay:getComputedStyle(document.querySelector(".iee-table-wrap")).display,
      rows:rows.map(row=>({width:row.getBoundingClientRect().width,valueWidth:row.querySelector("strong").getBoundingClientRect().width,writingMode:getComputedStyle(row.querySelector("strong")).writingMode,wordBreak:getComputedStyle(row.querySelector("strong")).wordBreak})),
      action:{text:action.textContent.trim(),width:action.getBoundingClientRect().width,scrollWidth:action.scrollWidth,writingMode:getComputedStyle(action).writingMode,wordBreak:getComputedStyle(action).wordBreak}
    };
  });
  expect(layout.noOverflow).toBe(true);expect(layout.tableDisplay).toBe("none");expect(layout.rows).toHaveLength(6);
  for(const row of layout.rows){expect(row.width).toBeGreaterThan(600);expect(row.valueWidth).toBeGreaterThan(600);expect(row.writingMode).toBe("horizontal-tb");expect(row.wordBreak).not.toBe("break-all")}
  expect(layout.action.text).toBe("Retirer");expect(layout.action.width).toBeGreaterThan(600);expect(layout.action.scrollWidth).toBeLessThanOrEqual(Math.ceil(layout.action.width));expect(layout.action.writingMode).toBe("horizontal-tb");expect(layout.action.wordBreak).not.toBe("break-all");
  await card.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath("shortlist-fr-768.png"),fullPage:false});
});

for (const config of [
  {url:"/tools/idea-board/",width:375,dark:true},
  {url:"/fr/tools/tableau-idees/",width:768,dark:false}
]) {
  test(`dark, 200% text zoom and ancillary geometry are safe at ${config.width}px`, async ({ page }) => {
    await page.emulateMedia({colorScheme:config.dark?"dark":"light",reducedMotion:"reduce"});await open(page,config.url,config.width);
    await page.evaluate(d=>{document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.fontSize="200%"},config.dark);
    await page.getByRole("button",{name:/add to local shortlist|ajouter à la sélection locale/i}).first().click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    const geometry=await page.evaluate(()=>{const a=document.querySelector("afro-site-assistant"),cookie=document.querySelector("#afro-cookie-consent,[data-cookie-consent],afro-cookie-consent"),ar=a&&a.getBoundingClientRect(),cr=cookie&&cookie.getBoundingClientRect(),visible=!!(ar&&ar.width&&ar.height&&getComputedStyle(a).display!=="none"),cookieVisible=!!(cr&&cr.width&&cr.height&&getComputedStyle(cookie).display!=="none");const targets=[...document.querySelectorAll(".iee-card,.iee-shortlist,.iee-actions,.iee-compare-card")];const hit=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;return{count:targets.length,assistantVisible:visible,overlaps:targets.filter(x=>visible&&hit(ar,x.getBoundingClientRect())).length,cookieAssistantOverlap:visible&&cookieVisible&&hit(ar,cr)}});expect(geometry.count).toBeGreaterThanOrEqual(5);expect(geometry.assistantVisible).toBe(false);expect(geometry.overlaps).toBe(0);expect(geometry.cookieAssistantOverlap).toBe(false);
  });
}
