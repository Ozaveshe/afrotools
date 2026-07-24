const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");

const routes = [
  { url:"/tools/business-plan-builder/", locale:"en", button:/build draft/i },
  { url:"/fr/tools/generateur-business-plan/", locale:"fr", button:/construire le brouillon/i },
  { url:"/sw/zana/mjenzi-mpango-wa-biashara/", locale:"sw", button:/jenga rasimu/i }
];
async function fill(page, name="Acme Foods") {
  const text = {
    name, country:"Kenya", sector:"Food retail", problem:"Customers need reliable fresh food.",
    customer:"Urban households", evidence:"Ten interviews and five paid trial orders.",
    offer:"Fresh produce boxes", channel:"Market stall and phone orders", operations:"Daily supplier collection",
    team:"Owner and one assistant", risks:"Supplier delay", mitigations:"Two backup suppliers", milestones:"Run 30 paid trials"
  };
  for (const [key,value] of Object.entries(text)) await page.locator(`[name="${key}"]`).fill(value);
  const nums = { monthlyRevenue:"100000", monthlyVariableCosts:"40000", monthlyFixedCosts:"30000",
    startupNeed:"180000", workingCapitalNeed:"60000", confirmedFunding:"90000", scenarioChangePct:"20" };
  for (const [key,value] of Object.entries(nums)) await page.locator(`[name="${key}"]`).fill(value);
}
for (const route of routes) {
  test(`${route.locale} native draft calculates safely at 320px`, async ({ page }) => {
    const errors=[],dialogs=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",async d=>{dialogs.push(d.message());await d.dismiss()});
    await page.setViewportSize({width:320,height:800});await page.goto(route.url);
    await expect(page.locator("html")).toHaveAttribute("lang",route.locale);
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(await page.evaluate(locale=>localStorage.getItem(`afrotools:business-plan-draft:v1:${locale}`),route.locale)).toBeNull();
    await fill(page,'<img src=x onerror="alert(1)"> Acme');
    await page.getByRole("button",{name:route.button}).click();
    await expect(page.locator("[data-result]")).toBeVisible();
    await expect(page.locator("[data-result]")).toContainText(/30.000/);
    await expect(page.locator("[data-result] img,[data-result] script")).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    expect(errors).toEqual([]);expect(dialogs).toEqual([]);
    await page.locator('[name="monthlyRevenue"]').fill("110000");
    await expect(page.locator("[data-result]")).toBeHidden();
  });
}

test("all narrative fields remain inert text", async ({ page }) => {
  const dialogs=[];page.on("dialog",async d=>{dialogs.push(d.message());await d.dismiss()});
  await page.goto("/tools/business-plan-builder/");
  await fill(page);
  for(const field of ["name","country","sector","problem","customer","evidence","offer","channel","operations","team","risks","mitigations","milestones"])
    await page.locator(`[name="${field}"]`).fill(`<svg onload=alert(7)> ${field}`);
  await page.getByRole("button",{name:/build draft/i}).click();
  await expect(page.locator("[data-result] svg,[data-result] img,[data-result] script")).toHaveCount(0);
  expect(dialogs).toEqual([]);
});

test("explicit draft save, corrupt recovery, clear and JSON import work", async ({ page }) => {
  await page.goto("/tools/business-plan-builder/");await fill(page);await page.getByRole("button",{name:/build draft/i}).click();
  const key="afrotools:business-plan-draft:v1:en";
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
  await page.getByRole("button",{name:/save draft/i}).click();
  const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));expect(saved.schemaVersion).toBe(1);expect(saved.form.narrative.name).toBe("Acme Foods");
  await page.locator('[name="name"]').fill("Changed");await page.getByRole("button",{name:/load saved draft/i}).click();await expect(page.locator('[name="name"]')).toHaveValue("Acme Foods");
  await page.evaluate(k=>localStorage.setItem(k,"{broken"),key);await page.getByRole("button",{name:/load saved draft/i}).click();await expect(page.locator("[data-draft-status]")).toContainText(/unreadable/i);
  const backup={schemaVersion:1,tool:"business-plan-builder",locale:"en",savedAt:new Date().toISOString(),form:saved.form};backup.form.narrative.name="Imported Foods";
  await page.locator("[data-import]").setInputFiles({name:"draft.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('[name="name"]')).toHaveValue("Imported Foods");await expect(page.locator("[data-draft-status]")).toContainText(/not saved/i);
  await page.getByRole("button",{name:/clear saved draft/i}).click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
});

test("TXT, formula-safe CSV, full JSON and parser-readable PDF export locally", async ({ page }) => {
  await page.goto("/tools/business-plan-builder/");await fill(page,"=CMD");await page.getByRole("button",{name:/build draft/i}).click();
  let pending=page.waitForEvent("download");await page.getByRole("button",{name:/download txt/i}).click();let d=await pending;expect(fs.readFileSync(await d.path(),"utf8")).toContain("=CMD");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download csv/i}).click();d=await pending;const csv=fs.readFileSync(await d.path(),"utf8");expect(csv).toContain("'=CMD");expect(csv).toContain("Operating profit");expect(csv).toContain("Same-mix break-even revenue");expect(csv).toContain("business-plan-draft-2026-07-23");
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download json/i}).click();d=await pending;const json=JSON.parse(fs.readFileSync(await d.path(),"utf8"));expect(json.formulas.simplePaybackMonths).toContain("not break-even");expect(json.assumptions.currencyDisplayOnly).toBe(true);expect(json.completeness).toHaveLength(11);
  pending=page.waitForEvent("download");await page.getByRole("button",{name:/download pdf/i}).click();d=await pending;const parsed=await pdfParse(fs.readFileSync(await d.path()));expect(parsed.text).toContain("SME Business Plan Draft Workshop");expect(parsed.text).toMatch(/Same-mix|Break-even|same-mix/i);expect(parsed.text).toContain("undiscounted");
});

for (const config of [
  {url:routes[2].url,width:320,dark:true,button:routes[2].button},
  {url:routes[0].url,width:375,dark:true,button:routes[0].button},
  {url:routes[1].url,width:768,dark:false,button:routes[1].button}
]) {
  test(`zoom, dark and ancillary geometry stay safe at ${config.width}px`, async ({ page }) => {
    await page.setViewportSize({width:config.width,height:900});await page.emulateMedia({colorScheme:config.dark?"dark":"light",reducedMotion:"reduce"});await page.goto(config.url);
    await page.evaluate(d=>{document.documentElement.dataset.theme=d?"dark":"light"},config.dark);await fill(page);await page.getByRole("button",{name:config.button}).click();
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
    const geometry=await page.evaluate(()=>{const a=document.querySelector("afro-site-assistant"),ar=a&&a.getBoundingClientRect(),visible=!!(ar&&ar.width&&ar.height&&getComputedStyle(a).display!=="none");const targets=[...document.querySelectorAll(".bpd-metric,.bpd-table-wrap,.bpd-export-actions .bpd-button,.bpd-drafts .bpd-button")];const hit=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;return{count:targets.length,visible,overlaps:targets.filter(x=>visible&&hit(ar,x.getBoundingClientRect())).length}});expect(geometry.count).toBeGreaterThanOrEqual(20);expect(geometry.overlaps).toBe(0);expect(geometry.visible).toBe(false);
  });
}
