const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { pages } = require("../../scripts/build-sw-trade-regional-parity.js");

test.describe.configure({ mode: "serial" });
test.setTimeout(120000);

for (const app of pages) {
  test(`${app.id}: calculate and parse every advertised export`, async ({ page }) => {
    const errors = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/sw/zana/${app.slug}/`);
    if (app.id === "commodity-tracker") await page.locator("[name=country]").selectOption({ index: 1 });
    if (app.id === "eac-cet") await page.locator("[name=query]").fill("maize");
    await page.locator("[data-trade-form] button[type=submit]").click();
    await expect(page.locator("[data-trade-result]")).toBeVisible();
    for (const format of ["json", "txt", "csv", "pdf"]) {
      const pending = page.waitForEvent("download");
      await page.locator(`[data-export=${format}]`).click();
      const download = await pending;
      const file = await download.path();
      const bytes = fs.readFileSync(file);
      expect(bytes.length).toBeGreaterThan(20);
      if (format === "json") {
        const payload = JSON.parse(bytes.toString("utf8"));
        expect(payload.tool).toBe(app.id);
        expect(payload.locale).toBe("sw");
        await page.locator("[data-import-json]").setInputFiles(file);
        await expect(page.locator("[data-trade-status]")).toContainText("imefunguliwa");
      } else if (format === "csv") expect(bytes.toString("utf8")).toContain("Sehemu");
      else if (format === "pdf") expect(bytes.subarray(0,4).toString("ascii")).toBe("%PDF");
    }
    await page.locator("[data-trade-form] button[type=reset]").click();
    await expect(page.locator("[data-trade-result]")).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test("regional Trade candidates reflow at 320, 375 and 200%", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    for (const app of pages) {
      await page.goto(`/sw/zana/${app.slug}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto(`/sw/zana/${pages[0].slug}/`);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
