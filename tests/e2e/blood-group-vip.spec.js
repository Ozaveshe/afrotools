const { test, expect } = require("@playwright/test");

const route = "/tools/blood-group/";

test("separates red cells, plasma and platelet laboratory selection", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  await page.selectOption("#bgv-component", "red-cells");
  await page.selectOption("#bgv-donor", "O-");
  await page.selectOption("#bgv-recipient", "A+");
  await page.click("#bgv-component-form button[type=submit]");
  await expect(page.locator("#bgv-component-result")).toContainText("basic red-cell reference");
  await expect(page.locator("#bgv-component-result")).toContainText("type, antibody-screen, select and crossmatch");
  await expect(page.locator("#bgv-component-result")).toContainText("Do not use this page to locate a donor");

  await page.selectOption("#bgv-component", "plasma");
  await page.selectOption("#bgv-donor", "O-");
  await page.selectOption("#bgv-recipient", "A+");
  await page.click("#bgv-component-form button[type=submit]");
  await expect(page.locator("#bgv-component-result")).toContainText("Not listed in the basic plasma reference");
  await expect(page.locator("#bgv-component-result")).toContainText("RhD signs are not used as a simple plasma rule");

  await page.selectOption("#bgv-component", "platelets");
  await page.click("#bgv-component-form button[type=submit]");
  await expect(page.locator("#bgv-component-result")).toContainText("Laboratory selection required");
  await expect(page.locator("#bgv-component-result")).toContainText("does not label this platelet pairing compatible or incompatible");
});

test("pregnancy result defers anti-D decisions to maternity testing and guidance", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.click("#bgv-tab-pregnancy");
  await page.selectOption("#bgv-pregnant", "O-");
  await page.selectOption("#bgv-other-parent", "A+");
  await page.click("#bgv-pregnancy-form button[type=submit]");
  await expect(page.locator("#bgv-pregnancy-result")).toContainText("A baby may be RhD positive");
  await expect(page.locator("#bgv-pregnancy-result")).toContainText("cannot determine the baby's blood group");
  await expect(page.locator("#bgv-pregnancy-result")).toContainText("Anti-D eligibility, product, dose and timing");
});

test("real local PDF export is ungated and does not contact lead, account or AI services", async ({ page }) => {
  const forbidden = [];
  page.on("request", request => {
    if (page.__exportStarted && /capture-lead|workspace|supabase|ai-advisor/i.test(request.url())) forbidden.push(request.url());
  });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.click("#bgv-component-form button[type=submit]");
  page.__exportStarted = true;
  const downloadPromise = page.waitForEvent("download");
  await page.click('[data-health-action="pdf"]');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^afrotools-health-blood-group-.+\.pdf$/);
  expect(forbidden).toEqual([]);
});

for (const width of [320, 375]) {
  test(`mobile ${width}px dark mode has no horizontal page overflow and tabs are keyboard operable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator("#bgv-tab-components").focus();
    await page.locator("#bgv-tab-components").press("ArrowRight");
    await expect(page.locator("#bgv-tab-pregnancy")).toBeFocused();
    await expect(page.locator("#bgv-tab-pregnancy")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#bgv-panel-pregnancy")).toBeVisible();
  });
}
