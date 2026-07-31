const { test, expect } = require("@playwright/test");

test("accepted explicit tool requests open the verified Swahili owner", async ({ page }) => {
  await page.goto("/sw/ai/?tool=ao-paye");
  await expect(page).toHaveURL(/\/sw\/angola\/kikokotoo-kodi-mshahara\/\?source=sw-ai-tool$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
});

test("blocked explicit tool requests stay fail closed in Swahili search", async ({ page }) => {
  await page.goto("/sw/ai/?tool=bi-paye");
  await expect(page).toHaveURL(/\/sw\/ai\/\?tool=bi-paye$/);
  await expect(page.locator("#aiSwQuery")).toHaveValue("bi paye");
  await expect(page.locator(".ai-local-note")).toHaveAttribute("data-ai-tool-status", "not-accepted");
  await expect(page.locator(".ai-local-note")).toContainText("bado haijathibitishwa");
});
