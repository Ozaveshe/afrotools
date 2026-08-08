const fs = require("fs");
const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/sw-developer-parity.json");

async function downloadText(page, selector) {
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator(selector).click()]);
  const file = await download.path();
  expect(file).toBeTruthy();
  return { name: download.suggestedFilename(), content: fs.readFileSync(file) };
}

for (const route of manifest.routes) {
  test(`${route.id}: native metadata, 320/375/200% reflow, keyboard and privacy`, async ({ page }) => {
    const errors = [], writes = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("request", (request) => { if (request.method() !== "GET" && !request.url().startsWith("http://127.0.0.1:4173")) writes.push(request.url()); });
    await page.setViewportSize({ width: 320, height: 844 });
    const response = await page.goto(route.swahili, { waitUntil: "domcontentloaded" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route.swahili}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
    const overflow320 = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      elements: [...document.querySelectorAll("body *")].filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 8).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ""), right: Math.round(node.getBoundingClientRect().right), width: Math.round(node.getBoundingClientRect().width) }))
    }));
    expect(overflow320.documentWidth, JSON.stringify(overflow320.elements)).toBeLessThanOrEqual(overflow320.clientWidth + 1);
    await page.setViewportSize({ width: 375, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const focusable = page.locator("main input,main textarea,main select,main button,main a").first();
    if (await focusable.count()) { await focusable.focus(); expect(await focusable.evaluate((node) => node === document.activeElement)).toBe(true); }
    const appWrites = writes.filter((url) => !/google-analytics\.com|googlesyndication\.com/.test(url));
    expect(appWrites).toEqual([]);
    expect(errors.filter((value) => !/favicon|cdn|analytics/i.test(value))).toEqual([]);
  });
}

