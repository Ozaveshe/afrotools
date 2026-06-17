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

test("default homepage keeps the legacy hero while routing its prompt form through AfroTools AI", async ({ page }) => {
  await quietExternalNoise(page);
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        source: "deterministic",
        decision: {
          intentCategory: "career",
          selectedToolId: "cv-builder",
          selectedRoute: "/tools/cv-builder/",
          confidence: 0.91,
          reasonShort: "Matched CV Builder for a Ghana electrical engineer profile.",
          extractedInputs: { country: "Ghana", targetRole: "electrical engineer" },
          missingInputs: [],
          clarificationQuestion: "",
          safetyDomain: "employment",
          highStakesNotice: "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.",
          privacyMode: "browser_local",
          canPrefill: true,
          suggestedNextActions: ["Open CV Builder"]
        }
      })
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#afrotoolsAiCommandHero")).toBeHidden();
  await expect(page.locator("#legacy-home-hero")).toBeVisible();
  await expect(page.locator("#hero-search-input")).toBeVisible();
  await expect(page.locator("#ai-frontdoor-form")).toHaveAttribute("action", "/ai/");
  await expect(page.locator("#start-country")).toBeAttached();
  await expect(page.getByRole("link", { name: /all countries/i }).first()).toHaveAttribute("href", "/countries/");

  await page.locator("#hero-search-input").fill("Write me a CV for an electrical engineer in Ghana");
  await page.locator("#hero-search-btn").click();
  await page.waitForURL(/\/ai\//);
  await expect(page.locator("#aiCommandInput")).toHaveValue("Write me a CV for an electrical engineer in Ghana");
  await expect(page.locator("[data-workflow-card]").first()).toContainText("CV Builder");
  expect(new URL(page.url()).searchParams.get("q")).toBe(null);
  const report = await page.evaluate(function () {
    return window.AfroToolsAIIntentAnalytics.getReport();
  });
  expect(report.surfaceBreakdown.some(function (item) { return item.name === "homepage"; })).toBe(true);
  expect(JSON.stringify(report)).not.toContain("electrical engineer");
});

test("legacy homepage dropdown surfaces an AI match for sentence-style prompts", async ({ page }) => {
  await quietExternalNoise(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.locator("#hero-search-input").fill("n electrical engineer in Ghana");
  const firstSuggestion = page.locator("#search-dropdown .sd-item").first();

  await expect(firstSuggestion).toContainText(/CV|Resume/i, { timeout: 10000 });
  await expect(firstSuggestion).toContainText(/AI match/i);
  await expect(firstSuggestion).toHaveAttribute("href", "/tools/cv-builder/");
  await expect(page.locator("#search-dropdown")).not.toContainText("No tools found");

  const loaded = await page.evaluate(function () {
    return {
      router: Boolean(window.AfroToolsAIOrchestrator),
      aiScriptCount: document.querySelectorAll('script[src*="/assets/js/ai/"]').length
    };
  });
  expect(loaded.router).toBe(true);
  expect(loaded.aiScriptCount).toBeGreaterThanOrEqual(4);
  const report = await page.evaluate(function () {
    return window.AfroToolsAIIntentAnalytics.getReport();
  });
  expect(report.surfaceBreakdown.some(function (item) { return item.name === "homepage"; })).toBe(true);
  expect(report.topSelectedTools.some(function (item) { return item.name === "cv-builder"; })).toBe(true);
  expect(JSON.stringify(report)).not.toContain("electrical engineer");
});

test("feature flag on renders the command homepage variant", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  await expect(hero).toBeVisible();
  await expect(page.locator("#legacy-home-hero")).toBeHidden();
  await expect(hero.getByRole("heading", { name: /AfroTools AI/i, level: 1 })).toContainText("Africa");
  await expect(hero.locator("#ai-home-command-input")).toBeVisible();
  await expect(hero.getByRole("link", { name: "Browse all tools" })).toHaveAttribute("href", "/tools/");
  await expect(page.locator("#start-country")).toBeAttached();
  await expect(page.getByRole("link", { name: /CV Builder/i }).first()).toBeAttached();
});

