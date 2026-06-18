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

test("ask command page uses the shared catalog router and registry examples", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator(".ask-copy")).toContainText("Say what you need");
  await expect(page.locator(".ask-privacy")).toContainText("Private by default");
  await expect(page.locator(".ask-system-strip")).toBeHidden();
  await expect(page.locator(".ask-examples")).toContainText("Passport documents");
  await expect(page.locator(".ask-example")).toHaveCount(4);
  await expect(page.locator("body")).not.toContainText("How this page works");
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroToolsAIOrchestrator && window.AfroToolsAIOrchestrator.buildPlan))).toBe(true);

  await page.locator("#askPrompt").fill("Get Ghana passport documents, fees to check, and next steps");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await expect(page.locator("#toolTitle")).toContainText(/Passport/i);
  await expect(page.locator("#toolMeta")).toContainText("orchestrated tool match");
  await expect(page.locator("#toolMeta")).not.toContainText("mock router");
  await expect(page.locator("#sourceNote")).toBeVisible();
  await expect(page.locator("#sourceNote")).toContainText(/source|private|estimate|ready/i);
  await expect(page.locator("#openToolLink")).toHaveAttribute("href", /\/tools\/passport-checklist\//);
  const openHref = await page.locator("#openToolLink").getAttribute("href");
  expect(new URL(openHref, "https://afrotools.com").searchParams.getAll("source")).toEqual(["ask"]);
  await expect(page.locator("#resultSearchLink")).toHaveAttribute("href", "/search/?source=ask_private");
  await expect(page.locator("#resultSearchLink")).not.toHaveAttribute("href", /Ghana|documents|fees|next/i);
  await expect(page.locator("#relatedTools")).toBeHidden();
  await expect(page.locator("#relatedTools")).not.toContainText("Ghana passport documents");
  await expect(page.locator("[data-ask-router-feedback] summary")).toContainText("Not right?");
  await page.locator("[data-ask-router-feedback] summary").click();
  await page.locator("[data-ask-feedback='negative']").click();
  await expect(page.locator("[data-ask-feedback-status]")).toContainText("Feedback saved for router review.");
  const feedbackReport = await page.evaluate(() => window.AfroToolsAIIntentAnalytics.getReport());
  expect(feedbackReport.totals.promptsSubmitted).toBe(1);
  expect(feedbackReport.totals.intentsDetected).toBe(1);
  expect(feedbackReport.totals.routed).toBe(1);
  expect(feedbackReport.totals.routerFeedbackSubmitted).toBe(1);
  expect(feedbackReport.totals.routerFeedbackNegative).toBe(1);
  expect(feedbackReport.surfaceBreakdown.some((item) => item.name === "ask_page")).toBe(true);
  expect(feedbackReport.driftSignals.some((item) => item.name === "route_mismatch")).toBe(true);
  expect(JSON.stringify(feedbackReport)).not.toContain("Ghana passport documents");
  await page.locator("#openToolLink").evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await page.locator("#openToolLink").click();
  const openReport = await page.evaluate(() => window.AfroToolsAIIntentAnalytics.getReport());
  expect(openReport.totals.toolOpen).toBe(1);
  expect(openReport.topSelectedTools.some((item) => item.name === "passport-checklist")).toBe(true);
  expect(openReport.topSurfaces.some((item) => item.name === "ask_page")).toBe(true);
  expect(JSON.stringify(openReport)).not.toContain("Ghana passport documents");

  await page.locator("#askPrompt").fill("n electrical engineer in Ghana");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await expect(page.locator("#toolTitle")).toContainText(/CV|Resume/i);
  await expect(page.locator("#prefillSummary")).toContainText(/electrical engineer/i);
  await expect(page.locator("#openToolLink")).toHaveAttribute("href", /\/tools\/cv-builder\//);
  await expect(page.locator("#relatedTools")).toBeHidden();
  await expect(page.locator("body")).not.toContainText("No related tools");
});