test("Developer deterministic outputs parse and advertised exports reopen", async ({ page }) => {
  test.setTimeout(150000);
  await page.goto("/sw/zana/kirekebisha-json/");
  await page.locator("#input").fill('{"nchi":"Kenya","idadi":2}'); await page.locator("#formatBtn").click();
  expect(JSON.parse(await page.locator("#output").textContent())).toEqual({ nchi: "Kenya", idadi: 2 });
  let file = await downloadText(page, "#downloadBtn"); expect(JSON.parse(file.content.toString("utf8"))).toEqual({ nchi: "Kenya", idadi: 2 });

  await page.goto("/sw/zana/kijaribu-regex/"); await page.locator("#patternInput").fill("\\d+"); await page.locator("#testInput").fill("Namba 123 na 456"); await page.locator("#testInput").dispatchEvent("input"); await expect(page.locator("#output")).toContainText("123");
  await page.goto("/sw/zana/cron/"); await page.locator("#cronInput").fill("*/5 * * * *"); await page.locator("#cronInput").dispatchEvent("input"); await expect(page.locator("#expressionOutput")).toContainText("*/5 * * * *");
  await page.goto("/sw/zana/kisimbuzi-jwt/"); await page.locator("#loadSample").click(); expect(JSON.parse(await page.locator("#payloadJson").textContent())).toHaveProperty("sub");
  await page.goto("/sw/zana/kizalishaji-uuid/"); await page.locator("#countInput").fill("2"); await page.locator("#generateBtn").click(); file=await downloadText(page,"#downloadJsonBtn"); const uuidExport=JSON.parse(file.content.toString("utf8")); expect(uuidExport.ids).toHaveLength(2); expect(uuidExport.ids[0]).toMatch(/^[0-9a-f-]{36}$/i); file=await downloadText(page,"#downloadCsvBtn"); expect(file.content.toString("utf8").trim().split(/\r?\n/).length).toBeGreaterThanOrEqual(3);
  await page.goto("/sw/zana/kilinganisha-maandishi/"); await page.locator("#text1").fill("moja\nmbili"); await page.locator("#text2").fill("moja\ntatu"); await page.locator("#text2").dispatchEvent("input"); await expect(page.locator("#diffOutput")).toContainText("tatu");
  await page.goto("/sw/zana/ukaguzi-contrast/"); await page.locator("#fgHex").fill("#000000"); await page.locator("#fgHex").dispatchEvent("input"); await page.locator("#bgHex").fill("#ffffff"); await page.locator("#bgHex").dispatchEvent("input"); await expect(page.locator("#ratioNum")).toContainText("21");

  await page.goto("/sw/zana/kiigaji-ussd/"); await page.locator("#flowEditor").fill(JSON.stringify({start:{text:"Menyu ya jaribio\n1. Endelea",options:{"1":{text:"Imekamilika",end:true}}}})); await page.evaluate(() => loadCustomFlow()); await expect(page.locator("#ussdText")).toContainText("Menyu ya jaribio"); await page.locator("#ussdInput").fill("1"); await page.evaluate(() => sendResponse()); await expect(page.locator("#ussdText")).toContainText("Imekamilika");
  let apiRequests=0; await page.route("https://api.example.test/**", async route=>{apiRequests++; await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,nchi:"Kenya"})});}); await page.goto("/sw/zana/kijaribu-api/"); expect(apiRequests).toBe(0); await page.locator("#url").fill("https://api.example.test/data"); await page.locator("#send-request").click(); await expect(page.locator("#response-body")).toContainText('"nchi": "Kenya"'); expect(apiRequests).toBe(1); expect(JSON.parse(await page.locator("#response-body").textContent())).toEqual({ok:true,nchi:"Kenya"});
  await page.goto("/sw/zana/uwanja-wa-sql/"); await expect(page.locator("#loading")).toBeHidden({timeout:20000}); await page.locator("#editor").fill("SELECT 1 AS value UNION ALL SELECT 2 AS value;"); await page.locator("#run-query").click(); await expect(page.locator("#results")).toContainText("2"); file=await downloadText(page,"#export-csv"); expect(file.content.toString("utf8").trim().split(/\r?\n/)).toHaveLength(3); file=await downloadText(page,"#export-db"); expect(file.content.subarray(0,16).toString("binary")).toBe("SQLite format 3\u0000"); const reopened=await page.evaluate(async(base64)=>{const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const sqlite=await initSqlJs({locateFile:file=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`});const reopenedDb=new sqlite.Database(bytes);return reopenedDb.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0].values.flat();},file.content.toString("base64")); expect(reopened.length).toBeGreaterThan(0);
  await page.goto("/sw/zana/kizalishaji-gradient-css/"); await page.locator("#angle").fill("45"); await page.locator("#angle").dispatchEvent("input"); await expect(page.locator("#codeOutput")).toContainText("45deg");
  await page.goto("/sw/zana/kizalishaji-meta/"); await page.locator("#metaForm button[type=submit]").click(); const metaCode=await page.locator("#output").textContent(); expect(metaCode).toContain('<link rel="canonical"'); file=await downloadText(page,"#jsonBtn"); expect(JSON.parse(file.content.toString("utf8")).code).toBe(metaCode);

  await page.goto("/sw/zana/kizalishaji-htaccess/"); await page.locator("#domain").fill("example.test"); await page.getByRole("button",{name:/\.htaccess/i}).first().click(); await expect(page.locator("#output")).toHaveValue(/RewriteEngine/); file=await downloadText(page,'button[onclick="downloadFile()"]'); expect(file.content.toString("utf8")).toContain("RewriteEngine");
  await page.goto("/sw/zana/kizalishaji-robots-txt/"); await page.locator("#sitemap").fill("https://example.test/sitemap.xml"); await page.locator("#sitemap").dispatchEvent("input"); await expect(page.locator("#output")).toContainText("User-agent"); file=await downloadText(page,'button[onclick="download()"]'); expect(file.content.toString("utf8")).toContain("User-agent:");
  await page.goto("/sw/zana/kizalishaji-sitemap/"); await page.locator("#baseUrl").fill("https://example.test"); await page.locator("#urlInput").fill("/\n/zana"); await page.getByRole("button",{name:/sitemap/i}).first().click(); await expect(page.locator("#xmlOutput")).toContainText("<urlset"); file=await downloadText(page,'button[onclick="downloadXML()"]'); expect(file.content.toString("utf8")).toMatch(/<urlset[\s\S]*<loc>https:\/\/example\.test\/zana<\/loc>/);
  await page.goto("/sw/zana/kizalishaji-nenosiri/"); await page.locator("#pwLen").fill("20"); await page.evaluate(() => generate()); expect((await page.locator("#pwOutput").textContent()).trim()).toHaveLength(20);
  await page.goto("/sw/zana/kirekebisha-sql/"); await page.locator("#sqlInput").fill("select id from users where active=1"); await page.evaluate(() => formatSQL()); await expect(page.locator("#sqlOutput")).toHaveValue(/SELECT[\s\S]*FROM/); file=await downloadText(page,'button[onclick="downloadOutput()"]'); expect(file.content.toString("utf8")).toMatch(/SELECT[\s\S]*FROM/);
  await page.goto("/sw/zana/kizalishaji-meta-tags/"); await page.locator("#title").fill("Zana za API Kenya"); await page.locator("#desc").fill("Mwongozo wa mfano wa zana za API kwa developer wa Kenya."); await page.locator("#url").fill("https://example.test/api"); await page.locator("#url").dispatchEvent("input"); const fullMeta=await page.locator("#codeOutput").textContent(); expect(fullMeta).toMatch(/<title>Zana za API Kenya<\/title>[\s\S]*og:url/);
  await page.goto("/sw/zana/saraka-ya-api-afrika/"); await page.locator("#search").fill("Paystack"); await expect(page.locator("#api-grid")).toContainText("Paystack");
  await page.goto("/sw/zana/vikoa-vya-afrika/"); await page.locator("#domain-name").fill("afrotools"); await page.locator("#domain-name").dispatchEvent("input"); expect(await page.locator("#results-tbody tr").count()).toBeGreaterThan(0);
  await page.goto("/sw/zana/kizalishaji-ujumbe-wa-commit/"); await page.locator("#scope").fill("api"); await page.locator("#description").fill("ongeza uthibitishaji wa nchi"); await page.locator("#description").dispatchEvent("input"); await expect(page.locator("#output-main")).toContainText("feat(api): ongeza uthibitishaji wa nchi");
  await page.goto("/sw/zana/kituo-cha-developer/"); await page.locator("#dev-search").fill("JSON"); await expect(page.locator("#tool-grid")).toContainText("JSON");
  await page.goto("/sw/zana/kizalishaji-docker-compose/"); await page.locator("#project").fill("afro-demo"); await page.locator("#project").dispatchEvent("input"); await expect(page.locator("#compose-code")).toContainText("services:"); await expect(page.locator("#compose-code")).toContainText("afro-demo");
  await page.goto("/sw/zana/kulinganisha-hosting/"); await page.locator("#budget").fill("25"); await page.locator("#budget").dispatchEvent("input"); await expect(page.locator("#best-title")).not.toHaveText(""); file=await downloadText(page,"#download-json"); const hosting=JSON.parse(file.content.toString("utf8")); expect(hosting.best.id).toBeTruthy(); expect(hosting.ranked.length).toBeGreaterThan(0); expect(hosting.state.budget).toBe(25);
  await page.goto("/sw/zana/kizalishaji-pwa-manifest/"); await page.locator("#app-name").fill("Afro Demo"); await page.locator("#app-name").dispatchEvent("input"); const pwa=JSON.parse(await page.locator("#manifest-code").textContent()); expect(pwa.name).toBe("Afro Demo");
  await page.goto("/sw/zana/mjenzi-mtiririko-ussd/"); await page.locator("#flow-name").fill("Malipo Demo"); await page.locator("#flow-name").dispatchEvent("input"); file=await downloadText(page,"#export-flow"); const flow=JSON.parse(file.content.toString("utf8")); expect(JSON.stringify(flow)).toContain("Malipo Demo");
});
