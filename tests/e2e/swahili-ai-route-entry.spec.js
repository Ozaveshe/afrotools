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
  await page.goto("/sw/ai/?tool=unlisted-tool-example");
  await expect(page).toHaveURL(/\/sw\/ai\/\?tool=unlisted-tool-example$/);
  await expect(page.locator("#aiSwQuery")).toHaveValue("unlisted tool example");
  await expect(page.locator(".ai-local-note")).toHaveAttribute("data-ai-tool-status", "not-accepted");
  await expect(page.locator(".ai-local-note")).toContainText("bado haijathibitishwa");
});

for (const [tool, route] of [
  ["afropoints", "/sw/zana/afropoints/"],
  ["mobile-vs-bank", "/sw/zana/pesa-simu-dhidi-ya-benki/"],
  ["import-duty", "/sw/zana/gharama-bidhaa/"]
]) {
  test("assistant referral stays editable for " + tool, async ({ page }) => {
    await page.goto(route);
    await page.locator('a[href^="/sw/ai/?assist=' + tool + '"]').click();
    await expect(page.locator('[data-ai-tool-status="assistant"]')).toBeVisible();
    await expect(page).toHaveURL(/\/sw\/ai\/\?assist=/);
    await expect(page.locator("#aiSwResult")).toHaveCount(0);
    await page.locator("#aiSwQuery").fill("Hesabu PAYE ya wafanyakazi");
    await page.locator("#aiSwQuery").press("Enter");
    await expect(page.locator("#aiSwResult a")).toHaveAttribute("href", "/sw/mshahara-na-kodi/paye/");
    await page.locator("#aiSwResult a").click();
    await expect(page).toHaveURL(/\/sw\/mshahara-na-kodi\/paye\/$/);
  });
}

test("previous contextual URLs open the assistant without overwriting an explicit question", async ({ page }) => {
  await page.goto("/sw/ai/?tool=afropoints&route=%2Fsw%2Fzana%2Fafropoints%2F&q=Swali");
  await expect(page.locator('[data-ai-tool-status="assistant"]')).toBeVisible();
  await expect(page.locator("#aiSwQuery")).toHaveValue("Swali");
  await expect(page.locator("#aiSwResult")).toHaveCount(0);
});
