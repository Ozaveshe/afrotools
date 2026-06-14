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

test("feature flag off leaves the current homepage hero and discovery surface available", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#afrotoolsAiCommandHero")).toBeHidden();
  await expect(page.locator("#legacy-home-hero")).toBeVisible();
  await expect(page.locator("#hero-search-input")).toBeVisible();
  await expect(page.locator("#start-country")).toBeAttached();
  await expect(page.getByRole("link", { name: /all countries/i }).first()).toHaveAttribute("href", "/countries/");
});

test("feature flag on renders the command homepage variant", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  await expect(hero).toBeVisible();
  await expect(page.locator("#legacy-home-hero")).toBeHidden();
  await expect(hero.getByRole("heading", { name: /AfroTools AI/i, level: 1 })).toContainText("Africa");
  await expect(hero.getByPlaceholder("What do you want to calculate, compare, write, or plan?")).toBeVisible();
  await expect(hero.getByRole("link", { name: "Browse all tools" })).toHaveAttribute("href", "/tools/");
  await expect(page.locator("#start-country")).toBeAttached();
  await expect(page.getByRole("link", { name: /CV Builder/i }).first()).toBeAttached();
});

test("prompt chips populate and focus the command input", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  const input = hero.locator("#ai-home-command-input");
  await hero.getByRole("button", { name: "Study in Canada from Nigeria with $8,000" }).click();

  await expect(input).toHaveValue("Study in Canada from Nigeria with $8,000");
  await expect(input).toBeFocused();
});

test("command submit routes to the AI command page with q", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/?ai_home_variant=command", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#afrotoolsAiCommandHero");
  await hero.locator("#ai-home-command-input").fill("Import a 2016 Toyota Axio into Nigeria");
  await hero.getByRole("button", { name: "Ask AfroTools AI" }).click();

  await page.waitForURL(/\/ai\/\?q=/);
  const url = new URL(page.url());
  expect(url.pathname).toBe("/ai/");
  expect(url.searchParams.get("q")).toBe("Import a 2016 Toyota Axio into Nigeria");
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
