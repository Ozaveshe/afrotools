const { test, expect } = require("@playwright/test");

test("accepted explicit tool requests open the verified Swahili owner", async ({ page }) => {
  await page.goto("/sw/ai/?tool=ao-paye");
  await expect(page).toHaveURL(/\/sw\/angola\/kikokotoo-kodi-mshahara\/\?source=sw-ai-tool$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
});

test("newly accepted crypto address requests open the native Swahili validator", async ({ page }) => {
  await page.goto("/sw/ai/?tool=crypto-address");
  await expect(page).toHaveURL(/\/sw\/crypto\/address-validator\/\?source=sw-ai-tool$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
});

test("newly accepted Trade requests open the verified native Swahili owner", async ({ page }) => {
  await page.goto("/sw/ai/?tool=cross-border-data");
  await expect(page).toHaveURL(/\/sw\/zana\/uhamishaji-data-mpaka\/\?source=sw-ai-tool$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("[data-sw-trade-app=\"cross-border-data\"]")).toBeVisible();
});

test("blocked explicit tool requests stay fail closed in Swahili search", async ({ page }) => {
  await page.goto("/sw/ai/?tool=bi-paye");
  await expect(page).toHaveURL(/\/sw\/ai\/\?tool=bi-paye$/);
  await expect(page.locator("#aiSwQuery")).toHaveValue("bi paye");
  await expect(page.locator(".ai-local-note")).toHaveAttribute("data-ai-tool-status", "not-accepted");
  await expect(page.locator(".ai-local-note")).toContainText("bado haijathibitishwa");
});
