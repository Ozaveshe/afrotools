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

async function mockAiRoute(page) {
  await page.route("**/.netlify/functions/ai-route-intent", async function (route) {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ ok: true, source: "deterministic", decision: { intentCategory: "career", selectedToolId: "cv-builder", selectedRoute: "/tools/cv-builder/", confidence: 0.91, reasonShort: "Matched CV Builder.", extractedInputs: { country: "Ghana", targetRole: "electrical engineer" }, missingInputs: [], clarificationQuestion: "", safetyDomain: "employment", privacyMode: "browser_local", canPrefill: true, suggestedNextActions: ["Open CV Builder"] } })
    });
  });
}

test("homepage renders one semantic product hero and the quick-start transition", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#home-product-hero")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The right African tool");
  await expect(page.locator("#ai-frontdoor-form")).toHaveCount(1);
  await expect(page.locator("#ai-frontdoor-form")).toHaveAttribute("action", "/ai/");
  await expect(page.locator("label[for='hero-search-input']")).toHaveText("Describe what you would like to do");
  await expect(page.locator("#hero-search-input")).toHaveAttribute("placeholder", "What would you like to do?");
  await expect(page.locator("#hero-search-btn")).toHaveText("Find my tool");
  await expect(page.locator(".home-product-hero__eyebrow")).toContainText("AfroTools AI");
  await expect(page.locator(".home-product-hero__copy")).toHaveText("Describe what you need and AfroTools will take you to the right calculator, document builder or country guide for salaries, tax, jobs, imports, study, solar and more.");
  await expect(page.locator(".home-product-hero__try")).toHaveText("Try:");
  await expect(page.locator(".home-product-hero__browse")).toContainText("Browse all tools");
  await expect(page.locator("[data-registry-count='tools.live_experiences']").first()).not.toHaveText("—");
  await expect(page.locator(".home-quick-start__grid a")).toHaveCount(6);
  await expect(page.locator("#start-country")).toBeVisible();
  expect(await page.locator("#home-product-hero").evaluate((hero) => hero.nextElementSibling.classList.contains("home-quick-start"))).toBe(true);
});

test("homepage startup renders the navbar once without a transient empty main surface", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(function () {
    window.__navbarRenderCount = 0;
    const descriptor = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "innerHTML")
      || Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    Object.defineProperty(ShadowRoot.prototype, "innerHTML", {
      configurable: true,
      get: descriptor.get,
      set: function (value) {
        if (this.host && this.host.localName === "afro-navbar") window.__navbarRenderCount += 1;
        return descriptor.set.call(this, value);
      }
    });
  });
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const startup = await page.evaluate(function () {
    return {
      navbarRenders: window.__navbarRenderCount,
      mainWidth: document.querySelector("#main-content").getBoundingClientRect().width,
      heroHeight: document.querySelector("#home-product-hero").getBoundingClientRect().height
    };
  });
  expect(startup.navbarRenders).toBe(1);
  expect(startup.mainWidth).toBe(390);
  expect(startup.heroHeight).toBeGreaterThan(0);
});

test("homepage prompt chips populate the editable input and update the local preview", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const prompt = page.getByRole("button", { name: "Calculate my Nigeria take-home pay" });
  await prompt.click();

  await expect(page.locator("#hero-search-input")).toHaveValue("Calculate my Nigeria take-home pay");
  await expect(page.locator("#hero-search-input")).toBeFocused();
  await expect(page.locator("#hero-search-input")).toHaveAttribute("aria-expanded", "false");
  await expect(prompt).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-preview-title]")).toHaveText("Nigeria Salary & PAYE Calculator");
  await expect(page.locator("[data-preview-cta]")).toHaveAttribute("href", "/nigeria/ng-salary-tax");

  await page.getByRole("button", { name: "Estimate a Toyota import cost" }).click();
  await expect(page.locator("[data-preview-title]")).toHaveText("Nigeria Import Duty & Landed Cost");
  await expect(page.locator("[data-preview-cta]")).toHaveAttribute("href", "/tools/import-duty/");

  await page.locator("#hero-search-input").fill("Estimate a Toyota import cost with shipping from Japan");
  await expect(page.locator("#hero-search-input")).toHaveValue("Estimate a Toyota import cost with shipping from Japan");
});

