const { test, expect } = require("@playwright/test");
const manifest = require("../../data/localization/fr-business-roi-parity.json");

for (const route of manifest.routes) {
  test(`${route.id}: English route retains the shared calculation owner`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(route.english, { waitUntil: "networkidle" });
    expect(response && response.ok()).toBeTruthy();
    await expect
      .poll(() => page.evaluate(() => typeof window.BusinessRoiEngine))
      .toBe("object");
    expect(errors).toEqual([]);
  });
}
