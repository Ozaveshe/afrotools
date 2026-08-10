const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const ROUTE = "/sw/zana/mpangaji-ramani-ya-sakafu/";

async function prepare(page, width = 375) {
  const errors = [];
  const writes = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !/favicon|font/i.test(message.text())) errors.push(message.text()); });
  page.on("request", request => { if (!/^(GET|HEAD)$/.test(request.method())) writes.push(request.method() + " " + request.url()); });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#fpWorkspace")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.FPCanvas && window.FPApp && window.FPExportSuite && window.FPSwahiliExport))).toBeTruthy();
  return { errors, writes };
}

async function seed(page) {
  await page.evaluate(() => {
    const objects = [
      { type:"wall", x1:0, y1:0, x2:4, y2:0, thickness:.15, material:"block" },
      { type:"wall", x1:4, y1:0, x2:4, y2:3, thickness:.15, material:"block" },
      { type:"wall", x1:4, y1:3, x2:0, y2:3, thickness:.15, material:"block" },
      { type:"wall", x1:0, y1:3, x2:0, y2:0, thickness:.15, material:"block" },
      { type:"room", name:"Chumba cha jaribio", points:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}], area:12, color:"rgba(37,99,235,.06)" },
      { type:"door", x:1, y:0, width:.9, angle:0, subtype:"single" },
      { type:"window", x:4, y:1.4, width:1.2, angle:90, subtype:"double" },
      { type:"furniture", label:"Kitanda", subtype:"bed", x:.5, y:.7, w:1.5, h:1.9, rotation:0 },
      { type:"dimension", x1:0, y1:3.4, x2:4, y2:3.4 },
      { type:"label", x:2, y:1.5, text:"Chumba" }
    ];
    FPApp.loadPlanData({ objects });
    FPCanvas.fitAll();
  });
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects().length)).toBe(10);
}

async function download(page, selector) {
  const result = await Promise.all([page.waitForEvent("download"), page.locator(selector).click()]);
  const path = await result[0].path();
  return { name: result[0].suggestedFilename(), path, bytes: fs.readFileSync(path) };
}

