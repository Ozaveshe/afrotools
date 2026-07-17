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

function installConsoleGuard(page) {
  const errors = [];
  page.on("console", function (message) {
    if (message.type() === "error") errors.push(message.text());
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
  await expect(page.locator(".ak-plan-summary")).toContainText("3-day plan ready", { timeout: 30000 });
  await expect(page.locator(".ak-plan-day")).toHaveCount(3);
  await expect(page.locator(".ak-plan-shopping")).toContainText("Grouped shopping list");
  await expect(page.locator(".ak-plan-shopping-group").first()).toContainText("Day 1:");

  await page.locator("#ak-plan-copy").click();
  await expect(page.locator("#ak-plan-status")).toContainText("Shopping list copied");
  const copiedText = await page.evaluate(function () { return window.__akCopiedText || ""; });
  expect(copiedText).toContain("AfroKitchen 3-day recipe plan");
  expect(copiedText).toContain("Shopping list");

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
  await expect(page.locator(".ak-plan-summary")).toContainText("7-day plan ready", { timeout: 30000 });
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
  await expect(page.locator(".ak-plan-summary")).toContainText("3-day plan ready", { timeout: 30000 });
  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  expect(consoleErrors).toEqual([]);
});
