const { test, expect } = require("@playwright/test");

test.describe("Education Hub app VIP", () => {
  test("renders an honest private planning boundary without remote fonts", async ({ page }) => {
    const consoleErrors = [];
    const failedRequests = [];
    const remoteFonts = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => failedRequests.push(request.url()));
    page.on("request", (request) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) remoteFonts.push(request.url());
    });

    await page.goto("/tools/education-hub/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /private education planning dashboard/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /planner, not an eligibility decision/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/strong match|good scholarship matches|next best action|judge study-abroad readiness|right tools in the right order|secondary actions after the top priority/i);
    await expect(page.locator("body")).toContainText(/filter overlaps/i);
    expect(remoteFonts).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests.filter((url) => url.startsWith("http://127.0.0.1:4173"))).toEqual([]);
  });

  test("works at 320px, dark mode and 200 percent text", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/tools/education-hub/", { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ content: "html{font-size:200%!important}" });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { name: /planner, not an eligibility decision/i })).toBeVisible();

    const boundary = page.locator(".hub-data-boundary");
    const colors = await boundary.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("saving is explicit and labels remain truthful after dynamic rendering", async ({ page }) => {
    await page.goto("/tools/education-hub/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /private education planning dashboard/i })).toBeVisible();

    await expect(page.locator("body")).not.toContainText(/strong match|good matches|next best action|degree readiness|destination-readiness/i);
    await expect(page.locator("#edGpaValue")).toHaveAccessibleName(/^GPA$/);
    await expect(page.locator("#edGpaScale")).toHaveAccessibleName(/GPA scale/);
    await expect(page.locator("#edIeltsOverall")).toHaveAccessibleName(/IELTS overall/);
    await expect(page.locator("#edJambScore")).toHaveAccessibleName(/JAMB score/);
    await page.locator("#edGpaValue").fill("999");
    await page.locator("#edGpaScale").selectOption("4.0");
    await page.locator("#edIeltsOverall").fill("99");
    await page.locator("#edJambScore").fill("999");
    await page.getByRole("button", { name: "Save my profile" }).click();
    const invalidSaved = await page.evaluate(() => localStorage.getItem("afroedu-profile-cache"));
    expect(invalidSaved).toBeNull();

    await page.locator("#edGpaValue").fill("3.5");
    await page.locator("#edIeltsOverall").fill("7");
    await page.locator("#edJambScore").fill("250");
    await page.getByLabel("Education level").selectOption("undergraduate");
    await page.getByRole("button", { name: "Save my profile" }).click();
    await expect(page.locator("#profileCompletionValue")).not.toHaveText("0%");
    await expect(page.locator("#profileSaveHint")).toContainText(/prefill compatible tools/i);
  });

  test("renders device-local profile before remote scholarship work completes", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "afroedu-profile-cache",
        JSON.stringify({
          education_level: "undergraduate",
          institution: "Local test institution",
          gpa_value: 3.4,
          gpa_scale: 4
        })
      );
      localStorage.setItem(
        "afrojamb-history",
        JSON.stringify([
          {
            aggregate: 999,
            durationSeconds: 60,
            ts: Date.now()
          }
        ])
      );
    });
    await page.route(/scholarship/i, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.abort();
    });

    await page.goto("/tools/education-hub/", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Education level")).toHaveValue("undergraduate", { timeout: 1500 });
    await expect(page.getByLabel("Institution")).toHaveValue("Local test institution", { timeout: 1500 });
    await expect(page.locator("#profileCompletionValue")).not.toHaveText("0%", { timeout: 1500 });
  });

  test("quarantines impossible scores created by an older dashboard version", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "afroedu-profile-cache",
        JSON.stringify({
          education_level: "undergraduate",
          institution: "Legacy local profile",
          gpa_value: 999,
          gpa_scale: 4,
          ielts_overall: 99,
          jamb_score: 999
        })
      );
    });

    await page.goto("/tools/education-hub/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#edGpaValue")).toHaveValue("");
    await expect(page.locator("#edGpaScale")).toHaveValue("");
    await expect(page.locator("#edIeltsOverall")).toHaveValue("");
    await expect(page.locator("#edJambScore")).toHaveValue("");
    await expect(page.locator("body")).not.toContainText(/999\.00|Overall 99\.0|JAMB 999/);
    await expect(page.locator("#profileJambValue")).toHaveText("Set route");
    await expect(page.locator("#readinessList")).not.toContainText(/TRACKED|Aggregate score on file|999/);
    await expect(page.locator("#profileCompletionValue")).toHaveText("25%");
  });
});
