const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdf = require("pdf-parse");
const os = require("os");
const path = require("path");

async function organize(page, route, currency) {
  await page.goto(route);
  await page.fill("#incidentLabel", "Unexpected support message");
  await page.fill("#incidentDate", "2026-07-20");
  await page.fill("#platform", "Example service");
  await page.fill("#contactReference", "Case reference 12");
  await page.check("[name=redFlag]", { position:{x:5,y:5} });
  await page.fill("#evidenceNotes", "screenshot-1.png\ntransaction receipt");
  await page.fill("#timelineNotes", "09:15 first message\n10:05 official support contacted");
  await page.fill("#currencyCode", currency);
  const row = page.locator(".scam-loss-row").first();
  await row.locator("input").nth(0).fill("Transfer");
  await row.locator("input").nth(1).fill("1200");
  await page.locator("#scamEvidenceForm").evaluate(form => form.requestSubmit());
  await expect(page.locator("#scamEvidenceResults")).toHaveAttribute("data-result-settled", "true");
}

test("English organizer is private, deterministic and mobile-overlay safe", async ({ page }, testInfo) => {
  await page.setViewportSize({ width:375, height:900 });
  await page.emulateMedia({ colorScheme:"dark", reducedMotion:"reduce" });
  const inputRequests = [];
  let entering = false;
  page.on("request", request => {
    if (entering && ["fetch","xhr"].includes(request.resourceType())) {
      inputRequests.push({url:request.url(),method:request.method(),body:request.postData()});
    }
  });
  entering = true;
  await organize(page, "/crypto/scam-checker/", "NGN");
  await expect(page.locator("#scamEvidenceResults")).toContainText("6 / 6");
  await expect(page.locator("#scamEvidenceResults")).toContainText("NGN");
  await expect(page.locator("#scamEvidenceResults")).toContainText("never declares");
  await expect(page.locator("#scamEvidenceResults")).toBeFocused();
  const entryPosition = await page.evaluate(() => {
    const result=document.querySelector("#scamEvidenceResults").getBoundingClientRect();
    const navbar=document.querySelector("afro-navbar").getBoundingClientRect();
    const hero=document.querySelector(".scam-result-hero").getBoundingClientRect();
    return {
      resultTop:result.top,
      navbarBottom:Math.max(0,navbar.bottom),
      heroVisible:hero.top>=0&&hero.bottom<=window.innerHeight
    };
  });
  expect(entryPosition.resultTop).toBeGreaterThanOrEqual(entryPosition.navbarBottom+8);
  expect(entryPosition.heroVisible).toBe(true);
  expect(inputRequests.filter(request => /crypto-scam|supabase|scam-checker/.test(request.url) && !request.url.includes("/crypto/scam-checker/"))).toEqual([]);
  expect(await page.locator("#scamEvidenceForm input,#scamEvidenceForm textarea").evaluateAll(nodes => nodes.every(node => node.labels?.length || node.getAttribute("aria-label")))).toBe(true);
  const overlay = await page.evaluate(() => {
    const cookie=document.querySelector("#afro-cookie-consent"), assistant=document.querySelector("afro-site-assistant");
    const critical=[document.querySelector(".scam-result-hero"),document.querySelector(".scam-metrics"),document.querySelector(".scam-boundary"),...document.querySelectorAll(".scam-actions button")].filter(Boolean).filter(node=>{const r=node.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight;});
    const exportActions=[...document.querySelectorAll(".scam-actions button")];
    const hit=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width>0&&x.height>0&&y.width>0&&y.height>0&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;};
    const cookieHits=cookie?critical.filter(node=>hit(cookie,node)).map(node=>node.className||node.textContent.trim().slice(0,30)):[];
    const cookieActionHits=cookie?exportActions.filter(node=>hit(cookie,node)).map(node=>node.textContent.trim()):[];
    return {cookieCritical:cookieHits.length>0,cookieHits,cookieActionHits,assistantCritical:assistant?critical.some(node=>hit(assistant,node)):false,assistantSuppressed:cookie&&assistant?assistant.getBoundingClientRect().width===0:true,cookieActionsContained:cookie?[...cookie.querySelectorAll(".afro-cc-actions > *")].every(node=>{const outer=cookie.getBoundingClientRect(),inner=node.getBoundingClientRect();return inner.left>=outer.left&&inner.right<=outer.right;}):true,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  expect(overlay).toEqual({cookieCritical:false,cookieHits:[],cookieActionHits:[],assistantCritical:false,assistantSuppressed:true,cookieActionsContained:true,overflow:0});
  await page.screenshot({path:path.join(os.tmpdir(),"crypto-scam-evidence-375-dark.png")});
  await page.fill("#incidentLabel", "Changed");
  await expect(page.locator("[data-scam-export=json]")).toBeDisabled();
  await expect(page.locator("#scamEvidenceStatus")).toContainText("stale");
});

test("French route is native parity and invalid inputs fail closed", async ({ page }) => {
  await page.setViewportSize({ width:768, height:900 });
  await organize(page, "/fr/crypto/scam-checker/", "XOF");
  await expect(page.locator("html")).toHaveAttribute("lang","fr");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("#scamEvidenceResults")).toContainText("6 / 6");
  await expect(page.locator("#scamEvidenceStatus")).toContainText("Aucune donnée");
  const settledGeometry=await page.evaluate(() => {
    const cookie=document.querySelector("#afro-cookie-consent");
    const assistant=document.querySelector("afro-site-assistant");
    const result=document.querySelector("#scamEvidenceResults").getBoundingClientRect();
    const navbar=document.querySelector("afro-navbar").getBoundingClientRect();
    const hero=document.querySelector(".scam-result-hero").getBoundingClientRect();
    const actions=[...document.querySelectorAll(".scam-actions button")];
    const hit=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width>0&&x.height>0&&y.width>0&&y.height>0&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;};
    return {
      resultTop:result.top,
      navbarBottom:Math.max(0,navbar.bottom),
      heroVisible:hero.top>=0&&hero.bottom<=window.innerHeight,
      cookieActionHits:cookie?actions.filter(node=>hit(cookie,node)).map(node=>node.textContent.trim()):[],
      cookieRect:cookie?(()=>{const r=cookie.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};})():null,
      actionRects:actions.map(node=>{const r=node.getBoundingClientRect();return {text:node.textContent.trim(),top:r.top,bottom:r.bottom,left:r.left,right:r.right};}),
      actionGrid:getComputedStyle(document.querySelector(".scam-actions")).gridTemplateColumns,
      innerWidth:window.innerWidth,
      actionStyleAttribute:document.querySelector(".scam-actions").getAttribute("style"),
      assistantActionHits:assistant?actions.filter(node=>hit(assistant,node)).map(node=>node.textContent.trim()):[],
      cookieActionsContained:cookie?[...cookie.querySelectorAll(".afro-cc-actions > *")].every(node=>{const outer=cookie.getBoundingClientRect(),inner=node.getBoundingClientRect();return inner.left>=outer.left&&inner.right<=outer.right;}):true,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  expect(settledGeometry.resultTop).toBeGreaterThanOrEqual(settledGeometry.navbarBottom+8);
  expect(settledGeometry.heroVisible).toBe(true);
  expect(settledGeometry.cookieActionHits,JSON.stringify(settledGeometry)).toEqual([]);
  expect(settledGeometry.assistantActionHits).toEqual([]);
  expect(settledGeometry.cookieActionsContained).toBe(true);
  expect(settledGeometry.actionGrid.trim().split(/\s+/)).toHaveLength(4);
  expect(settledGeometry.overflow).toBe(0);
  await page.screenshot({path:path.join(os.tmpdir(),"crypto-scam-evidence-fr-768-light.png")});
  await page.fill("#currencyCode","XX");
  await page.click(".scam-submit");
  await expect(page.locator("[data-scam-export=pdf]")).toBeDisabled();
});

test("manual theme choice overrides the operating-system preference", async ({ page }) => {
  await page.emulateMedia({colorScheme:"light"});
  await page.goto("/crypto/scam-checker/");
  await page.getByRole("button",{name:"Switch to dark mode"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  const manualDark=await page.locator(".scam-warning").evaluate(node=>getComputedStyle(node).backgroundColor);

  await page.emulateMedia({colorScheme:"dark"});
  await page.getByRole("button",{name:"Switch to light mode"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  const manualLight=await page.locator(".scam-warning").evaluate(node=>getComputedStyle(node).backgroundColor);
  expect(manualDark).not.toBe(manualLight);
  expect(manualDark).toBe("rgb(52, 27, 27)");
  expect(manualLight).toBe("rgb(255, 243, 243)");
});

test("JSON text parser-readable PDF and print remain local", async ({ page }) => {
  await organize(page, "/crypto/scam-checker/", "NGN");
  for (const type of ["json","txt"]) {
    const pending=page.waitForEvent("download");
    await page.click(`[data-scam-export=${type}]`);
    const item=await pending;
    expect(item.suggestedFilename()).toContain(`.${type}`);
  }
  const pendingPdf=page.waitForEvent("download");
  await page.click("[data-scam-export=pdf]");
  const pdfDownload=await pendingPdf;
  const pdfBuffer=fs.readFileSync(await pdfDownload.path());
  expect(pdfBuffer.subarray(0,4).toString()).toBe("%PDF");
  const parsed=await pdf(pdfBuffer);
  expect(parsed.text).toContain("Private crypto incident evidence pack");
  expect(parsed.text).toContain("Unexpected support message");
  expect(parsed.text).toContain("Urgency or threat");
  expect(parsed.text).toContain("09:15 first message");
  expect(parsed.text).toContain("never declares");
  expect(parsed.text).toMatch(/NGN\s*1,200\.00/);
  await page.evaluate(()=>{window.__printed=false;window.print=()=>{window.__printed=true;};});
  await page.click("[data-scam-export=print]");
  expect(await page.evaluate(()=>window.__printed)).toBe(true);
});
