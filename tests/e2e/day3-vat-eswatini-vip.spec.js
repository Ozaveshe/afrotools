const { test, expect } = require("@playwright/test");

const routes = [
  { path: "/eswatini/sz-vat", title: /Eswatini VAT Calculator/, locale: "en" },
  { path: "/fr/eswatini/sz-vat", title: /TVA Eswatini/, locale: "fr" },
  { path: "/sw/eswatini/kikokotoo-vat/", title: /VAT Eswatini/, locale: "sw" },
];

for (const route of routes) {
  test(`${route.locale} calculator adds, extracts and fails closed`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect.poll(() => page.evaluate(() => window.SZVatApp.getResult().vat)).toBe(1500);
    await page.locator('[data-szv-mode="extract"]').click();
    await page.locator("#szvAmount").fill("11500");
    await expect.poll(() => page.evaluate(() => window.SZVatApp.getResult().net)).toBe(10000);
    await page.locator('[data-szv-rate="second-schedule-zero-confirmed"]').click();
    await expect(page.locator("#szvResult")).not.toHaveClass(/on/);
    await expect(page.locator("#szvError")).not.toBeEmpty();
    await page.locator("#szvEvidence").check();
    await expect.poll(() => page.evaluate(() => window.SZVatApp.getResult().vat)).toBe(0);
    await page.locator("#szvAmount").fill("");
    await expect(page.locator("#szvResult")).not.toHaveClass(/on/);
    expect(errors).toEqual([]);
  });
}

test("English page exports a real local PDF and does not expose an amount in the URL", async ({ page }) => {
  await page.goto("/eswatini/sz-vat");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#szvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("eswatini-vat-estimate.pdf");
  expect(page.url()).not.toContain("10000");
});

test("responsive, zoom and explicit dark mode retain usable controls", async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/eswatini/sz-vat");
    await expect(page.locator("#szvAmount")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  }
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.evaluate(() => { document.body.style.zoom = "2"; });
  await expect(page.locator("#szvAmount")).toBeVisible();
});

test("widget uses the same standard formula and clears stale output", async ({ page }) => {
  await page.goto("/widgets/iframe/financial-eswatini-vat.html");
  await expect(page.locator("[data-vat]")).toContainText("1,500");
  await page.locator("#szWidgetAmount").fill("11500");
  await page.locator('[data-mode="extract"]').click();
  await expect(page.locator("[data-net]")).toContainText("10,000");
  await page.locator("#szWidgetAmount").fill("");
  await expect(page.locator("[data-error]")).not.toBeEmpty();
  await expect(page.locator("[data-main]")).toBeEmpty();
});
