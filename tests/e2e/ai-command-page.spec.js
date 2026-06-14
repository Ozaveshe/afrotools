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

test("saved AI projects stay local by default and can be continued or deleted", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Write%20a%20CV%20for%20an%20electrical%20engineer%20in%20Ghana&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await card.getByRole("button", { name: "Save project" }).click();
  await expect(card.locator("[data-project-card-status]")).toContainText("Saved on this device");
  await expect(page.locator("#aiSavedProjects")).toBeVisible();
  await expect(page.locator("#aiSavedProjectList")).toContainText("CV Builder");

  const saved = await page.evaluate(function () {
    const items = JSON.parse(localStorage.getItem("afrotools.aiSavedProjects.v1") || "[]");
    return { item: items[0], raw: localStorage.getItem("afrotools.aiSavedProjects.v1") || "" };
  });
  expect(saved.item.workflowType).toBe("cv-builder");
  expect(saved.item.structuredInputs.country).toBe("Ghana");
  expect(saved.item.structuredInputs.targetRole.toLowerCase()).toContain("electrical engineer");
  expect(saved.item.structuredInputs.resumeText).toBeUndefined();
  expect(saved.item.structuredInputs.pdfContent).toBeUndefined();
  expect(saved.item.structuredInputs.email).toBeUndefined();
  expect(saved.raw).not.toContain("Write a CV");

  await page.goto(`/ai/?project=${encodeURIComponent(saved.item.projectId)}&router=off`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-workflow-card]").first()).toContainText("Continued from a saved AfroTools AI project");
  await page.locator("#aiSavedProjectList").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator("#aiSavedProjects")).toBeHidden();
});

test("signed-in AI project sync requires an explicit sync action and sends sanitized payload", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Find%20scholarships%20for%20a%20Cameroonian%20student&router=off", { waitUntil: "domcontentloaded" });
  await page.evaluate(function () {
    window.__aiSyncPayload = null;
    window.AfroWorkspace = {
      isSignedIn: function () { return true; },
      upsert: async function (payload) {
        window.__aiSyncPayload = payload;
        return { id: "workspace-row", user_id: "user-123" };
      }
    };
  });

  const card = page.locator("[data-workflow-card]").first();
  await card.getByRole("button", { name: "Sync to account" }).click();
  await expect(card.locator("[data-project-card-status]")).toContainText("Synced to your AfroTools account");

  const payload = await page.evaluate(function () {
    return window.__aiSyncPayload;
  });
  expect(payload.itemType).toBe("ai-project");
  expect(payload.toolSlug).toBe("ask-afrotools-ai");
  expect(payload.meta.privacy).toBe("sanitized-ai-project");
  expect(payload.payload.structuredInputs.country).toBe("Cameroon");
  expect(JSON.stringify(payload)).not.toContain("Find scholarships");
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
  await expect(card.locator("[data-import-advisor]")).toContainText("Import advisor estimate");
  await expect(card.locator("[data-import-advisor]")).toContainText("Planning estimate only");
  await expect(card.locator("[data-import-advisor]")).toContainText("PDF brief");
  await expect(card.locator("[data-import-advisor]")).toContainText("WhatsApp summary");
  await expect(card.locator("[data-import-advisor]")).toContainText("JSON");
  await expect(card.getByRole("link", { name: "Open tool" })).toHaveAttribute("href", /\/tools\/import-duty\/.*prefill=1/);
});

test("education workflow renders a study plan and scholarship prefill handoff", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=I%20want%20to%20study%20in%20Canada%20from%20Nigeria%20with%20a%20budget%20of%20%248%2C000&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Study Abroad Planner");
  await expect(card.locator("[data-education-plan]")).toContainText("Education plan");
  await expect(card.locator("[data-education-plan]")).toContainText("Study Abroad Cost Planner");
  await expect(card.locator("[data-education-plan]")).toContainText("Scholarship Finder");
  await expect(card.locator("[data-education-plan]")).toContainText("Source and freshness");
  await expect(card.locator("[data-education-plan]")).toContainText("Scholarship-heavy plan needed");

  await card.getByRole("link", { name: "Open Scholarship Finder with profile" }).click();
  await page.waitForURL(/\/tools\/scholarship-finder\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft"));
  });
  expect(prefill.toolId).toBe("scholarship-finder");
  expect(prefill.normalizedInputs.country).toBe("Nigeria");
  expect(prefill.normalizedInputs.targetCountry).toBe("canada");
  expect(prefill.normalizedInputs.budget).toBe(8000);
});

