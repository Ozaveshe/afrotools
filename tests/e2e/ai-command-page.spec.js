const { test, expect } = require("@playwright/test");

async function quietExternalNoise(page) {
  await page.route("**/*", async function (route) {
    const url = new URL(route.request().url());
    if (url.hostname === "www.googletagmanager.com") {
      return route.fulfill({ contentType: "application/javascript; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.googleapis.com") {
      return route.fulfill({ contentType: "text/css; charset=utf-8", body: "" });
    }
    if (url.hostname === "fonts.gstatic.com") return route.abort();
    return route.continue();
  });
}

function routerDecision(overrides) {
  return Object.assign({
    intentCategory: "scholarships",
    selectedToolId: "scholarship-finder",
    selectedRoute: "/tools/scholarship-finder/",
    confidence: 0.88,
    reasonShort: "Matched by the server-side AfroTools router.",
    extractedInputs: { country: "Cameroon", studyLevel: "masters" },
    missingInputs: ["targetCountry"],
    clarificationQuestion: "Which destination country are you considering?",
    safetyDomain: "education",
    highStakesNotice: "Planning estimate only. Confirm eligibility, fees, deadlines, and admissions details with official school or scholarship sources.",
    privacyMode: "account_optional",
    canPrefill: true,
    suggestedNextActions: ["Open the recommended AfroTools workflow"]
  }, overrides || {});
}

test("direct query load hydrates the editable input and deterministic workflow", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Write%20a%20CV%20for%20an%20electrical%20engineer%20in%20Ghana&router=off", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#aiCommandInput")).toHaveValue("Write a CV for an electrical engineer in Ghana");
  await expect(page.locator("[data-workflow-card]").first()).toContainText("CV Builder");
  await expect(page.locator("[data-workflow-card]").first()).toContainText("Inputs already detected");
});

test("empty state shows fallback browse cards without login", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#aiEmptyState")).toBeVisible();
  await expect(page.getByText("Start with a practical task.")).toBeVisible();
  await expect(page.locator("#aiFallbackGrid .ai-fallback-card")).toHaveCount(9);
  await expect(page.getByRole("link", { name: /CV Builder/i }).first()).toHaveAttribute("href", "/tools/cv-builder/");
});

test("deterministic routing handles obvious import duty queries", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Import Duty Calculator");
  await expect(card).toContainText("Destination Country: Nigeria");
  await expect(card).toContainText("Item Category: Toyota Axio");
  await expect(card.getByRole("link", { name: "Open tool" })).toHaveAttribute("href", /\/tools\/import-duty\/.*prefill=1/);
});

test("clarification answers update structured workflow state and prefill payload", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Add details before opening");
  await expect(card.getByLabel(/CIF or item value/i)).toBeVisible();
  await card.getByLabel(/CIF or item value/i).fill("8500");
  await card.getByLabel(/Engine size/i).fill("1500");
  await card.getByRole("button", { name: "Update prefill" }).click();

  const state = await page.evaluate(function () {
    return window.AfroToolsAICommandPage.getState();
  });
  expect(state.originalQuery).toContain("Toyota Axio");
  expect(state.selectedToolId).toBe("import-duty");
  expect(state.source).toBe("deterministic");
  expect(state.consentToModel).toBe(false);
  expect(state.clarificationAnswers.itemValue).toBe(8500);
  expect(state.clarificationAnswers.engineCc).toBe(1500);
  expect(state.prefillPayload.normalizedInputs.itemValue).toBe(8500);
  expect(state.prefillPayload.normalizedInputs.engineCc).toBe(1500);
});

test("skip and open tool stores the current structured prefill payload", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await card.getByLabel(/CIF or item value/i).fill("9100");
  await card.getByRole("button", { name: "Skip and open tool" }).click();
  await page.waitForURL(/\/tools\/import-duty\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft"));
  });
  expect(prefill.toolId).toBe("import-duty");
  expect(prefill.normalizedInputs.itemValue).toBe(9100);
  expect(prefill.normalizedInputs.itemCategory).toBe("Toyota Axio");
});

test("PDF workflow asks for action type before opening", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Help%20me%20with%20a%20PDF&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("PDF Workspace");
  await expect(card).toContainText("Add details before opening");
  await card.locator('select[data-clarification-input="pdfAction"]').selectOption("compress");
  await card.getByRole("button", { name: "Update prefill" }).click();

  const state = await page.evaluate(function () {
    return window.AfroToolsAICommandPage.getState();
  });
  expect(state.selectedToolId).toBe("pdf-workspace");
  expect(state.prefillPayload.normalizedInputs.pdfAction).toBe("compress");
});

test("server router success renders a workflow card", async ({ page }) => {
  await quietExternalNoise(page);
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        source: "model_validated",
        decision: routerDecision()
      })
    });
  });

  await page.goto("/ai/?q=Find%20scholarships%20for%20a%20Cameroonian%20student", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Scholarship Finder");
  await expect(card).toContainText("Matched by the server-side AfroTools router.");
  await expect(card).toContainText("88% match");
  await expect(card).toContainText("Destination country");
});

