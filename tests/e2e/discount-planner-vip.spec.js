const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const pdf = require("pdf-parse");

const routes = [
  "/tools/discount-calc/",
  "/fr/tools/calculateur-remise/",
  "/sw/zana/kikokotoo-discount/"
];
const widths = [320, 360, 375, 768];

async function calculate(page) {
  await page.locator("#unitPrice").fill("100");
  await page.locator("#quantity").fill("2");
  await page.locator("[data-discount]").first().fill("20");
  await page.locator("#addDiscount").click();
  await page.locator("[data-discount]").nth(1).fill("10");
  await page.locator("#taxPct").fill("15");
  await page.locator("#dcpForm button[type=submit]").click();
}

for (const route of routes) {
  for (const width of widths) {
    test(`${route} is calculation and reflow safe at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.goto(route);
      await expect(page.locator("#dcpForm")).toBeVisible();
      await calculate(page);
      await expect(page.locator("#dcpResult")).toBeVisible();
      const text = (await page.locator("#dcpMetrics").innerText()).replace(/,/g, ".");
      expect(text).toContain("200");
      expect(text).toContain("144");
      expect(text).toContain("56");
      expect(text).toContain("28");
      expect(text).toContain("21.6");
      expect(text).toContain("165.6");
      expect(await page.locator("#dcpForm input").evaluateAll((nodes) => nodes.every((node) => node.labels.length > 0))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("invalid and stale results disable every native export", async ({ page }) => {
  await page.goto("/tools/discount-calc/");
  await calculate(page);
  await expect(page.locator("[data-export]:not(:disabled)")).toHaveCount(5);
  await page.locator("#taxPct").fill("101");
  await expect(page.locator("[data-export]:disabled")).toHaveCount(5);
  await page.locator("#dcpForm button[type=submit]").click();
  await expect(page.locator("#taxPct")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#dcpResult")).not.toBeVisible();
});

test("CSV, JSON and parser-readable PDF preserve formula and scope", async ({ page }) => {
  await page.goto("/tools/discount-calc/");
  await calculate(page);
  const csvDownload = page.waitForEvent("download");
  await page.locator('[data-export="csv"]').click();
  const csv = fs.readFileSync(await (await csvDownload).path(), "utf8");
  expect(csv).toContain('"discount_1_pct","20"');
  expect(csv).toContain('"savings","56');
  expect(csv).toContain('"entered_post_discount_tax_pct","15"');

  const jsonDownload = page.waitForEvent("download");
  await page.locator('[data-export="json"]').click();
  const json = JSON.parse(fs.readFileSync(await (await jsonDownload).path(), "utf8"));
  expect(json.result.outputs.savings).toBeCloseTo(56);
  expect(json.result.outputs.taxAmount).toBeCloseTo(21.6);
  expect(json.scopeNote).toContain("No supplied tax rate");

  const pdfDownload = page.waitForEvent("download");
  await page.locator('[data-export="pdf"]').click();
  const parsed = await pdf(fs.readFileSync(await (await pdfDownload).path()));
  expect(parsed.text).toContain("Discount Scenario");
  expect(parsed.text).toContain("Pre-tax savings");
  expect(parsed.text).toContain("No supplied tax rate");
});

test("widget uses shared semantics and canonical handoff at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/widgets/iframe/financial-discount-calc.html");
  await page.locator("#aw-orig").fill("100");
  await page.locator("#aw-qty").fill("1");
  await page.locator("#aw-d1").fill("10");
  await page.locator("#aw-d2").fill("0");
  await page.locator("#aw-tax").fill("20");
  await page.locator("#aw-calc").click();
  const text = await page.locator("#aw-res").innerText();
  expect(text).toContain("108");
  expect(text).toContain("Pre-tax savings");
  expect(text).toContain("10");
  expect(await page.locator("input").evaluateAll((nodes) => nodes.every((node) => node.labels.length > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('a[href*="/tools/discount-calc/"]')).toBeVisible();
});
