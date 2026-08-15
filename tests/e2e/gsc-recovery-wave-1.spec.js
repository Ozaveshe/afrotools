const { test, expect } = require("@playwright/test");

const waveRoutes = [
  "/tools/amount-words-gh/",
  "/blog/ghana-cedi-words/",
  "/tools/naira-to-words/",
  "/tools/market-days/",
  "/blog/igbo-market-days/",
  "/tools/waec-calculator/",
  "/blog/waec-result-guide-2026/"
];

test.describe("GSC Recovery Wave 1", () => {
  test("amount pages expose crawlable examples and reciprocal intent links", async ({ page }) => {
    await page.goto("/tools/amount-words-gh/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("region", { name: "Quick answer" })).toBeVisible();
    await expect(page.getByRole("row", { name: /GHS 10,000 Ghana Cedis Ten Thousand Only/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the Ghana Cedi wording guide" })).toHaveAttribute("href", "/blog/ghana-cedi-words/");

    await page.goto("/blog/ghana-cedi-words/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "How to Write Ghana Cedi Amounts in Words", exact: true })).toBeVisible();
    await expect(page.getByRole("row", { name: /GHS 1,000,000,000 Ghana Cedis One Billion Only/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open the GHS converter" })).toHaveAttribute("href", "/tools/amount-words-gh/");

    await page.goto("/tools/naira-to-words/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("row", { name: /NGN 10,000 Ten Thousand Naira Only/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open the Ghana Cedi converter" })).toHaveAttribute("href", "/tools/amount-words-gh/");
  });

  test("market-day lookup remains interactive while the guide owns explanation", async ({ page }) => {
    await page.goto("/tools/market-days/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("region", { name: "Quick answer" })).toContainText("calculated live");
    await page.getByLabel("Pick any Gregorian date").fill("2026-01-01");
    await expect(page.locator("#selectedDayName")).toHaveText("Orie");
    await expect(page.getByRole("link", { name: "Read the Igbo market-day guide" })).toHaveAttribute("href", "/blog/igbo-market-days/");

    await page.goto("/blog/igbo-market-days/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "How Igbo Market Days Work: Eke, Orie, Afor and Nkwo" })).toBeVisible();
    await expect(page.getByRole("table", { name: "The four Igbo market days" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open the market-day finder" })).toHaveAttribute("href", "/tools/market-days/");
  });

  test("WAEC calculator and guide keep calculation and interpretation separate", async ({ page }) => {
    await page.goto("/tools/waec-calculator/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("region", { name: "Quick answer" })).toContainText("Choose the exam system");
    await page.getByRole("button", { name: "Load sample grades" }).click();
    await expect(page.locator("#resultAggregate")).toHaveText("10");
    await expect(page.getByRole("link", { name: "Read the WAEC grading guide" })).toHaveAttribute("href", "/blog/waec-result-guide-2026/");

    await page.goto("/blog/waec-result-guide-2026/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "WAEC Grading System: A1 to F9, Credits and Aggregates" })).toBeVisible();
    await expect(page.getByRole("table", { name: "WAEC grade, planning point, and interpretation" })).toBeVisible();
    await expect(page.locator("article.article-body")).not.toContainText(/Approx\. Aggregate Cutoff|results are expected around/i);
    await expect(page.getByRole("link", { name: "Open the WAEC calculator" })).toHaveAttribute("href", "/tools/waec-calculator/");
  });

  test("all Wave 1 pages stay within a 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const runtimeErrors = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    for (const route of waveRoutes) {
      runtimeErrors.length = 0;
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("region", { name: "Quick answer" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), route).toBe(true);
      expect(runtimeErrors, route + " browser console/runtime errors").toEqual([]);
    }
  });
});
