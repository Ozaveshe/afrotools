const { test, expect } = require("@playwright/test");

test("AI mini-router iframe recommends a workflow without raw prompt in URL", async ({ page }) => {
  await page.goto("/widgets/iframe/ai-mini-router.html?defaultCountry=Nigeria&defaultCategory=education&allowedCategories=education,trade,energy&theme=minimal&partnerId=test-school");

  await expect(page.getByText("Ask AfroTools AI")).toBeVisible();
  await page.getByLabel("What do you need to do?").fill("How much duty to import a Toyota Axio into Nigeria?");
  await page.getByRole("button", { name: "Find tool" }).click();

  const link = page.getByRole("link", { name: "Open on AfroTools" });
  await expect(page.getByText("Import Duty and Trade Advisor")).toBeVisible();
  await expect(link).toHaveAttribute("href", /\/ai\/trade\/\?source=ai_widget/);
  await expect(link).toHaveAttribute("href", /partner=test-school/);
  await expect(link).not.toHaveAttribute("href", /Toyota|Axio|import/i);
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
  await expect(page.getByText("CV and Career Agent")).toBeVisible();
  await expect(link).toHaveAttribute("href", /\/ai\/career\/\?source=ai_widget/);
  await expect(link).toHaveAttribute("href", /partner=jobs-board/);
});