test("prompt chips populate and focus the command input", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  const input = hero.locator("#ai-home-command-input");
  await hero.getByRole("button", { name: "Get Ghana passport documents, fees to check, and next steps" }).click();

  await expect(input).toHaveValue("Get Ghana passport documents, fees to check, and next steps");
  await expect(input).toBeFocused();
});

test("command submit routes to AI, scrubs prompt from URL, and launches CV Builder prefill", async ({ page }) => {
  await quietExternalNoise(page);
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        ok: true,
        source: "model_validated",
        decision: {
          intentCategory: "career",
          selectedToolId: "cv-builder",
          selectedRoute: "/tools/cv-builder/",
          confidence: 0.91,
          reasonShort: "Matched CV Builder for a Ghana electrical engineer profile.",
          extractedInputs: { country: "Ghana", targetRole: "electrical engineer" },
          missingInputs: [],
          clarificationQuestion: "",
          safetyDomain: "employment",
          highStakesNotice: "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.",
          privacyMode: "browser_local",
          canPrefill: true,
          suggestedNextActions: ["Open CV Builder"]
        }
      })
    });
  });

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  await hero.locator("#ai-home-command-input").fill("Write me a CV for an electrical engineer in Ghana");
  await hero.getByRole("button", { name: "Ask AfroTools AI" }).click();

  await page.waitForURL(/\/ai\//);
  await expect(page.locator("#aiCommandInput")).toHaveValue("Write me a CV for an electrical engineer in Ghana");
  await expect(page.locator("[data-workflow-card]").first()).toContainText("CV Builder");
  expect(new URL(page.url()).searchParams.get("q")).toBe(null);

  await page.locator("[data-workflow-card]").first().getByRole("link", { name: /Open (this )?tool/ }).click();
  await page.waitForURL(/\/tools\/cv-builder\/.*prefill=1/);

  const prefill = await page.evaluate(function () {
    return JSON.parse(sessionStorage.getItem("afrotools.aiPrefillDraft") || "{}");
  });
  expect(prefill.toolId).toBe("cv-builder");
  expect(prefill.normalizedInputs.country).toBe("Ghana");
  expect(prefill.normalizedInputs.targetRole).toBe("electrical engineer");
  expect(page.url()).not.toContain("electrical");
  expect(page.url()).not.toContain("Ghana");
});

test("category pills render with non-empty local links", async ({ page, request }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const links = page.locator("#afrotoolsAiCommandHero .ai-command-category-pill");
  await expect(links).toHaveCount(9);

  const hrefs = await links.evaluateAll(function (nodes) {
    return nodes.map(function (node) {
      return node.getAttribute("href") || "";
    });
  });
  expect(hrefs.every(function (href) { return href.startsWith("/") && href.length > 1; })).toBe(true);

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBeLessThan(400);
  }
});

test("command hero fits a mobile viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  await expect(hero).toBeVisible();
  await expect(hero.locator("#ai-home-command-input")).toBeVisible();

  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
});

test("command hero chips and category pills stay tappable on narrow phones", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const metrics = await page.evaluate(function () {
    function minHeight(selector) {
      const nodes = Array.from(document.querySelectorAll(selector)).filter(function (node) {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return nodes.length ? Math.min.apply(null, nodes.map(function (node) { return node.getBoundingClientRect().height; })) : 999;
    }
    function maxRight(selector) {
      const nodes = Array.from(document.querySelectorAll(selector)).filter(function (node) {
        return node.getBoundingClientRect().width > 0;
      });
      return Math.max.apply(null, nodes.map(function (node) { return node.getBoundingClientRect().right; }));
    }
    return {
      inputFont: parseFloat(getComputedStyle(document.querySelector("#ai-home-command-input")).fontSize),
      chipHeight: minHeight(".ai-command-chip"),
      categoryHeight: minHeight(".ai-command-category-pill"),
      submitHeight: minHeight(".ai-command-home-submit"),
      chipRight: maxRight(".ai-command-chip"),
      categoryRight: maxRight(".ai-command-category-pill"),
      viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth
    };
  });

  expect(metrics.inputFont).toBeGreaterThanOrEqual(16);
  expect(metrics.chipHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.categoryHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.submitHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.chipRight).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.categoryRight).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
});
