const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { apps } = require("../../scripts/build-sw-agriculture-assigned-apps.js");

test.describe.configure({ mode: "serial" });
test.setTimeout(120000);

for (const app of apps) {
  test(`${app.id}: native calculation, reset and exports`, async ({ page }) => {
    const errors = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/sw/zana/${app.slug}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await page.locator("[data-agri-form] button[type=submit]").click();
    await expect(page.locator("[data-result]")).toBeVisible();
    const result = app.id === "export-docs"
      ? await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest())
      : JSON.parse(await page.locator("[data-output]").textContent());
    if (app.id === "export-docs") {
      expect(result.docs.some(item => item.doc.name.includes("Road consignment"))).toBe(true);
      await page.locator("[data-doc-key]").first().check();
      await expect(page.locator("[data-progress]")).toContainText("1 kati ya");
    }
    expect(result).toBeTruthy();

    for (const format of ["json", "txt", "csv", "pdf"]) {
      const downloadPromise = page.waitForEvent("download");
      await page.locator(`[data-export=${format}]`).click();
      const download = await downloadPromise;
      const file = await download.path();
      const bytes = fs.readFileSync(file);
      expect(bytes.length).toBeGreaterThan(20);
      if (format === "json") {
        const payload = JSON.parse(bytes.toString("utf8"));
        expect(payload.tool).toBe(app.id);
        expect(payload.locale).toBe("sw");
        await page.locator("[data-import]").setInputFiles(file);
        await expect(page.locator("[data-status]")).toContainText("imefunguliwa");
      } else if (format === "csv") expect(bytes.toString("utf8")).toContain("sehemu,thamani");
      else if (format === "txt") expect(bytes.toString("utf8")).toContain(app.name);
      else expect(bytes.subarray(0, 4).toString("ascii")).toBe("%PDF");
    }

    if (app.id === "export-docs") {
      await page.locator("#product").selectOption("tea");
      await expect(page.locator("[data-result]")).toBeHidden();
      await page.locator("#destination").selectOption("eu");
      await page.locator("#shipment").selectOption("air");
      await page.locator("[data-agri-form] button[type=submit]").click();
      await expect(page.locator(".swa-doc-item label").filter({hasText:"Air waybill (AWB)"})).toHaveCount(1);
      await expect(page.locator(".swa-doc-item label").filter({hasText:"Road consignment"})).toHaveCount(0);
      await expect(page.locator("[data-output]")).toContainText("KTDA");
    }

    await page.locator("[data-agri-form] button[type=reset]").click();
    await expect(page.locator("[data-result]")).toBeHidden();
    if (app.id === "export-docs") {
      await page.locator("#query").fill("hakuna-nchi-hii");
      await page.locator("[data-find-countries]").click();
    } else {
      await page.locator("#scenario").fill("{");
      await page.locator("[data-agri-form] button[type=submit]").click();
    }
    await expect(page.locator("[data-result]")).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test("assigned Agriculture layout reflows at 320, 375 and 200%", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    for (const app of apps) {
      await page.goto(`/sw/zana/${app.slug}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto(`/sw/zana/${apps[0].slug}/`);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("export-docs: late real file read cannot replace a new selection; PDF failure stays visible", async ({ page }) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  // Named dependency failure, not a mock of checklist or PDF success.
  await page.route('**/assets/vendor/jspdf/jspdf.umd.min.js*',route=>route.abort());
  // Delay only completion of the native file read; return its actual bytes.
  await page.addInitScript(()=>{
    const original=File.prototype.text;
    File.prototype.text=function(...args){
      return Reflect.apply(original,this,args)
        .then(value=>new Promise(resolve=>{window.__releaseNativeFileText=()=>resolve(value);}))
        .finally(()=>{window.__nativeFileReadSettled=true;});
    };
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/sw/zana/nyaraka-za-usafirishaji-mazao/');
  const old={schemaVersion:1,tool:'export-docs',locale:'sw',input:{query:'Kenya',countryCode:'KE',product:'maize',destination:'africa',shipment:'road'},result:{}};
  await page.locator('[data-import]').setInputFiles({name:'old-road.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await page.waitForFunction(()=>typeof window.__releaseNativeFileText==='function');
  await page.locator('#product').selectOption('tea');
  await page.locator('#destination').selectOption('eu');
  await page.locator('#shipment').selectOption('air');
  await page.locator('[data-agri-form] button[type=submit]').click();
  const status=await page.locator('[data-status]').textContent();
  await page.evaluate(()=>window.__releaseNativeFileText());
  await page.waitForFunction(()=>window.__nativeFileReadSettled===true);
  await expect(page.locator('#product')).toHaveValue('tea');
  await expect(page.locator('#shipment')).toHaveValue('air');
  await expect(page.locator('.swa-doc-item label').filter({hasText:'Air waybill (AWB)'})).toHaveCount(1);
  await expect(page.locator('.swa-doc-item label').filter({hasText:'Road consignment'})).toHaveCount(0);
  await expect(page.locator('[data-status]')).toHaveText(status);
  await page.locator('[data-export=pdf]').click();
  await expect(page.locator('[data-status]')).toHaveText('Moduli ya PDF haikupatikana.');
  await page.waitForFunction(()=>{const r=document.querySelector('[data-status]').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});
  expect(errors).toEqual([]);
});
