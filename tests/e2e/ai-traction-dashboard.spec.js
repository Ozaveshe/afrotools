const { test, expect } = require("@playwright/test");

test("admin AI traction dashboard unlocks and renders sanitized local metrics", async ({ page }) => {
  await page.route("**/api/admin-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.addInitScript(() => {
    sessionStorage.setItem("admin_key", "test-admin-key");
    localStorage.setItem("afrotools.aiIntentAnalytics.v1", JSON.stringify({
      version: 2,
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:00.000Z",
      totals: {
        promptsSubmitted: 2,
        intentsDetected: 1,
        routed: 1,
        fallback: 0,
        toolOpen: 1,
        prefillSuccess: 1,
        prefillFailed: 0,
        clarificationShown: 1,
        clarificationAnswered: 1,
        clarificationAbandoned: 0,
        exportsGenerated: 1,
        projectsSaved: 1,
        signupPromptShown: 1,
        proUpgradeClicked: 1,
        sponsorLeadOptinSubmitted: 1,
        apiWidgetInterest: 2
      },
      categories: { energy: 1 },
      workflows: { energy_advisor: 1 },
      tools: { "solar-roi": 1 },
      countries: { Nigeria: 1 },
      missingInputs: { monthlyElectricitySpend: 1 },
      queryLengthBuckets: { "21-60": 2 },
      sources: { homepage_input: 2 },
      confidenceBuckets: { high: 1 },
      exportTypes: { pdf: 1 },
      interestSurfaces: { api: 1, widget: 1 },
      noMatchCategories: {},
      safePromptExamples: { "solar-roi / energy / Nigeria / length:21-60": 1 }
    }));
  });

  await page.goto("/admin/ai-traction.html");
  await expect(page.getByRole("heading", { name: "AI Traction Dashboard" })).toBeVisible();
  await expect(page.locator("#metricPrompts")).toHaveText("2");
  await expect(page.locator("#metricApiWidget")).toHaveText("2");
  await expect(page.locator("#workflowList")).toContainText("energy_advisor");
  await expect(page.locator("#countryList")).toContainText("Nigeria");
  await expect(page.locator("#interestList")).toContainText("api");
  await expect(page.locator("#interestList")).toContainText("widget");
  await expect(page.locator("#jsonOutput")).not.toContainText("raw_query");
});
