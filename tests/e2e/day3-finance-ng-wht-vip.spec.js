const { test, expect } = require("@playwright/test");

const routes = {
  en: "/tools/ng-wht/",
  fr: "/fr/tools/ng-retenue-source/",
  ha: "/ha/kayan-aiki/wht-najeriya/",
  yo: "/yo/awon-ise/wht-naijiria/",
};

async function calculate(page) {
  await page.locator('[name="scopeConfirmed"]').check();
  await page.locator('[data-form] button[type="submit"]').click();
}

test("English route calculates the 5% professional fixture and exact 10% rent row", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (failure) => errors.push(failure.message));
  await page.goto(routes.en);
  await calculate(page);
  await expect(page.locator("[data-deduction]")).toContainText(/250.*000/);
  await expect(page.locator("[data-rate]")).toHaveText("5.00%");
  await page.locator('[name="transactionType"]').selectOption("rent");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("10.00%");
  expect(errors).toEqual([]);
});

test("missing Tax ID doubles eligible non-passive rates but not passive rent", async ({ page }) => {
  await page.goto(routes.en);
  await page.locator('[name="scopeConfirmed"]').check();
  await page.locator('[name="taxIdAvailable"]').uncheck();
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("10.00%");
  await expect(page.locator("[data-notes]")).toContainText("doubled");
  await page.locator('[name="transactionType"]').selectOption("rent");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("10.00%");
  await expect(page.locator("[data-notes]")).not.toContainText("doubled");
});

test("directors, winnings, unsupported goods and treaty paths fail or calculate deliberately", async ({ page }) => {
  await page.goto(routes.en);
  await page.locator('[name="scopeConfirmed"]').check();
  await page.locator('[name="transactionType"]').selectOption("directorsFees");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-error]")).toContainText("no rate");
  await page.locator('[name="recipientClass"]').selectOption("noncorporate");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("15.00%");
  await page.locator('[name="transactionType"]').selectOption("winnings");
  await page.locator('[name="residency"]').selectOption("nonresident");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("15.00%");
  await page.locator('[name="transactionType"]').selectOption("goods");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-error]")).toContainText("no rate");
  await page.locator('[name="transactionType"]').selectOption("dividend");
  await page.locator('[name="treatment"]').selectOption("treaty");
  await page.locator('[name="treatyRatePercent"]').fill("7.5");
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-error]")).toContainText("evidence");
  await page.locator('[name="documentationConfirmed"]').check();
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator("[data-rate]")).toHaveText("7.50%");
});

for (const [language, route] of Object.entries(routes)) {
  test(`${language} route uses the shared reviewed engine without runtime errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (failure) => errors.push(failure.message));
    await page.goto(route);
    await calculate(page);
    await expect(page.locator("[data-rate]")).toHaveText("5.00%");
    await expect(page.locator("[data-deduction]")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("320, 360 and 375px layouts and 200% text reflow avoid document overflow", async ({ page }) => {
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(routes.en);
    const normal = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(normal[0]).toBeLessThanOrEqual(normal[1] + 1);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const zoomed = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(zoomed[0]).toBeLessThanOrEqual(zoomed[1] + 1);
  }
});

test("manual and system dark modes keep cards and controls readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(routes.en);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await expect(page.locator(".ng-wht-card").first()).toHaveCSS("background-color", "rgb(21, 32, 25)");
  await expect(page.locator('[name="grossAmount"]')).toHaveCSS("min-height", "44px");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => {
    delete document.documentElement.dataset.theme;
  });
  await expect(page.locator(".ng-wht-card").first()).toHaveCSS("background-color", "rgb(21, 32, 25)");
});

test("local TXT and print/PDF exports are available after a result", async ({ page }) => {
  await page.goto(routes.en);
  await calculate(page);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("[data-download]").click();
  expect((await downloadPromise).suggestedFilename()).toBe("nigeria-wht-estimate.txt");
  await page.evaluate(() => {
    window.print = () => (document.documentElement.dataset.printed = "yes");
  });
  await page.locator("[data-print]").click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "yes");
});

test("French legacy alias redirects to the canonical native French calculator", async ({ page }) => {
  await page.goto("/fr/tools/ng-wht/");
  await expect(page).toHaveURL(/\/fr\/tools\/ng-retenue-source\/$/);
  await expect(page.locator("[data-ng-wht-app]")).toBeVisible();
});
