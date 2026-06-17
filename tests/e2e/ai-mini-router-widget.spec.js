const { test, expect } = require("@playwright/test");

test("AI mini-router iframe recommends a workflow without raw prompt in URL", async ({ page }) => {
  await page.goto("/widgets/iframe/ai-mini-router.html?defaultCountry=Nigeria&defaultCategory=education&allowedCategories=education,trade,energy&theme=minimal&partnerId=test-school");

  await expect(page.getByText("Ask AfroTools AI")).toBeVisible();
  await page.getByLabel("What do you need to do?").fill("How much duty to import a Toyota Axio into Nigeria?");
  await page.getByRole("button", { name: "Find tool" }).click();

  const link = page.getByRole("link", { name: "Open on AfroTools" });
  const directLink = page.getByRole("link", { name: "Open tool directly" });
  await expect(page.getByText("Import Duty Calculator")).toBeVisible();
  await expect(page.locator(".aw-ai-reason")).toContainText("full AfroTools catalog");
  await expect(page.getByText("Find a tool")).toBeVisible();
  await expect(page.getByText("Where to continue")).toBeVisible();
  await expect(page.getByText("Existing tool call")).toHaveCount(0);
  await expect(page.getByText("import-duty -> /tools/import-duty/")).toBeVisible();
  await expect(page.getByText("No raw prompt in URL")).toBeVisible();
  await expect(link).toHaveAttribute("href", /\/ai\/trade\/\?source=ai_widget/);
  await expect(link).toHaveAttribute("href", /partner=test-school/);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).not.toHaveAttribute("href", /Toyota|Axio/i);
  await expect(directLink).toHaveAttribute("href", /\/tools\/import-duty\/\?source=ai_widget/);
  await expect(directLink).toHaveAttribute("target", "_blank");
  await expect(directLink).toHaveAttribute("rel", /noopener/);
  await expect(directLink).not.toHaveAttribute("href", /Toyota|Axio/i);
  const report = await page.evaluate(function () {
    return window.AfroToolsAIIntentAnalytics.getReport();
  });
  expect(report.surfaceBreakdown.some(function (item) { return item.name === "ai_widget"; })).toBe(true);
  expect(report.topSelectedTools.some(function (item) { return item.name === "import-duty"; })).toBe(true);
  expect(JSON.stringify(report)).not.toContain("Toyota Axio");
});

test("AI mini-router iframe can use the full local tool catalog", async ({ page }) => {
  await page.goto("/widgets/iframe/ai-mini-router.html?defaultCountry=Ghana&defaultCategory=country-intelligence&allowedCategories=country-intelligence,career&theme=light&partnerId=civic-partner");

  await page.getByLabel("What do you need to do?").fill("Get Ghana passport documents, fees, and next steps");
  await page.getByRole("button", { name: "Find tool" }).click();

  const directLink = page.getByRole("link", { name: "Open tool directly" });
  await expect(page.locator(".aw-ai-result")).toContainText(/Passport/i);
  await expect(page.locator(".aw-ai-reason")).toContainText("full AfroTools catalog");
  await expect(page.getByText("passport-checklist -> /tools/passport-checklist/")).toBeVisible();
  await expect(directLink).toHaveAttribute("href", /\/tools\/passport-checklist\/\?source=ai_widget/);
  await expect(directLink).toHaveAttribute("target", "_blank");
  await expect(directLink).toHaveAttribute("rel", /noopener/);
  await expect(directLink).not.toHaveAttribute("href", /Ghana|documents|fees|next/i);
});

test("AI mini-router script embed accepts partner configuration", async ({ page }) => {
  await page.goto("/widgets/demo/");
  await page.evaluate(() => {
    const mount = document.createElement("div");
    mount.setAttribute("data-afrotools", "ask-ai-router");
    mount.setAttribute("data-afrotools-default-country", "Ghana");
    mount.setAttribute("data-afrotools-default-category", "career");
    mount.setAttribute("data-afrotools-partner-id", "jobs-board");
    mount.setAttribute("data-afrotools-allowed-categories", "career,business");
    mount.setAttribute("data-afrotools-sponsor-label", "In partnership with Jobs Board");
    document.body.prepend(mount);
    window.AfroWidgets.init();
  });

  await expect(page.getByText("In partnership with Jobs Board")).toBeVisible();
  await page.getByLabel("What do you need to do?").fill("Write a CV for an electrical engineer in Ghana");
  await page.getByRole("button", { name: "Find tool" }).click();

  const link = page.getByRole("link", { name: "Open on AfroTools" });
  const directLink = page.getByRole("link", { name: "Open tool directly" });
  await expect(page.getByText("CV and Career Agent")).toBeVisible();
  await expect(page.getByText("Where to continue")).toBeVisible();
  await expect(page.getByText("Existing tool call")).toHaveCount(0);
  await expect(page.getByText("cv-builder -> /tools/cv-builder/")).toBeVisible();
  await expect(link).toHaveAttribute("href", /\/ai\/career\/\?source=ai_widget/);
  await expect(link).toHaveAttribute("href", /partner=jobs-board/);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(directLink).toHaveAttribute("href", /\/tools\/cv-builder\/\?source=ai_widget/);
  await expect(directLink).toHaveAttribute("target", "_blank");
  await expect(directLink).toHaveAttribute("rel", /noopener/);
  await expect(directLink).not.toHaveAttribute("href", /electrical|engineer|Ghana/i);
});