test("native Sw workspace manipulates, saves, restores, imports and stays local", async ({ page }) => {
  const proof = await prepare(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "https://afrotools.com/sw/zana/mpangaji-ramani-ya-sakafu/");
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", /afroplan-floor-planner\.webp$/);
  await expect(page.locator("link[hreflang=en]")).toHaveAttribute("href", "https://afrotools.com/engineering/floor-planner/");
  await expect(page.locator("link[hreflang=fr]")).toHaveAttribute("href", "https://afrotools.com/fr/ingenierie/planificateur-etage/");
  await seed(page);
  expect(await page.evaluate(() => [...new Set(FPCanvas.getObjects().map(item => item.type))].sort())).toEqual(["dimension","door","furniture","label","room","wall","window"]);

  await page.evaluate(() => { FPCanvas.pushUndo(); FPCanvas.addObject({ type:"furniture", label:"Kiti", subtype:"chair", x:2, y:2, w:.5, h:.5 }); });
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects().length)).toBe(11);
  await page.locator("#fpUndo").click();
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects().length)).toBe(10);
  await page.locator("#fpRedo").click();
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects().length)).toBe(11);
  await page.locator("#fpCanvas").focus();
  await page.keyboard.press("w");
  await expect.poll(() => page.evaluate(() => FPApp.currentTool)).toBe("wall");
  await page.keyboard.press("v");
  await expect.poll(() => page.evaluate(() => FPApp.currentTool)).toBe("select");

  page.once("dialog", dialog => dialog.accept("Nyumba ya Jaribio"));
  await page.evaluate(() => FPApp.saveProject());
  const saved = await page.evaluate(() => ({ id:FPApp.projectId, list:JSON.parse(localStorage.getItem("afro_fp_list") || "[]") }));
  expect(saved.id).toBeTruthy();
  expect(saved.list[0].name).toBe("Nyumba ya Jaribio");
  await page.evaluate(id => { FPCanvas.clearAll(); FPApp.loadProject(id); }, saved.id);
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects().length)).toBe(11);

  const share = await page.evaluate(() => btoa(unescape(encodeURIComponent(JSON.stringify(FPApp.exportPlanData())))));
  await page.goto(ROUTE + "#plan=" + share, { waitUntil:"domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.FPCanvas && FPCanvas.getObjects().length)).toBe(11);
  await page.goto(ROUTE + "#plan=not-valid-base64", { waitUntil:"domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.FPCanvas && window.FPApp))).toBeTruthy();
  expect(proof.writes).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test("every advertised Sw export is downloaded and parsed or reopened", async ({ page }) => {
  const proof = await prepare(page, 1280);
  await seed(page);
  const packet = await page.evaluate(() => ({ count:FPSwahiliExport.packet().plan.objects.length, width:FPSwahiliExport.packet().planCanvas.width, height:FPSwahiliExport.packet().planCanvas.height, total:FPSwahiliExport.packet().boq.total }));
  expect(packet.count).toBe(10);
  expect(packet.width).toBeGreaterThan(500);
  expect(packet.height).toBeGreaterThan(300);
  expect(packet.total).toBeGreaterThan(0);

  const png = await download(page, "#fpExportPlanPng");
  expect(png.name).toMatch(/-ramani\.png$/);
  expect(png.bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const pngInfo = await page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type:"image/png" }));
    return { width:bitmap.width, height:bitmap.height };
  }, png.bytes.toString("base64"));
  expect(pngInfo).toEqual({ width:packet.width, height:packet.height });

  const pack = await download(page, "#fpExportPackPdf");
  expect(pack.name).toMatch(/-kifurushi\.pdf$/);
  expect(pack.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  const packText = (await pdfParse(pack.bytes)).text;
  expect(packText).toMatch(/Kifurushi cha ramani na BOQ/);
  expect(packText).toMatch(/Muhtasari wa BOQ/);

  await page.locator("#fpExportBoqData").click();
  await expect(page.locator("#fpCostModal")).toBeVisible();
  const csv = await download(page, "#fpBoqCsv");
  expect(csv.bytes.toString("utf8")).toMatch(/^Kipengele,Kiasi,Kipimo,Bei,Sarafu,Jumla,Chanzo,Onyo/m);
  const json = await download(page, "#fpCostJson");
  const reopened = JSON.parse(json.bytes.toString("utf8"));
  expect(reopened.schema).toBe("afrotools-floor-plan-boq-sw-v1");
  expect(reopened.plan.objects).toHaveLength(10);
  expect(reopened.boq.items.length).toBeGreaterThan(4);
  const html = await download(page, "#fpBoqPrintHtml");
  const htmlText = html.bytes.toString("utf8");
  expect(htmlText).toMatch(/<html lang="sw">/);
  expect(htmlText).toMatch(/data:image\/png;base64/);
  expect(htmlText).toMatch(/BOQ ya kupanga/);
  const boqPdf = await download(page, "#fpBoqPdf");
  expect((await pdfParse(boqPdf.bytes)).text).toMatch(/AfroPlan - BOQ ya kupanga/);
  const xlsx = await download(page, "#fpBoqXlsx");
  expect(xlsx.bytes.subarray(0, 2).toString()).toBe("PK");
  const sheets = await page.evaluate(encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const book = XLSX.read(bytes, { type:"array" });
    return { names:book.SheetNames, rows:XLSX.utils.sheet_to_json(book.Sheets.BOQ) };
  }, xlsx.bytes.toString("base64"));
  expect(sheets.names).toEqual(["BOQ", "Vyumba", "Muhtasari"]);
  expect(sheets.rows.length).toBeGreaterThan(4);
  expect(proof.writes).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test("320/375 and 200% reflow, themes, keyboard focus and modal semantics hold", async ({ page }) => {
  const proof = await prepare(page, 320);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height:900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; document.documentElement.setAttribute("data-theme", "dark"); });
  expect(await page.locator("#fpWorkspace").evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await page.locator("#fpMobileFab").focus();
  await expect(page.locator("#fpMobileFab")).toBeFocused();
  await seed(page);
  await page.setViewportSize({ width:1280, height:900 });
  await page.locator("#fpExportBoqData").click();
  await expect(page.locator("#fpCostModal")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#fpCostModal")).toHaveAttribute("aria-modal", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#fpCostModal")).toBeHidden();
  expect(proof.errors).toEqual([]);
});

test("authoritative English workspace remains operational", async ({ page }) => {
  await page.goto("/engineering/floor-planner/", { waitUntil:"domcontentloaded" });
  await expect(page.locator("#fpWorkspace")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.FPCanvas && window.FPApp && window.FPExportSuite))).toBeTruthy();
  await page.locator(".fp-project-drawer summary").click();
  await page.locator("[data-safe-template='qa-4x3-fixture']").click();
  await expect.poll(() => page.evaluate(() => FPCanvas.getObjects("room").length)).toBe(1);
  expect(await page.evaluate(() => FPExportSuite.buildExportPacket().plan.objects.length)).toBe(5);
});
