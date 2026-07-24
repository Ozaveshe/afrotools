const { test, expect } = require("@playwright/test");

const routes = { en: "/tools/ke-wht/", fr: "/fr/tools/ke-retenue-source/" };

async function setup(page, route = routes.en) {
  await page.goto(route);
  await page.locator('[name="scopeConfirmed"]').check();
}
async function submit(page) {
  await page.locator("[data-form] button[type=submit]").click();
}

test("management, contractual and commercial-rent acceptance fixtures calculate exactly", async ({ page }) => {
  await setup(page);
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/5.*000/);
  await page.locator('[name="residency"]').selectOption("nonresident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/20.*000/);
  await page.locator('[name="paymentType"]').selectOption("contractual");
  await page.locator('[name="residency"]').selectOption("resident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/3.*000/);
  await page.locator('[name="residency"]').selectOption("nonresident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/20.*000/);
  await page.locator('[name="paymentType"]').selectOption("immovableRent");
  await page.locator('[name="residency"]').selectOption("resident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/10.*000/);
  await page.locator('[name="residency"]').selectOption("nonresident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/30.*000/);
});

test("residential MRI, public goods and controlling dividend require explicit evidence", async ({ page }) => {
  await setup(page);
  await page.locator('[name="paymentType"]').selectOption("residentialRent");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("eligibility");
  await page.locator('[name="evidenceConfirmed"]').check();
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/7.*500/);
  await page.locator('[name="paymentType"]').selectOption("publicGoods");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/500/);
  await page.locator('[name="residency"]').selectOption("nonresident");
  await submit(page);
  await expect(page.locator("[data-deduction]")).toContainText(/5.*000/);
  await page.locator('[name="paymentType"]').selectOption("dividend");
  await page.locator('[name="residency"]').selectOption("resident");
  await page.locator('[name="treatment"]').selectOption("controllingDividend");
  await submit(page);
  await expect(page.locator("[data-rate]")).toHaveText("0.00%");
});

test("resident fee threshold includes KSh 24,000 and rejects KSh 23,999", async ({ page }) => {
  await setup(page);
  await page.locator('[name="grossAmount"]').fill("24000");
  await submit(page);
  await expect(page.locator("[data-rate]")).toHaveText("5.00%");
  await page.locator('[name="grossAmount"]').fill("23999");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("24,000");
});

test("EAC and treaty paths fail closed without evidence", async ({ page }) => {
  await setup(page);
  await page.locator('[name="paymentType"]').selectOption("dividend");
  await page.locator('[name="residency"]').selectOption("nonresident");
  await page.locator('[name="treatment"]').selectOption("eac");
  await submit(page);
  await expect(page.locator("[data-error]")).toContainText("evidence");
  await page.locator('[name="evidenceConfirmed"]').check();
  await submit(page);
  await expect(page.locator("[data-rate]")).toHaveText("5.00%");
  await page.locator('[name="treatment"]').selectOption("treaty");
  await page.locator('[name="treatyRatePercent"]').fill("10");
  await submit(page);
  await expect(page.locator("[data-rate]")).toHaveText("10.00%");
});

for (const [language, route] of Object.entries(routes)) {
  test(`${language} route calculates with no runtime errors`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await setup(page, route);
    await submit(page);
    await expect(page.locator("[data-rate]")).toHaveText("5.00%");
    await expect(page.locator("[data-result]")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("320, 360 and 375px plus 200% text reflow avoid document overflow", async ({ page }) => {
  for (const width of [320, 360, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(routes.en);
    const normal = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(normal[0]).toBeLessThanOrEqual(normal[1] + 1);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const zoomed = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(zoomed[0]).toBeLessThanOrEqual(zoomed[1] + 1);
  }
});

test("manual and system dark modes keep cards and controls readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(routes.en);
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await expect(page.locator(".ke-wht-card").first()).toHaveCSS("background-color", "rgb(24, 32, 25)");
  await expect(page.locator('[name="grossAmount"]')).toHaveCSS("min-height", "44px");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await expect(page.locator(".ke-wht-card").first()).toHaveCSS("background-color", "rgb(24, 32, 25)");
});

test("local TXT and print/PDF exports work after a result", async ({ page }) => {
  await setup(page);
  await submit(page);
  const download = page.waitForEvent("download");
  await page.locator("[data-download]").click();
  expect((await download).suggestedFilename()).toBe("kenya-wht-estimate.txt");
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printed = "yes"; }; });
  await page.locator("[data-print]").click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "yes");
});

test("French legacy alias redirects to the canonical native calculator", async ({ page }) => {
  await page.goto("/fr/tools/ke-wht/");
  await expect(page).toHaveURL(/\/fr\/tools\/ke-retenue-source\/$/);
  await expect(page.locator("[data-ke-wht-app]")).toBeVisible();
});
