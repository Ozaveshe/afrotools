const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { apps } = require("../../scripts/build-sw-trade-core-parity.js");

test.describe.configure({ mode: "serial" });
test.setTimeout(120000);

for (const app of apps) {
  test(`${app.id}: engine, stale clearing, exports and reopen`, async ({ page }) => {
    const errors = [];
    const rawLeak = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/sw/zana/${app.slug}/`);
    page.on("request", request => {
      const body = request.postData() || "";
      if (body.includes("Biashara ya Mfano") || request.url().includes("Biashara%20ya%20Mfano")) rawLeak.push(request.url());
    });
    await page.locator("[data-trade-form] button[type=submit]").click();
    await expect(page.locator("[data-result]")).toBeVisible();
    const result = await page.evaluate(() => window.__SW_TRADE_CORE_TEST__.getLatest());
    expect(result).toBeTruthy();
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
        await page.locator("[data-import]").setInputFiles(file);
        await expect(page.locator("[data-status]")).toContainText("imefunguliwa");
      } else if (format === "csv") expect(bytes.toString("utf8")).toContain("sehemu,thamani");
      else if (format === "txt") expect(bytes.toString("utf8")).toContain("Chanzo:");
      else expect(bytes.subarray(0,4).toString("ascii")).toBe("%PDF");
    }
    await page.locator("[name=scenario]").fill("{");
    await page.locator("[data-trade-form] button[type=submit]").click();
    await expect(page.locator("[data-result]")).toBeHidden();
    await page.locator("[data-trade-form] button[type=reset]").click();
    await expect(page.locator("[data-result]")).toBeHidden();
    expect(rawLeak).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("core Trade candidates reflow in light and dark at 320, 375 and 200%", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 800 });
      for (const app of apps) {
        await page.goto(`/sw/zana/${app.slug}/`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      }
    }
  }
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto(`/sw/zana/${apps[0].slug}/`);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
