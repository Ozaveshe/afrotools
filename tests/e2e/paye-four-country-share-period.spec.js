const { test, expect } = require("@playwright/test");

for (const [country, code] of [["malawi", "mw"], ["botswana", "bw"], ["mauritius", "mu"], ["namibia", "na"]]) {
  test(country + " shares the displayed pay period after recalculation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: async data => { window.shared = data; } });
      Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copied = text; } } });
    });
    const path = "/" + country + "/" + code + "-paye";
    await page.goto(path);
    await page.locator("#grossSalary").fill("120000");
    const calculate = page.locator(".calc-btn").first();
    const share = page.locator("#" + code + "ShareBtn");
    await calculate.press("Enter");
    for (const [name, unit] of [["Annual", "year"], ["Monthly", "month"]]) {
      await page.getByRole("button", { name, exact: true }).press("Enter");
      await calculate.press("Enter");
      await expect(page.locator(".res-hero-label").first()).toContainText(name);
      const net = await page.locator("#resAmount").innerText();
      await share.press("Enter");
      const payload = await page.evaluate(() => window.shared);
      expect(payload.text).toContain(net + "/" + unit);
      expect(payload.url).toBe("https://afrotools.com" + path);
    }
    await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined }));
    await share.press("Enter");
    expect(await page.evaluate(() => window.copied)).toBe(await page.evaluate(() => window.shared.text));
  });
}
