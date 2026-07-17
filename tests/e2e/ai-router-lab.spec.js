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

test("router lab renders the generated AI tool-call gate without raw prompt leakage", async ({ page }) => {
  await quietExternalNoise(page);

  await page.goto("/ai/router-lab.html", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "AfroTools AI Router Lab" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("#gateStatus")).toContainText("System gate passed");
  await expect(page.locator("#metricRecords")).toContainText("157");
  await expect(page.locator("#metricSplit")).toContainText("99/29/29");
  await expect(page.locator("#metricExact")).toContainText("100%");
  await expect(page.locator("#metricExecutable")).toContainText("100%");
  await expect(page.locator("#metricPrivacy")).toContainText("100%");
  await expect(page.locator("#metricPrompt")).toContainText("2026-06-17.tool-call-v1");
  await expect(page.locator("#metricCatalogTools")).toContainText("1245");
  await expect(page.locator("#metricCatalogChunks")).toContainText("57");
  await expect(page.locator("#categoryRows")).toContainText("agriculture");
  await expect(page.locator("#toolList")).toContainText("afroatlas");
  await expect(page.locator("#privacyList")).toContainText("Synthetic only");
  await expect(page.locator("#readinessList")).toContainText("Readiness gate");
  await expect(page.locator("#readinessList")).toContainText("passed");
  await expect(page.locator("#readinessList")).toContainText("Router-safe tools");
  await expect(page.locator("#readinessList")).toContainText("Catalog pack gate");
  await expect(page.locator("#catalogPackList")).toContainText("Packed existing tools");
  await expect(page.locator("#catalogPackList")).toContainText("1245");
  await expect(page.locator("#catalogPackList")).toContainText("Model context chunks");
  await expect(page.locator("#catalogPackList")).toContainText("57");
  await expect(page.locator("#catalogPackList")).toContainText("Raw private text detected");
  await expect(page.locator("#catalogPackList")).toContainText("false");
  await expect(page.locator("#architectureList")).toContainText("Architecture gate");
  await expect(page.locator("#architectureList")).toContainText("passed");
  await expect(page.locator("#architectureList")).toContainText("static_first_ai_orchestration");
  await expect(page.locator("#architectureList")).toContainText("Heavy UI frameworks");
  await expect(page.locator("#architectureList")).toContainText("0");
  await expect(page.locator("#failureList")).toContainText("No failures in latest report");

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("Router unavailable");
  expect(bodyText).not.toContain("Write me a CV");
  expect(bodyText).not.toContain("Toyota Axio");
});

test("router lab stays usable on a narrow phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await quietExternalNoise(page);

  await page.goto("/ai/router-lab.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#metricGrid")).toBeVisible();
  await expect(page.locator("#gateStatus")).toContainText("System gate passed");

  const overflow = await page.evaluate(function () {
    return document.documentElement.scrollWidth - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  const buttons = await page.locator(".lab-button").evaluateAll(function (nodes) {
    return nodes.map(function (node) {
      var rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  });
  expect(buttons.every(function (button) {
    return button.width >= 44 && button.height >= 42;
  })).toBe(true);
});
