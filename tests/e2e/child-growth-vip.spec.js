const { test, expect } = require("@playwright/test");

const route = "/tools/child-growth/";

async function fillSupported(page) {
  await page.fill("#cgv-birth", "2023-01-01");
  await page.fill("#cgv-measured", "2025-09-27");
  await page.selectOption("#cgv-sex", "male");
  await page.fill("#cgv-weight", "15");
  await page.selectOption("#cgv-weight-unit", "kg");
  await page.fill("#cgv-length", "100");
  await page.selectOption("#cgv-length-unit", "cm");
  await page.check('input[name="cgv-method"][value="standing"]');
}

test("uses exact age and WHO daily sex-specific z-scores without diagnoses", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await fillSupported(page);
  await page.click("#cgv-form button[type=submit]");
  await expect(page.locator("#cgv-result")).toBeVisible();
  await expect(page.locator("#cgv-age")).toContainText("1000 completed days");
  await expect(page.locator("#cgv-lhfa-z")).toHaveText("+1.70");
  await expect(page.locator("#cgv-wfa-z")).toHaveText("+0.69");
  await expect(page.locator("#cgv-bmifa-z")).toHaveText("-0.58");
  await expect(page.locator("#cgv-lhfa-pct")).toContainText("95.5");
  await expect(page.locator("#cgv-result")).toContainText("cannot determine malnutrition, obesity, failure to thrive");
});

test("fails closed for measurement-method mismatch and unsupported age", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.fill("#cgv-birth", "2025-01-01");
  await page.fill("#cgv-measured", "2025-07-01");
  await page.selectOption("#cgv-sex", "female");
  await page.fill("#cgv-weight", "8");
  await page.fill("#cgv-length", "68");
  await page.check('input[name="cgv-method"][value="standing"]');
  await page.click("#cgv-form button[type=submit]");
  await expect(page.locator("#cgv-status")).toContainText("recumbent length measured lying down");
  await expect(page.locator("#cgv-result")).toBeHidden();

  await page.fill("#cgv-birth", "2020-01-01");
  await page.fill("#cgv-measured", "2025-01-02");
  await page.click("#cgv-form button[type=submit]");
  await expect(page.locator("#cgv-status")).toContainText("supports birth through 1,826 completed days only");
  await expect(page.locator("#cgv-result")).toBeHidden();
});

test("real local PDF excludes date fields and does not contact lead, account or AI services", async ({ page }) => {
  const forbidden = [];
  page.on("request", request => {
    if (page.__exportStarted && /capture-lead|workspace|supabase|ai-advisor/i.test(request.url())) forbidden.push(request.url());
  });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await fillSupported(page);
  await page.click("#cgv-form button[type=submit]");
  page.__exportStarted = true;
  const downloadPromise = page.waitForEvent("download");
  await page.click('[data-health-action="pdf"]');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^afrotools-health-child-growth-.+\.pdf$/);
  expect(forbidden).toEqual([]);
  const plans = await page.evaluate(() => localStorage.getItem("afro_health_plans"));
  expect(plans).toBeNull();
  const snapshots = await page.evaluate(() => localStorage.getItem("afro_health_snapshots") || "");
  expect(snapshots).not.toContain("2023-01-01");
  expect(snapshots).not.toContain("2025-09-27");
});

for (const width of [320, 375]) {
  test(`mobile ${width}px dark mode has no horizontal page overflow and labelled controls remain operable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.locator("#cgv-birth").focus();
    await expect(page.locator("#cgv-birth")).toBeFocused();
    await expect(page.locator('label[for="cgv-birth"]')).toBeVisible();
    await expect(page.locator(".cgv-danger")).toContainText("Unable to drink or breastfeed");
  });
}