test("clarification answers update structured workflow state and prefill payload", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Add details before opening");
  await expect(card.getByLabel(/Purchase price/i)).toBeVisible();
  await card.getByLabel(/Purchase price/i).fill("8500");
  await card.getByLabel(/Shipping \/ freight/i).fill("1200");
  await card.getByLabel(/User FX rate/i).fill("1600");
  await card.getByRole("button", { name: "Update prefill" }).click();

  const state = await page.evaluate(function () {
    return window.AfroToolsAICommandPage.getState();
  });
  expect(state.originalQuery).toContain("Toyota Axio");
  expect(state.selectedToolId).toBe("import-duty");
  expect(state.source).toBe("deterministic");
  expect(state.consentToModel).toBe(false);
  expect(state.clarificationAnswers.purchasePrice).toBe(8500);
  expect(state.clarificationAnswers.shippingCost).toBe(1200);
  expect(state.clarificationAnswers.fxRate).toBe(1600);
  expect(state.prefillPayload.normalizedInputs.itemValue).toBe(8500);
  expect(state.prefillPayload.normalizedInputs.shippingCost).toBe(1200);
  expect(state.importAdvisorPlan.estimate.cif).toBe(9700);
});

test("skip and open tool stores the current structured prefill payload", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await card.getByLabel(/Purchase price/i).fill("9100");
  await card.getByRole("button", { name: "Skip and open tool" }).click();
  await page.waitForURL(/\/tools\/import-duty\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft"));
  });
  expect(prefill.toolId).toBe("import-duty");
  expect(prefill.normalizedInputs.itemValue).toBe(9100);
  expect(prefill.normalizedInputs.purchasePrice).toBe(9100);
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

test("career agent panel creates CV template starter prefill", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Write%20me%20a%20CV%20for%20an%20electrical%20engineer%20in%20Ghana&router=off", { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-career-plan]")).toContainText("Career agent plan");
  await expect(page.locator("[data-career-plan]")).toContainText("Safe CV rules");
  await expect(page.locator("[data-career-plan]")).toContainText("Do not fabricate degrees");
  await page.getByRole("link", { name: "Open CV Builder with starter" }).click();
  await page.waitForURL(/\/tools\/cv-builder\/.*prefill=1/);

  const payload = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft") || "{}");
  });
  expect(payload.toolId).toBe("cv-builder");
  expect(payload.normalizedInputs.country).toBe("Ghana");
  expect(payload.normalizedInputs.targetRole.toLowerCase()).toContain("electrical engineer");
  expect(payload.normalizedInputs.starterId).toBeTruthy();
  expect(payload.normalizedInputs.templateId).toBeTruthy();
  expect(page.url()).not.toContain("electrical");
  expect(page.url()).not.toContain("Ghana");

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await page.waitForFunction(function () {
    return window.CVApp && window.CVApp.getState && window.CVApp.getState().template;
  });
  const cvState = await page.evaluate(function () {
    const state = window.CVApp.getState();
    return { country: state.country, title: state.data.title, template: state.template };
  });
  expect(cvState.country).toBe("GH");
  expect(cvState.title.toLowerCase()).toContain("electrical engineer");
  expect(cvState.template).toBe(payload.normalizedInputs.templateId);
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

  await page.goto("/ai/?q=Import%20a%202016%20Toyota%20Axio%20into%20Nigeria%20from%20Japan%20price%20%248500%20shipping%20%241200%20insurance%20%24250%20FX%201600%20and%201500cc%20Tin%20Can&router=off", { waitUntil: "domcontentloaded" });
  await page.locator("[data-workflow-card]").first().getByRole("link", { name: "Open tool" }).click();
  await page.waitForURL(/\/tools\/import-duty\/.*prefill=1/);

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await expect(page.locator("#carCountry")).toHaveValue("Nigeria");
  await expect(page.locator("#carPurchasePrice")).toHaveValue("8500");
  await expect(page.locator("#carShipping")).toHaveValue("1200");
  await expect(page.locator("#carInsurance")).toHaveValue("250");
  await expect(page.locator("#carOrigin")).toHaveValue("Japan");
  await expect(page.locator("#carPort")).toHaveValue("tin-can");
  await expect(page.locator("#carFxRate")).toHaveValue("1600");
  await expect(page.locator("#carEngineSize")).toHaveValue("1500");
  await expect(page.locator("#resultShell .result-empty")).toBeVisible();
});