test("router requests keep model consent false until explicit retry", async ({ page }) => {
  await quietExternalNoise(page);
  const bodies = [];
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    bodies.push(JSON.parse(route.request().postData() || "{}"));
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        source: bodies.length > 1 ? "model_validated" : "deterministic_model_consent_required",
        decision: routerDecision({
          selectedToolId: "scholarship-finder",
          selectedRoute: "/tools/scholarship-finder/",
          confidence: bodies.length > 1 ? 0.92 : 0.86
        })
      })
    });
  });

  await page.goto("/ai/?q=Find%20scholarships%20for%20a%20Cameroonian%20student", { waitUntil: "domcontentloaded" });

  expect(bodies[0].consentToModel).toBe(false);
  await expect(page.locator("#aiConsentCard")).toBeVisible();
  await page.locator("#aiModelConsent").check();
  await page.getByRole("button", { name: "Retry with AI assist" }).click();
  await expect(page.locator("[data-workflow-card]").first()).toContainText("Scholarship Finder");
  expect(bodies[1].consentToModel).toBe(true);

  const state = await page.evaluate(function () {
    return window.AfroToolsAICommandPage.getState();
  });
  expect(state.source).toBe("router");
  expect(state.consentToModel).toBe(true);
});

test("router failure falls back to deterministic workflow cards", async ({ page }) => {
  await quietExternalNoise(page);
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 500,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ ok: false, error: "boom" })
    });
  });

  await page.goto("/ai/?q=Check%20solar%20ROI%20for%20my%20shop%20in%20Lagos", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#aiErrorState")).toBeVisible();
  await expect(page.locator("#aiErrorText")).toContainText("Using deterministic routing instead.");
  await expect(page.locator("[data-workflow-card]").first()).toContainText("Solar ROI Calculator");
});

test("low-confidence router result shows no-match browse fallback", async ({ page }) => {
  await quietExternalNoise(page);
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        source: "deterministic",
        decision: routerDecision({
          intentCategory: "search",
          selectedToolId: "tool-search",
          selectedRoute: "/search/",
          confidence: 0.2,
          reasonShort: "No strong workflow match.",
          extractedInputs: {},
          missingInputs: [],
          safetyDomain: "none",
          highStakesNotice: "",
          privacyMode: "browser_local",
          canPrefill: false
        })
      })
    });
  });

  await page.goto("/ai/?q=Something%20very%20unclear", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#aiNoMatchState")).toBeVisible();
  await expect(page.locator("#aiNoMatchCards [data-workflow-card]")).toHaveCount(9);
});

test("open tool link stores prefill handoff and navigates", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Write%20a%20CV%20for%20an%20electrical%20engineer%20in%20Ghana&router=off", { waitUntil: "domcontentloaded" });

  const open = page.locator("[data-workflow-card]").first().getByRole("link", { name: "Open tool" });
  await expect(open).toHaveAttribute("href", /\/tools\/cv-builder\/.*prefill=1/);
  await open.click();
  await page.waitForURL(/\/tools\/cv-builder\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return sessionStorage.getItem("afrotools.aiPrefillDraft");
  });
  expect(prefill).toContain("cv-builder");
});

test("CV Builder receives Ask AfroTools AI prefill without auto-exporting", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Write%20a%20CV%20for%20an%20electrical%20engineer%20in%20Ghana&router=off", { waitUntil: "domcontentloaded" });
  await page.locator("[data-workflow-card]").first().getByRole("link", { name: "Open tool" }).click();
  await page.waitForURL(/\/tools\/cv-builder\/.*prefill=1/);

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await page.waitForFunction(function () {
    return window.CVApp && window.CVApp.getState && window.CVApp.getState().data && window.CVApp.getState().data.title;
  });

  const cvState = await page.evaluate(function () {
    const state = window.CVApp.getState();
    return {
      country: state.country,
      title: state.data.title,
      location: state.data.loc
    };
  });
  expect(cvState.country).toBe("GH");
  expect(cvState.title.toLowerCase()).toContain("electrical engineer");
  expect(cvState.location).toContain("Ghana");
  await expect(page.locator(".cv-form-inner")).toBeVisible();
});

test("Scholarship Finder receives study-level and destination prefill", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Find%20scholarships%20for%20a%20student%20from%20Cameroon%20for%20masters%20in%20Canada&router=off", { waitUntil: "domcontentloaded" });
  await page.locator("[data-workflow-card]").first().getByRole("link", { name: "Open tool" }).click();
  await page.waitForURL(/\/tools\/scholarship-finder\/.*prefill=1/);

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await expect(page.locator("#quickLevel")).toHaveValue("masters");
  await expect(page.locator("#profileLevel")).toHaveValue("masters");
  await expect(page.locator("#quickDest")).toHaveValue("canada");
  await expect(page.locator("#profileDest")).toHaveValue("canada");
});

test("Import Duty Calculator receives vehicle prefill and waits for user calculation", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria%20with%20%248500%20and%201500cc&router=off", { waitUntil: "domcontentloaded" });
  await page.locator("[data-workflow-card]").first().getByRole("link", { name: "Open tool" }).click();
  await page.waitForURL(/\/tools\/import-duty\/.*prefill=1/);

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await expect(page.locator("#carCountry")).toHaveValue("Nigeria");
  await expect(page.locator("#carPurchasePrice")).toHaveValue("8500");
  await expect(page.locator("#carEngineSize")).toHaveValue("1500");
  await expect(page.locator("#resultShell .result-empty")).toBeVisible();
});

test("AI command page fits a mobile viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Calculate%20payroll%20for%205%20employees%20in%20Kenya&router=off", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#aiCommandInput")).toBeVisible();
  await expect(page.locator("[data-workflow-card]").first()).toContainText("PAYE Calculator");

  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
});