test("each example prompt updates the matching published recommendation without a request", async ({ page }) => {
  await quietExternalNoise(page);
  const routeRequests = [];
  page.on("request", function (request) {
    if (request.url().includes("ai-route-intent")) routeRequests.push(request.url());
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const examples = [
    ["Calculate my Nigeria take-home pay", "Nigeria Salary & PAYE Calculator", "/nigeria/ng-salary-tax"],
    ["Build a Ghana electrical engineer CV", "Ghana CV Builder", "/tools/cv-builder/"],
    ["Estimate a Toyota import cost", "Nigeria Import Duty & Landed Cost", "/tools/import-duty/"]
  ];
  for (const [prompt, title, href] of examples) {
    await page.getByRole("button", { name: prompt }).click();
    await expect(page.locator("#hero-search-input")).toHaveValue(prompt);
    await expect(page.locator("[data-preview-title]")).toHaveText(title);
    await expect(page.locator("[data-preview-cta]")).toHaveAttribute("href", href);
  }
  expect(routeRequests).toHaveLength(0);
});

test("homepage submission preserves the private AfroTools AI handoff", async ({ page }) => {
  await quietExternalNoise(page);
  await mockAiRoute(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.locator("#hero-search-input").fill("Write me a CV for an electrical engineer in Ghana");
  await page.locator("#hero-search-input").press("Enter");

  await page.waitForURL(/\/ai\/\?source=homepage_input/);
  await expect(page.locator("#aiCommandInput")).toHaveValue("Write me a CV for an electrical engineer in Ghana");
  expect(new URL(page.url()).searchParams.get("q")).toBe(null);
  const report = await page.evaluate(function () { return window.AfroToolsAIIntentAnalytics.getReport(); });
  expect(report.surfaceBreakdown.some(function (item) { return item.name === "homepage"; })).toBe(true);
  expect(JSON.stringify(report)).not.toContain("electrical engineer");
});

test("submitting a selected example uses that editable query and fires each hero event once", async ({ page }) => {
  await quietExternalNoise(page);
  await mockAiRoute(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(function () {
    sessionStorage.removeItem("hero-test-events");
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.analytics = window.AfroTools.analytics || {};
    window.AfroTools.analytics.track = function (name) {
      var events = JSON.parse(sessionStorage.getItem("hero-test-events") || "[]");
      events.push(name);
      sessionStorage.setItem("hero-test-events", JSON.stringify(events));
    };
  });

  await page.getByRole("button", { name: "Build a Ghana electrical engineer CV" }).click();
  await page.locator("#hero-search-input").press("Enter");
  await page.waitForURL(/\/ai\/\?source=homepage_input/);
  await expect(page.locator("#aiCommandInput")).toHaveValue("Build a Ghana electrical engineer CV");
  const events = await page.evaluate(function () { return JSON.parse(sessionStorage.getItem("hero-test-events") || "[]"); });
  expect(events.filter(function (name) { return name === "ai_frontdoor_example_click"; })).toHaveLength(1);
  expect(events.filter(function (name) { return name === "ai_frontdoor_submit"; })).toHaveLength(1);
  await page.evaluate(function () { history.back(); });
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(function () { history.forward(); });
  await expect(page).toHaveURL(/\/ai\/\?source=homepage_input/);
});

test("homepage dropdown retains keyboard discovery and ARIA state", async ({ page }) => {
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const input = page.locator("#hero-search-input");
  await input.fill("electrical engineer in Ghana");
  await expect(page.locator("#search-dropdown .sd-item").first()).toBeVisible({ timeout: 10000 });
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await input.press("ArrowDown");
  await expect(page.locator("#search-dropdown [aria-selected='true']")).toHaveCount(1);
  await expect(input).toHaveAttribute("aria-activedescendant", /sd-option-\d+/);
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
});

test("all hero, preview, and quick-start routes are published", async ({ page, request }) => {
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const hrefs = new Set();
  for (const prompt of ["Calculate my Nigeria take-home pay", "Build a Ghana electrical engineer CV", "Estimate a Toyota import cost"]) {
    await page.getByRole("button", { name: prompt }).click();
    const stateHrefs = await page.locator(".home-routing-preview a").evaluateAll(function (nodes) {
      return nodes.map(function (node) { return node.getAttribute("href") || ""; });
    });
    stateHrefs.forEach(function (href) { hrefs.add(href); });
  }
  const staticHrefs = await page.locator(".home-quick-start__grid a, .home-product-hero__browse").evaluateAll(function (nodes) {
    return nodes.map(function (node) { return node.getAttribute("href") || ""; });
  });
  staticHrefs.forEach(function (href) { hrefs.add(href); });
  const allHrefs = Array.from(hrefs);
  expect(allHrefs.every(function (href) { return href.startsWith("/") && href.length > 1; })).toBe(true);
  for (const href of allHrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBeLessThan(400);
  }
});

test("hero accessibility contracts and reduced-motion styling remain intact", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const audit = await page.evaluate(function () {
    const ids = Array.from(document.querySelectorAll("[id]")).map(function (node) { return node.id; });
    const duplicateIds = ids.filter(function (id, index) { return ids.indexOf(id) !== index; });
    const heroHeadings = Array.from(document.querySelectorAll("#home-product-hero h1, #home-product-hero h2")).map(function (node) { return Number(node.tagName.slice(1)); });
    const focusables = Array.from(document.querySelectorAll("#home-product-hero input, #home-product-hero button, #home-product-hero a, .home-quick-start a"));
    return {
      duplicateIds,
      heroHeadings,
      emptyLinks: Array.from(document.querySelectorAll("#home-product-hero a, .home-quick-start a")).filter(function (node) { return !node.textContent.trim(); }).length,
      nestedInteractive: document.querySelectorAll("a button, a input, a select, button a").length,
      hiddenIcons: Array.from(document.querySelectorAll("#home-product-hero [aria-hidden='true'], .home-quick-start [aria-hidden='true']")).length,
      badTabindex: focusables.filter(function (node) { return node.tabIndex !== 0; }).length,
      moving: focusables.filter(function (node) {
        const style = getComputedStyle(node);
        return style.transitionDuration !== "0s" && style.transitionDuration !== "0.00001s";
      }).length
    };
  });
  expect(audit.duplicateIds).toEqual([]);
  expect(audit.heroHeadings).toEqual([1, 2]);
  expect(audit.emptyLinks).toBe(0);
  expect(audit.nestedInteractive).toBe(0);
  expect(audit.hiddenIcons).toBeGreaterThan(0);
  expect(audit.badTabindex).toBe(0);
  expect(audit.moving).toBe(0);

  for (const selector of ["#hero-search-input", "#hero-search-btn", ".home-prompt-chip:first-of-type", ".home-product-hero__browse", "[data-preview-cta]", ".home-quick-start__grid a:first-child"]) {
    const target = page.locator(selector);
    await target.focus();
    const focusStyle = await target.evaluate(function (node) {
      const style = getComputedStyle(node);
      return { outline: style.outlineStyle, boxShadow: style.boxShadow };
    });
    expect(focusStyle.outline !== "none" || focusStyle.boxShadow !== "none", selector).toBe(true);
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  await expect(page.locator(".home-skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("server-rendered hero and native GET fallback remain usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await quietExternalNoise(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("#ai-frontdoor-form")).toHaveCount(1);
  await page.locator("#hero-search-input").fill("Nigeria salary tax");
  await page.locator("#hero-search-btn").click();
  await expect(page).toHaveURL(/\/ai\/\?q=Nigeria(?:\+|%20)salary(?:\+|%20)tax/);
  await context.close();
});

for (const viewport of [
  { name: "large desktop", width: 1440, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "small desktop", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "large mobile", width: 430, height: 932 },
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow mobile", width: 360, height: 800 }
]) {
  test(`homepage hero is usable without overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await quietExternalNoise(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#home-product-hero")).toBeVisible();
    const metrics = await page.evaluate(function () {
      function minHeight(selector) {
        const nodes = Array.from(document.querySelectorAll(selector)).filter(function (node) { return node.getBoundingClientRect().width > 0; });
        return Math.min.apply(null, nodes.map(function (node) { return node.getBoundingClientRect().height; }));
      }
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        inputFont: parseFloat(getComputedStyle(document.querySelector("#hero-search-input")).fontSize),
        promptHeight: minHeight(".home-prompt-chip"),
        categoryHeight: minHeight(".home-quick-start__grid a"),
        submitHeight: minHeight("#hero-search-btn"),
        relatedColumns: getComputedStyle(document.querySelector("[data-preview-related]")).gridTemplateColumns.split(" ").length
      };
    });
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.promptHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.categoryHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.submitHeight).toBeGreaterThanOrEqual(44);
    if (viewport.width <= 700) expect(metrics.inputFont).toBeGreaterThanOrEqual(16);
    if (viewport.width <= 430) expect(metrics.relatedColumns).toBe(1);
  });
}