test("energy advisor renders a decision brief and Solar ROI receives prefill", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Should%20I%20install%20solar%20for%20my%20shop%20in%20Lagos%20with%20monthly%20bill%20NGN%20120000%205kVA%20generator%206%20hours%20daily&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("Solar ROI Calculator");
  await expect(card.locator("[data-energy-advisor]")).toContainText("Solar and generator advisor");
  await expect(card.locator("[data-energy-advisor]")).toContainText("Monthly generator cost");
  await expect(card.locator("[data-energy-advisor]")).toContainText("Questions to ask installer");
  await expect(card.locator("[data-energy-advisor]")).toContainText("Planning estimate only");
  await expect(card.locator("[data-energy-advisor]")).toContainText("PDF brief");
  await expect(card.locator("[data-energy-advisor]")).toContainText("Copy checklist");
  await expect(card.locator("[data-energy-advisor]")).toContainText("JSON");

  await card.getByRole("link", { name: "Open Solar ROI with prefill" }).click();
  await page.waitForURL(/\/tools\/solar-roi\/nigeria\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft"));
  });
  expect(prefill.toolId).toBe("solar-roi");
  expect(prefill.normalizedInputs.country).toBe("Nigeria");
  expect(prefill.normalizedInputs.city).toBe("Lagos");
  expect(prefill.normalizedInputs.userType).toBe("shop");

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await expect(page.locator("#monthlyBill")).toHaveValue("120000");
  await expect(page.locator("#generatorSpend")).not.toHaveValue("12600");
  await expect(page.locator("#outageHours")).toHaveValue("6");
  await expect(page.locator("#systemKW")).toHaveValue("5");
});

test("SME finance assistant routes Kenya payroll into PAYE prefill", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/?q=Help%20me%20calculate%20payroll%20for%205%20employees%20in%20Kenya%20with%20KES%20250000%20monthly%20salary&router=off", { waitUntil: "domcontentloaded" });

  const card = page.locator("[data-workflow-card]").first();
  await expect(card).toContainText("PAYE Calculator");
  await expect(card.locator("[data-sme-finance]")).toContainText("SME finance assistant");
  await expect(card.locator("[data-sme-finance]")).toContainText("Gross payroll");
  await expect(card.locator("[data-sme-finance]")).toContainText("not tax");
  await expect(card.locator("[data-sme-finance]")).toContainText("Partner/accounting placements");

  await card.getByRole("link", { name: "Open recommended tool" }).click();
  await page.waitForURL(/\/kenya\/ke-paye.*prefill=1/);

  const payload = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft"));
  });
  expect(payload.toolId).toBe("paye-calculator");
  expect(payload.normalizedInputs.country).toBe("Kenya");
  expect(payload.normalizedInputs.employeeCount).toBe(5);
  expect(payload.normalizedInputs.grossPay).toBe(250000);

  await expect(page.locator("#afrotools-ai-prefill-notice")).toContainText("Started from AfroTools AI", { timeout: 12000 });
  await expect(page.locator("#salaryInput")).toHaveValue("250000");
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
