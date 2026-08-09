const { test, expect } = require("@playwright/test");
const receipt = require("../../data/localization/sw-financial-shard-a-candidate.json");

const accepted = receipt.rows.filter((row) => row.status === "accepted");

for (const [index, candidate] of accepted.entries()) {
  test(`${candidate.englishId}: native Swahili mobile, theme, focus and privacy smoke`, async ({ page }) => {
    const errors = [];
    const nonGet = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("request", (request) => {
      if (request.method() !== "GET" && request.url().startsWith("http://127.0.0.1:43181")) nonGet.push(`${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width: index % 2 ? 320 : 375, height: 812 });
    await page.goto(`${candidate.swahiliRoute.replace(/\/$/, "")}/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "sw");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /afrotools\.com\/sw\//);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; document.documentElement.dataset.theme = "dark"; });
    const reflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll("body *")).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: String(element.className || ""), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
      }).filter((item) => item.right > document.documentElement.clientWidth + 1 || item.left < -1).sort((a, b) => b.right - a.right).slice(0, 8),
    }));
    expect(reflow.delta, JSON.stringify(reflow.offenders)).toBeLessThanOrEqual(1);
    const control = page.locator('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])').first();
    await control.focus();
    await expect(control).toBeFocused();
    expect(nonGet).toEqual([]);
    expect(errors.filter((message) => !/favicon|ERR_ABORTED|Failed to load resource/i.test(message))).toEqual([]);
  });
}
