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
    const result = JSON.parse(await page.locator("[data-output]").textContent());
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

    await page.locator("[data-agri-form] button[type=reset]").click();
    await expect(page.locator("[data-result]")).toBeHidden();
    await page.locator("#scenario").fill("{");
    await page.locator("[data-agri-form] button[type=submit]").click();
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
