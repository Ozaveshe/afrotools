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
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) return route.abort();
    return route.continue();
  });
}

function installConsoleGuard(page) {
  const errors = [];
  page.on("console", function (message) {
    if (message.type() !== "error") return;
    if (/Failed to load resource|ERR_FAILED|CORS|supabase/i.test(message.text())) return;
    errors.push(message.text());
  });
  page.on("pageerror", function (error) {
    errors.push(error.message);
  });
  return errors;
}

test("AfroKitchen weekly planner generates plans, exports shopping list, handles empty state, and fits mobile", async ({ page }) => {
  test.setTimeout(120000);
  await quietExternalNoise(page);
  await page.addInitScript(function () {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async function (text) {
          window.__akCopiedText = text;
        }
      }
    });
  });
  const consoleErrors = installConsoleGuard(page);

  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#cook-this-week")).toBeVisible();
  await expect(page.locator("#ak-plan-result")).toContainText("generate a 3-day or 7-day plan");

  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-servings").fill("5");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("3-day plan ready", { timeout: 30000 });
  await expect(page.locator(".ak-plan-day")).toHaveCount(3);
  await expect(page.locator(".ak-plan-shopping")).toContainText("Grouped shopping list");
  await expect(page.locator(".ak-plan-shopping-group").first()).toContainText("Day 1:");

  await page.locator("#ak-plan-copy").click();
  await expect(page.locator("#ak-plan-status")).toContainText("Shopping list copied");
  const copiedText = await page.evaluate(function () { return window.__akCopiedText || ""; });
  expect(copiedText).toContain("Shopping list");
  expect(copiedText).toContain("Nigerian Jollof Rice");

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#ak-plan-export").click()
  ]).then(function (values) { return values[0]; });
  expect(download.suggestedFilename()).toBe("afrokitchen-3-day-plan.txt");

  await page.locator("#ak-plan-days").selectOption("7");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-diet").selectOption("");
  await page.locator("#ak-plan-country").selectOption("");
  await page.locator("#ak-plan-occasion").selectOption("");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("7-day plan ready", { timeout: 30000 });
  await expect(page.locator(".ak-plan-day")).toHaveCount(7);

  await page.locator("#ak-plan-time").selectOption("30");
  await page.locator("#ak-plan-diet").selectOption("vegan");
  await page.locator("#ak-plan-country").selectOption("SS");
  await page.locator("#ak-plan-occasion").selectOption("street-food");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-status")).toContainText("No complete plan generated", { timeout: 30000 });
  await expect(page.locator("#ak-plan-result")).toContainText("stored", { timeout: 30000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-diet").selectOption("");
  await page.locator("#ak-plan-country").selectOption("");
  await page.locator("#ak-plan-occasion").selectOption("");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("3-day plan ready", { timeout: 30000 });
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const darkBackgrounds = await page.evaluate(function () {
    return [".ak-planner-card", ".ak-method-card", ".ak-recipe-card-meta-text"].map(function (selector) {
      return getComputedStyle(document.querySelector(selector)).backgroundColor;
    });
  });
  darkBackgrounds.forEach(function (color) {
    expect(Number(color.match(/\d+/)[0])).toBeLessThan(100);
  });
  expect(consoleErrors).toEqual([]);
});

test("AfroKitchen search results stay close to filters and quick picks narrow recipes", async ({ page }) => {
  await quietExternalNoise(page);
  const consoleErrors = installConsoleGuard(page);
  await page.goto("/tools/afrokitchen/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#recipes-grid .ak-recipe-card").first()).toBeVisible();
  await expect(page.locator("#ak-more-filters")).toHaveAttribute("open", "");
  await expect(page.locator("#clear-recipe-filters")).toBeHidden();

  const gap = await page.evaluate(function () {
    const browse = document.getElementById("browse-panel").getBoundingClientRect();
    const results = document.getElementById("recipe-results").getBoundingClientRect();
    return results.top - browse.bottom;
  });
  expect(gap).toBeLessThan(100);

  await page.locator('[data-quick-filter="time"]').click();
  await expect(page.locator("#filter-time")).toHaveValue("45");
  await expect(page.locator("#results-summary")).toContainText("45 minutes or less");
  const times = await page.locator("#recipes-grid .ak-recipe-card-meta-item").filter({ hasText: "Time" }).allTextContents();
  expect(times.length).toBeGreaterThan(0);
  times.forEach(function (time) { expect(Number(time.match(/\d+/)[0])).toBeLessThanOrEqual(45); });

  await page.locator("#clear-recipe-filters").click();
  await expect(page.locator("#filter-time")).toHaveValue("");
  await page.locator('[data-quick-filter="vegetarian"]').click();
  await expect(page.locator("#filter-diet")).toHaveValue("vegetarian");
  await expect(page.locator("#results-summary")).toContainText("Vegetarian");

  await page.locator("#clear-recipe-filters").click();
  await page.locator("#search-input").fill("jollof");
  await expect(page.locator("#results-summary")).toContainText('"jollof"');
  await expect(page.locator("#recipes-grid .ak-recipe-card").first()).toContainText("Jollof");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#ak-more-filters")).not.toHaveAttribute("open", "");
  await page.locator("#clear-recipe-filters").click();
  await expect(page.locator("#clear-recipe-filters")).toBeHidden();
  await page.locator("#ak-more-filters summary").click();
  await expect(page.locator("#filter-country")).toBeVisible();
  await page.locator("#filter-country").selectOption("NG");
  await expect(page.locator("#results-summary")).toContainText("Nigeria");
  await page.locator("#ak-more-filters summary").click();
  await expect(page.locator("#filter-country")).toBeHidden();
  await expect(page.locator("#clear-recipe-filters")).toBeVisible();
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 320, height: 720 });
  const narrowOverflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(narrowOverflow).toBeLessThanOrEqual(1);
  expect(consoleErrors).toEqual([]);
});
