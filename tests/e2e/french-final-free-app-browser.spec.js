const { test, expect } = require("@playwright/test");
const fs = require("fs");
const pdfParse = require("pdf-parse");

async function downloadText(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const download = await pending;
  return {
    download,
    path: await download.path(),
    text: fs.readFileSync(await download.path(), "utf8")
  };
}

async function installPrivacyWatch(page) {
  const consoleErrors = [];
  const writes = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  await page.route("https://**/*", (route) => route.fulfill({ status: 204, body: "" }));
  return { consoleErrors, writes };
}

async function assertPresentation(page) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  }
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.fontSize = "200%";
  });
  const reflow = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    wide: [...document.querySelectorAll("body *")].filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
    }).slice(0, 8).map((node) => ({ tag: node.tagName, className: node.className, text: (node.textContent || "").trim().slice(0, 60), rect: node.getBoundingClientRect().toJSON() })),
    bodyWidth: document.body.scrollWidth,
    overflowers: [...document.querySelectorAll("body *")].filter((node) => node.scrollWidth > node.clientWidth + 1).slice(0, 12).map((node) => ({ tag: node.tagName, className: node.className, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
  }));
  expect(reflow.fits, JSON.stringify(reflow)).toBe(true);
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(dark).not.toBe(light);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
}

test("native French BOQ calculates, fails closed, reopens JSON and exports", async ({ page }) => {
  const privacy = await installPrivacyWatch(page);
  await page.goto("/fr/tools/generateur-boq/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toContainText("Bordereau quantitatif");
  await expect(page.locator("body")).not.toContainText("Informations et hypothèses du calcul");

  await page.locator("#floorArea").fill("-1");
  await page.getByRole("button", { name: /Générer le bordereau quantitatif/i }).click();
  await expect(page.locator("#priceNote")).toContainText("dimensions et quantités positives");
  await expect(page.locator("#floorArea")).toHaveAttribute("aria-invalid", "true");

  await page.locator("#floorArea").fill("120");
  await page.getByRole("button", { name: /Générer le bordereau quantitatif/i }).click();
  const firstTotal = await page.locator("#sumTotal").textContent();
  await expect(page.locator("#boqTableWrap table")).toBeVisible();
  await page.locator("#floorArea").fill("200");
  await page.getByRole("button", { name: /Générer le bordereau quantitatif/i }).click();
  await expect(page.locator("#sumTotal")).not.toHaveText(firstTotal);

  const jsonPending = page.waitForEvent("download");
  await page.locator("[data-fr-engineering-export]").click();
  const json = await jsonPending;
  const jsonPath = await json.path();
  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  expect(payload.owner).toBe("boq-gen");
  expect(payload.inputs.floorArea).toBe("200");
  await page.locator("#floorArea").fill("300");
  await page.locator("[data-fr-engineering-import]").setInputFiles(jsonPath);
  await expect(page.locator("#floorArea")).toHaveValue("200");
  await expect(page.locator("[data-fr-engineering-runtime-status]")).toContainText("rouvert localement");

  const csv = await downloadText(page, ".export-btn.csv");
  expect(csv.download.suggestedFilename()).toMatch(/^boq-.*\.csv$/);
  expect(csv.text).toContain("Poste,Description");
  expect(csv.text).toContain("TOTAL GÉNÉRAL");

  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await page.locator(".export-btn.print").click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  const printedPdf = await page.pdf({ format: "A4" });
  expect(printedPdf.subarray(0, 4).toString()).toBe("%PDF");
  expect((await pdfParse(printedPdf)).text).toContain("Bordereau quantitatif");

  await assertPresentation(page);
  expect(privacy.consoleErrors).toEqual([]);
  expect(privacy.writes).toEqual([]);
});

test("native French Export Docs mutates, reopens JSON and parses every export", async ({ page }) => {
  const privacy = await installPrivacyWatch(page);
  await page.goto("/fr/tools/documents-export/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#exportCountry option")).not.toHaveCount(0);

  await page.locator("#exportCountry").selectOption({ index: 0 });
  await page.locator("#productCat").selectOption({ index: 0 });
  await page.locator("#exportDest").selectOption({ index: 0 });
  await page.getByRole("button", { name: "Calculer et vérifier" }).click();
  await expect(page.locator("[data-trade-result]")).toBeVisible();
  const firstSummary = await page.locator("[data-trade-summary]").textContent();
  await page.locator("#exportCountry").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Calculer et vérifier" }).click();
  await expect(page.locator("[data-trade-summary]")).not.toHaveText(firstSummary);

  const json = await downloadText(page, '[data-export="json"]');
  const payload = JSON.parse(json.text);
  expect(payload.tool).toBe("export-documents");
  expect(payload.locale).toBe("fr");
  const originalCountry = payload.inputs.exportCountry;
  await page.locator("#exportCountry").selectOption({ index: 0 });
  await page.locator("[data-import-json]").setInputFiles(json.path);
  await expect(page.locator("#exportCountry")).toHaveValue(originalCountry);
  await expect(page.locator("[data-trade-status]")).toContainText("rouvert localement");

  const csv = await downloadText(page, '[data-export="csv"]');
  expect(csv.text).toContain('"Section","Libellé","Valeur"');
  const txt = await downloadText(page, '[data-export="txt"]');
  expect(txt.text).toContain("Checklist documentaire export");
  expect(txt.text).toContain("Généré localement");
  const pdfPending = page.waitForEvent("download");
  await page.locator('[data-export="pdf"]').click();
  const pdf = await pdfPending;
  const pdfBuffer = fs.readFileSync(await pdf.path());
  expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  expect((await pdfParse(pdfBuffer)).text).toContain("Checklist documentaire export");

  await page.locator("#exportCountry").evaluate((select) => { select.value = ""; });
  await page.getByRole("button", { name: "Calculer et vérifier" }).click();
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");

  await assertPresentation(page);
  expect(privacy.consoleErrors).toEqual([]);
  expect(privacy.writes).toEqual([]);
});