test("ask command page shows source and freshness guidance for high-stakes matches", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/", { waitUntil: "domcontentloaded" });

  await page.locator("#askPrompt").fill("How much duty to import a 2016 Toyota Axio into Nigeria?");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await expect(page.locator("#toolTitle")).toContainText(/Import|Duty|Customs/i);
  await expect(page.locator("#riskPill")).toContainText(/estimate/i);
  await expect(page.locator("#sourceNote")).toBeVisible();
  await expect(page.locator("#sourceNote")).toContainText(/source|fees|rules|estimate/i);
  await expect(page.locator("#sourceNote")).not.toContainText("guaranteed");
});

test("ask command page gives an intelligent Angola salary-tax answer preview", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".ask-doodle")).toBeVisible();
  await page.locator("#askPrompt").fill("i want to calculate my salary tax in angoa 1000000");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await expect(page.locator("#toolTitle")).toContainText("Angola PAYE Calculator");
  await expect(page.locator("#answerPreview")).toBeVisible();
  await expect(page.locator("#answerPreview")).toContainText("Angola");
  await expect(page.locator("#answerPreview")).toContainText("Kz 1,000,000");
  await expect(page.locator("#answerPreview")).toContainText("IRT + INSS");
  await expect(page.locator("#answerPreview")).not.toContainText(/tax is|net pay is|you will pay/i);
  await expect(page.locator("#openToolLink")).toHaveAttribute("href", "/angola/ao-paye?source=ask&prefill=1");
  await expect(page.locator("#sourceNote")).toContainText(/Check sources|tool source notes/i);
});

test("ask command page uses local-search fallback without scary router errors", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/?router=off&q=router%20error", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stateNoMatch")).toBeVisible();
  await expect(page.locator("#stateError")).toBeHidden();
  await expect(page.locator("#stateNoMatch")).toContainText("Using local search");
  await expect(page.locator("#noMatchSearchLink")).toHaveAttribute("href", "/search/?source=ask_private");
  await expect(page.locator("#noMatchSearchLink")).not.toHaveAttribute("href", /router%20error|router error/i);
  await expect(page.locator("body")).not.toContainText("Router unavailable");
  await expect(page.locator("body")).not.toContainText("routing is disabled");
  const fallbackReport = await page.evaluate(() => window.AfroToolsAIIntentAnalytics.getReport());
  expect(fallbackReport.totals.promptsSubmitted).toBe(1);
  expect(fallbackReport.totals.fallback).toBe(1);
  expect(fallbackReport.fallbackRate).toBe(100);
  expect(fallbackReport.surfaceBreakdown.some((item) => item.name === "ask_page")).toBe(true);
  expect(fallbackReport.noMatchCategories.some((item) => item.name === "local_search")).toBe(true);
  expect(JSON.stringify(fallbackReport)).not.toContain("router error");
});

test("ask private search handoff keeps prompt out of the URL", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/", { waitUntil: "domcontentloaded" });
  await page.locator("#askPrompt").fill("Get Ghana passport documents, fees to check, and next steps");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await page.locator("#resultSearchLink").click();
  await page.waitForURL(/\/search\/?$/);
  await expect(page.locator("#search-input")).toHaveValue("Get Ghana passport documents, fees to check, and next steps");
  await expect(page.locator("#results-container a[href]").first()).toContainText(/Passport/i);
  expect(page.url()).not.toContain("Ghana");
  expect(page.url()).not.toContain("documents");
});

test("ask command page lets users add missing details from chips", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ask/", { waitUntil: "domcontentloaded" });

  await page.locator("#askPrompt").fill("I want to study in Canada from Nigeria with $8,000");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page.locator("#stateResult")).toBeVisible();
  await expect(page.locator("#toolTitle")).toContainText(/Study|Scholarship/i);
  await page.locator("#detailDrawer summary").click();
  const detailChip = page.getByRole("button", { name: "Add detail: Study Level" });
  await expect(detailChip).toBeVisible();
  await detailChip.click();

  await expect(page.locator("#questionsIntro")).toContainText("Add the detail in the prompt");
  await expect(page.locator("#askPrompt")).toHaveValue(/Study level: $/i);
  await expect(page.locator("#askPrompt")).toBeFocused();
  await expect(page.locator("#openToolLink")).not.toHaveAttribute("href", /Study%20Level|study%20level/i);
});
