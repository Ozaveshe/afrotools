const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");

test("a buyer compares shipping modes, downloads the estimate and reopens it", async ({ page }) => {
  await page.goto("/sw/zana/makisio-ya-usafirishaji-wa-biashara/", { waitUntil: "domcontentloaded" });
  const form = page.locator("[data-trade-form]");
  const result = page.locator("[data-result]");
  const size = form.getByLabel("Aina ya mzigo wa baharini");
  const calculate = form.getByRole("button", { name: "Kokotoa ndani" });
  await expect(form.locator("textarea")).toHaveCount(0);
  await calculate.click();
  await expect(result).toContainText("Shanghai → Mombasa");
  await expect(result).toContainText("1,200–2,500");
  await expect(result).toContainText("300–550");
  await expect(result).toContainText("25–40 siku");
  await expect(result).toContainText("4–8 siku");
  await size.selectOption("40ft");
  await expect(result).toBeHidden();
  await expect(form.locator('[name="weightKg"]')).toBeHidden();
  await calculate.click();
  await expect(result).toContainText("2,000–4,000");
  await expect(result).toContainText("Hakuna makisio ya anga");
  await size.selectOption("LCL");
  await form.getByLabel("Ujazo wa mzigo wa pamoja (m³)").fill("3.5");
  await form.getByLabel("Uzito wa mzigo kwa makisio ya anga (kg)").fill("180");
  await calculate.click();
  await expect(result).toContainText("140–280");
  await expect(result).toContainText("540–990");
  let payload;
  for (const format of ["json", "csv", "txt", "pdf"]) {
    const download = page.waitForEvent("download");
    await result.locator('[data-export="' + format + '"]').click();
    const file = await download;
    const bytes = await fs.readFile(await file.path());
    if (format === "json") {
      payload = JSON.parse(bytes.toString());
      expect(payload.input.cbm).toBe(3.5);
      expect(payload.result.air.minUSD).toBe(540);
    } else if (format === "pdf") expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    else expect(bytes.toString()).toContain("Gharama ya baharini");
  }
  await form.getByLabel("Bandari ya kuondokea").selectOption("NGAPP");
  await expect(form.locator('[name="destCode"] option[value="KEMBA"]')).toHaveCount(0);
  await expect(form.locator('[name="originCode"] option[value="CNNGB"]')).toHaveCount(0);
  const openReport = async data => page.locator("[data-import]").setInputFiles({
    name: "usafirishaji.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(data))
  });
  payload.result.sea.minUSD = 1;
  await openReport(payload);
  await expect(result).toContainText("140–280");
  await expect(form.getByLabel("Bandari ya kuondokea")).toHaveValue("CNSHA");
  const legacy = { ...payload, input: { originCode: "CNSHA", destCode: "KEMBA", containerType: "20ft", cbm: 5, weightKg: 100 } };
  await openReport(legacy);
  await expect(result).toContainText("1,200–2,500");
  await expect(result).toContainText("300–550");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  payload.input.destCode = "UNKNOWN";
  await openReport(payload);
  await expect(result).toBeHidden();
  await expect(page.locator("[data-status]")).toContainText("Hakuna bei");
});
