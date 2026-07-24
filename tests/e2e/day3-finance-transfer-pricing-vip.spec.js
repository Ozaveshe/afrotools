const { test, expect } = require("@playwright/test");

const routes = { en: "/tools/transfer-pricing/", fr: "/fr/tools/prix-transfert/" };

async function prepare(page, route = routes.en) {
  await page.goto(route);
  await page.locator('[name="jurisdiction"]').fill("Synthetic jurisdiction");
  await page.locator('[name="period"]').fill("FY2025");
  await page.locator('[name="comparableSource"]').fill("Synthetic screened range, FY2025, reviewed 2026-07-22");
  await page.locator('[name="scopeConfirmed"]').check();
}
async function submit(page) {
  await page.locator("[data-form] button[type=submit]").click();
}

test("TNMM reports only an inside position against the user-supplied range", async ({ page }) => {
  await prepare(page);
  await submit(page);
  await expect(page.locator("[data-position]")).toHaveText("Inside the user-supplied range");
  await expect(page.locator("[data-indicator]")).toHaveText("5%");
  await expect(page.locator(".tp-alert")).toContainText("Do not book an adjustment");
});

test("cost-plus, resale, CUP and loan arithmetic use method-specific units", async ({ page }) => {
  await prepare(page);
  await page.locator('[name="method"]').selectOption("costPlus");
  await page.locator('[name="amountA"]').fill("115");
  await page.locator('[name="amountB"]').fill("100");
  await page.locator('[name="rangeLow"]').fill("10");
  await page.locator('[name="rangeMedian"]').fill("15");
  await page.locator('[name="rangeHigh"]').fill("20");
  await submit(page);
  await expect(page.locator("[data-indicator]")).toHaveText("15%");
  await page.locator('[name="method"]').selectOption("resale");
  await page.locator('[name="amountA"]').fill("200");
  await page.locator('[name="amountB"]').fill("150");
  await page.locator('[name="rangeLow"]').fill("20");
  await page.locator('[name="rangeMedian"]').fill("25");
  await page.locator('[name="rangeHigh"]').fill("30");
  await submit(page);
  await expect(page.locator("[data-indicator]")).toHaveText("25%");
  await page.locator('[name="method"]').selectOption("cup");
  await page.locator('[name="amountA"]').fill("104");
  await page.locator('[name="rangeLow"]').fill("95");
  await page.locator('[name="rangeMedian"]').fill("100");
  await page.locator('[name="rangeHigh"]').fill("103");
  await submit(page);
  await expect(page.locator("[data-position]")).toHaveText("Above the user-supplied range");
  await expect(page.locator("[data-indicator]")).toContainText("104");
  await page.locator('[name="method"]').selectOption("loan");
  await page.locator('[name="amountA"]').fill("1000000");
  await page.locator('[name="amountB"]').fill("8");
  await page.locator('[name="rangeLow"]').fill("5");
  await page.locator('[name="rangeMedian"]').fill("6");
  await page.locator('[name="rangeHigh"]').fill("7");
  await submit(page);
  await expect(page.locator("[data-indicator]")).toHaveText("8%");
});

test("missing source, missing acknowledgement and unordered range fail closed", async ({ page }) => {
  await page.goto(routes.en);
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("jurisdiction");
  await page.locator('[name="jurisdiction"]').fill("Synthetic jurisdiction");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("period");
  await page.locator('[name="period"]').fill("FY2025");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("Confirm");
  await page.locator('[name="scopeConfirmed"]').check();
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("source");
  await page.locator('[name="comparableSource"]').fill("Synthetic source");
  await page.locator('[name="rangeLow"]').fill("8");
  await page.locator('[name="rangeMedian"]').fill("5");
  await page.locator('[name="rangeHigh"]').fill("3");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("ordered");
});

for (const [language, route] of Object.entries(routes)) {
  test(`${language} route uses the shared engine without runtime errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await prepare(page, route);
    await submit(page);
    await expect(page.locator("[data-result]")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("320, 360, 375 and 768px plus 200% text reflow avoid document overflow", async ({ page }) => {
  for (const width of [320, 360, 375, 768]) {
    await page.setViewportSize({ width, height: 820 });
    await page.goto(routes.en);
    const normal = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(normal[0]).toBeLessThanOrEqual(normal[1] + 1);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const zoomed = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(zoomed[0]).toBeLessThanOrEqual(zoomed[1] + 1);
  }
});

test("manual and system dark modes and focus treatment are readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(routes.en);
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await expect(page.locator(".tp-card").first()).toHaveCSS("background-color", "rgb(21, 34, 41)");
  await expect(page.locator('[name="amountA"]')).toHaveCSS("min-height", "44px");
  await page.locator('[name="amountA"]').focus();
  await expect(page.locator('[name="amountA"]')).toHaveCSS("outline-style", "solid");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await expect(page.locator(".tp-card").first()).toHaveCSS("background-color", "rgb(21, 34, 41)");
});

test("TXT, JSON and print/PDF exports are real and local", async ({ page }) => {
  await prepare(page);
  await submit(page);
  let download = page.waitForEvent("download");
  await page.locator("[data-txt]").click();
  expect((await download).suggestedFilename()).toBe("transfer-pricing-comparability.txt");
  download = page.waitForEvent("download");
  await page.locator("[data-json]").click();
  expect((await download).suggestedFilename()).toBe("transfer-pricing-comparability.json");
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printed = "yes"; }; });
  await page.locator("[data-print]").click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "yes");
});

test("canonical, reciprocal hreflang and structured-data contracts are present", async ({ page }) => {
  await page.goto(routes.en);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute("href", "https://afrotools.com/tools/transfer-pricing/");
  await expect(page.locator('link[rel=alternate][hreflang=fr]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/prix-transfert/");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join(" ")).toContain("Transfer Pricing Comparability Worksheet");
  expect(jsonLd.join(" ")).not.toContain("audit report");
});
